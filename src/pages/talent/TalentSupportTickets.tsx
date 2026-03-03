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
	const [assignees, setAssignees] = useState<any[]>([]);
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

			// Get all employers with their superadmin info
			const { data: employers, error: empError } = await supabase
				.from("employers")
				.select("id, user_id, company_name, rep_first_name, rep_last_name");

			if (empError) throw empError;

			// Get all superadmin users
			const superadminIds = (employers || []).map(emp => emp.user_id).filter(Boolean);
			const { data: superadmins, error: superError } = await supabase
				.from("users")
				.select("id, email")
				.eq("user_role", "superadmin")
				.in("id", superadminIds);

			if (superError) throw superError;

			// Load platform owner
			const { data: ownerUser, error: ownerError } = await supabase
				.from("users")
				.select("id, email")
				.eq("user_role", "owner")
				.maybeSingle();

			if (ownerError) throw ownerError;

			const combined = [];

			// Add all company superadmins with company names
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

			// Add platform owner if exists
			if (ownerUser) {
				combined.push({
					id: ownerUser.id,
					name: ownerUser.email || "Platform Owner",
					email: ownerUser.email,
					company: "Platform",
					type: "owner"
				});
			}

			setAssignees(combined);
			
			// Auto-select first assignee as default
			if (combined.length > 0) {
				setForm(prev => ({ ...prev, assignedTo: combined[0].id }));
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
			// Get sender name from talents table
			const { data: talent } = await supabase
				.from("talents")
				.select("full_name")
				.eq("user_id", user.id)
				.maybeSingle();

			const senderName = talent?.full_name || "Talent";

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

			setForm({ subject: "", message: "", type: "Technical", priority: "medium", assignedTo: assignees[0]?.id || "" });
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

	async function handleDelete(ticketId: string) {
		try {
			const { error } = await supabase
				.from("tickets")
				.delete()
				.eq("id", ticketId);

			if (error) throw error;

			toast({ title: "Success", description: "Ticket deleted successfully" });
			loadTickets();
		} catch (error) {
			console.error("Error deleting ticket:", error);
			toast({ title: "Error", description: "Failed to delete ticket", variant: "destructive" });
		}
	}

	async function handleClose(ticketId: string) {
		try {
			const { error } = await supabase
				.from("tickets")
				.update({ status: "closed", resolved_at: new Date().toISOString() })
				.eq("id", ticketId);

			if (error) throw error;

			toast({ title: "Success", description: "Ticket closed successfully" });
			loadTickets();
		} catch (error) {
			console.error("Error closing ticket:", error);
			toast({ title: "Error", description: "Failed to close ticket", variant: "destructive" });
		}
	}

	function getTicketTypeConfig(type: string) {
		return ticketTypes.find(t => t.value === type) || ticketTypes[0];
	}

	const filteredTickets = tickets.filter(ticket => {
		return filterType === "All" || ticket.ticket_type === filterType;
	});

	return (
		<TalentLayout>
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-6">
				<div className="max-w-7xl mx-auto space-y-6">
					{/* Header */}
					<div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
						<h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
						<p className="text-blue-100">Get help from our support team</p>
						<div className="flex gap-2 mt-4">
							<button
								onClick={() => setView("sent")}
								className={view === "sent"
									? "px-6 py-2 rounded-lg font-semibold transition-all bg-white text-blue-600 shadow-lg"
									: "px-6 py-2 rounded-lg font-semibold transition-all bg-blue-400 text-white hover:bg-blue-300"
								}
							>
								📤 Sent
							</button>
							<button
								onClick={() => setView("inbox")}
								className={view === "inbox"
									? "px-6 py-2 rounded-lg font-semibold transition-all bg-white text-blue-600 shadow-lg"
									: "px-6 py-2 rounded-lg font-semibold transition-all bg-blue-400 text-white hover:bg-blue-300"
								}
							>
								📥 Inbox
							</button>
						</div>
					</div>

					{/* Create Ticket Button */}
					<div>
						{!showForm ? (
							<button
								className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
								onClick={() => setShowForm(true)}
							>
								<Send className="w-5 h-5" />
								Create New Ticket
							</button>
						) : (
							<div className="bg-white rounded-xl shadow-lg p-8">
								<div className="flex justify-between items-center mb-6">
									<h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
										<Send className="w-6 h-6 text-blue-500" />
										Create Support Ticket
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
											className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
																	? "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all border-blue-500 bg-blue-50 shadow-md"
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
															<Icon className={isSelected ? "w-5 h-5 text-blue-500" : "w-5 h-5 text-gray-400"} />
															<span className={isSelected ? "text-sm font-medium text-blue-700" : "text-sm font-medium text-gray-700"}>
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
													className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
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
													className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
													required
												>
													<option value="">Select recipient...</option>
													{assignees.map((assignee) => (
														<option key={assignee.id} value={assignee.id}>
															{assignee.type === "owner" ? "👑" : "🏢"} {assignee.company} - {assignee.name} ({assignee.email})
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
											className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
											placeholder="Describe your issue in detail..."
											rows={6}
											required
										/>
									</div>

									<div className="flex gap-3 items-center pt-2">
										<button
											type="submit"
											className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
										>
											<Send className="w-4 h-4" />
											Submit Ticket
										</button>
										<button
											type="button"
											onClick={() => {
												setShowForm(false);
												setError("");
											}}
											className="px-8 py-3 rounded-xl border-2 border-gray-200 font-semibold hover:bg-gray-50 transition-all"
										>
											Cancel
										</button>
									</div>
								</form>
							</div>
						)}
					</div>

					{/* Filter Section */}
					<div className="bg-white rounded-xl shadow-md p-6">
						<div className="flex items-center gap-3 mb-4">
							<Filter className="w-5 h-5 text-blue-500" />
							<h2 className="text-lg font-bold text-gray-900">Filter Tickets</h2>
						</div>
						<div className="flex flex-wrap gap-2">
							{ticketTypes.map((type) => {
								const Icon = type.icon;
								const isActive = filterType === type.value;
								return (
									<button
										key={type.value}
										onClick={() => setFilterType(type.value)}
										className={
											isActive
												? "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all border-blue-500 bg-blue-50 text-blue-700"
												: "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all border-gray-200 hover:border-gray-300 text-gray-600"
										}
									>
										{Icon && <Icon className="w-4 h-4" />}
										<span className="text-sm font-medium">{type.label}</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Tickets Table */}
					<div className="bg-white rounded-xl shadow-md overflow-hidden">
						{loading ? (
							<div className="flex items-center justify-center py-20">
								<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
										<tr>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Subject
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">											Sender Role
										</th>
										<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">												Type
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Priority
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Message
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
												Status
											</th>
											<th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
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
														<td className="px-6 py-4">
															<Badge className="bg-indigo-100 text-indigo-700 capitalize">
															{ticket.sender?.user_role || 'user'}
															</Badge>
														</td>
														<td className="px-6 py-4">
													<Badge className={
														ticket.ticket_type === "Technical" ? "flex items-center gap-1.5 w-fit bg-blue-100 text-blue-700" :
														ticket.ticket_type === "Bug Report" ? "flex items-center gap-1.5 w-fit bg-red-100 text-red-700" :
														ticket.ticket_type === "Feature Request" ? "flex items-center gap-1.5 w-fit bg-purple-100 text-purple-700" :
														ticket.ticket_type === "Billing" ? "flex items-center gap-1.5 w-fit bg-orange-100 text-orange-700" :
														"flex items-center gap-1.5 w-fit bg-gray-100 text-gray-700"
													}>
																{Icon && <Icon className="w-3.5 h-3.5" />}
																{ticket.ticket_type}
															</Badge>
														</td>
														<td className="px-6 py-4">
													<Badge className={
														ticket.priority === "urgent" ? "bg-red-100 text-red-700" :
														ticket.priority === "high" ? "bg-orange-100 text-orange-700" :
														ticket.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
														"bg-green-100 text-green-700"
													}>
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
													<Badge className={
														ticket.status === "solved" || ticket.status === "closed"
															? "bg-green-100 text-green-700"
															: ticket.status === "in-progress"
															? "bg-blue-100 text-blue-700"
															: ticket.status === "viewed"
															? "bg-purple-100 text-purple-700"
															: "bg-yellow-100 text-yellow-700"
													}>
																{ticket.status}
															</Badge>
														</td>
														<td className="px-6 py-4">
															<div className="flex gap-2">
																{ticket.status !== "solved" && ticket.status !== "closed" && (
																	<button
																		className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition shadow hover:shadow-md"
																		onClick={() => handleClose(ticket.id)}
																	>
																		<CheckCircle2 className="w-3.5 h-3.5" />
																		Close
																	</button>
																)}
																<button
																	className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition shadow hover:shadow-md"
																	onClick={() => handleDelete(ticket.id)}
																>
																	<Trash2 className="w-3.5 h-3.5" />
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
						)}
					</div>
				</div>
			</div>
		</TalentLayout>
	);
};

export default TalentSupportTickets;
