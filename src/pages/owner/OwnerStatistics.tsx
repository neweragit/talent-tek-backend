
import { useCallback, useEffect, useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Gauge,
  Loader2,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

type CountValue = number | null;

type Stats = {
  users_total: CountValue;
  users_active: CountValue;
  users_suspended: CountValue;
  users_email_verified: CountValue;
  users_profile_completed: CountValue;
  users_role_owner: CountValue;
  users_role_recruiter: CountValue;
  users_role_talent: CountValue;

  owners_total: CountValue;
  talents_total: CountValue;
  employers_total: CountValue;
  employer_team_members_total: CountValue;

  jobs_total: CountValue;
  jobs_published: CountValue;
  jobs_unpublished: CountValue;
  jobs_archived: CountValue;

  applications_total: CountValue;
  applications_pending: CountValue;
  applications_in_progress: CountValue;
  applications_maybe: CountValue;
  applications_rejected: CountValue;
  applications_archived: CountValue;

  interviews_total: CountValue;
  interviews_scheduled: CountValue;
  interviews_confirmed: CountValue;
  interviews_completed: CountValue;
  interviews_rescheduled: CountValue;
  interviews_cancelled: CountValue;
  interviews_no_show: CountValue;

  tickets_total: CountValue;
  tickets_open: CountValue;
  tickets_in_progress: CountValue;
  tickets_solved: CountValue;
  tickets_closed: CountValue;

  notifications_total: CountValue;
  notifications_unread: CountValue;

  subscriptions_total: CountValue;
  subscriptions_active: CountValue;
  subscriptions_trial: CountValue;
  subscriptions_cancelled: CountValue;
  subscriptions_expired: CountValue;
  subscriptions_suspended: CountValue;

  plans_total: CountValue;
  plans_active: CountValue;

  payments_total: CountValue;
  payments_completed: CountValue;
  payments_failed: CountValue;
  payments_pending: CountValue;

  payment_methods_total: CountValue;

  offers_total: CountValue;
  services_total: CountValue;
  service_reviews_total: CountValue;

  interviewers_total: CountValue;
  interview_reviews_total: CountValue;

  activity_logs_total: CountValue;
  login_attempts_total: CountValue;
};

const formatCount = (value: CountValue) => (value === null ? "—" : value.toLocaleString());
const toNumber = (value: CountValue) => (value === null ? 0 : value);

const safeCount = async (query: any): Promise<CountValue> => {
  try {
    const res = await query;
    if (res?.error) return null;
    return res?.count ?? 0;
  } catch {
    return null;
  }
};

type RangeKey = "7d" | "30d" | "90d" | "180d" | "365d";
const rangeDays: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90, "180d": 180, "365d": 365 };
const rangeLabel: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "180d": "Last 6 months",
  "365d": "Last 12 months",
};

type GrowthMetric = {
  label: string;
  value: CountValue;
  prev: CountValue;
  icon: any;
  hint: string;
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

type RecentPayment = {
  id: string;
  employer_id: string;
  amount: number | null;
  currency: string | null;
  status: string | null;
  created_at: string | null;
  employerName?: string | null;
};
export default function OwnerStatistics() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  const [growth, setGrowth] = useState<GrowthMetric[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - rangeDays[range]);
      const prevStart = new Date(now);
      prevStart.setDate(prevStart.getDate() - rangeDays[range] * 2);

      const results = await Promise.all([
        safeCount(supabase.from("users").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true)),
        safeCount(supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", false)),
        safeCount(supabase.from("users").select("id", { count: "exact", head: true }).eq("email_verified", true)),
        safeCount(supabase.from("users").select("id", { count: "exact", head: true }).eq("profile_completed", true)),
        safeCount(supabase.from("users").select("id", { count: "exact", head: true }).eq("user_role", "owner")),
        safeCount(supabase.from("users").select("id", { count: "exact", head: true }).eq("user_role", "recruiter")),
        safeCount(supabase.from("users").select("id", { count: "exact", head: true }).eq("user_role", "talent")),

        safeCount(supabase.from("owners").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("talents").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("employers").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("employer_team_members").select("id", { count: "exact", head: true })),

        safeCount(supabase.from("jobs").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "published")),
        safeCount(supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "unpublished")),
        safeCount(supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "archived")),

        safeCount(supabase.from("applications").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending")),
        safeCount(supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "in-progress")),
        safeCount(supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "maybe")),
        safeCount(supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "rejected")),
        safeCount(supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "archived")),

        safeCount(supabase.from("interviews").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "scheduled")),
        safeCount(supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "confirmed")),
        safeCount(supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "completed")),
        safeCount(supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "rescheduled")),
        safeCount(supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "cancelled")),
        safeCount(supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "no-show")),

        safeCount(supabase.from("tickets").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open")),
        safeCount(supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "in-progress")),
        safeCount(supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "solved")),
        safeCount(supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "closed")),

        safeCount(supabase.from("notifications").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false)),

        safeCount(supabase.from("subscriptions").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active")),
        safeCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "trial")),
        safeCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "cancelled")),
        safeCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired")),
        safeCount(supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "suspended")),

        safeCount(supabase.from("plans").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("plans").select("id", { count: "exact", head: true }).eq("is_active", true)),

        safeCount(supabase.from("payments").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "completed")),
        safeCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "failed")),
        safeCount(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending")),

        safeCount(supabase.from("payment_methods").select("id", { count: "exact", head: true })),

        safeCount(supabase.from("offers").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("services").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("service_reviews").select("id", { count: "exact", head: true })),

        safeCount(supabase.from("interviewers").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("interview_reviews").select("id", { count: "exact", head: true })),

        safeCount(supabase.from("activity_logs").select("id", { count: "exact", head: true })),
        safeCount(supabase.from("login_attempts").select("id", { count: "exact", head: true })),

        safeCount(supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString())),
        safeCount(
          supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("talents")
            .select("id", { count: "exact", head: true })
            .gte("created_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("talents")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("employers")
            .select("id", { count: "exact", head: true })
            .gte("created_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("employers")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", start.toISOString()),
        ),
        safeCount(supabase.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString())),
        safeCount(
          supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .gte("applied_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .gte("applied_at", prevStart.toISOString())
            .lt("applied_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("interviews")
            .select("id", { count: "exact", head: true })
            .gte("created_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("interviews")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .gte("created_at", start.toISOString()),
        ),
        safeCount(
          supabase
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .gte("created_at", prevStart.toISOString())
            .lt("created_at", start.toISOString()),
        ),
      ]);

      const [
        users_total,
        users_active,
        users_suspended,
        users_email_verified,
        users_profile_completed,
        users_role_owner,
        users_role_recruiter,
        users_role_talent,
        owners_total,
        talents_total,
        employers_total,
        employer_team_members_total,
        jobs_total,
        jobs_published,
        jobs_unpublished,
        jobs_archived,
        applications_total,
        applications_pending,
        applications_in_progress,
        applications_maybe,
        applications_rejected,
        applications_archived,
        interviews_total,
        interviews_scheduled,
        interviews_confirmed,
        interviews_completed,
        interviews_rescheduled,
        interviews_cancelled,
        interviews_no_show,
        tickets_total,
        tickets_open,
        tickets_in_progress,
        tickets_solved,
        tickets_closed,
        notifications_total,
        notifications_unread,
        subscriptions_total,
        subscriptions_active,
        subscriptions_trial,
        subscriptions_cancelled,
        subscriptions_expired,
        subscriptions_suspended,
        plans_total,
        plans_active,
        payments_total,
        payments_completed,
        payments_failed,
        payments_pending,
        payment_methods_total,
        offers_total,
        services_total,
        service_reviews_total,
        interviewers_total,
        interview_reviews_total,
        activity_logs_total,
        login_attempts_total,
        users_new,
        users_new_prev,
        talents_new,
        talents_new_prev,
        employers_new,
        employers_new_prev,
        jobs_new,
        jobs_new_prev,
        apps_new,
        apps_new_prev,
        interviews_new,
        interviews_new_prev,
        tickets_new,
        tickets_new_prev,
      ] = results;

      setStats({
        users_total,
        users_active,
        users_suspended,
        users_email_verified,
        users_profile_completed,
        users_role_owner,
        users_role_recruiter,
        users_role_talent,
        owners_total,
        talents_total,
        employers_total,
        employer_team_members_total,
        jobs_total,
        jobs_published,
        jobs_unpublished,
        jobs_archived,
        applications_total,
        applications_pending,
        applications_in_progress,
        applications_maybe,
        applications_rejected,
        applications_archived,
        interviews_total,
        interviews_scheduled,
        interviews_confirmed,
        interviews_completed,
        interviews_rescheduled,
        interviews_cancelled,
        interviews_no_show,
        tickets_total,
        tickets_open,
        tickets_in_progress,
        tickets_solved,
        tickets_closed,
        notifications_total,
        notifications_unread,
        subscriptions_total,
        subscriptions_active,
        subscriptions_trial,
        subscriptions_cancelled,
        subscriptions_expired,
        subscriptions_suspended,
        plans_total,
        plans_active,
        payments_total,
        payments_completed,
        payments_failed,
        payments_pending,
        payment_methods_total,
        offers_total,
        services_total,
        service_reviews_total,
        interviewers_total,
        interview_reviews_total,
        activity_logs_total,
        login_attempts_total,
      });

      setGrowth([
        { label: "New Users", value: users_new, prev: users_new_prev, icon: Users, hint: rangeLabel[range] },
        { label: "New Talents", value: talents_new, prev: talents_new_prev, icon: Briefcase, hint: rangeLabel[range] },
        { label: "New Employers", value: employers_new, prev: employers_new_prev, icon: Building2, hint: rangeLabel[range] },
        { label: "New Jobs", value: jobs_new, prev: jobs_new_prev, icon: FileText, hint: rangeLabel[range] },
        { label: "New Applications", value: apps_new, prev: apps_new_prev, icon: Ticket, hint: rangeLabel[range] },
        { label: "New Interviews", value: interviews_new, prev: interviews_new_prev, icon: CalendarDays, hint: rangeLabel[range] },
        { label: "New Tickets", value: tickets_new, prev: tickets_new_prev, icon: Bell, hint: rangeLabel[range] },
      ]);

      const [jobsRes, appsRes, ticketsRes, paymentsRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id,employer_id,title,location,status,workplace,employment_type,experience_level,created_at")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("applications")
          .select("id,job_id,talent_id,status,stage,applied_at")
          .order("applied_at", { ascending: false })
          .limit(6),
        supabase
          .from("tickets")
          .select("id,user_id,sender_name,subject,status,priority,created_at")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("payments")
          .select("id,employer_id,amount,currency,status,created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (appsRes.error) throw appsRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const jobs = ((jobsRes.data ?? []) as any[]).map((j) => ({ ...j })) as RecentJob[];
      const apps = ((appsRes.data ?? []) as any[]).map((a) => ({ ...a })) as RecentApplication[];
      const tickets = ((ticketsRes.data ?? []) as any[]).map((t) => ({ ...t })) as RecentTicket[];
      const payments = ((paymentsRes.data ?? []) as any[]).map((p) => ({ ...p })) as RecentPayment[];

      const employerIds = Array.from(new Set([...jobs.map((j) => j.employer_id), ...payments.map((p) => p.employer_id)].filter(Boolean)));
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
      setRecentPayments(payments.map((p) => ({ ...p, employerName: empMap.get(p.employer_id) ?? "—" })));
      setRecentApplications(
        apps.map((a) => ({ ...a, jobTitle: jobMap.get(a.job_id) ?? "—", talentName: talentMap.get(a.talent_id) ?? "—" })),
      );
      setRecentTickets(tickets.map((t) => ({ ...t, userEmail: userMap.get(t.user_id) ?? "—" })));
    } catch (err: any) {
      console.error("Owner statistics load failed:", err);
      toast({
        title: "Load failed",
        description: err?.message || "Unable to load statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, range]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const breakdown = useMemo(() => {
    if (!stats) return null;

    const jobs = [
      { name: "Published", value: toNumber(stats.jobs_published), color: "#ea580c" },
      { name: "Unpublished", value: toNumber(stats.jobs_unpublished), color: "#fb923c" },
      { name: "Archived", value: toNumber(stats.jobs_archived), color: "#fed7aa" },
    ];

    const applications = [
      { name: "Pending", value: toNumber(stats.applications_pending), color: "#ea580c" },
      { name: "In Progress", value: toNumber(stats.applications_in_progress), color: "#fb923c" },
      { name: "Maybe", value: toNumber(stats.applications_maybe), color: "#fdba74" },
      { name: "Rejected", value: toNumber(stats.applications_rejected), color: "#fca5a5" },
      { name: "Archived", value: toNumber(stats.applications_archived), color: "#e2e8f0" },
    ];

    const interviews = [
      { name: "Scheduled", value: toNumber(stats.interviews_scheduled), color: "#ea580c" },
      { name: "Confirmed", value: toNumber(stats.interviews_confirmed), color: "#fb923c" },
      { name: "Completed", value: toNumber(stats.interviews_completed), color: "#34d399" },
      { name: "Rescheduled", value: toNumber(stats.interviews_rescheduled), color: "#60a5fa" },
      { name: "Cancelled", value: toNumber(stats.interviews_cancelled), color: "#fca5a5" },
      { name: "No-show", value: toNumber(stats.interviews_no_show), color: "#fecaca" },
    ];

    const tickets = [
      { name: "Open", value: toNumber(stats.tickets_open), color: "#ea580c" },
      { name: "In Progress", value: toNumber(stats.tickets_in_progress), color: "#fb923c" },
      { name: "Solved", value: toNumber(stats.tickets_solved), color: "#34d399" },
      { name: "Closed", value: toNumber(stats.tickets_closed), color: "#e2e8f0" },
    ];

    const subscriptions = [
      { name: "Active", value: toNumber(stats.subscriptions_active), color: "#ea580c" },
      { name: "Trial", value: toNumber(stats.subscriptions_trial), color: "#fb923c" },
      { name: "Cancelled", value: toNumber(stats.subscriptions_cancelled), color: "#fca5a5" },
      { name: "Expired", value: toNumber(stats.subscriptions_expired), color: "#e2e8f0" },
      { name: "Suspended", value: toNumber(stats.subscriptions_suspended), color: "#fdba74" },
    ];

    const payments = [
      { name: "Completed", value: toNumber(stats.payments_completed), color: "#34d399" },
      { name: "Pending", value: toNumber(stats.payments_pending), color: "#fb923c" },
      { name: "Failed", value: toNumber(stats.payments_failed), color: "#fca5a5" },
    ];

    return { jobs, applications, interviews, tickets, subscriptions, payments } as const;
  }, [stats]);

  const growthCards = useMemo(() => {
    const calc = (current: CountValue, prev: CountValue) => {
      if (current === null || prev === null) return null;
      const c = current ?? 0;
      const p = prev ?? 0;
      const denom = Math.max(p, 1);
      return Math.round(((c - p) / denom) * 1000) / 10; // 1 decimal
    };

    return growth.map((g) => ({ ...g, delta: calc(g.value, g.prev) }));
  }, [growth]);

  const sections = useMemo(() => {
    if (!stats) return [] as any[];

    return [
      {
        title: "Users",
        subtitle: "Accounts and roles",
        icon: Users,
        items: [
          { label: "Total Users", value: formatCount(stats.users_total), detail: "All accounts", icon: Users },
          { label: "Active", value: formatCount(stats.users_active), detail: "is_active = true", icon: CheckCircle2 },
          { label: "Suspended", value: formatCount(stats.users_suspended), detail: "is_active = false", icon: AlertTriangle },
          { label: "Email Verified", value: formatCount(stats.users_email_verified), detail: "email_verified = true", icon: ShieldCheck },
          { label: "Profile Completed", value: formatCount(stats.users_profile_completed), detail: "profile_completed = true", icon: Gauge },
          { label: "Owners", value: formatCount(stats.users_role_owner), detail: "user_role = owner", icon: ShieldCheck },
          { label: "Recruiters", value: formatCount(stats.users_role_recruiter), detail: "user_role = recruiter", icon: Building2 },
          { label: "Talents", value: formatCount(stats.users_role_talent), detail: "user_role = talent", icon: Briefcase },
        ],
      },
      {
        title: "Marketplace",
        subtitle: "Profiles and organizations",
        icon: Building2,
        items: [
          { label: "Talents", value: formatCount(stats.talents_total), detail: "talents table", icon: Briefcase },
          { label: "Employers", value: formatCount(stats.employers_total), detail: "employers table", icon: Building2 },
          { label: "Team Members", value: formatCount(stats.employer_team_members_total), detail: "employer_team_members", icon: Users },
          { label: "Owners", value: formatCount(stats.owners_total), detail: "owners table", icon: ShieldCheck },
          { label: "Services", value: formatCount(stats.services_total), detail: "services table", icon: Briefcase },
          { label: "Service Reviews", value: formatCount(stats.service_reviews_total), detail: "service_reviews", icon: CheckCircle2 },
        ],
      },
      {
        title: "Jobs",
        subtitle: "Job inventory status",
        icon: FileText,
        items: [
          { label: "Total Jobs", value: formatCount(stats.jobs_total), detail: "jobs table", icon: FileText },
          { label: "Published", value: formatCount(stats.jobs_published), detail: "status = published", icon: CheckCircle2 },
          { label: "Unpublished", value: formatCount(stats.jobs_unpublished), detail: "status = unpublished", icon: Clock3 },
          { label: "Archived", value: formatCount(stats.jobs_archived), detail: "status = archived", icon: AlertTriangle },
        ],
      },
      {
        title: "Applications",
        subtitle: "Pipeline health",
        icon: Ticket,
        items: [
          { label: "Total", value: formatCount(stats.applications_total), detail: "applications table", icon: Ticket },
          { label: "Pending", value: formatCount(stats.applications_pending), detail: "status = pending", icon: Clock3 },
          { label: "In Progress", value: formatCount(stats.applications_in_progress), detail: "status = in-progress", icon: Settings2 },
          { label: "Maybe", value: formatCount(stats.applications_maybe), detail: "status = maybe", icon: AlertTriangle },
          { label: "Rejected", value: formatCount(stats.applications_rejected), detail: "status = rejected", icon: AlertTriangle },
          { label: "Archived", value: formatCount(stats.applications_archived), detail: "status = archived", icon: FileText },
        ],
      },
      {
        title: "Interviews",
        subtitle: "Scheduling and outcomes",
        icon: CalendarDays,
        items: [
          { label: "Total", value: formatCount(stats.interviews_total), detail: "interviews table", icon: CalendarDays },
          { label: "Scheduled", value: formatCount(stats.interviews_scheduled), detail: "status = scheduled", icon: Clock3 },
          { label: "Confirmed", value: formatCount(stats.interviews_confirmed), detail: "status = confirmed", icon: CheckCircle2 },
          { label: "Completed", value: formatCount(stats.interviews_completed), detail: "status = completed", icon: CheckCircle2 },
          { label: "Rescheduled", value: formatCount(stats.interviews_rescheduled), detail: "status = rescheduled", icon: Settings2 },
          { label: "Cancelled", value: formatCount(stats.interviews_cancelled), detail: "status = cancelled", icon: AlertTriangle },
          { label: "No-show", value: formatCount(stats.interviews_no_show), detail: "status = no-show", icon: AlertTriangle },
          { label: "Interviewers", value: formatCount(stats.interviewers_total), detail: "interviewers table", icon: Users },
          { label: "Interview Reviews", value: formatCount(stats.interview_reviews_total), detail: "interview_reviews", icon: CheckCircle2 },
        ],
      },
      {
        title: "Support & Ops",
        subtitle: "Tickets, notifications, and security",
        icon: Bell,
        items: [
          { label: "Tickets", value: formatCount(stats.tickets_total), detail: "tickets table", icon: Ticket },
          { label: "Open", value: formatCount(stats.tickets_open), detail: "status = open", icon: Clock3 },
          { label: "In Progress", value: formatCount(stats.tickets_in_progress), detail: "status = in-progress", icon: Settings2 },
          { label: "Solved", value: formatCount(stats.tickets_solved), detail: "status = solved", icon: CheckCircle2 },
          { label: "Closed", value: formatCount(stats.tickets_closed), detail: "status = closed", icon: CheckCircle2 },
          { label: "Notifications", value: formatCount(stats.notifications_total), detail: "notifications table", icon: Bell },
          { label: "Unread", value: formatCount(stats.notifications_unread), detail: "is_read = false", icon: Bell },
          { label: "Login Attempts", value: formatCount(stats.login_attempts_total), detail: "login_attempts", icon: ShieldCheck },
          { label: "Activity Logs", value: formatCount(stats.activity_logs_total), detail: "activity_logs", icon: ShieldCheck },
        ],
      },
      {
        title: "Billing",
        subtitle: "Subscriptions and payments",
        icon: CreditCard,
        items: [
          { label: "Subscriptions", value: formatCount(stats.subscriptions_total), detail: "subscriptions table", icon: CreditCard },
          { label: "Active", value: formatCount(stats.subscriptions_active), detail: "status = active", icon: CheckCircle2 },
          { label: "Trial", value: formatCount(stats.subscriptions_trial), detail: "status = trial", icon: Clock3 },
          { label: "Cancelled", value: formatCount(stats.subscriptions_cancelled), detail: "status = cancelled", icon: AlertTriangle },
          { label: "Expired", value: formatCount(stats.subscriptions_expired), detail: "status = expired", icon: AlertTriangle },
          { label: "Suspended", value: formatCount(stats.subscriptions_suspended), detail: "status = suspended", icon: AlertTriangle },
          { label: "Plans", value: formatCount(stats.plans_total), detail: "plans table", icon: FileText },
          { label: "Plans Active", value: formatCount(stats.plans_active), detail: "is_active = true", icon: CheckCircle2 },
          { label: "Payments", value: formatCount(stats.payments_total), detail: "payments table", icon: CreditCard },
          { label: "Completed", value: formatCount(stats.payments_completed), detail: "status = completed", icon: CheckCircle2 },
          { label: "Failed", value: formatCount(stats.payments_failed), detail: "status = failed", icon: AlertTriangle },
          { label: "Pending", value: formatCount(stats.payments_pending), detail: "status = pending", icon: Clock3 },
          { label: "Payment Methods", value: formatCount(stats.payment_methods_total), detail: "payment_methods", icon: CreditCard },
          { label: "Offers", value: formatCount(stats.offers_total), detail: "offers table", icon: FileText },
        ],
      },
    ];
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
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Statistics</h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Live KPIs across all core tables — accounts, jobs, applications, interviews, billing, and operations.
                </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
                  onClick={() => void loadStats()}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>
                <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
                  <SelectTrigger className="h-11 w-52 rounded-full border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(rangeLabel).map((k) => (
                      <SelectItem key={k} value={k}>
                        {rangeLabel[k as RangeKey]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                  {loading ? "Loading…" : "Live database snapshot"}
                </Badge>
              </div>
            </div>

              <div className="grid w-full gap-4 sm:max-w-[420px] md:grid-cols-2 lg:max-w-none lg:w-[420px] lg:min-w-[420px] xl:w-[480px] xl:min-w-[480px] shrink-0 lg:flex-none">
                {[
                  { label: "Users", value: stats?.users_total ?? null, icon: Users },
                  { label: "Employers", value: stats?.employers_total ?? null, icon: Building2 },
                  { label: "Jobs", value: stats?.jobs_total ?? null, icon: FileText },
                  { label: "Applications", value: stats?.applications_total ?? null, icon: Ticket },
                ].map((card) => (
                  <div key={card.label} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 leading-snug whitespace-normal break-normal text-balance">{card.label}</p>
                        <div className="mt-2 text-3xl font-bold leading-none text-slate-900">{formatCount(card.value)}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Total records</p>
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
            <h2 className="text-2xl font-bold text-slate-900">Loading statistics…</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">Fetching real data from every core table.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                    <Gauge className="h-3.5 w-3.5" />
                    Growth & Activity
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">What changed in {rangeLabel[range].toLowerCase()}</h2>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {growthCards.map((g) => (
                  <div key={g.label} className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                        <g.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 whitespace-normal break-normal text-balance">
                          {g.label}
                        </p>
                        <div className="mt-2 text-2xl font-extrabold leading-none text-slate-900">{formatCount(g.value)}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="rounded-full border border-orange-200 bg-white px-2.5 py-1 text-slate-700">
                            prev: {formatCount(g.prev)}
                          </span>
                          {g.delta === null ? (
                            <span className="text-slate-500">—</span>
                          ) : (
                            <span className={g.delta >= 0 ? "text-emerald-700" : "text-rose-700"}>
                              {g.delta >= 0 ? "+" : ""}
                              {g.delta}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {breakdown ? (
              <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Distributions
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Status breakdowns</h2>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-900">Applications</div>
                      <Badge className="border border-orange-200 bg-white text-orange-700">Total {formatCount(stats?.applications_total ?? null)}</Badge>
                    </div>
                    <ChartContainer
                      className="h-[260px] w-full"
                      config={{
                        Pending: { label: "Pending", color: "#ea580c" },
                        "In Progress": { label: "In Progress", color: "#fb923c" },
                        Maybe: { label: "Maybe", color: "#fdba74" },
                        Rejected: { label: "Rejected", color: "#fca5a5" },
                        Archived: { label: "Archived", color: "#e2e8f0" },
                      }}
                    >
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={breakdown.applications} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} strokeWidth={2}>
                          {breakdown.applications.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                  </div>

                  <div className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-900">Tickets</div>
                      <Badge className="border border-orange-200 bg-white text-orange-700">Total {formatCount(stats?.tickets_total ?? null)}</Badge>
                    </div>
                    <ChartContainer
                      className="h-[260px] w-full"
                      config={{
                        Open: { label: "Open", color: "#ea580c" },
                        "In Progress": { label: "In Progress", color: "#fb923c" },
                        Solved: { label: "Solved", color: "#34d399" },
                        Closed: { label: "Closed", color: "#e2e8f0" },
                      }}
                    >
                      <BarChart data={breakdown.tickets} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                          {breakdown.tickets.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                    <Clock3 className="h-3.5 w-3.5" />
                    Recent Activity
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Latest records across the platform</h2>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
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
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">{j.title}</div>
                              <div className="mt-1 truncate text-xs text-slate-600">{j.employerName}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{j.status ?? "—"}</Badge>
                                {j.workplace ? <Badge className="border border-slate-200 bg-slate-50 text-slate-700">{j.workplace}</Badge> : null}
                                {j.employment_type ? <Badge className="border border-slate-200 bg-slate-50 text-slate-700">{j.employment_type}</Badge> : null}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">{j.created_at ? new Date(j.created_at).toLocaleDateString() : "—"}</div>
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
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">{a.jobTitle}</div>
                              <div className="mt-1 truncate text-xs text-slate-600">{a.talentName}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{a.status ?? "—"}</Badge>
                                {a.stage ? <Badge className="border border-slate-200 bg-slate-50 text-slate-700">{a.stage}</Badge> : null}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">{a.applied_at ? new Date(a.applied_at).toLocaleDateString() : "—"}</div>
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
                      Tickets
                    </div>
                    <Badge className="border border-orange-200 bg-white text-orange-700">Latest</Badge>
                  </div>
                  <div className="space-y-3">
                    {recentTickets.length === 0 ? (
                      <div className="text-sm text-slate-600">—</div>
                    ) : (
                      recentTickets.map((t) => (
                        <div key={t.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">{t.subject}</div>
                              <div className="mt-1 truncate text-xs text-slate-600">{t.userEmail}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{t.status ?? "—"}</Badge>
                                {t.priority ? <Badge className="border border-slate-200 bg-slate-50 text-slate-700">{t.priority}</Badge> : null}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <CreditCard className="h-4 w-4 text-orange-600" />
                      Payments
                    </div>
                    <Badge className="border border-orange-200 bg-white text-orange-700">Latest</Badge>
                  </div>
                  <div className="space-y-3">
                    {recentPayments.length === 0 ? (
                      <div className="text-sm text-slate-600">—</div>
                    ) : (
                      recentPayments.map((p) => (
                        <div key={p.id} className="rounded-2xl border border-orange-100 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">{p.employerName}</div>
                              <div className="mt-1 truncate text-xs text-slate-600">
                                {p.amount !== null ? `${p.amount} ${p.currency ?? ""}`.trim() : "—"}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{p.status ?? "—"}</Badge>
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            {sections.map((section) => (
              <section key={section.title} className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                      <section.icon className="h-3.5 w-3.5" />
                      {section.title}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{section.subtitle}</h2>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {section.items.map((item: any) => (
                    <div key={item.label} className="rounded-3xl border border-orange-100 bg-orange-50/35 p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 whitespace-normal break-normal text-balance">{item.label}</p>
                          <div className="mt-2 text-2xl font-extrabold leading-none text-slate-900">{item.value}</div>
                          <p className="mt-2 text-xs font-semibold text-slate-600">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-[2rem] border border-orange-100 bg-orange-50/40 p-6 text-sm text-slate-700 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">Notes</div>
              <div className="mt-1 text-slate-600">
                Some tables may return “—” if Row Level Security blocks access for the current owner session. If you want every KPI to load,
                ensure owner role has read permissions for those tables.
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
