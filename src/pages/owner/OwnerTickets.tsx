import { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bug, Wrench, Lightbulb, CreditCard, HelpCircle, Filter, CheckCircle2, Clock, AlertCircle, User, Send, X } from "lucide-react";
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

const OwnerTickets = () => {
	const { user } = useAuth();
	const { toast } = useToast();
	const [tickets, setTickets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterType, setFilterType] = useState("All");
	const [filterStatus, setFilterStatus] = useState("All");
	const [view, setView] = useState<"sent" | "inbox">("inbox");
	const [showForm, setShowForm] = useState(false);
	const [recipients, setRecipients] = useState([]);
	const [form, setForm] = useState({
		subject: "",
		message: "",
		type: "Technical",
		priority: "medium",
		assignedTo: "",
	});
	const [error, setError] = useState("");

	useEffect(() => {
		loadRecipients();
		loadTickets();
	}, [user, view]);

	async function loadRecipients() {
		try {
			// Get all superadmins with their employer data
			const { data: employers, error: empError } = await supabase
				.from("employers")
				.select("id, user_id, company_name, rep_first_name, rep_last_name");

			if (empError) throw empError;

			const superadminIds = (employers || []).map(emp => emp.user_id).filter(Boolean);
			const { data: superadmins } = await supabase
				.from("users")
				.select("id, email")
				.eq("user_role", "superadmin")
				.in("id", superadminIds);

			// Get all talents
			const { data: talents } = await supabase
				.from("talents")
				.select("user_id, full_name");

			const talentIds = (talents || []).map(t => t.user_id).filter(Boolean);
			const { data: talentUsers } = await supabase
				.from("users")
				.select("id, email")
				.eq("user_role", "talent")
				.in("id", talentIds);

			const combined = [];

			// Add superadmins
			if (employers && superadmins) {
				employers.forEach(emp => {
					const superadmin = superadmins.find(sa => sa.id === emp.user_id);
					if (superadmin) {
						const name = `${emp.rep_first_name || ''} ${emp.rep_last_name || ''}`.trim() || superadmin.email;
						combined.push({
							id: superadmin.id,
							name: name,
							email: superadmin.email,
							company: emp.company_name,
							type: "superadmin"
						});
					}
				});
			}

			// Add talents
			if (talents && talentUsers) {
				talents.forEach(talent => {
					const user = talentUsers.find(u => u.id === talent.user_id);
					if (user) {
						combined.push({
							id: user.id,
							name: talent.full_name || user.email,
							email: user.email,
							company: "Talent",
							type: "talent"
						});
					}
				});
			}

			setRecipients(combined);
			if (combined.length > 0) {
				setForm(prev => ({ ...prev, assignedTo: combined[0].id }));
			}
		} catch (error) {
			console.error("Error loading recipients:", error);
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
			
			if (view === "inbox") {
				// Get tickets assigned to owner (platform owner receives all tickets assigned to them)
				query = query.eq("assigned_to", user.id);
			} else {
				// Sent: tickets created by owner
				query = query.eq("user_id", user.id);
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
		} catch (error) {
			console.error("Error updating ticket:", error);
			toast({ title: "Error", description: "Failed to update ticket", variant: "destructive" });
		}
	}

	function handleInput(e) {
		setForm({ ...form, [e.target.name]: e.target.value });
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!form.subject || !form.message || !form.assignedTo) {
			setError("All fields are required.");
			return;
		}

		try {
			const { error: insertError } = await supabase
				.from("tickets")
				.insert({
					user_id: user.id,
					sender_name: "Platform Owner",
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

			setForm({ subject: "", message: "", type: "Technical", priority: "medium", assignedTo: recipients[0]?.id || "" });
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
		<OwnerLayout>
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 p-6">
				<div className="max-w-7xl mx-auto space-y-6">
					{/* Header */}
					<div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white">
						<h1 className="text-3xl font-bold mb-2">Platform Support Tickets</h1>
						<p className="text-purple-100">Tickets assigned to you from talents and recruiters</p>
						<div className="flex gap-2 mt-4">
							<button
								onClick={() => setView("inbox")}
								className={`px-6 py-2 rounded-lg font-semibold transition-all ${
									view === "inbox"
										? "bg-white text-purple-600 shadow-lg"
										: "bg-purple-500 text-white hover:bg-purple-400"
								}`}
							>
								📥 Inbox
							</button>
							<button
								onClick={() => setView("sent")}
								className={`px-6 py-2 rounded-lg font-semibold transition-all ${
									view === "sent"
										? "bg-white text-purple-600 shadow-lg"
										: "bg-purple-500 text-white hover:bg-purple-400"
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
								className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
								onClick={() => setShowForm(true)}
							>
								<Send className="w-5 h-5" />
								Create New Ticket
							</button>
						) : (
							<div className="bg-white rounded-xl shadow-lg p-8">
								<div className="flex justify-between items-center mb-6">
									<h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
										<Send className="w-6 h-6 text-purple-500" />
										Send Ticket
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
											className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
											placeholder="Brief description of your message"
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
																	? "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all border-purple-500 bg-purple-50 shadow-md"
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
															<Icon className={isSelected ? "w-5 h-5 text-purple-500" : "w-5 h-5 text-gray-400"} />
															<span className={isSelected ? "text-sm font-medium text-purple-700" : "text-sm font-medium text-gray-700"}>
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
													className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none bg-white"
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
													className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none bg-white"
													required
												>
													<option value="">Select recipient...</option>
													<optgroup label="Superadmins">
														{recipients.filter(r => r.type === "superadmin").map((recipient) => (
															<option key={recipient.id} value={recipient.id}>
																🏢 {recipient.company} - {recipient.name} ({recipient.email})
															</option>
														))}
													</optgroup>
													<optgroup label="Talents">
														{recipients.filter(r => r.type === "talent").map((recipient) => (
															<option key={recipient.id} value={recipient.id}>
																👤 {recipient.name} ({recipient.email})
															</option>
														))}
													</optgroup>
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
											className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
											placeholder="Enter your message..."
											rows={6}
											required
										/>
									</div>

									<div className="flex gap-3 items-center pt-2">
										<button
											type="submit"
											className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
						<div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-600 font-medium">Total Tickets</p>
									<p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
								</div>
								<HelpCircle className="w-10 h-10 text-purple-500" />
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
							<Filter className="w-5 h-5 text-purple-500" />
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
														? "border-purple-500 bg-purple-50 text-purple-700"
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
									className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none bg-white"
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
								<Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
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
														<p className="text-sm">Support tickets will appear here</p>
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
															<div className="flex items-center gap-2">
																<User className="w-4 h-4 text-gray-400" />
																<span className="font-medium text-gray-900">{ticket.sender_name}</span>
															</div>
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
		</OwnerLayout>
	);
};

export default OwnerTickets;
