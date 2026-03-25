import { useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  X,
  Zap,
} from "lucide-react";

type OwnerTicketType = "Platform Incident" | "Billing" | "Compliance" | "Company Admin" | "Talent Quality" | "Integrations";
type OwnerMailbox = "my" | "inbox";
type TicketStatus = "Open" | "In Review" | "Resolved";

interface OwnerSupportTicket {
  id: number;
  subject: string;
  type: OwnerTicketType;
  status: TicketStatus;
  message: string;
  createdAt: string;
  priority: "High" | "Medium" | "Low";
}

const ticketTypeOptions: Array<{ value: "all" | OwnerTicketType; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "Platform Incident", label: "Platform Incident" },
  { value: "Billing", label: "Billing" },
  { value: "Compliance", label: "Compliance" },
  { value: "Company Admin", label: "Company Admin" },
  { value: "Talent Quality", label: "Talent Quality" },
  { value: "Integrations", label: "Integrations" },
];

const seededMyTickets: OwnerSupportTicket[] = [
  {
    id: 4012,
    subject: "Payment retry spike in GCC billing cluster",
    type: "Billing",
    status: "Open",
    message: "SlickPay payment retries increased above threshold for enterprise renewals. Need reconciliation details before dunning escalation.",
    createdAt: "14 Mar 2026",
    priority: "High",
  },
  {
    id: 4008,
    subject: "Investigate interviewer scoring drift for data roles",
    type: "Talent Quality",
    status: "In Review",
    message: "Calibration variance rose across data-science interview tracks. Support and quality teams are reviewing flagged scorecards.",
    createdAt: "12 Mar 2026",
    priority: "Medium",
  },
  {
    id: 3999,
    subject: "API webhook latency for enterprise hiring sync",
    type: "Integrations",
    status: "Resolved",
    message: "Two enterprise clients reported delayed webhook delivery for candidate status updates. Incident has been patched and replayed.",
    createdAt: "09 Mar 2026",
    priority: "Medium",
  },
];

const seededInboxTickets: OwnerSupportTicket[] = [
  {
    id: 4021,
    subject: "Support confirmed fraud-screening false positive cleared",
    type: "Compliance",
    status: "Resolved",
    message: "The compliance queue reviewed the flagged company admin account. Access has been restored and the audit note is complete.",
    createdAt: "14 Mar 2026",
    priority: "Low",
  },
  {
    id: 4016,
    subject: "Support escalation: platform incident affecting overview metrics",
    type: "Platform Incident",
    status: "In Review",
    message: "Dashboard aggregates for owner analytics were delayed after the last ETL cycle. Monitoring remains active while backfill completes.",
    createdAt: "13 Mar 2026",
    priority: "High",
  },
];

const getTicketTypeMeta = (type: OwnerTicketType) => {
  switch (type) {
    case "Platform Incident":
      return {
        icon: AlertTriangle,
        badgeClassName: "border border-amber-200 bg-amber-50 text-amber-700",
      };
    case "Billing":
      return {
        icon: FileText,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
    case "Compliance":
      return {
        icon: ShieldCheck,
        badgeClassName: "border border-green-200 bg-green-50 text-green-700",
      };
    case "Company Admin":
      return {
        icon: Building2,
        badgeClassName: "border border-blue-200 bg-blue-50 text-blue-700",
      };
    case "Talent Quality":
      return {
        icon: Users,
        badgeClassName: "border border-orange-200 bg-orange-100 text-orange-700",
      };
    default:
      return {
        icon: Zap,
        badgeClassName: "border border-purple-200 bg-purple-50 text-purple-700",
      };
  }
};

const getStatusClasses = (status: TicketStatus) => {
  if (status === "Resolved") {
    return "border border-green-200 bg-green-50 text-green-700";
  }

  if (status === "In Review") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border border-orange-200 bg-orange-50 text-orange-700";
};

const getPriorityClasses = (priority: OwnerSupportTicket["priority"]) => {
  if (priority === "High") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "Medium") {
    return "border border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
};

export default function OwnerSupportTickets() {
  const [activeMailbox, setActiveMailbox] = useState<OwnerMailbox>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | OwnerTicketType>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myTickets, setMyTickets] = useState<OwnerSupportTicket[]>(seededMyTickets);
  const [inboxTickets] = useState<OwnerSupportTicket[]>(seededInboxTickets);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    type: "Platform Incident" as OwnerTicketType,
    message: "",
    priority: "High" as OwnerSupportTicket["priority"],
  });

  const sourceTickets = activeMailbox === "my" ? myTickets : inboxTickets;
  const mailboxCounts = {
    my: myTickets.length,
    inbox: inboxTickets.length,
  };

  const ticketStats = useMemo(() => {
    const allTickets = [...myTickets, ...inboxTickets];
    return [
      { label: "Open", value: allTickets.filter((ticket) => ticket.status === "Open").length, detail: "Need owner response", icon: Clock3 },
      { label: "In Review", value: allTickets.filter((ticket) => ticket.status === "In Review").length, detail: "Support teams engaged", icon: Settings2 },
      { label: "Resolved", value: allTickets.filter((ticket) => ticket.status === "Resolved").length, detail: "Closed successfully", icon: CheckCircle2 },
      { label: "High Priority", value: allTickets.filter((ticket) => ticket.priority === "High").length, detail: "Escalated operational issues", icon: AlertTriangle },
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

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      return;
    }

    const ticket: OwnerSupportTicket = {
      id: Date.now(),
      subject: newTicket.subject.trim(),
      type: newTicket.type,
      status: "Open",
      message: newTicket.message.trim(),
      createdAt: new Date().toLocaleDateString("en-GB"),
      priority: newTicket.priority,
    };

    setMyTickets((previous) => [ticket, ...previous]);
    setShowCreateModal(false);
    setActiveMailbox("my");
    setNewTicket({ subject: "", type: "Platform Incident", message: "", priority: "High" });
  };

  return (
    <OwnerLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Owner Support Desk
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
                Support Tickets
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Escalate platform incidents, billing disputes, compliance reviews, and marketplace quality issues from one owner-level support workspace.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-12 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
            >
              <Plus className="h-4 w-4" />
              Create New Ticket
            </Button>
          </div>
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ticketStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-orange-100 bg-white p-5 shadow-lg">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
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

          <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | OwnerTicketType)}>
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

        {filteredTickets.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredTickets.map((ticket) => {
              const typeMeta = getTicketTypeMeta(ticket.type);
              const TypeIcon = typeMeta.icon;

              return (
                <article
                  key={ticket.id}
                  className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 opacity-0 transition-opacity group-hover:opacity-100" />

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
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-orange-100 pt-5">
                    <p className="max-w-xl text-sm leading-6 text-slate-600">
                      Keep escalations updated so support, finance, and operations teams can respond with full context.
                    </p>
                    <Button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
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
                <p className="mb-2 text-xl font-semibold text-slate-900">No owner tickets yet</p>
                <p className="text-gray-600">Create your first escalation and the right internal team will follow up.</p>
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

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Create Owner Ticket</h2>
                  <p className="mt-1 text-sm text-slate-600">Escalate a platform, billing, compliance, or quality issue.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
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
                  <Select value={newTicket.type} onValueChange={(value) => setNewTicket({ ...newTicket, type: value as OwnerTicketType })}>
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
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as OwnerSupportTicket["priority"] })}
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

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Message</Label>
                  <Textarea
                    value={newTicket.message}
                    onChange={(event) => setNewTicket({ ...newTicket, message: event.target.value })}
                    placeholder="Describe the issue, affected accounts, and business impact..."
                    rows={5}
                    className="resize-none rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
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
                    disabled={!newTicket.subject.trim() || !newTicket.message.trim()}
                    className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Submit Ticket
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}