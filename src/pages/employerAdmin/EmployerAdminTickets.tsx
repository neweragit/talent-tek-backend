import { useState, useEffect } from "react";
import EmployerAdminLayout from "@/components/layouts/EmployerAdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bug, Wrench, Lightbulb, CreditCard, HelpCircle, Filter, CheckCircle2, Clock, AlertCircle, Send, X, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ticketTypes = [
	{ value: "All", label: "All", icon: null },
	{ value: "Technical", label: "Technical", icon: Wrench, color: "blue" },
	{ value: "Bug Report", label: "Bug Report", icon: Bug, color: "red" },
	{ value: "Feature Request", label: "Feature Request", icon: Lightbulb, color: "purple" },
	{ value: "Billing", label: "Billing", icon: CreditCard, color: "orange" },
	{ value: "General", label: "General", icon: HelpCircle, color: "gray" },
];

const statusOptions = [
	{ value: "All", label: "All Statuses" },
	{ value: "open", label: "Open" },
	{ value: "viewed", label: "Viewed" },
	{ value: "in-progress", label: "In Progress" },
	{ value: "solved", label: "Solved" },
	{ value: "closed", label: "Closed" },
];

const EmployerAdminTickets = () => {
	const { user } = useAuth();
	const { toast } = useToast();
	const [tickets, setTickets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterType, setFilterType] = useState("All");
	const [filterStatus, setFilterStatus] = useState("All");
	const [employerData, setEmployerData] = useState(null);
	const [view, setView] = useState<"sent" | "inbox">("inbox");
	const [showForm, setShowForm] = useState(false);
	const [platformOwner, setPlatformOwner] = useState(null);
	const [teamMembers, setTeamMembers] = useState([]);
	const [form, setForm] = useState({
		subject: "",
		message: "",
		type: "Technical",
		priority: "medium",
		assignedTo: "",
	});
	const [error, setError] = useState("");

	useEffect(() => {
		loadEmployerData();
		loadPlatformOwner();
		loadTeamMembers();
		loadTickets();
	}, [user, view]);

	async function loadEmployerData() {
		try {
			if (!user?.id) return;

			// Get employer where this user is the superadmin (user_id in employers table)
			const { data: employer, error: empError } = await supabase
				.from("employers")
				.select("id, company_name, rep_first_name, rep_last_name")
				.eq("user_id", user.id)
				.maybeSingle();

			if (empError) throw empError;
			setEmployerData(employer);
		} catch (error) {
			console.error("Error loading employer data:", error);
		}
	}

	async function loadPlatformOwner() {
		try {
			// Get platform owner (user with role 'owner')
			const { data: ownerUsers, error: ownerError } = await supabase
				.from("users")
				.select("id, email")
				.eq("user_role", "owner")
				.limit(1)
				.maybeSingle();

			if (ownerError) throw ownerError;
			setPlatformOwner(ownerUsers);
		} catch (error) {
			console.error("Error loading platform owner:", error);
		}
	}

	async function loadTeamMembers() {
		try {
			if (!user?.id) return;

			// Get employer where this user is the superadmin
			const { data: employer } = await supabase
				.from("employers")
				.select("id")
				.eq("user_id", user.id)
				.maybeSingle();

			if (!employer) return;

			// Get all team members for this employer
			const { data: members, error } = await supabase
				.from("employer_team_members")
				.select("user_id, first_name, last_name, role")
				.eq("employer_id", employer.id)
				.eq("is_active", true);

			if (error) throw error;

			// Get user emails for team members
			if (members && members.length > 0) {
				const userIds = members.map(m => m.user_id);
				const { data: users } = await supabase
					.from("users")
					.select("id, email")
					.in("id", userIds);

				// Combine member data with emails
				const membersWithEmails = members.map(member => {
					const userInfo = users?.find(u => u.id === member.user_id);
					return {
						...member,
						email: userInfo?.email || ""
					};
				});

				setTeamMembers(membersWithEmails);
				// Set first team member as default if available
				if (membersWithEmails.length > 0) {
					setForm(prev => ({ ...prev, assignedTo: membersWithEmails[0].user_id }));
				}
			}
		} catch (error) {
			console.error("Error loading team members:", error);
		}
	}

	function handleInput(e: any) {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
	}

	async function handleSubmit(e: any) {
		e.preventDefault();
		if (!form.assignedTo) {
			setError("Please select a recipient");
			return;
		}

		try {
			// Get sender name from employer data
			const senderName = employerData ? `${employerData.rep_first_name || ''} ${employerData.rep_last_name || ''}`.trim() || "Superadmin" : "Superadmin";

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
				description: "Ticket sent successfully",
			});

			setForm({ subject: "", message: "", type: "Technical", priority: "medium", assignedTo: teamMembers[0]?.user_id || "" });
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

	async function loadTickets() {
		try {
			if (!user?.id) return;
			setLoading(true);

			// Get employer id where current user is superadmin
			const { data: employer } = await supabase
				.from("employers")
				.select("id")
				.eq("user_id", user.id)
				.maybeSingle();

			if (!employer) {
				setTickets([]);
				return;
			}

			let data, error;

			if (view === "inbox") {
				// Get all team members user_ids for this employer
				const { data: teamMembers } = await supabase
					.from("employer_team_members")
					.select("user_id")
					.eq("employer_id", employer.id)
					.eq("is_active", true);

				const teamUserIds = (teamMembers || []).map(tm => tm.user_id);

				if (teamUserIds.length === 0) {
					setTickets([]);
					return;
				}

				// Get tickets assigned to current superadmin OR created by team members with user_role JOIN
				const result = await supabase
					.from("tickets")
					.select(`
						*,
						sender:user_id(user_role)
					`)
					.or(`assigned_to.eq.${user.id},user_id.in.(${teamUserIds.join(",")})`)
					.order("created_at", { ascending: false });
				data = result.data;
				error = result.error;
			} else {
				// Sent: tickets created by this superadmin
				const result = await supabase
					.from("tickets")
					.select(`
						*,
						sender:user_id(user_role)
					`)
					.eq("user_id", user.id)
					.order("created_at", { ascending: false });
				data = result.data;
				error = result.error;
			}

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

	async function updateTicketStatus(ticketId: string, newStatus: string) {
		try {
			const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
			if (newStatus === "solved" || newStatus === "closed") {
				updateData.resolved_at = new Date().toISOString();
			}

			const { error } = await supabase
				.from("tickets")
				.update(updateData)
				.eq("id", ticketId);

			if (error) throw error;

			toast({ title: "Success", description: `Ticket marked as ${newStatus}` });
			loadTickets();
		} catch (err) {
			console.error("Error updating ticket:", err);
			toast({ title: "Error", description: "Failed to update ticket", variant: "destructive" });
		}
	}

	function getTicketTypeConfig(type: string) {
		return ticketTypes.find(t => t.value === type) || ticketTypes[0];
	}

	const filteredTickets = tickets.filter(ticket => {
		const typeMatch = filterType === "All" || ticket.ticket_type === filterType;
		const statusMatch = filterStatus === "All" || ticket.status === filterStatus;
		return typeMatch && statusMatch;
	});

	const stats = {
		open: tickets.filter(t => t.status === "open").length,
		inProgress: tickets.filter(t => t.status === "in-progress").length,
		solved: tickets.filter(t => t.status === "solved" || t.status === "closed").length,
		total: tickets.length,
	};

	return (
		<EmployerAdminLayout>
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 p-6">
				<div className="max-w-7xl mx-auto space-y-6">
					{/* Header */}
					<div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white">
						<h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
						<p className="text-orange-100">Manage tickets from your team members</p>
						{employerData && (
							<p className="text-sm text-orange-200 mt-2">{employerData.company_name}</p>
						)}
						<div className="flex gap-2 mt-4">
							<button
								onClick={() => setView("inbox")}
								className={`px-6 py-2 rounded-lg font-semibold transition-all ${
									view === "inbox"
										? "bg-white text-orange-600 shadow-lg"
										: "bg-orange-400 text-white hover:bg-orange-300"
								}`}
							>
								📥 Inbox
							</button>
							<button
								onClick={() => setView("sent")}
								className={`px-6 py-2 rounded-lg font-semibold transition-all ${
									view === "sent"
										? "bg-white text-orange-600 shadow-lg"
										: "bg-orange-400 text-white hover:bg-orange-300"
								}`}
							>
								📤 Sent
							</button>
						</div>
					</div>

					{/* Create Ticket Button */}
					<div>
						{!showForm ? (
							<button
								className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
								onClick={() => setShowForm(true)}
							>
								<Send className="w-5 h-5" />
								Create New Ticket
							</button>
						) : (
							<div className="bg-white rounded-xl shadow-lg p-8">
								<div className="flex justify-between items-center mb-6">
									<h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
										<Send className="w-6 h-6 text-orange-500" />
										Send Ticket to Team or Platform
									</h2>
									<button
										onClick={() => {
											setShowForm(false);
											setError("");
										}}
										className="text-gray-400 hover:text-gray-600 transition"
									>
										<X className="w-6 h-6" />
									</button>
								</div>

								{error && (
									<div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
										<p className="text-red-700 font-medium">{error}</p>
									</div>
								)}

								<form onSubmit={handleSubmit} className="space-y-6">
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-3">Subject *</label>
										<input
											type="text"
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
													const isSelected = form.type === typeObj.value;
													return (
														<label
															key={typeObj.value}
															className={
																isSelected
																	? "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all border-orange-500 bg-orange-50 shadow-md"
																	: "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all border-gray-200 hover:border-gray-300 hover:bg-gray-50"
															}
														>
															<input
																type="radio"
																name="type"
																value={typeObj.value}
																checked={isSelected}
																onChange={handleInput}
																className="hidden"
															/>
															<Icon className={isSelected ? "w-5 h-5 text-orange-500" : "w-5 h-5 text-gray-400"} />
															<span className={isSelected ? "text-sm font-medium text-orange-700" : "text-sm font-medium text-gray-700"}>
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
													<optgroup label="Team Members">
														{teamMembers.map((member) => (
															<option key={member.user_id} value={member.user_id}>
																👤 {member.first_name} {member.last_name} - {member.role} ({member.email})
															</option>
														))}
													</optgroup>
													{platformOwner && (
														<optgroup label="Platform">
															<option value={platformOwner.id}>
																👑 Platform Owner ({platformOwner.email})
															</option>
														</optgroup>
													)}
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
											Send Ticket
										</button>
										<button
											type="button"
											onClick={() => {
												setShowForm(false);
												setError("");
											}}
											className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-all"
										>
											Cancel
										</button>
									</div>
								</form>
							</div>
						)}
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-600 font-medium">Total Tickets</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
								</div>
								<HelpCircle className="w-10 h-10 text-orange-500" />
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-600 font-medium">Open</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">{stats.open}</p>
								</div>
								<AlertCircle className="w-10 h-10 text-yellow-500" />
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-600 font-medium">In Progress</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">{stats.inProgress}</p>
								</div>
								<Clock className="w-10 h-10 text-blue-500" />
							</div>
						</div>
						<div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-600 font-medium">Solved</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">{stats.solved}</p>
								</div>
								<CheckCircle2 className="w-10 h-10 text-green-500" />
							</div>
						</div>
					</div>

					{/* Filters */}
					<div className="bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-4">
							<Filter className="w-5 h-5 text-orange-500" />
							<h2 className="text-lg font-bold text-gray-900">Filter Tickets</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Type</label>
								<div className="flex flex-wrap gap-2">
									{ticketTypes.map((type) => {
										const Icon = type.icon;
										return (
											<button
												key={type.value}
												onClick={() => setFilterType(type.value)}
												className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
													filterType === type.value
														? "border-orange-500 bg-orange-50 text-orange-700"
														: "border-gray-200 hover:border-gray-300 text-gray-600"
												}`}
											>
												{Icon && <Icon className="w-4 h-4" />}
												<span className="text-sm font-medium">{type.label}</span>
											</button>
										);
									})}
								</div>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
								<select
									value={filterStatus}
									onChange={(e) => setFilterStatus(e.target.value)}
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition appearance-none bg-white"
								>
									{statusOptions.map(status => (
										<option key={status.value} value={status.value}>{status.label}</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{/* Tickets Table */}
					<div className="bg-white rounded-xl shadow-md overflow-hidden">
						{loading ? (
							<div className="flex items-center justify-center py-20">
								<Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
										<tr>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Subject
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Sender
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Sender Role
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Type
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Priority
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Status
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Message
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100">
										{filteredTickets.length === 0 ? (
											<tr>
													<td colSpan={8} className="text-center py-12 text-gray-500">
													<div className="flex flex-col items-center gap-3">
														<HelpCircle className="w-12 h-12 text-gray-300" />
														<p className="text-lg font-medium">No tickets found</p>
														<p className="text-sm">Tickets from your team will appear here</p>
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
														<td className="px-6 py-4">
															<div className="font-medium text-gray-900">{ticket.sender_name}</div>
														</td>
														<td className="px-6 py-4">
															<Badge className="bg-indigo-100 text-indigo-700 capitalize">
																{ticket.sender?.user_role || 'user'}
															</Badge>
														</td>
														<td className="px-6 py-4">
															<Badge className={`flex items-center gap-1.5 w-fit ${
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
															<Badge className={`${
																ticket.status === "solved" || ticket.status === "closed"
																	? "bg-green-100 text-green-700"
																	: ticket.status === "in-progress"
																	? "bg-blue-100 text-blue-700"
																	: ticket.status === "viewed"
																	? "bg-purple-100 text-purple-700"
																	: "bg-yellow-100 text-yellow-700"
															}`}>
																{ticket.status}
															</Badge>
														</td>
														<td className="px-6 py-4">
															<p className="text-sm text-gray-700 max-w-md truncate">
																{ticket.message}
															</p>
														</td>
														<td className="px-6 py-4">
															<div className="flex flex-col gap-2">
																{ticket.status === "open" && (
																	<button
																		className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow hover:shadow-md"
																		onClick={() => updateTicketStatus(ticket.id, "viewed")}
																	>
																		Mark Viewed
																	</button>
																)}
																{(ticket.status === "open" || ticket.status === "viewed") && (
																	<button
																		className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow hover:shadow-md"
																		onClick={() => updateTicketStatus(ticket.id, "in-progress")}
																	>
																		Start Work
																	</button>
																)}
																{ticket.status === "in-progress" && (
																	<button
																		className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow hover:shadow-md"
																		onClick={() => updateTicketStatus(ticket.id, "solved")}
																	>
																		Mark Solved
																	</button>
																)}
																{ticket.status !== "closed" && (
																	<button
																		className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow hover:shadow-md"
																		onClick={() => updateTicketStatus(ticket.id, "closed")}
																	>
																		Close
																	</button>
																)}
															</div>
														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>
		</EmployerAdminLayout>
	);
};

export default EmployerAdminTickets;
