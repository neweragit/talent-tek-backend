import { useEffect, useMemo, useState } from "react";
import RecruiterAdminLayout from "@/components/layouts/RecruiterAdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Zap,
} from "lucide-react";

type CompanyAdminTicketType = "Platform Incident" | "Billing" | "Compliance" | "Company Admin" | "Talent Quality" | "Integrations";
type CompanyAdminMailbox = "my" | "inbox";
type TicketStatus = "Open" | "In Review" | "Resolved";

interface CompanyAdminSupportTicket {
  id: number;
  subject: string;
  type: CompanyAdminTicketType;
  status: TicketStatus;
  message: string;
  createdAt: string;
  priority: "High" | "Medium" | "Low";
  senderUserId?: string;
  assignedToUserId?: string;
  senderName?: string;
}

interface TicketRecipient {
  userId: string;
  label: string;
  roleLabel: string;
}

const toDisplayRole = (role?: string) => {
  if (!role) return "Recruiter";
  return role
    .split("-")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const mapUiTypeToDbType = (type: CompanyAdminTicketType) => {
  switch (type) {
    case "Platform Incident":
      return "Technical";
    case "Billing":
      return "Billing";
    case "Integrations":
      return "Feature Request";
    default:
      return "General";
  }
};

const mapDbTypeToUiType = (type: string): CompanyAdminTicketType => {
  if (type === "Billing") return "Billing";
  if (type === "Technical") return "Platform Incident";
  if (type === "Feature Request") return "Integrations";
  if (type === "Bug Report") return "Company Admin";
  return "Compliance";
};

const mapDbStatusToUiStatus = (status: string): TicketStatus => {
  if (status === "solved" || status === "closed") return "Resolved";
  if (status === "in-progress" || status === "viewed") return "In Review";
  return "Open";
};

const mapUiPriorityToDbPriority = (priority: CompanyAdminSupportTicket["priority"]) => {
  if (priority === "High") return "high";
  if (priority === "Low") return "low";
  return "medium";
};

const mapDbPriorityToUiPriority = (priority: string): CompanyAdminSupportTicket["priority"] => {
  if (priority === "high" || priority === "urgent") return "High";
  if (priority === "low") return "Low";
  return "Medium";
};

const ticketTypeOptions: Array<{ value: "all" | CompanyAdminTicketType; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "Platform Incident", label: "Platform Incident" },
  { value: "Billing", label: "Billing" },
  { value: "Compliance", label: "Compliance" },
  { value: "Company Admin", label: "Company Admin" },
  { value: "Talent Quality", label: "Talent Quality" },
  { value: "Integrations", label: "Integrations" },
];

const seededMyTickets: CompanyAdminSupportTicket[] = [
  {
    id: 5102,
    subject: "Invoice mismatch for premium recruiter seats",
    type: "Billing",
    status: "Open",
    message: "The latest renewal appears to include 2 extra recruiter seats. Requesting billing verification before month-end close.",
    createdAt: "14 Mar 2026",
    priority: "High",
  },
  {
    id: 5095,
    subject: "Interview score calibration request",
    type: "Talent Quality",
    status: "In Review",
    message: "Our senior hiring panel observed score variance on backend interview loops. Quality team follow-up requested.",
    createdAt: "12 Mar 2026",
    priority: "Medium",
  },
  {
    id: 5088,
    subject: "Webhook retries delayed for ATS sync",
    type: "Integrations",
    status: "Resolved",
    message: "Candidate stage updates were delayed for a partner ATS. Incident was patched and replayed successfully.",
    createdAt: "10 Mar 2026",
    priority: "Medium",
  },
];

const seededInboxTickets: CompanyAdminSupportTicket[] = [
  {
    id: 5110,
    subject: "Support confirmed billing adjustment",
    type: "Billing",
    status: "Resolved",
    message: "Finance support approved a pro-rated correction for the extra seat charge on your current cycle.",
    createdAt: "15 Mar 2026",
    priority: "Low",
  },
  {
    id: 5104,
    subject: "Compliance evidence request pending",
    type: "Compliance",
    status: "In Review",
    message: "Security team requested additional verification for one recruiter account flagged by risk monitoring.",
    createdAt: "13 Mar 2026",
    priority: "High",
  },
];

const getTicketTypeMeta = (type: CompanyAdminTicketType) => {
  switch (type) {
    case "Platform Incident":
      return {
        icon: AlertTriangle,
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
      };
    case "Billing":
      return {
        icon: FileText,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
    case "Compliance":
      return {
        icon: ShieldCheck,
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
      };
    case "Company Admin":
      return {
        icon: Building2,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
    case "Talent Quality":
      return {
        icon: Users,
        badgeClassName: "border border-orange-200 bg-orange-100 text-orange-700",
      };
    default:
      return {
        icon: Zap,
        badgeClassName: "border border-orange-200 bg-orange-100 text-orange-700",
      };
  }
};

const getStatusClasses = (status: TicketStatus) => {
  if (status === "Resolved") {
    return "border border-orange-300 bg-orange-100 text-orange-800";
  }

  if (status === "In Review") {
    return "border border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border border-orange-200 bg-orange-50 text-orange-700";
};

const getPriorityClasses = (priority: CompanyAdminSupportTicket["priority"]) => {
  if (priority === "High") {
    return "border border-orange-300 bg-orange-100 text-orange-800";
  }

  if (priority === "Medium") {
    return "border border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border border-orange-200 bg-orange-50 text-orange-700";
};

export default function EmployerAdminTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeMailbox, setActiveMailbox] = useState<CompanyAdminMailbox>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | CompanyAdminTicketType>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myTickets, setMyTickets] = useState<CompanyAdminSupportTicket[]>([]);
  const [inboxTickets, setInboxTickets] = useState<CompanyAdminSupportTicket[]>([]);
  const [ownerRecipients, setOwnerRecipients] = useState<TicketRecipient[]>([]);
  const [invitedRecipients, setInvitedRecipients] = useState<TicketRecipient[]>([]);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    type: "Platform Incident" as CompanyAdminTicketType,
    message: "",
    priority: "High" as CompanyAdminSupportTicket["priority"],
    recipientUserId: "",
  });

  const sourceTickets = activeMailbox === "my" ? myTickets : inboxTickets;
  const mailboxCounts = {
    my: myTickets.length,
    inbox: inboxTickets.length,
  };

  const ticketStats = useMemo(() => {
    const allTickets = [...myTickets, ...inboxTickets];
    return [
      { label: "Open", value: allTickets.filter((ticket) => ticket.status === "Open").length, detail: "Need support response", icon: Clock3 },
      { label: "In Review", value: allTickets.filter((ticket) => ticket.status === "In Review").length, detail: "Support teams engaged", icon: Settings2 },
      { label: "Resolved", value: allTickets.filter((ticket) => ticket.status === "Resolved").length, detail: "Closed successfully", icon: CheckCircle2 },
      { label: "High Priority", value: allTickets.filter((ticket) => ticket.priority === "High").length, detail: "Escalated issues", icon: AlertTriangle },
    ];
  }, [inboxTickets, myTickets]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return sourceTickets.filter((ticket) => {
      const matchesType = filterType === "all" || ticket.type === filterType;
      if (!matchesType) {
        return false;
      }

      if (normalizedSearch.length === 0) {
        return true;
      }

      return (
        ticket.subject.toLowerCase().includes(normalizedSearch) ||
        ticket.message.toLowerCase().includes(normalizedSearch) ||
        ticket.type.toLowerCase().includes(normalizedSearch) ||
        ticket.createdAt.toLowerCase().includes(normalizedSearch) ||
        ticket.status.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [filterType, searchQuery, sourceTickets]);

  const resultsLabel =
    filteredTickets.length === sourceTickets.length
      ? `Showing all ${sourceTickets.length} tickets`
      : `Showing ${filteredTickets.length} of ${sourceTickets.length} tickets`;

  const mailboxTitle = activeMailbox === "my" ? "My Tickets" : "Inbox";

  const receiverOptions = useMemo(() => {
    const byUserId = new Map<string, TicketRecipient>();

    for (const recipient of ownerRecipients) {
      if (!recipient.userId) continue;
      byUserId.set(recipient.userId, recipient);
    }

    for (const recipient of invitedRecipients) {
      if (!recipient.userId) continue;
      if (!byUserId.has(recipient.userId)) {
        byUserId.set(recipient.userId, recipient);
      }
    }

    return Array.from(byUserId.values());
  }, [ownerRecipients, invitedRecipients]);

  const receiverLabelByUserId = useMemo(() => {
    const labels = new Map<string, string>();
    for (const receiver of receiverOptions) {
      labels.set(receiver.userId, receiver.label);
    }
    return labels;
  }, [receiverOptions]);

  useEffect(() => {
    if (!newTicket.recipientUserId) return;
    const stillExists = receiverOptions.some((receiver) => receiver.userId === newTicket.recipientUserId);
    if (!stillExists) {
      setNewTicket((prev) => ({ ...prev, recipientUserId: "" }));
    }
  }, [newTicket.recipientUserId, receiverOptions]);

  const loadTicketsAndRecipients = async () => {
    try {
      if (!user?.id) return;

      const { data: employerRow } = await supabase
        .from("employers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const employerId = employerRow?.id;

      const { data: myRows, error: myError } = await supabase
        .from("tickets")
        .select("id,subject,message,ticket_type,status,priority,created_at,user_id,assigned_to,sender_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (myError) throw myError;

      const { data: inboxRows, error: inboxError } = await supabase
        .from("tickets")
        .select("id,subject,message,ticket_type,status,priority,created_at,user_id,assigned_to,sender_name")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });

      if (inboxError) throw inboxError;

      const mapRow = (row: any): CompanyAdminSupportTicket => ({
        id: Number(String(row.id).replace(/-/g, "").slice(0, 12)) || Date.now(),
        subject: row.subject || "Untitled Ticket",
        type: mapDbTypeToUiType(row.ticket_type || "General"),
        status: mapDbStatusToUiStatus(row.status || "open"),
        message: row.message || "",
        createdAt: new Date(row.created_at).toLocaleDateString("en-GB"),
        priority: mapDbPriorityToUiPriority(row.priority || "medium"),
        senderUserId: row.user_id || undefined,
        assignedToUserId: row.assigned_to || undefined,
        senderName: row.sender_name || undefined,
      });

      setMyTickets((myRows || []).map(mapRow));
      setInboxTickets((inboxRows || []).map(mapRow));

      const { data: ownerRows, error: ownerError } = await supabase
        .from("owners")
        .select("user_id,full_name")
        .not("user_id", "is", null);

      if (ownerError) throw ownerError;

      const ownerNameById = new Map<string, string>();
      for (const owner of ownerRows || []) {
        if (owner?.user_id) {
          ownerNameById.set(owner.user_id, owner.full_name || "Owner");
        }
      }

      const { data: roleOwnerUsers, error: roleOwnerUsersError } = await supabase
        .from("users")
        .select("id,email")
        .eq("user_role", "owner");

      if (roleOwnerUsersError) throw roleOwnerUsersError;

      const ownerUsersById = new Map<string, { id: string; email: string }>();

      for (const roleOwner of roleOwnerUsers || []) {
        if (!roleOwner?.id) continue;
        ownerUsersById.set(roleOwner.id, { id: roleOwner.id, email: roleOwner.email || "" });
      }

      const ownerIdsFromProfiles = (ownerRows || []).map((r: any) => r.user_id).filter(Boolean);
      if (ownerIdsFromProfiles.length > 0) {
        const missingProfileOwners = ownerIdsFromProfiles.filter((id: string) => !ownerUsersById.has(id));
        if (missingProfileOwners.length > 0) {
          const { data: missingUsers } = await supabase
            .from("users")
            .select("id,email")
            .in("id", missingProfileOwners);

          for (const missingUser of missingUsers || []) {
            if (!missingUser?.id) continue;
            ownerUsersById.set(missingUser.id, { id: missingUser.id, email: missingUser.email || "" });
          }
        }
      }

      const owners: TicketRecipient[] = Array.from(ownerUsersById.values()).map((ownerUser) => ({
        userId: ownerUser.id,
        roleLabel: "Owner",
        label: `Owner: ${ownerNameById.get(ownerUser.id) || "Owner"}${ownerUser.email ? ` (${ownerUser.email})` : ""}`,
      }));

      setOwnerRecipients(owners);

      if (employerId) {
        const { data: invitedRows, error: invitedError } = await supabase
          .from("employer_team_members")
          .select("user_id,first_name,last_name")
          .eq("employer_id", employerId)
          .eq("invited_by", user.id)
          .not("user_id", "is", null);

        if (invitedError) throw invitedError;

        const invitedIds = (invitedRows || []).map((r: any) => r.user_id).filter(Boolean);
        let invitedUserDataById = new Map<string, { email: string; user_role: string }>();

        if (invitedIds.length > 0) {
          const { data: invitedUsers } = await supabase
            .from("users")
            .select("id,email,user_role")
            .in("id", invitedIds);
          invitedUserDataById = new Map((invitedUsers || []).map((u: any) => [u.id, { email: u.email || "", user_role: u.user_role || "recruiter" }]));
        }

        const invited: TicketRecipient[] = (invitedRows || []).map((r: any) => {
          const userData = invitedUserDataById.get(r.user_id) || { email: "", user_role: "recruiter" };
          const roleLabel = toDisplayRole(userData.user_role);
          const name = `${r.first_name || ""} ${r.last_name || ""}`.trim() || roleLabel;
          const email = userData.email;
          return {
            userId: r.user_id,
            roleLabel,
            label: `${roleLabel}: ${name}${email ? ` (${email})` : ""}`,
          };
        });

        setInvitedRecipients(invited);
      } else {
        setInvitedRecipients([]);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load tickets from database.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadTicketsAndRecipients();
  }, [user?.id]);

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim() || !user?.id) {
      return;
    }

    const recipientId = newTicket.recipientUserId;

    if (!recipientId || recipientId === user.id) {
      toast({
        title: "Select Receiver",
        description: "Please choose a valid receiver before sending.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingTicket(true);

      const senderName = user.email || "Company Admin";
      const selectedReceiverLabel =
        receiverOptions.find((receiver) => receiver.userId === recipientId)?.label || "selected receiver";
      const row = {
        user_id: user.id,
        sender_name: senderName,
        subject: newTicket.subject.trim(),
        message: newTicket.message.trim(),
        ticket_type: mapUiTypeToDbType(newTicket.type),
        status: "open",
        priority: mapUiPriorityToDbPriority(newTicket.priority),
        assigned_to: recipientId,
      };

      const { error: insertError } = await supabase.from("tickets").insert([row]);
      if (insertError) throw insertError;

      toast({
        title: "Ticket Sent",
        description: `Ticket sent to ${selectedReceiverLabel}.`,
      });

      setShowCreateModal(false);
      setActiveMailbox("my");
      setNewTicket({
        subject: "",
        type: "Platform Incident",
        message: "",
        priority: "High",
        recipientUserId: "",
      });

      await loadTicketsAndRecipients();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to send ticket.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  return (
    <RecruiterAdminLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Company Admin Support Desk
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
                Support Tickets
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Escalate billing, compliance, integrations, and platform issues from one company admin support workspace.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-12 gap-2 rounded-full bg-orange-600 px-6 text-white shadow-lg hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Create New Ticket
            </Button>
          </div>
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ticketStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-orange-100 bg-white p-5 shadow-lg">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
              <div className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</div>
              <p className="mt-1 text-sm text-slate-600">{stat.detail}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_320px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by subject, message, type, or date..."
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | CompanyAdminTicketType)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {ticketTypeOptions.map((option) => (
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
                    ? "bg-orange-600 text-white shadow-md"
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
                    ? "bg-orange-600 text-white shadow-md"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                <Inbox className="h-4 w-4" />
                Inbox ({mailboxCounts.inbox})
              </button>
            </div>
          </div>
        </div>

        {filteredTickets.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredTickets.map((ticket) => {
              const typeMeta = getTicketTypeMeta(ticket.type);
              const TypeIcon = typeMeta.icon;
              const receiverLabel = ticket.assignedToUserId ? receiverLabelByUserId.get(ticket.assignedToUserId) : undefined;

              return (
                <article
                  key={ticket.id}
                  className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-orange-600 opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-600">
                        <TypeIcon className="h-3.5 w-3.5" />
                        Ticket #{ticket.id}
                      </div>
                      <h2 className="text-xl font-bold leading-tight text-slate-900">{ticket.subject}</h2>
                      <p className="mt-1 text-xs text-gray-500">Created {ticket.createdAt}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={typeMeta.badgeClassName}>{ticket.type}</Badge>
                      <Badge className={getPriorityClasses(ticket.priority)}>{ticket.priority} Priority</Badge>
                    </div>
                  </div>

                  <p className="mb-5 text-sm leading-6 text-gray-600">{ticket.message}</p>

                  <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Created</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{ticket.createdAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mailbox</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{mailboxTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Category</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{ticket.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
                        <Badge className={getStatusClasses(ticket.status)}>{ticket.status}</Badge>
                      </div>
                    </div>

                    {activeMailbox === "my" && ticket.assignedToUserId ? (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <Send className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sent To</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{receiverLabel || "Selected receiver"}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-orange-100 pt-5">
                    <p className="max-w-xl text-sm leading-6 text-slate-600">
                      Keep escalations updated so support, finance, and operations teams can respond with full context.
                    </p>
                    <Button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="gap-2 rounded-full bg-orange-600 text-white shadow-md hover:bg-orange-700"
                    >
                      <Send className="h-4 w-4" />
                      Reply
                    </Button>
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
                <p className="mb-2 text-xl font-semibold text-slate-900">No company tickets yet</p>
                <p className="text-gray-600">Create your first ticket and support will follow up from the inbox.</p>
              </>
            ) : (
              <>
                <Inbox className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <p className="mb-2 text-xl font-semibold text-slate-900">Inbox is empty</p>
                <p className="text-gray-600">Replies from support, finance, or compliance will appear here.</p>
              </>
            )}
          </div>
        )}

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="w-[96vw] max-w-[860px] max-h-[90vh] overflow-y-auto rounded-3xl border-orange-100 bg-white p-6 sm:p-8">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-bold text-slate-900">Create Company Ticket</DialogTitle>
              <p className="mt-1 text-sm text-slate-600">Escalate a platform, billing, compliance, or quality issue.</p>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label className="text-sm font-semibold text-slate-700">Type</Label>
                  <Select
                    value={newTicket.type}
                    onValueChange={(value) => setNewTicket({ ...newTicket, type: value as CompanyAdminTicketType })}
                  >
                    <SelectTrigger className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Platform Incident">Platform Incident</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="Company Admin">Company Admin</SelectItem>
                      <SelectItem value="Talent Quality">Talent Quality</SelectItem>
                      <SelectItem value="Integrations">Integrations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as CompanyAdminSupportTicket["priority"] })}
                  >
                    <SelectTrigger className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Receiver</Label>
                  <Select
                    value={newTicket.recipientUserId}
                    onValueChange={(value) => setNewTicket({ ...newTicket, recipientUserId: value })}
                  >
                    <SelectTrigger className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400">
                      <SelectValue placeholder="Select receiver" />
                    </SelectTrigger>
                    <SelectContent>
                      {receiverOptions.map((receiver) => (
                        <SelectItem key={receiver.userId} value={receiver.userId}>
                          {receiver.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Message</Label>
                  <Textarea
                    value={newTicket.message}
                    onChange={(event) => setNewTicket({ ...newTicket, message: event.target.value })}
                    placeholder="Describe the issue, affected accounts, and business impact..."
                    rows={6}
                    className="resize-none rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                <div className="flex gap-3 pt-2 sm:col-span-2">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-full bg-orange-200 text-orange-700 shadow-lg hover:bg-orange-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateTicket}
                    disabled={
                      isSubmittingTicket ||
                      !newTicket.subject.trim() ||
                      !newTicket.message.trim() ||
                      !newTicket.recipientUserId ||
                      receiverOptions.length === 0
                    }
                    className="flex-1 gap-2 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmittingTicket ? "Sending..." : "Submit Ticket"}
                  </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RecruiterAdminLayout>
  );
}
