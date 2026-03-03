import { useState, useEffect } from "react";
import EmployerLayout from "@/components/layouts/EmployerLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Filter, Bug, Wrench, Lightbulb, CreditCard, HelpCircle, Shield, Crown, X, CheckCircle2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ticketTypes = [
	{ value: "All", label: "All", icon: null },
	{ value: "Technical", label: "Technical", icon: Wrench, color: "blue" },
	{ value: "Bug Report", label: "Bug Report", icon: Bug, color: "red" },
	{ value: "Feature Request", label: "Feature Request", icon: Lightbulb, color: "purple" },
	{ value: "Billing", label: "Billing", icon: CreditCard, color: "orange" },
	{ value: "General", label: "General", icon: HelpCircle, color: "gray" },
];

const EmployerTickets = () => {
	const { user } = useAuth();
	const { toast } = useToast();
	const [tickets, setTickets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [assignees, setAssignees] = useState([]);
	const [employerData, setEmployerData] = useState(null);
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
		loadEmployerData();
		loadTickets();
	}, [user, view]);

	async function loadEmployerData() {
		try {
			if (!user?.id) return;

			// Get current user's employer_id from employer_team_members table
			const { data: teamMember, error: teamError } = await supabase
				.from("employer_team_members")
				.select("employer_id, first_name, last_name")
				.eq("user_id", user.id)
				.eq("is_active", true)
				.maybeSingle();

			if (teamError) throw teamError;

			if (!teamMember?.employer_id) {
				toast({ title: "Error", description: "No employer assigned to your account", variant: "destructive" });
				return;
			}

			// Get employer data - the user_id in employers table is the company superadmin
			const { data: employer, error: empError } = await supabase
				.from("employers")
				.select("id, user_id, company_name, rep_first_name, rep_last_name")
				.eq("id", teamMember.employer_id)
				.maybeSingle();

			if (empError) throw empError;
			setEmployerData(employer);

			if (!employer) {
				toast({ title: "Error", description: "Employer profile not found", variant: "destructive" });
				return;
			}

			// Get the superadmin user for this employer (the user_id in employers table)
			const { data: superadminUser, error: superError } = await supabase
				.from("users")
				.select("id, email")
				.eq("id", employer.user_id)
				.eq("user_role", "superadmin")
				.maybeSingle();

			if (superError) throw superError;

			// Load platform owner (simple user_role='owner')
			const { data: ownerUser, error: ownerError } = await supabase
				.from("users")
				.select("id, email")
				.eq("user_role", "owner")
				.maybeSingle();

			if (ownerError) throw ownerError;

			const combined = [];

			// Add company superadmin if exists
			if (superadminUser) {
				const name = `${employer.rep_first_name || ''} ${employer.rep_last_name || ''}`.trim() || superadminUser.email || "Company Superadmin";
				combined.push({
					id: superadminUser.id,
					name: name,
					type: "superadmin"
				});
			}

			// Add platform owner if exists
			if (ownerUser) {
				combined.push({
					id: ownerUser.id,
					name: ownerUser.email || "Platform Owner",
					type: "owner"
				});
			}

			// Show error if somehow no assignees found (should never happen)
			if (combined.length === 0) {
				toast({ title: "Error", description: "No assignees available. Please contact support.", variant: "destructive" });
			}

			setAssignees(combined);
		} catch (error) {
			console.error("Error loading assignees:", error);
			toast({ title: "Error", description: "Failed to load assignees", variant: "destructive" });
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

	function handleInput(e) {
		setForm({ ...form, [e.target.name]: e.target.value });
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!form.subject || !form.message || !form.type || !form.assignedTo) {
			setError("All fields are required.");
			return;
		}

		try {
			// Get sender name from employer_team_members table
			const { data: teamMember } = await supabase
				.from("employer_team_members")
				.select("first_name, last_name")
				.eq("user_id", user.id)
				.maybeSingle();

			const senderName = `${teamMember?.first_name || ''} ${teamMember?.last_name || ''}`.trim() || "Recruiter";

				const { error: insertError } = await supabase
					.from("tickets")
					.insert({
						user_id: user.id,
						sender_name: senderName,
					subject: form.subject,
					message: form.message,
					ticket_type: form.type,
					priority: form.priority,
					assigned_to: form.assignedTo,
					status: "open"
				});

			if (insertError) throw insertError;

			toast({
				title: "Success",
				description: "Ticket created successfully",
			});

			setForm({ subject: "", message: "", type: "Technical", priority: "medium", assignedTo: "" });
			setError("");
			setShowForm(false);
			loadTickets();
		} catch (error) {
			console.error("Error creating ticket:", error);
			toast({
				title: "Error",
				description: "Failed to create ticket",
				variant: "destructive",
			});
		}
	}

	const filteredTickets =
		filterType === "All"
			? tickets
			: tickets.filter((t) => t.ticket_type === filterType);

	const getTicketTypeConfig = (type) => {
		return ticketTypes.find(t => t.value === type) || ticketTypes[ticketTypes.length - 1];
	};

	if (loading) {
		return (
			<EmployerLayout>
				<div className="flex items-center justify-center h-64">
					<Loader2 className="w-8 h-8 animate-spin text-orange-500" />
				</div>
			</EmployerLayout>
		);
	}

	return (
		<EmployerLayout>
			<div className="max-w-7xl mx-auto mt-8 px-4 pb-12">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 mb-2">Support Tickets</h1>
						<p className="text-gray-600">Get help from your company admin or platform owner</p>
						<div className="flex gap-2 mt-4">
							<button
								onClick={() => setView("sent")}
								className={`px-6 py-2 rounded-lg font-semibold transition-all ${
									view === "sent"
										? "bg-orange-500 text-white shadow-lg"
										: "bg-gray-200 text-gray-700 hover:bg-gray-300"
								}`}
							>
								📤 Sent
							</button>
							<button
								onClick={() => setView("inbox")}
								className={`px-6 py-2 rounded-lg font-semibold transition-all ${
									view === "inbox"
										? "bg-orange-500 text-white shadow-lg"
										: "bg-gray-200 text-gray-700 hover:bg-gray-300"
								}`}
							>
								📥 Inbox
							</button>
						</div>
					</div>
					{!showForm && (
						<button
							className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
							onClick={() => setShowForm(true)}
						>
							<Send className="w-5 h-5" />
							New Ticket
						</button>
					)}
				</div>

				{/* Create Ticket Form */}
				{showForm && (
					<div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-xl p-8 mb-8 border-2 border-orange-200">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-gray-900">Create Support Ticket</h2>
							<button
								type="button"
								className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
								onClick={() => {
									setShowForm(false);
									setError("");
								}}
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<form className="space-y-6" onSubmit={handleSubmit}>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-3">Subject *</label>
								<input
									name="subject"
									value={form.subject}
									onChange={handleInput}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
									placeholder="Brief description of your issue"
									required
								/>
							</div>

							<div className="grid gap-6 md:grid-cols-2">
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-3">Ticket Type *</label>
									<div className="grid grid-cols-2 gap-3">
										{ticketTypes.slice(1).map((typeObj) => {
											const Icon = typeObj.icon;
											return (
												<label
													key={typeObj.value}
													className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
														form.type === typeObj.value
															? "border-orange-500 bg-orange-50 shadow-md"
															: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
													}`}
												>
													<input
														type="radio"
														name="type"
														value={typeObj.value}
														checked={form.type === typeObj.value}
														onChange={handleInput}
														className="hidden"
													/>
													<Icon className={`w-5 h-5 ${form.type === typeObj.value ? "text-orange-500" : "text-gray-400"}`} />
													<span className={`text-sm font-medium ${form.type === typeObj.value ? "text-orange-700" : "text-gray-700"}`}>
														{typeObj.label}
													</span>
												</label>
											);
										})}
									</div>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-3">Priority *</label>
										<select
											name="priority"
											value={form.priority}
											onChange={handleInput}
											className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition appearance-none bg-white"
											required
										>
											<option value="low">🟢 Low</option>
											<option value="medium">🟡 Medium</option>
											<option value="high">🟠 High</option>
											<option value="urgent">🔴 Urgent</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-3">Assign To *</label>
										<select
											name="assignedTo"
											value={form.assignedTo}
											onChange={handleInput}
											className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition appearance-none bg-white"
											required
										>
											<option value="">Select recipient...</option>
											{assignees.map((assignee) => (
												<option key={assignee.id} value={assignee.id}>
													{assignee.type === "owner" ? "👑" : "🛡️"} {assignee.name} ({assignee.type === "owner" ? "Platform Owner" : "Company Superadmin"})
												</option>
											))}
										</select>
									</div>
								</div>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-3">Message *</label>
								<textarea
									name="message"
									value={form.message}
									onChange={handleInput}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
									placeholder="Describe your issue in detail..."
									rows={6}
									required
								/>
							</div>

							<div className="flex gap-3 items-center pt-2">
								<button
									type="submit"
									className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
								>
									<Send className="w-4 h-4" />
									Submit Ticket
								</button>
								<button
									type="button"
									className="px-8 py-3 rounded-xl border-2 border-gray-300 font-semibold hover:bg-gray-50 transition"
									onClick={() => {
										setShowForm(false);
										setError("");
									}}
								>
									Cancel
								</button>
								{error && (
									<span className="text-red-500 text-sm font-medium ml-2">{error}</span>
								)}
							</div>
						</form>
					</div>
				)}

				{/* Tickets List */}
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200">
					<div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<h2 className="text-2xl font-bold text-gray-900">{view === "sent" ? "📤 Sent Tickets" : "📥 Inbox"}</h2>
							<div className="flex items-center gap-3">
								<Filter className="w-5 h-5 text-gray-500" />
								<div className="flex flex-wrap gap-2">
									{ticketTypes.map((typeObj) => {
										const Icon = typeObj.icon;
										return (
											<button
												key={typeObj.value}
												onClick={() => setFilterType(typeObj.value)}
												className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
													filterType === typeObj.value
														? "bg-orange-500 text-white shadow-lg scale-105"
														: "bg-gray-100 text-gray-600 hover:bg-gray-200"
												}`}
											>
												{Icon && <Icon className="w-4 h-4" />}
												{typeObj.label}
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead className="bg-gradient-to-r from-gray-100 to-gray-50">
								<tr>
									<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
										Subject
									</th>
									<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
										Sender Role
									</th>
									<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
										Type
									</th>
									<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
										Priority
									</th>
									<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
										Message
									</th>
									<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{filteredTickets.length === 0 ? (
									<tr>
											<td colSpan={7} className="text-center py-12 text-gray-500">
											<div className="flex flex-col items-center gap-3">
												<HelpCircle className="w-12 h-12 text-gray-300" />
												<p className="text-lg font-medium">No tickets found</p>
												<p className="text-sm">Create a ticket to get help</p>
											</div>
										</td>
									</tr>
								) : (
									filteredTickets.map((ticket) => {
										const typeConfig = getTicketTypeConfig(ticket.ticket_type);
										const Icon = typeConfig.icon;
										return (
											<tr
												key={ticket.id}
												className="hover:bg-gray-50 transition-colors"
											>
												<td className="px-6 py-4">
													<div className="font-semibold text-gray-900">{ticket.subject}</div>
													<div className="text-sm text-gray-500 mt-1">
														{new Date(ticket.created_at).toLocaleDateString()}
													</div>
												</td>
												<td className="px-6 py-4">														<Badge className="bg-indigo-100 text-indigo-700 capitalize">
															{ticket.sender_role || 'recruiter'}
														</Badge>
													</td>
													<td className="px-6 py-4">													<Badge className={`flex items-center gap-1.5 w-fit ${
														ticket.ticket_type === "Technical" ? "bg-blue-100 text-blue-700" :
														ticket.ticket_type === "Bug Report" ? "bg-red-100 text-red-700" :
														ticket.ticket_type === "Feature Request" ? "bg-purple-100 text-purple-700" :
														ticket.ticket_type === "Billing" ? "bg-orange-100 text-orange-700" :
														"bg-gray-100 text-gray-700"
													}`}>
														{Icon && <Icon className="w-3.5 h-3.5" />}
														{ticket.ticket_type}
													</Badge>
												</td>
												<td className="px-6 py-4">
													<Badge className={`${
														ticket.priority === "urgent" ? "bg-red-100 text-red-700" :
														ticket.priority === "high" ? "bg-orange-100 text-orange-700" :
														ticket.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
														"bg-green-100 text-green-700"
													}`}>
														{ticket.priority === "urgent" ? "🔴" :
														ticket.priority === "high" ? "🟠" :
														ticket.priority === "medium" ? "🟡" : "🟢"} {ticket.priority}
													</Badge>
												</td>
												<td className="px-6 py-4">
													<p className="text-sm text-gray-700 max-w-md truncate">
														{ticket.message}
													</p>
												</td>
												<td className="px-6 py-4">
													<Badge className={`${
														ticket.status === "solved" || ticket.status === "closed"
															? "bg-green-100 text-green-700"
															: ticket.status === "in-progress"
															? "bg-blue-100 text-blue-700"
															: "bg-yellow-100 text-yellow-700"
													}`}>
														{ticket.status}
													</Badge>
												</td>
												<td className="px-6 py-4">
													<div className="flex gap-2">
														{ticket.status !== "solved" && ticket.status !== "closed" && (
															<button
																className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition shadow hover:shadow-md"
																onClick={async () => {
																	const { error } = await supabase
																		.from("tickets")
																		.update({ status: "closed", resolved_at: new Date().toISOString() })
																		.eq("id", ticket.id);
																	if (error) {
																		toast({
																			title: "Error",
																			description: "Failed to update ticket",
																			variant: "destructive",
																		});
																	} else {
																		loadTickets();
																	}
																}}
															>
																<CheckCircle2 className="w-4 h-4" />
																Close
															</button>
														)}
														<button
															className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold transition"
															onClick={async () => {
																const { error } = await supabase
																	.from("tickets")
																	.delete()
																	.eq("id", ticket.id);
																if (error) {
																	toast({
																		title: "Error",
																		description: "Failed to delete ticket",
																		variant: "destructive",
																	});
																} else {
																	loadTickets();
																}
															}}
														>
															<Trash2 className="w-4 h-4" />
															Delete
														</button>
													</div>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</EmployerLayout>
	);
};

export default EmployerTickets;
