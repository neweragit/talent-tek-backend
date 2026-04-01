import { useEffect, useMemo, useState } from "react";
import RecruiterAdminLayout from "@/components/layouts/RecruiterAdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock3,
  Cpu,
  DollarSign,
  Globe2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";

type MonthKey = "all" | "7d" | "30d" | "90d";

type StatCard = {
  label: string;
  value: string;
  desc: string;
  trend: string;
  icon: typeof DollarSign;
};

type RevenueStream = {
  id: number;
  stream: string;
  region: string;
  accounts: number;
  mrr: string;
  growth: string;
  status: "Strong" | "Healthy" | "Watch";
};

type UserDistribution = {
  id: number;
  segment: string;
  activeUsers: number;
  newUsers: number;
  share: number;
  retention: string;
  note: string;
};

type ActivityItem = {
  id: number;
  title: string;
  detail: string;
  time: string;
  type: "Revenue" | "Growth" | "Risk";
};

const statsByMonth: Record<MonthKey, StatCard[]> = {
  all: [
    { label: "Hiring Budget", value: "$86,400", desc: "Monthly recruitment spend", trend: "+6.8%", icon: DollarSign },
    { label: "Open Roles", value: "34", desc: "Across active departments", trend: "+4.2%", icon: Building2 },
    { label: "New Applicants", value: "428", desc: "Received this month", trend: "+13.6%", icon: Briefcase },
    { label: "Active Recruiters", value: "19", desc: "Currently hiring", trend: "+5.5%", icon: UserCog },
  ],
  january: [
    { label: "Hiring Budget", value: "$78,900", desc: "Monthly recruitment spend", trend: "+5.1%", icon: DollarSign },
    { label: "Open Roles", value: "27", desc: "Across active departments", trend: "+3.4%", icon: Building2 },
    { label: "New Applicants", value: "356", desc: "Received in January", trend: "+8.7%", icon: Briefcase },
    { label: "Active Recruiters", value: "16", desc: "Currently hiring", trend: "+3.9%", icon: UserCog },
  ],
  february: [
    { label: "Hiring Budget", value: "$82,200", desc: "Monthly recruitment spend", trend: "+6.0%", icon: DollarSign },
    { label: "Open Roles", value: "31", desc: "Across active departments", trend: "+3.9%", icon: Building2 },
    { label: "New Applicants", value: "391", desc: "Received in February", trend: "+11.2%", icon: Briefcase },
    { label: "Active Recruiters", value: "18", desc: "Currently hiring", trend: "+4.8%", icon: UserCog },
  ],
  march: [
    { label: "Hiring Budget", value: "$86,400", desc: "Monthly recruitment spend", trend: "+6.8%", icon: DollarSign },
    { label: "Open Roles", value: "34", desc: "Across active departments", trend: "+4.2%", icon: Building2 },
    { label: "New Applicants", value: "428", desc: "Received in March", trend: "+13.6%", icon: Briefcase },
    { label: "Active Recruiters", value: "19", desc: "Currently hiring", trend: "+5.5%", icon: UserCog },
  ],
};

const revenueStreams: RevenueStream[] = [
  { id: 1, stream: "Engineering Hiring", region: "Product & Tech", accounts: 12, mrr: "$28,600", growth: "+10.2%", status: "Strong" },
  { id: 2, stream: "Sales Hiring", region: "Commercial", accounts: 9, mrr: "$21,300", growth: "+8.4%", status: "Strong" },
  { id: 3, stream: "Operations Hiring", region: "Operations", accounts: 7, mrr: "$14,200", growth: "+6.5%", status: "Healthy" },
  { id: 4, stream: "Leadership Roles", region: "Executive", accounts: 4, mrr: "$11,800", growth: "+7.1%", status: "Healthy" },
  { id: 5, stream: "Urgent Backfills", region: "Cross-team", accounts: 10, mrr: "$7,900", growth: "+2.9%", status: "Watch" },
  { id: 6, stream: "Internship Pipeline", region: "Graduate Program", accounts: 6, mrr: "$2,600", growth: "+9.8%", status: "Healthy" },
];

const userDistribution: UserDistribution[] = [
  { id: 1, segment: "Recruiters", activeUsers: 46, newUsers: 4, share: 38, retention: "88%", note: "Consistent outreach and screening" },
  { id: 2, segment: "Hiring Managers", activeUsers: 29, newUsers: 2, share: 24, retention: "84%", note: "High interview completion" },
  { id: 3, segment: "Technical Interviewers", activeUsers: 22, newUsers: 3, share: 18, retention: "86%", note: "Steady feedback turnaround" },
  { id: 4, segment: "Leadership Interviewers", activeUsers: 14, newUsers: 1, share: 12, retention: "82%", note: "Good decision consistency" },
  { id: 5, segment: "Observers", activeUsers: 10, newUsers: 1, share: 8, retention: "79%", note: "Needs deeper workflow adoption" },
];

const activityFeed: ActivityItem[] = [
  {
    id: 1,
    title: "Senior backend role moved to final stage",
    detail: "Candidate #TK-482 advanced after technical and leadership approvals",
    time: "12 min ago",
    type: "Growth",
  },
  {
    id: 2,
    title: "Recruiter workload rebalanced",
    detail: "4 urgent roles reassigned to reduce time-to-first-screen by 18%",
    time: "35 min ago",
    type: "Growth",
  },
  {
    id: 3,
    title: "Interview cancellation spike detected",
    detail: "3 interviews rescheduled from one department due to manager conflicts",
    time: "1h 04m ago",
    type: "Risk",
  },
  {
    id: 4,
    title: "Offer acceptance trend improved",
    detail: "Offer acceptance increased from 61% to 67% in the last 7 days",
    time: "1h 52m ago",
    type: "Growth",
  },
  {
    id: 5,
    title: "Agency invoice approved",
    detail: "External sourcing invoice INV-2048 ($3,400) approved by finance",
    time: "2h 41m ago",
    type: "Revenue",
  },
];

const platformHealth = [
  { label: "Role fill velocity", value: "23.1 days", change: "-1.7 days", icon: ShieldCheck },
  { label: "First-screen SLA", value: "16h 20m", change: "-2h 10m", icon: Cpu },
  { label: "Interview completion", value: "87.2%", change: "+3.4%", icon: CheckCircle2 },
  { label: "Candidate response time", value: "5h 45m", change: "-48m", icon: Clock3 },
  { label: "Hiring efficiency score", value: "91/100", change: "+5.2%", icon: Banknote },
];

const getStatusClasses = (status: RevenueStream["status"]) => {
  if (status === "Strong") {
    return "border-orange-300 bg-orange-100 text-orange-800";
  }

  if (status === "Healthy") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-orange-200 bg-orange-100 text-orange-700";
};

const getActivityTypeClasses = (type: ActivityItem["type"]) => {
  if (type === "Revenue") {
    return "border-orange-300 bg-orange-100 text-orange-800";
  }

  if (type === "Growth") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-orange-200 bg-orange-100 text-orange-700";
};

export default function EmployerAdminOverview() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");
  const [kpis, setKpis] = useState({
    employersTotal: 0,
    jobsTotal: 0,
    jobsPublished: 0,
    jobsUnpublished: 0,
    jobsArchived: 0,
    talentsTotal: 0,
    applicationsTotal: 0,
    applicationsPending: 0,
    applicationsInProgress: 0,
    applicationsMaybe: 0,
    applicationsRejected: 0,
    applicationsArchived: 0,
  });
  const [recentApplications, setRecentApplications] = useState<
    Array<{
      id: string;
      candidateName: string;
      companyName: string;
      jobTitle: string;
      status: string;
      stage: string | null;
      appliedAt: string;
    }>
  >([]);

  const rangeStartIso = useMemo(() => {
    if (selectedMonth === "all") return null;
    const now = new Date();
    const days = selectedMonth === "7d" ? 7 : selectedMonth === "30d" ? 30 : 90;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return start.toISOString();
  }, [selectedMonth]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const countTable = async (
        table: "employers" | "talents" | "jobs" | "applications",
        apply?: (query: any) => any,
      ) => {
        // NOTE: `.eq/.gte` only exists after `.select(...)` in supabase-js.
        let query: any = supabase.from(table).select("id", { head: true, count: "exact" });

        if (rangeStartIso) {
          if (table === "applications") query = query.gte("applied_at", rangeStartIso);
          else query = query.gte("created_at", rangeStartIso);
        }

        if (apply) query = apply(query);

        const { count, error } = await query;
        if (error) throw error;
        return count ?? 0;
      };

      const [
        employersTotal,
        talentsTotal,
        jobsTotal,
        jobsPublished,
        jobsUnpublished,
        jobsArchived,
        applicationsTotal,
        applicationsPending,
        applicationsInProgress,
        applicationsMaybe,
        applicationsRejected,
        applicationsArchived,
      ] = await Promise.all([
        countTable("employers"),
        countTable("talents"),
        countTable("jobs"),
        countTable("jobs", (q) => q.eq("status", "published")),
        countTable("jobs", (q) => q.eq("status", "unpublished")),
        countTable("jobs", (q) => q.eq("status", "archived")),
        countTable("applications"),
        countTable("applications", (q) => q.eq("status", "pending")),
        countTable("applications", (q) => q.eq("status", "in-progress")),
        countTable("applications", (q) => q.eq("status", "maybe")),
        countTable("applications", (q) => q.eq("status", "rejected")),
        countTable("applications", (q) => q.eq("status", "archived")),
      ]);

      setKpis({
        employersTotal,
        jobsTotal,
        jobsPublished,
        jobsUnpublished,
        jobsArchived,
        talentsTotal,
        applicationsTotal,
        applicationsPending,
        applicationsInProgress,
        applicationsMaybe,
        applicationsRejected,
        applicationsArchived,
      });

      const recentQuery = supabase
        .from("applications")
        .select(
          `
          id,
          status,
          stage,
          applied_at,
          talents ( full_name ),
          jobs ( title, employers ( company_name ) )
        `,
        )
        .order("applied_at", { ascending: false })
        .limit(6);

      const { data: recent, error: recentError } = rangeStartIso
        ? await recentQuery.gte("applied_at", rangeStartIso)
        : await recentQuery;

      if (recentError) throw recentError;

      setRecentApplications(
        (recent || []).map((row: any) => ({
          id: String(row.id),
          candidateName: row.talents?.full_name || "Candidate",
          companyName: row.jobs?.employers?.company_name || "Company",
          jobTitle: row.jobs?.title || "Role",
          status: row.status || "pending",
          stage: row.stage ?? null,
          appliedAt: row.applied_at || "",
        })),
      );

      setLastUpdatedAt(new Date().toLocaleString());
    } catch (error: any) {
      console.error("Recruiter admin overview load failed:", error);
      toast({
        title: "Could not load dashboard",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const stats = useMemo<StatCard[]>(() => {
    const fmt = (n: number) => n.toLocaleString();
    return [
      {
        label: "Employers",
        value: loading ? "-" : fmt(kpis.employersTotal),
        desc: "Companies created",
        trend: "",
        icon: Building2,
      },
      {
        label: "Jobs",
        value: loading ? "-" : fmt(kpis.jobsTotal),
        desc: `${fmt(kpis.jobsPublished)} published - ${fmt(kpis.jobsUnpublished)} unpublished`,
        trend: "",
        icon: Briefcase,
      },
      {
        label: "Talents",
        value: loading ? "-" : fmt(kpis.talentsTotal),
        desc: "Candidate profiles",
        trend: "",
        icon: Users,
      },
      {
        label: "Applications",
        value: loading ? "-" : fmt(kpis.applicationsTotal),
        desc: `${fmt(kpis.applicationsPending)} pending - ${fmt(kpis.applicationsInProgress)} in progress`,
        trend: "",
        icon: CheckCircle2,
      },
    ];
  }, [kpis, loading]);

  return (
    <RecruiterAdminLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Company Admin Overview
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Hello, Recruiter👋
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Monitor role progress, recruiter performance, and hiring execution from one unified company admin command center.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                  {lastUpdatedAt ? `Last updated: ${lastUpdatedAt}` : "Live platform snapshot"}
                </div>
                <Button
                  className="gap-2 rounded-full bg-orange-600 px-5 text-white shadow-lg hover:bg-orange-700"
                  onClick={async () => {
                    setRefreshing(true);
                    await loadDashboard();
                    setRefreshing(false);
                  }}
                  disabled={refreshing}
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh Hiring Data
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</div>
                  <p className="mt-1 text-sm text-slate-600">{stat.desc}</p>
                  {stat.trend ? (
                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {stat.trend}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold text-slate-700">
            Showing {selectedMonth === "all" ? "all-time consolidated" : selectedMonth === "7d" ? "last 7 days" : selectedMonth === "30d" ? "last 30 days" : "last 90 days"} company-admin metrics.
          </div>
          <div className="flex flex-nowrap gap-3">
            <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value as MonthKey)}>
              <SelectTrigger className="h-12 w-52 rounded-full border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedMonth("all")}
              className="rounded-full border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                  <Activity className="h-3.5 w-3.5" />
                  Applications
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Application status breakdown</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Counts are read from `applications.status`.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Pending", value: kpis.applicationsPending, icon: Clock3 },
                { label: "In Progress", value: kpis.applicationsInProgress, icon: CheckCircle2 },
                { label: "Maybe", value: kpis.applicationsMaybe, icon: Clock3 },
                { label: "Rejected", value: kpis.applicationsRejected, icon: Clock3 },
                { label: "Archived", value: kpis.applicationsArchived, icon: Clock3 },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <item.icon className="h-4 w-4 text-orange-600" />
                      {item.label}
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{loading ? "—" : item.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                  <Building2 className="h-3.5 w-3.5" />
                  Jobs
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Job status breakdown</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Counts are read from `jobs.status`.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Published", value: kpis.jobsPublished },
                { label: "Unpublished", value: kpis.jobsUnpublished },
                { label: "Archived", value: kpis.jobsArchived },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-4 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? "—" : item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                <Clock3 className="h-3.5 w-3.5" />
                Recent
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Recent applications</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Latest submissions across jobs and talents.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-600">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-600" />
              Loading recent applications...
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="rounded-3xl border border-orange-100 bg-orange-50/40 p-6 text-sm text-slate-600">No applications yet.</div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-orange-100">
              <table className="w-full text-left">
                <thead className="bg-orange-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 bg-white">
                  {recentApplications.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{item.candidateName}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.jobTitle}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.companyName}</td>
                      <td className="px-4 py-4">
                        <Badge className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                          {item.status === "in-progress" && item.stage
                            ? item.stage
                                .split("-")
                                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                                .join(" ")
                            : item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {item.appliedAt ? new Date(item.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </RecruiterAdminLayout>
  );
}
