import { useEffect, useMemo, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
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
  Clock3,
  Inbox,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  Ticket,
  User,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type TicketStatus = "open" | "resolved" | "closed";
type TicketPriority = "low" | "normal" | "high" | "urgent";
type TicketMailbox = "my" | "inbox";

interface SupportTicket {
  id: string;
  userId: string;
  assignedTo: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
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

interface RecruiterInfo {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  jobTitles?: string[];
}

const statusOptions: Array<{ value: "all" | TicketStatus; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions: Array<{ value: TicketPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const getStatusBadgeClassName = (status: TicketStatus) => {
  switch (status) {
    case "closed":
      return "border border-slate-200 bg-slate-50 text-slate-700";
    case "resolved":
      return "border border-green-200 bg-green-50 text-green-700";
    default:
      return "border border-orange-200 bg-orange-50 text-orange-700";
  }
};

const getPriorityBadgeClassName = (priority: TicketPriority) => {
  switch (priority) {
    case "urgent":
      return "border border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border border-orange-300 bg-orange-100 text-orange-800";
    case "normal":
      return "border border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
};

const TalentSupportTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeMailbox, setActiveMailbox] = useState<TicketMailbox>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | TicketStatus>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [inboxTickets, setInboxTickets] = useState<SupportTicket[]>([]);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    priority: "normal" as TicketPriority,
    message: "",
    assignedTo: "",
  });

  const [newMessage, setNewMessage] = useState("");
  const [recruiters, setRecruiters] = useState<RecruiterInfo[]>([]);
  const [recruiterDirectory, setRecruiterDirectory] = useState<Record<string, RecruiterInfo>>({});
  const [owners, setOwners] = useState<RecruiterInfo[]>([]);
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);

  // Load tickets
  useEffect(() => {
    const loadTickets = async () => {
      if (!user?.id) {
        setMyTickets([]);
        setInboxTickets([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [myResult, inboxResult] = await Promise.all([
          supabase
            .from("support_tickets")
            .select("id, user_id, assigned_to, subject, status, priority, created_at, updated_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("support_tickets")
            .select("id, user_id, assigned_to, subject, status, priority, created_at, updated_at")
            .eq("assigned_to", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (myResult.error) throw myResult.error;
        if (inboxResult.error) throw inboxResult.error;

        const mapTicket = (row: any): SupportTicket => ({
          id: row.id,
          userId: row.user_id,
          assignedTo: row.assigned_to || null,
          subject: row.subject,
          status: (row.status as TicketStatus) || "open",
          priority: (row.priority as TicketPriority) || "normal",
          createdAt: new Date(row.created_at).toLocaleDateString("en-GB"),
          updatedAt: new Date(row.updated_at).toLocaleDateString("en-GB"),
        });

        setMyTickets((myResult.data || []).map(mapTicket));
        setInboxTickets((inboxResult.data || []).map(mapTicket));
      } catch (error) {
        console.error("Failed to load tickets", error);
        toast({
          title: "Error loading tickets",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadTickets();
  }, [user?.id, toast]);

  // Load recruiters who scheduled interviews for this talent
  useEffect(() => {
    const loadRecruiters = async () => {
      if (!user?.id) {
        setRecruiters([]);
        setRecruiterDirectory({});
        return;
      }

      setLoadingRecruiters(true);

      try {
        // Get talent profile
        const { data: talent, error: talentError } = await supabase
          .from("talents")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (talentError || !talent) {
          setRecruiters([]);
          setRecruiterDirectory({});
          setLoadingRecruiters(false);
          return;
        }

        // Get applications for this talent
        const { data: applications, error: appError } = await supabase
          .from("applications")
          .select("id, job_id")
          .eq("talent_id", talent.id);

        if (appError || !applications || applications.length === 0) {
          setRecruiters([]);
          setRecruiterDirectory({});
          setLoadingRecruiters(false);
          return;
        }

        // Get interviews for this talent's applications and collect team_member_id values
        const { data: interviews, error: interviewError } = await supabase
          .from("interviews")
          .select("team_member_id, application_id")
          .in(
            "application_id",
            applications.map((a) => a.id)
          )
          .not("team_member_id", "is", null);

        if (interviewError) throw interviewError;

        const recruiterIds = Array.from(
          new Set((interviews || []).map((row: any) => row.team_member_id).filter(Boolean))
        ) as string[];

        const applicationById = new Map<string, any>((applications || []).map((app: any) => [app.id, app]));
        const jobIds = Array.from(
          new Set(
            (applications || [])
              .map((app: any) => app.job_id)
              .filter(Boolean)
          )
        ) as string[];

        const jobTitleById = new Map<string, string>();
        if (jobIds.length > 0) {
          const { data: jobsData, error: jobsError } = await supabase
            .from("jobs")
            .select("id, title")
            .in("id", jobIds);

          if (jobsError) throw jobsError;

          (jobsData || []).forEach((job: any) => {
            jobTitleById.set(job.id, job.title);
          });
        }

        const jobTitlesForRecruiter = new Map<string, Set<string>>();
        (interviews || []).forEach((row: any) => {
          const teamMemberId = row.team_member_id as string | null;
          if (!teamMemberId) return;

          const application = applicationById.get(row.application_id);
          const jobTitle = application?.job_id ? jobTitleById.get(application.job_id) : null;
          if (!jobTitle) return;

          if (!jobTitlesForRecruiter.has(teamMemberId)) {
            jobTitlesForRecruiter.set(teamMemberId, new Set());
          }
          jobTitlesForRecruiter.get(teamMemberId)!.add(jobTitle);
        });

        // Fetch team member details separately using the collected ids
        const recruitersMap = new Map<string, RecruiterInfo>();
        const directory: Record<string, RecruiterInfo> = {};

        if (recruiterIds.length > 0) {
          const { data: teamMembers, error: teamMembersError } = await supabase
            .from("employer_team_members")
            .select("id, user_id, first_name, last_name")
            .in("id", recruiterIds);

          if (teamMembersError) throw teamMembersError;

          const teamMemberById = new Map((teamMembers || []).map((member: any) => [member.id, member]));

          recruiterIds.forEach((id: string) => {
            const member = teamMemberById.get(id) as any;
            if (!member) return;

            const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || "Recruiter";
            const recruiterInfo = {
              id,
              userId: member.user_id,
              name,
              email: null,
              jobTitles: Array.from(jobTitlesForRecruiter.get(id) || []),
            };

            recruitersMap.set(id, recruiterInfo);
            directory[member.user_id] = recruiterInfo;
          });
        }

        const recruiterList = Array.from(recruitersMap.values());
        setRecruiters(recruiterList);
        setRecruiterDirectory(directory);
        const { data: ownersData, error: ownersError } = await supabase
          .from("owners")
          .select("id, user_id, full_name");

        if (!ownersError && ownersData) {
          const ownersList: RecruiterInfo[] = ownersData.map((o: any) => {
            const info = {
              id: o.id,
              userId: o.user_id,
              name: o.full_name,
              email: null,
            };
            directory[o.user_id] = info;
            return info;
          });
          setOwners(ownersList);
          setRecruiterDirectory({ ...directory });
        } else {
          setOwners([]);
        }
      } catch (error) {
        console.error("Failed to load recruiters", error);
        setRecruiters([]);
        setRecruiterDirectory({});
      } finally {
        setLoadingRecruiters(false);
      }
    };

    void loadRecruiters();
  }, [user?.id]);

  // Load messages for selected ticket
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

        const mapMessage = (row: any): TicketMessage => {
          let name = row.is_from_support ? "Support" : "User";
          
          if (row.sender_id === user?.id) {
            name = "You";
          } else if (row.is_from_support) {
             // If it's from support, try to get their name from recruiters list
             if (recruiterDirectory[row.sender_id]) {
                name = recruiterDirectory[row.sender_id].name;
             } else if (selectedTicket.assignedTo) {
                // Fallback to assigned person's name if we have it
                const assigned = recruiterDirectory[selectedTicket.assignedTo];
                if (assigned) name = assigned.name;
             }
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
        };

        setMessages((data || []).map(mapMessage));
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    void loadMessages();
  }, [selectedTicket, user?.name]);

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

    if (!user?.id) {
      toast({
        title: "Not signed in",
        description: "Please sign in to create a ticket.",
        variant: "destructive",
      });
      return;
    }

    if (!newTicket.assignedTo) {
      toast({
        title: "Select recipient",
        description: "Please select a recruiter or owner to contact.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          assigned_to: newTicket.assignedTo || null,
          subject: newTicket.subject.trim(),
          status: "open",
          priority: newTicket.priority,
        })
        .select()
        .single();

      if (ticketError || !ticketData) throw ticketError || new Error("Failed to create ticket");

      // Add initial message
      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketData.id,
        sender_id: user.id,
        message: newTicket.message.trim(),
        is_from_support: false,
      });

      const newTicketObj: SupportTicket = {
        id: ticketData.id,
        userId: ticketData.user_id,
        assignedTo: ticketData.assigned_to || null,
        subject: ticketData.subject,
        status: ticketData.status,
        priority: ticketData.priority,
        createdAt: new Date(ticketData.created_at).toLocaleDateString("en-GB"),
        updatedAt: new Date(ticketData.updated_at).toLocaleDateString("en-GB"),
      };

      setMyTickets((previous) => [newTicketObj, ...previous]);
      setShowCreateModal(false);
      setActiveMailbox("my");
      setNewTicket({ subject: "", priority: "normal", message: "", assignedTo: "" });
      toast({ title: "Ticket created", description: "Your support ticket has been created." });
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user?.id) {
      return;
    }

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
        .select("id, ticket_id, sender_id, message, is_from_support, read_at, created_at")
        .single();

      if (error || !data) throw error || new Error("Failed to send message");

      const newMsg: TicketMessage = {
        id: data.id,
        ticketId: data.ticket_id,
        senderId: data.sender_id,
        senderName: user.name || "You",
        senderEmail: user.email || "",
        message: data.message,
        isFromSupport: data.is_from_support,
        readAt: data.read_at,
        createdAt: new Date(data.created_at).toLocaleString("en-GB"),
      };

      setMessages((previous) => [...previous, newMsg]);
      setNewMessage("");
    } catch (error: any) {
      console.error("Failed to send message", error);
      toast({
        title: "Failed to send message",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      setSelectedTicket({ ...selectedTicket, status: newStatus });
      
      const updater = (prev: SupportTicket[]) => 
        prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t);
      
      setMyTickets(updater);
      setInboxTickets(updater);

      toast({
        title: `Ticket ${newStatus}`,
        description: `Ticket status updated to ${newStatus}.`,
      });
    } catch (err: any) {
      console.error("Failed to update status", err);
      toast({
        title: "Update failed",
        description: "Could not update ticket status.",
        variant: "destructive",
      });
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
        ticket.status.toLowerCase().includes(normalizedSearch) ||
        ticket.priority.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [filterStatus, searchQuery, sourceTickets]);

  const resultsLabel =
    filteredTickets.length === sourceTickets.length
      ? `Showing all ${sourceTickets.length} tickets`
      : `Showing ${filteredTickets.length} of ${sourceTickets.length} tickets`;

  return (
    <TalentLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        {/* Header */}
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
                Get support quickly. Track every request and view conversations in one place.
              </p>
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

        {/* Filters */}
        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_320px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by subject, status, or priority..."
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | TicketStatus)}>
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

        {/* Tickets List */}
        {loading ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredTickets.map((ticket) => (
              <article
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setShowDetailModal(true);
                }}
                className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-5 flex-1">
                      {/* Assigned To Section */}
                      {(() => {
                        const assignedRecipient = ticket.assignedTo ? recruiterDirectory[ticket.assignedTo] : null;
                        return assignedRecipient ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">Assigned To</span>
                            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{assignedRecipient.name}</h3>
                            {assignedRecipient.jobTitles && assignedRecipient.jobTitles.length > 0 && (
                              <p className="mt-1 text-sm font-semibold text-slate-600 line-clamp-1">
                                Jobs: {assignedRecipient.jobTitles.join(", ")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">Assigned To</span>
                            <h3 className="text-xl font-extrabold text-slate-900 mt-1">Support Team</h3>
                          </div>
                        );
                      })()}

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
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            {activeMailbox === "my" ? (
              <>
                <Ticket className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <p className="mb-2 text-xl font-semibold text-slate-900">No tickets yet</p>
                <p className="text-gray-600">Create a ticket to get support.</p>
              </>
            ) : (
              <>
                <Inbox className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <p className="mb-2 text-xl font-semibold text-slate-900">Inbox is empty</p>
                <p className="text-gray-600">Replies will appear here.</p>
              </>
            )}
          </div>
        )}

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-orange-100 bg-white p-5 shadow-2xl sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Create New Ticket</h2>
                  <p className="mt-1 text-sm text-slate-600">Describe your issue and we'll help you.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700">Subject</Label>
                    <Input
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
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
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700">Recipient</Label>
                    <Select
                      value={newTicket.assignedTo}
                      onValueChange={(value) => setNewTicket({ ...newTicket, assignedTo: value })}
                      disabled={loadingRecruiters}
                    >
                      <SelectTrigger className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400">
                        <SelectValue placeholder={loadingRecruiters ? "Loading recipients..." : "Select recruiter or owner"} />
                      </SelectTrigger>
                      <SelectContent>
                        {recruiters.map((recipient) => (
                          <SelectItem key={`recruiter-${recipient.id}`} value={recipient.userId}>
                            <div className="flex flex-col">
                              <span className="font-semibold">{recipient.name} <span className="text-xs text-slate-400">(Recruiter)</span></span>
                              {recipient.email && <span className="text-xs text-slate-500">{recipient.email}</span>}
                              {recipient.jobTitles && recipient.jobTitles.length > 0 && (
                                <span className="text-xs text-slate-500">Jobs: {recipient.jobTitles.join(", ")}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        {owners.map((recipient) => (
                          <SelectItem key={`owner-${recipient.id}`} value={recipient.userId}>
                            <div className="flex flex-col">
                              <span className="font-semibold">{recipient.name} <span className="text-xs text-slate-400">(Owner)</span></span>
                              {recipient.email && <span className="text-xs text-slate-500">{recipient.email}</span>}
                            </div>
                          </SelectItem>
                        ))}
                        {recruiters.length === 0 && owners.length === 0 && (
                          <SelectItem value="__none__" disabled>
                            No recipients available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Recipients come from live recruiter and owner records.</p>
                  </div>

                   <div className="space-y-2 sm:col-span-2">
                     <Label className="text-sm font-semibold text-slate-700">Message</Label>
                     <Textarea
                       value={newTicket.message}
                       onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                       placeholder="Describe your issue in detail..."
                       rows={6}
                       className="resize-none rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                     />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3 border-t border-orange-100 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 text-white shadow-lg hover:from-orange-500 hover:to-orange-400"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateTicket}
                  disabled={submitting || !newTicket.subject.trim() || !newTicket.message.trim() || !newTicket.assignedTo}
                  className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal with Messages */}
        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl">
              {/* Header */}
              <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-6 py-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex flex-col gap-5">
                    {/* Assigned To Section */}
                    {selectedTicket.assignedTo && (() => {
                      const assignedRecipient = recruiterDirectory[selectedTicket.assignedTo];
                      return assignedRecipient ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">Assigned To</span>
                          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{assignedRecipient.name}</h3>
                          {assignedRecipient.jobTitles && assignedRecipient.jobTitles.length > 0 && (
                            <p className="mt-1 text-sm font-semibold text-slate-600">
                              Jobs: {assignedRecipient.jobTitles.join(", ")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">Assigned To</span>
                          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">Support Team</h3>
                        </div>
                      );
                    })()}

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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-white px-6 py-6">
                {loadingMessages ? (
                  <div className="flex h-full flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500 mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading Conversation...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-center">
                    <div>
                      <MessageSquare className="mx-auto h-12 w-12 text-orange-200 mb-3" />
                      <p className="text-slate-500">No messages yet. Write a message to get started.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-3 ${msg.senderId === user?.id ? "justify-end" : ""}`}>
                        <div
                          className={`max-w-xs rounded-2xl px-4 py-2 ${
                            msg.senderId === user?.id
                              ? "rounded-br-none bg-orange-500 text-white"
                              : "rounded-bl-none border border-orange-200 bg-orange-50 text-slate-900"
                          }`}
                        >
                          {msg.senderId !== user?.id && (
                            <p className="text-xs font-semibold text-orange-600 mb-1">{msg.senderName}</p>
                          )}
                          <p className="text-sm break-words">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">{msg.createdAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer / Message Input */}
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
    </TalentLayout>
  );
};

export default TalentSupportTickets;
