
import { useCallback, useEffect, useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";

type TicketType = "Technical" | "Bug Report" | "Feature Request" | "Billing" | "General";

type TicketStatus = "open" | "viewed" | "in-progress" | "solved" | "closed";

type TicketPriority = "low" | "medium" | "high" | "urgent";

type Mailbox = "all" | "inbox" | "sent";

type RecipientGroup = "talents" | "companies";

type RecipientMode = "all" | "one";

type RecipientOption = {
  id: string;
  user_id: string;
  label: string;
  secondary?: string | null;
};

type TicketRow = {
  id: string;
  user_id: string;
  sender_name: string;
  subject: string;
  message: string;
  ticket_type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
};

type TicketView = TicketRow & {
  userEmail?: string | null;
  userRole?: string | null;
  talentName?: string | null;
  companyName?: string | null;
};

const typeOptions: Array<{ value: "all" | TicketType; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "Technical", label: "Technical" },
  { value: "Bug Report", label: "Bug Report" },
  { value: "Feature Request", label: "Feature Request" },
  { value: "Billing", label: "Billing" },
  { value: "General", label: "General" },
];

const statusOptions: Array<{ value: "all" | TicketStatus; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "viewed", label: "Viewed" },
  { value: "in-progress", label: "In Progress" },
  { value: "solved", label: "Solved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions: Array<{ value: "all" | TicketPriority; label: string }> = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const statusBadge = (status: TicketStatus) => {
  if (status === "solved" || status === "closed") return "border border-green-200 bg-green-50 text-green-700";
  if (status === "in-progress") return "border border-blue-200 bg-blue-50 text-blue-700";
  if (status === "viewed") return "border border-slate-200 bg-slate-50 text-slate-700";
  return "border border-orange-200 bg-orange-50 text-orange-700";
};

const priorityBadge = (priority: TicketPriority) => {
  if (priority === "urgent") return "border border-red-200 bg-red-50 text-red-700";
  if (priority === "high") return "border border-orange-200 bg-orange-50 text-orange-700";
  if (priority === "medium") return "border border-amber-200 bg-amber-50 text-amber-800";
  return "border border-slate-200 bg-slate-50 text-slate-700";
};

const mailboxMeta = {
  all: { label: "All", icon: Ticket },
  inbox: { label: "Inbox", icon: Inbox },
  sent: { label: "Sent", icon: Send },
} as const;

export default function OwnerSupportTickets() {
  const { toast } = useToast();
  const { user } = useAuth();

  const ownerSenderName = user?.name?.trim() || "Platform Owner";

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketView[]>([]);

  const [mailbox, setMailbox] = useState<Mailbox>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TicketType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TicketPriority>("all");

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSending, setComposeSending] = useState(false);

  const [recipientGroup, setRecipientGroup] = useState<RecipientGroup>("talents");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [recipientId, setRecipientId] = useState<string>("");

  const [talentRecipients, setTalentRecipients] = useState<RecipientOption[]>([]);
  const [companyRecipients, setCompanyRecipients] = useState<RecipientOption[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    ticket_type: "General" as TicketType,
    priority: "high" as TicketPriority,
    message: "",
  });

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);

      const ticketsRes = await supabase
        .from("tickets")
        .select("id,user_id,sender_name,subject,message,ticket_type,status,priority,created_at")
        .order("created_at", { ascending: false });

      if (ticketsRes.error) throw ticketsRes.error;

      const base = ((ticketsRes.data as TicketRow[]) ?? []).map((t) => ({ ...t })) as TicketView[];

      const userIds = Array.from(new Set(base.map((t) => t.user_id).filter(Boolean))) as string[];

      const [usersRes, talentsRes, employersRes] = await Promise.all([
        userIds.length
          ? supabase.from("users").select("id,email,user_role").in("id", userIds)
          : Promise.resolve({ data: [], error: null } as any),
        supabase.from("talents").select("id,user_id,full_name"),
        supabase.from("employers").select("id,user_id,company_name"),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (talentsRes.error) throw talentsRes.error;
      if (employersRes.error) throw employersRes.error;

      const userMap = new Map<string, { email: string | null; user_role: string | null }>();
      (usersRes.data ?? []).forEach((u: any) => userMap.set(u.id, { email: u.email ?? null, user_role: u.user_role ?? null }));

      const talentMap = new Map<string, { id: string; full_name: string | null }>();
      (talentsRes.data ?? []).forEach((t: any) => {
        if (t.user_id) talentMap.set(t.user_id, { id: t.id, full_name: t.full_name ?? null });
      });

      const companyMap = new Map<string, { id: string; company_name: string | null }>();
      (employersRes.data ?? []).forEach((e: any) => {
        if (e.user_id) companyMap.set(e.user_id, { id: e.id, company_name: e.company_name ?? null });
      });

      setTickets(
        base.map((t) => {
          const u = userMap.get(t.user_id);
          const talent = talentMap.get(t.user_id);
          const company = companyMap.get(t.user_id);
          return {
            ...t,
            userEmail: u?.email ?? null,
            userRole: u?.user_role ?? null,
            talentName: talent?.full_name ?? null,
            companyName: company?.company_name ?? null,
          };
        }),
      );
    } catch (err: any) {
      console.error("OwnerSupportTickets load failed:", err);
      toast({
        title: "Load failed",
        description: err?.message || "Unable to load tickets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const ensureRecipientsLoaded = useCallback(async () => {
    if (talentRecipients.length > 0 && companyRecipients.length > 0) return;

    try {
      setRecipientsLoading(true);

      const [talentsRes, employersRes, usersRes] = await Promise.all([
        supabase.from("talents").select("id,user_id,full_name,city,current_position").order("created_at", { ascending: false }),
        supabase.from("employers").select("id,user_id,company_name,industry,country,city").order("created_at", { ascending: false }),
        supabase.from("users").select("id,email,user_role,is_active"),
      ]);

      if (talentsRes.error) throw talentsRes.error;
      if (employersRes.error) throw employersRes.error;
      if (usersRes.error) throw usersRes.error;

      const usersMap = new Map<string, { email: string | null }>();
      (usersRes.data ?? []).forEach((u: any) => {
        usersMap.set(u.id, { email: u.email ?? null });
      });

      const talentOpts: RecipientOption[] = (talentsRes.data ?? [])
        .filter((t: any) => !!t.user_id)
        .map((t: any) => {
          const u = usersMap.get(t.user_id);
          const location = [t.city].filter(Boolean).join(", ");
          return {
            id: t.id,
            user_id: t.user_id,
            label: `${t.full_name || "Talent"}${u?.email ? ` — ${u.email}` : ""}`,
            secondary: [t.current_position, location].filter(Boolean).join(" • ") || null,
          };
        });

      const companyOpts: RecipientOption[] = (employersRes.data ?? [])
        .filter((e: any) => !!e.user_id)
        .map((e: any) => {
          const u = usersMap.get(e.user_id);
          const location = [e.city, e.country].filter(Boolean).join(", ");
          return {
            id: e.id,
            user_id: e.user_id,
            label: `${e.company_name || "Company"}${u?.email ? ` — ${u.email}` : ""}`,
            secondary: [e.industry, location].filter(Boolean).join(" • ") || null,
          };
        });

      setTalentRecipients(talentOpts);
      setCompanyRecipients(companyOpts);
    } catch (err: any) {
      toast({
        title: "Recipients load failed",
        description: err?.message || "Unable to load recipients.",
        variant: "destructive",
      });
    } finally {
      setRecipientsLoading(false);
    }
  }, [toast, talentRecipients.length, companyRecipients.length]);

  const isSent = useCallback(
    (t: TicketView) => {
      const s = (t.sender_name || "").trim().toLowerCase();
      const owner = ownerSenderName.trim().toLowerCase();
      return s === owner || s === "platform owner";
    },
    [ownerSenderName],
  );

  const stats = useMemo(() => {
    const all = tickets;
    return {
      open: all.filter((t) => t.status === "open").length,
      inReview: all.filter((t) => t.status === "in-progress").length,
      solved: all.filter((t) => t.status === "solved" || t.status === "closed").length,
      urgent: all.filter((t) => t.priority === "urgent").length,
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter((t) => {
      if (mailbox === "inbox" && isSent(t)) return false;
      if (mailbox === "sent" && !isSent(t)) return false;

      if (typeFilter !== "all" && t.ticket_type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;

      if (!q) return true;

      const hay = [
        t.subject,
        t.message,
        t.sender_name,
        t.ticket_type,
        t.status,
        t.priority,
        t.userEmail ?? "",
        t.talentName ?? "",
        t.companyName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [tickets, search, mailbox, typeFilter, statusFilter, priorityFilter, isSent]);

  const handleSend = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({
        title: "Missing fields",
        description: "Subject and message are required.",
        variant: "destructive",
      });
      return;
    }

    await ensureRecipientsLoaded();

    const recipients = recipientGroup === "talents" ? talentRecipients : companyRecipients;

    const userIds =
      recipientMode === "all"
        ? recipients.map((r) => r.user_id)
        : recipients.filter((r) => r.id === recipientId).map((r) => r.user_id);

    const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean);

    if (uniqueUserIds.length === 0) {
      toast({
        title: "No recipients",
        description:
          recipientMode === "one" ? "Select a recipient to send this ticket." : "No recipients found for this group.",
        variant: "destructive",
      });
      return;
    }

    try {
      setComposeSending(true);

      const base = {
        sender_name: ownerSenderName,
        subject: newTicket.subject.trim(),
        message: newTicket.message.trim(),
        ticket_type: newTicket.ticket_type,
        status: "open" as TicketStatus,
        priority: newTicket.priority,
      };

      const payload = uniqueUserIds.map((uid) => ({ ...base, user_id: uid }));

      const chunkSize = 100;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase.from("tickets").insert(chunk);
        if (error) throw error;
      }

      toast({
        title: "Ticket sent",
        description:
          uniqueUserIds.length === 1 ? "Your message was delivered." : `Your message was delivered to ${uniqueUserIds.length} users.`,
      });

      setComposeOpen(false);
      setNewTicket({ subject: "", ticket_type: "General", priority: "high", message: "" });
      setRecipientMode("all");
      setRecipientId("");

      await loadTickets();
    } catch (err: any) {
      toast({
        title: "Send failed",
        description: err?.message || "Unable to send tickets.",
        variant: "destructive",
      });
    } finally {
      setComposeSending(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="max-w-6xl px-4 pb-10 pt-6 xl:px-0 xl:pt-10 overflow-x-hidden">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Owner Support Desk
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">Support Tickets</h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Send owner messages to talents or company admins, and review incoming support requests in one workspace.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Badge className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                  Showing {filtered.length} tickets
                </Badge>
              </div>
            </div>

            <div className="grid w-full gap-4 sm:max-w-[420px] sm:grid-cols-2 lg:w-[420px] lg:min-w-[420px] shrink-0 lg:flex-none">
              {[
                { label: "Open", value: stats.open, detail: "Need attention", icon: Clock3 },
                { label: "In Progress", value: stats.inReview, detail: "Being handled", icon: Settings2 },
                { label: "Resolved", value: stats.solved, detail: "Closed tickets", icon: CheckCircle2 },
                { label: "Urgent", value: stats.urgent, detail: "High priority", icon: AlertTriangle },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 leading-snug whitespace-normal break-normal text-balance">{stat.label}</p>
                      <div className="mt-2 text-3xl font-bold leading-none text-slate-900">{stat.value}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-normal break-normal text-balance">{stat.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-12 lg:items-center">
          <div className="relative lg:col-span-4">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets by subject, recipient, or content…"
              className="h-12 rounded-2xl border-orange-200 bg-white/90 pl-11 shadow-sm"
            />
          </div>

          <div className="lg:col-span-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white/90 shadow-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white/90 shadow-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white/90 shadow-sm">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-2 lg:items-end">
            <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white/90 p-2 shadow-sm lg:justify-end">
              {(Object.keys(mailboxMeta) as Mailbox[]).map((key) => {
                const meta = mailboxMeta[key];
                const ActiveIcon = meta.icon;
                const active = mailbox === key;
                return (
                  <Button
                    key={key}
                    variant={active ? "default" : "ghost"}
                    className={
                      active
                        ? "h-10 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-4 text-white hover:from-orange-700 hover:to-orange-600"
                        : "h-10 rounded-xl px-4 text-slate-600 hover:bg-orange-50 hover:text-orange-700"
                    }
                    onClick={() => setMailbox(key)}
                  >
                    <ActiveIcon className="mr-2 h-4 w-4" />
                    {meta.label}
                  </Button>
                );
              })}
            </div>

            <Button
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-base font-semibold text-white shadow-lg hover:from-orange-700 hover:to-orange-600 lg:w-auto"
              onClick={() => {
                setComposeOpen(true);
                void ensureRecipientsLoaded();
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Send Ticket
            </Button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 shadow-md">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Loading tickets…</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">Fetching real data from your database.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No tickets found</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">Adjust filters or send a new ticket.</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filtered.map((t) => (
              <article
                key={t.id}
                className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{t.ticket_type}</Badge>
                      <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(t.status)}`}>{t.status}</Badge>
                      <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge(t.priority)}`}>{t.priority}</Badge>
                    </div>

                    <h2 className="mt-3 truncate text-xl font-bold text-slate-900">{t.subject}</h2>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{t.message}</p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                    <Ticket className="h-5 w-5" />
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recipient</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{t.userEmail || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Created</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatDate(t.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Profile</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                        {t.talentName ? `${t.talentName} (Talent)` : t.companyName ? `${t.companyName} (Company)` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-orange-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">From</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{t.sender_name || "—"}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Dialog
          open={composeOpen}
          onOpenChange={(open) => {
            setComposeOpen(open);
            if (!open) {
              setRecipientId("");
              setRecipientGroup("talents");
              setRecipientMode("all");
              setComposeSending(false);
            }
          }}
        >
          <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] p-0">
            <ScrollArea className="max-h-[85vh]">
              <div className="px-8 pb-8 pt-7">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                        <Send className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="text-2xl font-extrabold text-slate-900">Send Ticket</DialogTitle>
                        <div className="mt-1 text-sm text-slate-600">Send an owner message to talents or company admins.</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full hover:bg-orange-50"
                      onClick={() => setComposeOpen(false)}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </DialogHeader>

                <div className="mt-6 grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label className="text-sm font-semibold">Recipient Group</Label>
                      <Select
                        value={recipientGroup}
                        onValueChange={(v) => {
                          setRecipientGroup(v as RecipientGroup);
                          setRecipientId("");
                        }}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="talents">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-orange-600" />
                              Talents
                            </div>
                          </SelectItem>
                          <SelectItem value="companies">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-orange-600" />
                              Company Admins
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-sm font-semibold">Send To</Label>
                      <Select
                        value={recipientMode}
                        onValueChange={(v) => {
                          setRecipientMode(v as RecipientMode);
                          setRecipientId("");
                        }}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All in group</SelectItem>
                          <SelectItem value="one">Specific recipient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {recipientMode === "one" ? (
                    <div className="grid gap-2">
                      <Label className="text-sm font-semibold">Select Recipient</Label>
                      <Select value={recipientId} onValueChange={setRecipientId}>
                        <SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white shadow-sm">
                          <SelectValue placeholder={recipientsLoading ? "Loading…" : "Choose…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(recipientGroup === "talents" ? talentRecipients : companyRecipients).map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              <div className="grid">
                                <div className="font-semibold">{r.label}</div>
                                {r.secondary ? <div className="text-xs text-slate-500">{r.secondary}</div> : null}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label className="text-sm font-semibold">Ticket Type</Label>
                      <Select
                        value={newTicket.ticket_type}
                        onValueChange={(v) => setNewTicket((p) => ({ ...p, ticket_type: v as TicketType }))}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions
                            .filter((t) => t.value !== "all")
                            .map((t) => (
                              <SelectItem key={t.value} value={t.value as TicketType}>
                                {t.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-sm font-semibold">Priority</Label>
                      <Select
                        value={newTicket.priority}
                        onValueChange={(v) => setNewTicket((p) => ({ ...p, priority: v as TicketPriority }))}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions
                            .filter((p) => p.value !== "all")
                            .map((p) => (
                              <SelectItem key={p.value} value={p.value as TicketPriority}>
                                {p.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Subject</Label>
                    <Input
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="Short summary…"
                      className="h-12 rounded-2xl border-orange-200 bg-white shadow-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Message</Label>
                    <Textarea
                      value={newTicket.message}
                      onChange={(e) => setNewTicket((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Write your message…"
                      className="min-h-[140px] rounded-2xl border-orange-200 bg-white shadow-sm"
                    />
                  </div>

                  <div className="rounded-3xl border border-orange-100 bg-orange-50/40 p-5 text-sm text-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">Delivery</div>
                        <div className="mt-1 text-slate-600">
                          This creates ticket rows for the selected users in the database. Use “All in group” to broadcast.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      className="h-12 rounded-2xl border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                      onClick={() => setComposeOpen(false)}
                      disabled={composeSending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="h-12 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-base font-semibold text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
                      onClick={() => void handleSend()}
                      disabled={composeSending || recipientsLoading}
                    >
                      {composeSending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  );
}
