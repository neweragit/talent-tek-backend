
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

type CountValue = number | null;

type DashboardStats = {
  users: CountValue;
  talents: CountValue;
  employers: CountValue;
  jobs_published: CountValue;
  applications_pending: CountValue;
  interviews_scheduled: CountValue;
  tickets_open: CountValue;
  subscriptions_active: CountValue;
  payments_completed: CountValue;
};

type RecentJob = {
  id: string;
  employer_id: string;
  title: string;
  location: string | null;
  status: string | null;
  workplace: string | null;
  employment_type: string | null;
  experience_level: string | null;
  created_at: string | null;
  employerName?: string | null;
};

type RecentApplication = {
  id: string;
  job_id: string;
  talent_id: string;
  status: string | null;
  stage: string | null;
  applied_at: string | null;
  jobTitle?: string | null;
  talentName?: string | null;
};

type RecentTicket = {
  id: string;
  user_id: string;
  sender_name: string | null;
  subject: string;
  status: string | null;
  priority: string | null;
  created_at: string | null;
  userEmail?: string | null;
};

const formatCount = (value: CountValue) => (value === null ? "—" : value.toLocaleString());
const formatShortDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const safeCount = async (query: any): Promise<CountValue> => {
  try {
    const res = await query;
    if (res?.error) return null;
    return res?.count ?? 0;
  } catch {
    return null;
  }
};
export default function OwnerDashboard() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [
        users,
        talents,
        employers,
        jobs_published,
        applications_pending,
        interviews_scheduled,
        tickets_open,
        subscriptions_active,
        payments_completed,
      ] = await Promise.all([
        safeCount(supabase.from("users").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("talents").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("employers").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "published")),
        safeCount(supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
        safeCount(supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "scheduled")),
        safeCount(supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open")),
        safeCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active")),
        safeCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "completed")),
      ]);

      setStats({
        users,
        talents,
        employers,
        jobs_published,
        applications_pending,
        interviews_scheduled,
        tickets_open,
        subscriptions_active,
        payments_completed,
      });

      const [jobsRes, appsRes, ticketsRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id,employer_id,title,location,status,workplace,employment_type,experience_level,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("applications")
          .select("id,job_id,talent_id,status,stage,applied_at")
          .order("applied_at", { ascending: false })
          .limit(5),
        supabase
          .from("tickets")
          .select("id,user_id,sender_name,subject,status,priority,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (appsRes.error) throw appsRes.error;
      if (ticketsRes.error) throw ticketsRes.error;

      const jobs = ((jobsRes.data ?? []) as any[]).map((j) => ({ ...j })) as RecentJob[];
      const apps = ((appsRes.data ?? []) as any[]).map((a) => ({ ...a })) as RecentApplication[];
      const tickets = ((ticketsRes.data ?? []) as any[]).map((t) => ({ ...t })) as RecentTicket[];

      const employerIds = Array.from(new Set(jobs.map((j) => j.employer_id).filter(Boolean)));
      const jobIds = Array.from(new Set(apps.map((a) => a.job_id).filter(Boolean)));
      const talentIds = Array.from(new Set(apps.map((a) => a.talent_id).filter(Boolean)));
      const ticketUserIds = Array.from(new Set(tickets.map((t) => t.user_id).filter(Boolean)));

      const [employersRes, jobsNamesRes, talentsRes, usersRes] = await Promise.all([
        employerIds.length ? supabase.from("employers").select("id,company_name").in("id", employerIds) : Promise.resolve({ data: [], error: null } as any),
        jobIds.length ? supabase.from("jobs").select("id,title").in("id", jobIds) : Promise.resolve({ data: [], error: null } as any),
        talentIds.length ? supabase.from("talents").select("id,full_name").in("id", talentIds) : Promise.resolve({ data: [], error: null } as any),
        ticketUserIds.length ? supabase.from("users").select("id,email").in("id", ticketUserIds) : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (employersRes.error) throw employersRes.error;
      if (jobsNamesRes.error) throw jobsNamesRes.error;
      if (talentsRes.error) throw talentsRes.error;
      if (usersRes.error) throw usersRes.error;

      const empMap = new Map<string, string>();
      (employersRes.data ?? []).forEach((e: any) => empMap.set(e.id, e.company_name ?? "—"));

      const jobMap = new Map<string, string>();
      (jobsNamesRes.data ?? []).forEach((j: any) => jobMap.set(j.id, j.title ?? "—"));

      const talentMap = new Map<string, string>();
      (talentsRes.data ?? []).forEach((t: any) => talentMap.set(t.id, t.full_name ?? "—"));

      const userMap = new Map<string, string>();
      (usersRes.data ?? []).forEach((u: any) => userMap.set(u.id, u.email ?? "—"));

      setRecentJobs(jobs.map((j) => ({ ...j, employerName: empMap.get(j.employer_id) ?? "—" })));
      setRecentApplications(apps.map((a) => ({ ...a, jobTitle: jobMap.get(a.job_id) ?? "—", talentName: talentMap.get(a.talent_id) ?? "—" })));
      setRecentTickets(tickets.map((t) => ({ ...t, userEmail: userMap.get(t.user_id) ?? "—" })));
    } catch (err: any) {
      console.error("Owner dashboard load failed:", err);
      toast({
        title: "Load failed",
        description: err?.message || "Unable to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const kpiCards = useMemo(() => {
    const s = stats;
    return [
      { label: "Users", value: s?.users ?? null, detail: "All accounts", icon: Users },
      { label: "Talents", value: s?.talents ?? null, detail: "Profiles", icon: Briefcase },
      { label: "Employers", value: s?.employers ?? null, detail: "Organizations", icon: Building2 },
      { label: "Published Jobs", value: s?.jobs_published ?? null, detail: "Live listings", icon: FileText },
      { label: "Pending Apps", value: s?.applications_pending ?? null, detail: "Need review", icon: Ticket },
      { label: "Scheduled Interviews", value: s?.interviews_scheduled ?? null, detail: "Upcoming", icon: CalendarDays },
      { label: "Open Tickets", value: s?.tickets_open ?? null, detail: "Support queue", icon: Bell },
      { label: "Active Subs", value: s?.subscriptions_active ?? null, detail: "Billing", icon: CreditCard },
      { label: "Payments (Completed)", value: s?.payments_completed ?? null, detail: "Transactions", icon: CheckCircle2 },
    ] as const;
  }, [stats]);

  return (
    <OwnerLayout>
      <div className="max-w-6xl px-4 pb-10 pt-6 xl:px-0 xl:pt-10">
        <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-50 shadow-[0_30px_60px_-40px_rgba(234,88,12,0.35)]">
          <div className="p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="max-w-xl">
                <Badge className="mb-4 inline-flex rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Owner Portal
                </Badge>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Overview</h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Simple live snapshot. Use statistics for deep breakdowns.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
                    onClick={() => void loadDashboard()}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Refresh
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                  >
                    <Link to="/owner/statistics">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Check statistics for more
                    </Link>
                  </Button>
                  <Badge className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                    {loading ? "Loading…" : "Live database snapshot"}
                  </Badge>
                </div>
              </div>

              <div className="grid w-full gap-4 sm:max-w-[520px] md:grid-cols-2 lg:max-w-none lg:w-[520px] lg:min-w-[520px] shrink-0 lg:flex-none">
                {kpiCards.slice(0, 4).map((card) => (
                  <div key={card.label} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 leading-snug whitespace-normal break-normal text-balance">{card.label}</p>
                        <div className="mt-2 text-3xl font-bold leading-none text-slate-900">{formatCount(card.value)}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {loading && !stats ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 shadow-md">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Loading overview…</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">Fetching real data from your database.</p>
          </div>
        ) : (
          <>
            <section className="mb-8 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                    <Clock3 className="h-3.5 w-3.5" />
                    Queue KPIs
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Operational queues</h2>
                  <p className="mt-1 text-sm text-slate-600">Quick action metrics. Full breakdowns live in Statistics.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kpiCards.slice(4).map((card) => (
                  <div key={card.label} className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 whitespace-normal break-normal text-balance">{card.label}</p>
                        <div className="mt-2 text-2xl font-extrabold leading-none text-slate-900">{formatCount(card.value)}</div>
                        <p className="mt-2 text-xs font-semibold text-slate-600">{card.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Recent Activity
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Latest records</h2>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Jobs
                    </div>
                    <Badge className="border border-orange-200 bg-white text-orange-700">Latest</Badge>
                  </div>
                  <div className="space-y-3">
                    {recentJobs.length === 0 ? (
                      <div className="text-sm text-slate-600">—</div>
                    ) : (
                      recentJobs.map((j) => (
                        <div key={j.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                          <div className="truncate text-sm font-bold text-slate-900">{j.title}</div>
                          <div className="mt-1 truncate text-xs text-slate-600">{j.employerName}</div>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{j.status ?? "—"}</Badge>
                            <div className="text-xs font-semibold text-slate-500">{formatShortDate(j.created_at)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Ticket className="h-4 w-4 text-orange-600" />
                      Applications
                    </div>
                    <Badge className="border border-orange-200 bg-white text-orange-700">Latest</Badge>
                  </div>
                  <div className="space-y-3">
                    {recentApplications.length === 0 ? (
                      <div className="text-sm text-slate-600">—</div>
                    ) : (
                      recentApplications.map((a) => (
                        <div key={a.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                          <div className="truncate text-sm font-bold text-slate-900">{a.jobTitle}</div>
                          <div className="mt-1 truncate text-xs text-slate-600">{a.talentName}</div>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{a.status ?? "—"}</Badge>
                            <div className="text-xs font-semibold text-slate-500">{formatShortDate(a.applied_at)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Bell className="h-4 w-4 text-orange-600" />
                      Support
                    </div>
                    <Badge className="border border-orange-200 bg-white text-orange-700">Latest</Badge>
                  </div>
                  <div className="space-y-3">
                    {recentTickets.length === 0 ? (
                      <div className="text-sm text-slate-600">—</div>
                    ) : (
                      recentTickets.map((t) => (
                        <div key={t.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                          <div className="truncate text-sm font-bold text-slate-900">{t.subject}</div>
                          <div className="mt-1 truncate text-xs text-slate-600">{t.userEmail}</div>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{t.status ?? "—"}</Badge>
                            <div className="text-xs font-semibold text-slate-500">{formatShortDate(t.created_at)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-end">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                >
                  <Link to="/owner/statistics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View full statistics
                  </Link>
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}
