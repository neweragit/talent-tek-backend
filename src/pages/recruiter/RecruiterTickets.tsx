import { useEffect, useMemo, useState } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  CalendarDays,
  Clock3,
  FileText as FileTextIcon,
  Inbox,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Ticket,
  User,
  X,
  ChevronRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type TicketMailbox = "my" | "inbox";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface SupportTicket {
  id: string;
  assignedTo?: string | null;
  subject: string;
  message: string;
  createdAt: string;
  status: "open" | "resolved" | "closed";
  priority: TicketPriority;
  senderName?: string | null;
  senderEmail?: string | null;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  message: string;
  isFromSupport: boolean;
  readAt: string | null;
  createdAt: string;
}

const ticketPriorityOptions: Array<{ value: TicketPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const getPriorityBadgeClassName = (priority: TicketPriority) => {
  switch (priority) {
    case "urgent":
      return "border border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border border-orange-300 bg-orange-100 text-orange-800";
    case "medium":
      return "border border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
};

const getStatusBadgeClassName = (status: string) => {
  switch (status) {
    case "closed":
      return "border border-slate-200 bg-slate-50 text-slate-700";
    case "resolved":
      return "border border-green-200 bg-green-50 text-green-700";
    default:
      return "border border-orange-200 bg-orange-50 text-orange-700";
  }
};

const getRecipientToggleClassName = (active: boolean) =>
  active
    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-200"
    : "border border-orange-200 bg-white text-orange-700 hover:bg-orange-50";

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];



const mapDbTicket = (row: any): SupportTicket => ({
  id: row.id,
  subject: row.subject,
  assignedTo: row.assigned_to ?? null,
  message: row.message || "",
  createdAt: new Date(row.created_at).toLocaleDateString("en-GB"),
  status: row.status,
  priority: (row.priority as TicketPriority) || "medium",
  senderName: row.sender_name || row.users?.email?.split("@")[0] || "Unknown",
  senderEmail: row.users?.email || null,
});

const RecruiterTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeMailbox, setActiveMailbox] = useState<TicketMailbox>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "resolved" | "closed">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [inboxTickets, setInboxTickets] = useState<SupportTicket[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [supervisorId, setSupervisorId] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [teamMemberId, setTeamMemberId] = useState<string | null>(null);
  const [supervisorTeamMemberId, setSupervisorTeamMemberId] = useState<string | null>(null);
  const [senderName, setSenderName] = useState("Recruiter");

  const [newTicket, setNewTicket] = useState({
    subject: "",
    priority: "medium" as TicketPriority,
    message: "",
  });
  const [recipientMode, setRecipientMode] = useState<"supervisor" | "talent">("supervisor");
  const [talentQuery, setTalentQuery] = useState("");
  const [talentResults, setTalentResults] = useState<Array<{ id: string; full_name: string; user_id: string }>>([]);
  const [selectedTalent, setSelectedTalent] = useState<{ id: string; full_name: string; user_id: string } | null>(null);
  const selectedRecipientLabel = recipientMode === "supervisor"
    ? supervisorName || "Supervisor"
    : selectedTalent?.full_name || "Select a talent";

  useEffect(() => {
    const loadTickets = async () => {
      if (!user?.id) {
        setMyTickets([]);
        setInboxTickets([]);
        setSupervisorId(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const teamMemberResult = await supabase
        .from("employer_team_members")
        .select("id, first_name, last_name, invited_by, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const invitedBy = teamMemberResult.data?.invited_by ?? null;
      setSupervisorId(invitedBy);
      setSupervisorName("");
      setSupervisorEmail("");
      setTeamMemberId(teamMemberResult.data?.id ?? null);

      const fullName = [teamMemberResult.data?.first_name, teamMemberResult.data?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      setSenderName(fullName || user.name || "Recruiter");

      const inboxResult = await supabase
        .from("support_tickets")
        .select("id, user_id, assigned_to, subject, status, priority, created_at, users ( email )")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });

      setInboxTickets((inboxResult.data || []).map(mapDbTicket));

      if (!invitedBy) {
        setMyTickets([]);
        setLoading(false);
        return;
      }

      const [supervisorEmployerResult, supervisorUserResult, supervisorTeamMember] = await Promise.all([
        supabase
          .from("employers")
          .select("rep_first_name, rep_last_name")
          .eq("user_id", invitedBy)
          .maybeSingle(),
        supabase
          .from("users")
          .select("email")
          .eq("id", invitedBy)
          .maybeSingle(),
        supabase
          .from("employer_team_members")
          .select("id")
          .eq("user_id", invitedBy)
          .maybeSingle(),
      ]);

      const repName = [
        supervisorEmployerResult.data?.rep_first_name,
        supervisorEmployerResult.data?.rep_last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      setSupervisorName(repName || "Supervisor");
      setSupervisorEmail(supervisorUserResult.data?.email || "");
      setSupervisorTeamMemberId(supervisorTeamMember.data?.id ?? null);

      const ticketSelect = "id, user_id, assigned_to, subject, status, priority, created_at, users ( email )";

      const [myResultFinal, inboxResultFinal] = await Promise.all([
        supabase
          .from("support_tickets")
          .select(ticketSelect)
          .eq("user_id", user.id)
          .eq("assigned_to", invitedBy)
          .order("created_at", { ascending: false }),
        supabase
          .from("support_tickets")
          .select(ticketSelect)
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setMyTickets((myResultFinal.data || []).map(mapDbTicket));
      setInboxTickets((inboxResultFinal.data || []).map(mapDbTicket));
      setLoading(false);
    };

    void loadTickets();
  }, [user?.id, user?.name]);

  // Load messages when a ticket is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedTicket) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);

      try {
        const { data, error } = await supabase
          .from("support_ticket_messages")
          .select("id, ticket_id, sender_id, message, is_from_support, read_at, created_at, users(email, user_role)")
          .eq("ticket_id", selectedTicket.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setMessages((data || []).map((row: any) => {
          let name = row.is_from_support ? "Support" : (row.users?.email?.split("@")[0] || "User");
          
          if (row.sender_id === user.id) {
            name = senderName || "You";
          }

          return {
            id: row.id,
            ticketId: row.ticket_id,
            senderId: row.sender_id,
            senderName: name,
            senderEmail: row.users?.email || "",
            message: row.message,
            isFromSupport: row.is_from_support,
            readAt: row.read_at,
            createdAt: new Date(row.created_at).toLocaleString("en-GB"),
          };
        }));
      } catch (err) {
        console.error("Failed to load messages", err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [selectedTicket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user?.id) return;

    if (selectedTicket.status === "closed" || selectedTicket.status === "resolved") {
      toast({
        title: "Ticket closed",
        description: "You cannot send messages to a closed or resolved ticket.",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);

    try {
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: newMessage.trim(),
          is_from_support: false,
        })
        .select("id, ticket_id, sender_id, message, is_from_support, read_at, created_at, users(email)")
        .single();

      if (error || !data) throw error || new Error("Failed to send message");

      const newMsg: TicketMessage = {
        id: data.id,
        ticketId: data.ticket_id,
        senderId: data.sender_id,
        senderName: senderName || "You",
        senderEmail: data.users?.email || "",
        message: data.message,
        isFromSupport: data.is_from_support,
        readAt: data.read_at,
        createdAt: new Date(data.created_at).toLocaleString("en-GB"),
      };

      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");
    } catch (err: any) {
      console.error("Failed to send message", err);
      toast({ title: "Failed to send message", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "open" | "resolved" | "closed") => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      setSelectedTicket({ ...selectedTicket, status: newStatus });
      
      const updateList = (prev: SupportTicket[]) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
      
      setMyTickets(updateList);
      setInboxTickets(updateList);

      toast({
        title: `Ticket ${newStatus}`,
        description: `Ticket has been marked as ${newStatus}.`,
      });
    } catch (err: any) {
      console.error("Failed to update status", err);
      toast({
        title: "Update failed",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Talent search for recruiter when selecting a talent recipient
  useEffect(() => {
    if (!talentQuery || talentQuery.trim().length < 2) {
      setTalentResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("talents")
          .select("id, full_name, user_id")
          .ilike("full_name", `%${talentQuery}%`)
          .limit(8);

        if (!error && data) {
          setTalentResults(data as any[]);
        }
      } catch (err) {
        console.error("Talent search failed", err);
        setTalentResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [talentQuery]);

  const sourceTickets = activeMailbox === "my" ? myTickets : inboxTickets;
  const mailboxCounts = { my: myTickets.length, inbox: inboxTickets.length };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({
        title: "Missing details",
        description: "Subject and message are required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let ticketData;
      let ticketError;

      if (recipientMode === "supervisor") {
        if (!supervisorId) {
          throw new Error("No supervisor available to receive this ticket.");
        }

        const result = await supabase
          .from("support_tickets")
          .insert({
            user_id: user.id,
            assigned_to: supervisorId,
            sender_name: senderName,
            subject: newTicket.subject.trim(),
            status: "open",
            priority: newTicket.priority,
          })
          .select()
          .single();
        
        ticketData = result.data;
        ticketError = result.error;
      } else {
        // send to selected talent
        if (!selectedTalent) {
          throw new Error("Please select a talent to message.");
        }

        const result = await supabase
          .from("support_tickets")
          .insert({
            user_id: selectedTalent.user_id,
            assigned_to: user.id,
            sender_name: senderName,
            subject: newTicket.subject.trim(),
            status: "open",
            priority: newTicket.priority,
          })
          .select()
          .single();
        
        ticketData = result.data;
        ticketError = result.error;
      }

      if (ticketError || !ticketData) throw ticketError || new Error("Failed to create ticket");

      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketData.id,
        sender_id: user.id,
        message: newTicket.message.trim(),
        is_from_support: false,
      });

      if (recipientMode === "supervisor") {
        setMyTickets((previous) => [mapDbTicket(ticketData), ...previous]);
        toast({ title: "Ticket sent", description: "Your supervisor received your ticket." });
      } else {
        setInboxTickets((previous) => [mapDbTicket(ticketData), ...previous]);
        toast({ title: "Message sent", description: `Your message has been sent to ${selectedTalent.full_name}.` });
      }

      setShowCreateModal(false);
      setNewTicket({ subject: "", priority: "medium", message: "" });
      setSelectedTalent(null);
      setTalentQuery("");
      setTalentResults([]);
    } catch (error: any) {
      console.error("Failed to create ticket", error);
      toast({
        title: "Failed to create ticket",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return sourceTickets.filter((ticket) => {
      const statusMatches = filterStatus === "all" || ticket.status === filterStatus;
      
      if (!statusMatches) return false;

      if (normalizedSearch.length === 0) return true;

      return (
        ticket.subject.toLowerCase().includes(normalizedSearch) ||
        ticket.message.toLowerCase().includes(normalizedSearch) ||
        ticket.createdAt.toLowerCase().includes(normalizedSearch) ||
        (ticket.senderName ?? "").toLowerCase().includes(normalizedSearch) ||
        (ticket.senderEmail ?? "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [filterStatus, searchQuery, sourceTickets]);

  const resultsLabel =
    filteredTickets.length === sourceTickets.length
      ? `Showing all ${sourceTickets.length} tickets`
      : `Showing ${filteredTickets.length} of ${sourceTickets.length} tickets`;

  const mailboxTitle = activeMailbox === "my" ? "My Tickets" : "Inbox";

  return (
    <RecruiterLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Support Desk
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-slate-900 mb-4">
                Support Tickets
              </h1>
              <p className="max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Communicate directly with your supervisor and keep ticket history in one place.
              </p>
              {activeMailbox === "my" && supervisorId && (
                <div className="mt-4 rounded-2xl border border-orange-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <p className="font-semibold text-orange-700">Receiver</p>
                  <p className="mt-1">{supervisorName || "Supervisor"}</p>
                  <p className="text-slate-500">{supervisorEmail || "No email available"}</p>
                </div>
              )}
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-12 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
            >
              <Plus className="w-4 h-4" />
              Create New Ticket
            </Button>
          </div>
        </section>

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_320px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search..."
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="grid h-12 w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveMailbox("my")}
                className={`flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                  activeMailbox === "my"
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                <Ticket className="h-4 w-4" />
                My ({mailboxCounts.my})
              </button>
              <button
                type="button"
                onClick={() => setActiveMailbox("inbox")}
                className={`flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                  activeMailbox === "inbox"
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                <Inbox className="h-4 w-4" />
                Inbox ({mailboxCounts.inbox})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredTickets.map((ticket) => {
              const directionLabel = activeMailbox === "my" ? "To" : "From";
              const directionName =
                activeMailbox === "my" ? supervisorName || "Supervisor" : ticket.senderName || "Sender";
              const directionEmail =
                activeMailbox === "my" ? supervisorEmail || null : ticket.senderEmail || null;

              return (
                <article
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); setShowDetailModal(true); }}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-5 flex-1">
                        {/* Assigned Section */}
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">{directionLabel}</span>
                          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{directionName}</h3>
                          {directionEmail && <p className="mt-1 text-xs text-slate-500 truncate">{directionEmail}</p>}
                        </div>

                        {/* Metadata Section */}
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-slate-500 font-medium">
                            <Clock3 className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">Created {ticket.createdAt}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${getStatusBadgeClassName(ticket.status)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                              {ticket.status}
                            </Badge>
                            <Badge className={`${getPriorityBadgeClassName(ticket.priority)} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                              Priority: {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Subject Section */}
                    <div className="mt-2 border-t border-orange-50 pt-4">
                      <h2 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-orange-600 transition-colors">
                        <span className="text-orange-400 mr-2 group-hover:text-orange-600">#</span>
                        {ticket.subject}
                      </h2>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            {activeMailbox === "my" ? (
              <>
                <Ticket className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <p className="mb-2 text-xl font-semibold text-slate-900">No tickets yet</p>
                <p className="text-gray-600">Create your first ticket to your supervisor.</p>
              </>
            ) : (
              <>
                <Inbox className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <p className="mb-2 text-xl font-semibold text-slate-900">Inbox is empty</p>
                <p className="text-gray-600">Tickets sent to you will appear here.</p>
              </>
            )}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-2xl">
              <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-6 py-5 sm:px-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create New Ticket</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Choose a recipient: your supervisor or a talent.
                    </p>
                  </div>
                  <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200"
                >
                  <X className="h-5 w-5" />
                </button>
                </div>
              </div>

              <div className="overflow-y-auto px-6 py-5 sm:px-7">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700">Subject</Label>
                    <Input
                      value={newTicket.subject}
                      onChange={(event) => setNewTicket({ ...newTicket, subject: event.target.value })}
                      placeholder="Enter ticket subject"
                      className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as TicketPriority })}
                    >
                      <SelectTrigger className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketPriorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 text-sm text-slate-700 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-orange-700">Receiver</p>
                      <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                        {selectedRecipientLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setRecipientMode("supervisor")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${getRecipientToggleClassName(recipientMode === "supervisor")}`}
                      >
                        Supervisor
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientMode("talent")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${getRecipientToggleClassName(recipientMode === "talent")}`}
                      >
                        Talent
                      </button>
                    </div>

                    {recipientMode === "supervisor" ? (
                      <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                        <p className="text-base font-semibold text-slate-900">{supervisorName || "Supervisor"}</p>
                        <p className="mt-1 text-sm text-slate-500">{supervisorEmail || "No email available"}</p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <Input
                          value={talentQuery}
                          onChange={(e) => setTalentQuery(e.target.value)}
                          placeholder="Search talents by name..."
                          className="h-11 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                        />
                        <div className="max-h-48 overflow-auto rounded-2xl border border-orange-100 bg-white p-1 shadow-sm">
                          {talentResults.map((t) => {
                            const isSelected = selectedTalent?.id === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setSelectedTalent(t)}
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${isSelected ? "bg-orange-50" : "hover:bg-orange-50/70"}`}
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">{t.full_name}</p>
                                  <p className="truncate text-xs text-slate-500">Talent ID: {t.id}</p>
                                </div>
                                {isSelected && <span className="ml-3 rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-semibold text-white">Selected</span>}
                              </button>
                            );
                          })}
                          {talentResults.length === 0 && (
                            <div className="px-4 py-4 text-sm text-slate-500">No matches yet. Start typing to search.</div>
                          )}
                        </div>

                        {selectedTalent && (
                          <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">Selected talent</p>
                            <p className="mt-1 font-semibold text-slate-900">{selectedTalent.full_name}</p>
                            <p className="text-xs text-slate-500">User ID: {selectedTalent.user_id}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700">Message</Label>
                    <Textarea
                      value={newTicket.message}
                      onChange={(event) => setNewTicket({ ...newTicket, message: event.target.value })}
                      placeholder="Describe your issue or question..."
                      rows={5}
                      className="resize-none rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-orange-100 bg-gradient-to-r from-white to-orange-50 px-6 py-4 sm:px-7">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-full border border-orange-200 bg-white text-orange-700 shadow-sm hover:bg-orange-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateTicket}
                    disabled={submitting || !newTicket.subject.trim() || !newTicket.message.trim()}
                    className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-200 hover:from-orange-700 hover:to-orange-600 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal for Recruiter */}
        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
              {/* Header */}
              <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-6 py-6 sm:px-7">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex flex-col gap-5">
                    {/* Assigned To Section */}
                    {selectedTicket.assignedTo && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">Assigned To</span>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-lg font-bold text-orange-700 shadow-sm">
                            {((supervisorName || "R").trim().charAt(0) || "R").toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <h3 className="text-2xl font-extrabold text-slate-900 leading-none">{supervisorName || "Recipient"}</h3>
                            {supervisorEmail && <p className="mt-1 text-sm font-medium text-slate-500">{supervisorEmail}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata Section */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Clock3 className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Created {selectedTicket.createdAt}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${getStatusBadgeClassName(selectedTicket.status)} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
                          {selectedTicket.status}
                        </Badge>
                        <Badge className={`${getPriorityBadgeClassName(selectedTicket.priority)} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>
                          Priority: {selectedTicket.priority}
                        </Badge>

                        {/* Status Management Actions */}
                        <div className="flex items-center gap-3 ml-2">
                          {selectedTicket.status === "open" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus("resolved")}
                                className="h-9 gap-2 rounded-xl border-green-200 bg-green-50 px-4 font-bold text-green-700 shadow-sm transition-all hover:bg-green-100 hover:text-green-800 hover:shadow-md active:scale-95"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-[10px] uppercase tracking-wider">Mark as Resolved</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus("closed")}
                                className="h-9 gap-2 rounded-xl border-slate-300 bg-slate-900 px-4 font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-95"
                              >
                                <Lock className="h-4 w-4 text-slate-400" />
                                <span className="text-[10px] uppercase tracking-wider">Close Ticket</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subject Section */}
                    <div className="mt-2">
                      <h2 className="text-xl font-bold text-slate-800 leading-tight">
                        <span className="text-orange-500 mr-2">#</span>
                        {selectedTicket.subject}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedTicket(null);
                      setMessages([]);
                    }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white border border-orange-100 text-orange-600 shadow-sm transition-all hover:bg-orange-50 hover:scale-110"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-orange-50/30 px-4 py-5 sm:px-6">
                {loadingMessages ? (
                  <div className="flex h-full flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500 mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading Conversation...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-center">
                    <div className="rounded-3xl border border-dashed border-orange-200 bg-white px-6 py-8 shadow-sm">
                      <MessageSquare className="mx-auto mb-3 h-12 w-12 text-orange-200" />
                      <p className="text-slate-600">No messages yet.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ${msg.senderId === user?.id ? "rounded-br-md bg-gradient-to-br from-orange-600 to-orange-500 text-white" : "rounded-bl-md border border-orange-200 bg-white text-slate-900"}`}>
                          {msg.senderId !== user?.id && (
                            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-600">{msg.senderName}</p>
                          )}
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">{msg.message}</p>
                          <p className={`mt-2 text-xs ${msg.senderId === user?.id ? "text-orange-100" : "text-slate-500"}`}>{msg.createdAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-orange-100 bg-orange-50/30 px-6 py-6 sm:px-7">
                {(selectedTicket.status === "closed" || selectedTicket.status === "resolved") ? (
                  <div className="flex items-center justify-center rounded-2xl border border-orange-100 bg-white p-6 text-center shadow-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <Clock3 className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Ticket is {selectedTicket.status}</p>
                      <p className="text-xs text-slate-500">This conversation is complete and cannot be modified.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Write your reply..."
                      rows={2}
                      className="min-h-[4.5rem] resize-none rounded-2xl border-orange-200 bg-orange-50/70 px-4 py-3 focus:border-orange-400 focus:ring-orange-400"
                      disabled={sendingMessage}
                    />
                    <Button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="h-12 self-end gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-lg shadow-orange-200 hover:from-orange-700 hover:to-orange-600 disabled:opacity-50"
                    >
                      {sendingMessage ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};

export default RecruiterTickets;
