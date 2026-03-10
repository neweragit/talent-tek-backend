import { useState, useEffect } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Filter, Bug, Wrench, Lightbulb, CreditCard, HelpCircle, Crown, X, CheckCircle2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ticketTypes = [
	{ value: "All", label: "All", icon: null },
	{ value: "Technical", label: "Technical", icon: Wrench, color: "blue" },
	{ value: "Bug Report", label: "Bug Report", icon: Bug, color: "red" },
	{ value: "Feature Request", label: "Feature Request", icon: Lightbulb, color: "purple" },
	{ value: "Billing", label: "Billing", icon: CreditCard, color: "orange" },
	{ value: "General", label: "General", icon: HelpCircle, color: "gray" },
];

const TalentSupportTickets = () => {
	const { user } = useAuth();
	const { toast } = useToast();
	const [tickets, setTickets] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [contacts, setContacts] = useState<any[]>([]);
	const [talentData, setTalentData] = useState<any>(null);
	const [form, setForm] = useState({
		subject: "",
		message: "",
		type: "Technical",
		priority: "medium",
		assignedTo: "",
	});
	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [filterType, setFilterType] = useState("All");
	const [view, setView] = useState<"sent" | "inbox">("sent");

	useEffect(() => {
		loadTalentData();
		loadTickets();
	}, [user, view]);

	async function loadTalentData() {
		try {
			if (!user?.id) return;

			// Get talent data
			const { data: talent, error: talentError } = await supabase
				.from("talents")
				.select("id, full_name")
				.eq("user_id", user.id)
				.maybeSingle();

			if (talentError) throw talentError;
			setTalentData(talent);

			if (!talent) {
				setContacts([]);
				return;
			}

			// Find all interviews for this talent's applications and get who created them
			const { data: interviews, error: interviewsError } = await supabase
				.from("interviews")
				.select(`
					created_by,
					team_member_id,
					interviewer_id,
					interview_type,
					applications!inner(talent_id)
				`)
				.eq("applications.talent_id", talent.id);

			if (interviewsError) throw interviewsError;

			console.log('Debug - Found interviews:', interviews);

			const contactsMap = new Map(); // Use Map to avoid duplicates by email

			// Add platform owner first
			const { data: ownerUser, error: ownerError } = await supabase
				.from("users")
				.select("id, email")
				.eq("user_role", "owner")
				.maybeSingle();

			if (!ownerError && ownerUser) {
				contactsMap.set(ownerUser.email, {
					id: ownerUser.id,
					name: "Platform Owner",
					email: ownerUser.email,
					company: "Platform Support",
					type: "owner",
					description: "Platform administrator and support"
				});
			}

			// Process interviews and collect contact info with interview types
			if (interviews?.length > 0) {
				// Group interviews by contact to collect all interview types per person
				const contactInterviews = new Map();

				interviews.forEach(interview => {
					// Track by created_by (team members who created interviews)
					if (interview.created_by) {
						const key = `team_${interview.created_by}`;
						if (!contactInterviews.has(key)) {
							contactInterviews.set(key, {
								id: interview.created_by,
								type: 'team_member',
								interviewTypes: []
							});
						}
						if (interview.interview_type) {
							contactInterviews.get(key).interviewTypes.push(interview.interview_type);
						}
					}

					// Track by team_member_id (team members assigned to interviews)
					if (interview.team_member_id) {
						const key = `team_${interview.team_member_id}`;
						if (!contactInterviews.has(key)) {
							contactInterviews.set(key, {
								id: interview.team_member_id,
								type: 'team_member',
								interviewTypes: []
							});
						}
						if (interview.interview_type) {
							contactInterviews.get(key).interviewTypes.push(interview.interview_type);
						}
					}

					// Track by interviewer_id (professional interviewers)
					if (interview.interviewer_id) {
						const key = `interviewer_${interview.interviewer_id}`;
						if (!contactInterviews.has(key)) {
							contactInterviews.set(key, {
								id: interview.interviewer_id,
								type: 'interviewer',
								interviewTypes: []
							});
						}
						if (interview.interview_type) {
							contactInterviews.get(key).interviewTypes.push(interview.interview_type);
						}
					}
				});

				// Get team member details
				const teamMemberIds = Array.from(contactInterviews.values())
					.filter(c => c.type === 'team_member')
					.map(c => c.id);

				if (teamMemberIds.length > 0) {
					const { data: teamMembers, error: teamError } = await supabase
						.from("employer_team_members")
						.select(`
							id, first_name, last_name, role, user_id,
							users(email),
							employers(company_name)
						`)
						.in("id", teamMemberIds)
						.eq("is_active", true);

					if (!teamError && teamMembers) {
						teamMembers.forEach((member: any) => {
							// Skip if we already have this person by email to prevent duplicates
							if (member.users?.email && !contactsMap.has(member.users.email)) {
								const contactKey = `team_${member.id}`;
								const interviewData = contactInterviews.get(contactKey);
								const uniqueTypes = [...new Set(interviewData?.interviewTypes || [])];
								const typeText = uniqueTypes.length > 0 ? uniqueTypes.join(', ') : 'various';
								
								const name = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 
											 member.users.email;
								
								contactsMap.set(member.users.email, {
									id: member.user_id,
									name: name,
									email: member.users.email,
									company: member.employers?.company_name || 'Company',
									role: member.role,
									type: "interviewer",
									description: `${member.role} - conducted ${typeText} interviews with you`
								});
							}
						});
					}
				}

				// Get interviewer details
				const interviewerIds = Array.from(contactInterviews.values())
					.filter(c => c.type === 'interviewer')
					.map(c => c.id);

				if (interviewerIds.length > 0) {
					const { data: interviewers, error: intError } = await supabase
						.from("interviewers")
						.select(`
							id, full_name, email, role, interview_type,
							user_id,
							employers(company_name)
						`)
						.in("id", interviewerIds)
						.eq("status", "active");

					if (!intError && interviewers) {
						interviewers.forEach((interviewer: any) => {
							// Skip if we already have this person by email
							if (interviewer.email && !contactsMap.has(interviewer.email)) {
								contactsMap.set(interviewer.email, {
									id: interviewer.user_id || interviewer.id,
									name: interviewer.full_name,
									email: interviewer.email,
									company: interviewer.employers?.company_name || 'Company',
									role: interviewer.role,
									type: "interviewer",
									description: `${interviewer.interview_type} interviewer`
								});
							}
						});
					}
				}
			}

			// Fallback: If no interview contacts found, get employer team members from applications
			const interviewContacts = Array.from(contactsMap.values()).filter(c => c.type === "interviewer");
			if (interviewContacts.length === 0) {
				console.log('Debug - No interview contacts found, checking applications...');
				
				const { data: applications, error: appError } = await supabase
					.from("applications")
					.select(`
						jobs(employer_id)
					`)
					.eq("talent_id", talent.id);

				if (!appError && applications?.length > 0) {
					const employerIds = [...new Set(applications.map((app: any) => app.jobs?.employer_id).filter(Boolean))];
					console.log('Debug - Employer IDs from applications:', employerIds);

					const { data: fallbackTeamMembers, error: fbError } = await supabase
						.from("employer_team_members")
						.select(`
							id, first_name, last_name, role, user_id,
							users(email),
							employers(company_name)
						`)
						.in("employer_id", employerIds)
						.eq("is_active", true)
						.in("role", ["admin", "recruiter", "hiring-manager"])
						.limit(5);

					console.log('Debug - Fallback team members:', fallbackTeamMembers);

					if (!fbError && fallbackTeamMembers) {
						fallbackTeamMembers.forEach((member: any) => {
							if (member.users?.email && !contactsMap.has(member.users.email)) {
								const name = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 
											 member.users.email;
								contactsMap.set(member.users.email, {
									id: member.user_id,
									name: name,
									email: member.users.email,
									company: member.employers?.company_name || 'Company',
									role: member.role,
									type: "interviewer",
									description: `${member.role} from company you applied to`
								});
							}
						});
					}
				}
			}

			const combined = Array.from(contactsMap.values());
			console.log('Debug - Final combined contacts:', combined);

			setContacts(combined);
			
			// Auto-select first contact as default
			if (combined.length > 0) {
				setForm(prev => ({ ...prev, assignedTo: combined[0].id }));
			} else {
				// Clear assignedTo if no contacts available
				setForm(prev => ({ ...prev, assignedTo: "" }));
			}
		} catch (error) {
			console.error("Error loading talent data:", error);
		}
	}

	async function loadTickets() {
		try {
			if (!user?.id) return;
			setLoading(true);

			let query = supabase.from("tickets").select(`
				*,
				sender:user_id(user_role)
			`);

			if (view === "sent") {
				query = query.eq("user_id", user.id);
			} else {
				query = query.eq("assigned_to", user.id);
			}

			const { data, error } = await query.order("created_at", { ascending: false });

			if (error) throw error;
			setTickets(data || []);
		} catch (error) {
			console.error("Error loading tickets:", error);
			toast({
				title: "Error",
				description: "Failed to load tickets",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}

	async function submitTicket(e: React.FormEvent) {
		e.preventDefault();

		if (contacts.length === 0) {
			toast({
				title: "No Recipients Available",
				description: "You need to apply to companies to have available support contacts.",
				variant: "destructive",
			});
			return;
		}

		if (!form.subject || !form.message || !form.assignedTo) {
			setError("Please fill in all required fields");
			return;
		}

		try {
			setError("");
			const { error } = await supabase
				.from("tickets")
				.insert({
					user_id: user?.id,
					subject: form.subject,
					message: form.message,
					type: form.type,
					priority: form.priority,
					assigned_to: form.assignedTo,
					status: "open",
				});

			if (error) throw error;

			toast({
				title: "Ticket Submitted",
				description: "Your support ticket has been submitted successfully.",
			});

			setForm({ subject: "", message: "", type: "Technical", priority: "medium", assignedTo: contacts[0]?.id || "" });
			setShowForm(false);
			loadTickets();
		} catch (error) {
			console.error("Error submitting ticket:", error);
			setError("Failed to submit ticket. Please try again.");
		}
	}

	const filteredTickets = tickets.filter(ticket => 
		filterType === "All" || ticket.type === filterType
	);

	if (loading) {
		return (
			<TalentLayout>
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="flex items-center gap-3 text-blue-600">
						<Loader2 className="w-6 h-6 animate-spin" />
						<span className="text-lg font-medium">Loading support tickets...</span>
					</div>
				</div>
			</TalentLayout>
		);
	}

	return (
		<TalentLayout>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
					<p className="text-gray-600">Get help with your questions and concerns</p>
				</div>

				{/* View Toggle */}
				<div className="mb-6 flex items-center gap-2 bg-white p-1 rounded-xl border shadow-sm w-fit">
					<button
						onClick={() => setView("sent")}
						className={`px-4 py-2 rounded-lg font-medium transition ${
							view === "sent" 
								? "bg-blue-500 text-white" 
								: "text-gray-600 hover:bg-gray-100"
						}`}
					>
						My Tickets
					</button>
					<button
						onClick={() => setView("inbox")}
						className={`px-4 py-2 rounded-lg font-medium transition ${
							view === "inbox" 
								? "bg-blue-500 text-white" 
								: "text-gray-600 hover:bg-gray-100"
						}`}
					>
						Inbox
					</button>
				</div>

				{/* Controls */}
				<div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					{/* Filters */}
					<div className="flex items-center gap-3">
						<Filter className="w-5 h-5 text-gray-500" />
						<select 
							value={filterType} 
							onChange={(e) => setFilterType(e.target.value)}
							className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{ticketTypes.map(type => (
								<option key={type.value} value={type.value}>{type.label}</option>
							))}
						</select>
					</div>

					{/* Create Ticket Button */}
					<div>
						{!showForm ? (
							<div>
								<button
									className={contacts.length === 0 
										? "bg-gray-300 text-gray-500 px-8 py-3 rounded-xl font-semibold cursor-not-allowed flex items-center gap-2"
										: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
									}
									onClick={() => setShowForm(true)}
									disabled={contacts.length === 0}
								>
									<Send className="w-5 h-5" />
									Create New Ticket
								</button>
								{contacts.length === 0 && (
									<div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
										<p className="text-sm text-yellow-700">
											<strong>💡 No support contacts available yet</strong><br />
											To create support tickets, you need to apply to companies on the platform:
										</p>
										<ul className="mt-2 text-sm text-yellow-600 list-disc list-inside space-y-1">
											<li>Apply to job positions</li>
											<li>Connect with company representatives</li>
											<li>Get interviews scheduled</li>
											<li>Then you can contact relevant people for support</li>
										</ul>
									</div>
								)}
							</div>
						) : (
							<button
								onClick={() => setShowForm(false)}
								className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
							>
								<X className="w-5 h-5" />
								Cancel
							</button>
						)}
					</div>
				</div>

				{/* Create Ticket Form */}
				{showForm && (
					<div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-8">
						<h2 className="text-xl font-bold text-gray-900 mb-6">Create New Support Ticket</h2>
						{error && (
							<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
								{error}
							</div>
						)}
						<form onSubmit={submitTicket} className="space-y-6">
							<div className="grid md:grid-cols-2 gap-6">
								{/* Subject */}
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
									<input
										type="text"
										value={form.subject}
										onChange={(e) => setForm({...form, subject: e.target.value})}
										placeholder="Brief description of your issue..."
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
										required
									/>
								</div>

								{/* Type */}
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
									<select
										value={form.type}
										onChange={(e) => setForm({...form, type: e.target.value})}
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
									>
										{ticketTypes.slice(1).map(type => (
											<option key={type.value} value={type.value}>{type.label}</option>
										))}
									</select>
								</div>

								{/* Priority */}
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
									<select
										value={form.priority}
										onChange={(e) => setForm({...form, priority: e.target.value})}
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
										<option value="urgent">Urgent</option>
									</select>
								</div>

								{/* Assign To */}
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">Send To *</label>
									<select
										value={form.assignedTo}
										onChange={(e) => setForm({...form, assignedTo: e.target.value})}
										className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
										required
									>
										<option value="">Select recipient...</option>
										{contacts.length === 0 ? (
											<option disabled>No available recipients</option>
										) : (
											contacts.map((contact) => (
												<option key={contact.id} value={contact.id}>
													{contact.type === "owner" ? "👑" : "🏢"} {contact.company} - {contact.name} 
													{contact.description && ` (${contact.description})`}
												</option>
											))
										)}
									</select>
									{contacts.length === 0 && (
										<div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
											<p className="text-sm text-yellow-700">
												<strong>No recipients available.</strong><br />
												You can send tickets to people from companies where you've applied or the platform owner. 
												Apply to job positions to connect with company representatives.
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Message */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
								<textarea
									value={form.message}
									onChange={(e) => setForm({...form, message: e.target.value})}
									placeholder="Describe your issue or question in detail..."
									rows={6}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
									required
								/>
							</div>

							{/* Submit */}
							<div className="flex gap-3 items-center pt-2">
								<button
									type="submit"
									disabled={contacts.length === 0}
									className={contacts.length === 0 
										? "bg-gray-300 text-gray-500 px-8 py-3 rounded-xl font-semibold cursor-not-allowed flex items-center gap-2"
										: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
									}
								>
									<Send className="w-4 h-4" />
									Submit Ticket
								</button>
								<span className="text-sm text-gray-500">All fields marked with * are required</span>
							</div>
						</form>
					</div>
				)}

				{/* Tickets List */}
				<div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-bold text-gray-900">
							{view === "sent" ? "My Tickets" : "Inbox"} ({filteredTickets.length})
						</h2>
					</div>

					{filteredTickets.length === 0 ? (
						<div className="text-center py-12">
							<div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
								<HelpCircle className="w-8 h-8 text-gray-400" />
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								{view === "sent" ? "No Tickets Sent" : "No Messages Received"}
							</h3>
							<p className="text-gray-500 mb-4">
								{view === "sent" 
									? "You haven't created any support tickets yet." 
									: "You haven't received any messages yet."
								}
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{filteredTickets.map(ticket => (
								<div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
									<div className="flex items-start justify-between mb-3">
										<div>
											<h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
											<div className="flex items-center gap-2 mt-1">
												<Badge 
													variant={ticket.type === "Bug Report" ? "destructive" : 
															 ticket.type === "Feature Request" ? "secondary" : 
															 "default"}
												>
													{ticket.type}
												</Badge>
												<Badge 
													variant={ticket.priority === "urgent" ? "destructive" : 
															 ticket.priority === "high" ? "secondary" : 
															 "outline"}
												>
													{ticket.priority}
												</Badge>
												<Badge 
													variant={ticket.status === "closed" ? "secondary" : 
															 ticket.status === "in-progress" ? "default" : 
															 "outline"}
												>
													{ticket.status === "in-progress" ? "In Progress" : 
													 ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
												</Badge>
											</div>
										</div>
										<div className="text-sm text-gray-500">
											{new Date(ticket.created_at).toLocaleString()}
										</div>
									</div>
									<p className="text-gray-600 text-sm line-clamp-2">{ticket.message}</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</TalentLayout>
	);
};

export default TalentSupportTickets;