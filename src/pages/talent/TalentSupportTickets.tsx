import { useMemo, useState } from "react";
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
  X,
} from "lucide-react";

type TicketType = "General" | "Technical" | "Billing" | "Job Offer" | "Interview";
type TicketMailbox = "my" | "inbox";

interface SupportTicket {
  id: number;
  subject: string;
  type: TicketType;
  message: string;
  createdAt: string;
}

const ticketTypeOptions: Array<{ value: "all" | TicketType; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "General", label: "General" },
  { value: "Technical", label: "Technical" },
  { value: "Billing", label: "Billing" },
  { value: "Job Offer", label: "Job Offer" },
  { value: "Interview", label: "Interview" },
];

const getTicketTypeMeta = (type: TicketType) => {
  switch (type) {
    case "Technical":
      return {
        label: "Technical",
        icon: Settings,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
    case "Billing":
      return {
        label: "Billing",
        icon: FileTextIcon,
        badgeClassName: "border border-orange-200 bg-orange-100 text-orange-700",
      };
    case "Job Offer":
      return {
        label: "Job Offer",
        icon: Briefcase,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
    case "Interview":
      return {
        label: "Interview",
        icon: CalendarDays,
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
      };
    default:
      return {
        label: "General",
        icon: MessageSquare,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
  }
};

const TalentSupportTickets = () => {
  const [activeMailbox, setActiveMailbox] = useState<TicketMailbox>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | TicketType>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [inboxTickets] = useState<SupportTicket[]>([]);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    type: "General" as TicketType,
    message: "",
  });

  const sourceTickets = activeMailbox === "my" ? myTickets : inboxTickets;
  const mailboxCounts = {
    my: myTickets.length,
    inbox: inboxTickets.length,
  };

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      return;
    }

    const ticket: SupportTicket = {
      id: myTickets.length + 1,
      subject: newTicket.subject.trim(),
      type: newTicket.type,
      message: newTicket.message.trim(),
      createdAt: new Date().toLocaleDateString("en-GB"),
    };

    setMyTickets((previous) => [ticket, ...previous]);
    setShowCreateModal(false);
    setActiveMailbox("my");
    setNewTicket({ subject: "", type: "General", message: "" });
  };

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    if (filterType === "all") {
      return sourceTickets.filter((ticket) => {
        if (normalizedSearch.length === 0) {
          return true;
        }

        return (
          ticket.subject.toLowerCase().includes(normalizedSearch) ||
          ticket.message.toLowerCase().includes(normalizedSearch) ||
          ticket.type.toLowerCase().includes(normalizedSearch) ||
          ticket.createdAt.toLowerCase().includes(normalizedSearch)
        );
      });
    }

    return sourceTickets.filter((ticket) => {
      const typeMatches = ticket.type === filterType;
      if (!typeMatches) {
        return false;
      }

      if (normalizedSearch.length === 0) {
        return true;
      }

      return (
        ticket.subject.toLowerCase().includes(normalizedSearch) ||
        ticket.message.toLowerCase().includes(normalizedSearch) ||
        ticket.type.toLowerCase().includes(normalizedSearch) ||
        ticket.createdAt.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [filterType, searchQuery, sourceTickets]);

  const resultsLabel =
    filteredTickets.length === sourceTickets.length
      ? `Showing all ${sourceTickets.length} tickets`
      : `Showing ${filteredTickets.length} of ${sourceTickets.length} tickets`;

  const mailboxTitle = activeMailbox === "my" ? "My Tickets" : "Inbox";

  return (
    <TalentLayout>
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
                Reach support faster, track every request, and keep conversation history visible in one place.
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

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_320px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by subject, message, type, or date..."
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | TicketType)}>
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
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-600">
                        <TypeIcon className="h-3.5 w-3.5" />
                        Ticket #{ticket.id}
                      </div>
                      <h2 className="text-xl font-bold leading-tight text-slate-900">{ticket.subject}</h2>
                      <p className="mt-1 text-xs text-gray-500">Created {ticket.createdAt}</p>
                    </div>
                    <Badge className={typeMeta.badgeClassName}>{typeMeta.label}</Badge>
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
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Type</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{typeMeta.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">Open</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-orange-100 pt-5">
                    <p className="max-w-xl text-sm leading-6 text-slate-600">
                      Keep this ticket updated so support can respond with the right context.
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
                <p className="mb-2 text-xl font-semibold text-slate-900">No tickets yet</p>
                <p className="text-gray-600">Create your first support ticket and the team will follow up.</p>
              </>
            ) : (
              <>
                <Inbox className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <p className="mb-2 text-xl font-semibold text-slate-900">Inbox is empty</p>
                <p className="text-gray-600">Replies from support will appear here once available.</p>
              </>
            )}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Create New Ticket</h2>
                  <p className="mt-1 text-sm text-slate-600">Tell us what you need help with.</p>
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
                  <Select
                    value={newTicket.type}
                    onValueChange={(value) => setNewTicket({ ...newTicket, type: value as TicketType })}
                  >
                    <SelectTrigger className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Job Offer">Job Offer</SelectItem>
                      <SelectItem value="Interview">Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Message</Label>
                  <Textarea
                    value={newTicket.message}
                    onChange={(event) => setNewTicket({ ...newTicket, message: event.target.value })}
                    placeholder="Describe your issue or question..."
                    rows={4}
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
    </TalentLayout>
  );
};

export default TalentSupportTickets;
