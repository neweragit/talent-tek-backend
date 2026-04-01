// Legacy dashboard (kept for reference)
import { useMemo, useState } from "react";
import RecruiterAdminLayout from "@/components/layouts/RecruiterAdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";

type MonthKey = "all" | "january" | "february" | "march";

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
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>("all");

  const stats = useMemo(() => statsByMonth[selectedMonth], [selectedMonth]);

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
                  Hiring snapshot updates every 15 minutes
                </div>
                <Button className="gap-2 rounded-full bg-orange-600 px-5 text-white shadow-lg hover:bg-orange-700">
                  <RefreshCw className="h-4 w-4" />
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
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {stat.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold text-slate-700">
            Showing {selectedMonth === "all" ? "all-time consolidated" : `${selectedMonth} 2026`} company-admin metrics.
          </div>
          <div className="flex flex-nowrap gap-3">
            <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value as MonthKey)}>
              <SelectTrigger className="h-12 w-52 rounded-full border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="january">January 2026</SelectItem>
                <SelectItem value="february">February 2026</SelectItem>
                <SelectItem value="march">March 2026</SelectItem>
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
                  <BadgeDollarSign className="h-3.5 w-3.5" />
                  Hiring Budget Streams
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Monthly spend by hiring stream</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Replace chart placeholders with recruiter budget usage across departments and role groups.
                </p>
              </div>
              <div className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
                {revenueStreams.length} streams
              </div>
            </div>

            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
              {revenueStreams.map((item) => (
                <article key={item.id} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{item.stream}</h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <Globe2 className="h-4 w-4 text-orange-500" />
                        {item.region}
                      </div>
                    </div>
                    <Badge className={`border ${getStatusClasses(item.status)}`}>{item.status}</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">MRR</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{item.mrr}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Accounts</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{item.accounts}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Growth</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-orange-600">
                        <TrendingUp className="h-4 w-4" />
                        {item.growth}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                  <Users className="h-3.5 w-3.5" />
                  Team Distribution
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Hiring team composition</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Team-level distribution with retention and monthly intake replacing static visuals.
                </p>
              </div>
              <div className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
                {userDistribution.length} segments
              </div>
            </div>

            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
              {userDistribution.map((segment) => (
                <article key={segment.id} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{segment.segment}</h3>
                      <p className="mt-1 text-sm text-slate-600">{segment.note}</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{segment.share}%</p>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div className="h-full rounded-full bg-orange-600" style={{ width: `${segment.share}%` }} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Active users</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{segment.activeUsers.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">New users</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">+{segment.newUsers}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Retention</p>
                      <p className="mt-1 text-lg font-bold text-orange-600">{segment.retention}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                  <Activity className="h-3.5 w-3.5" />
                  Live Hiring Activity
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Company admin activity feed</h2>
              </div>
              <div className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
                {activityFeed.length} events
              </div>
            </div>

            <div className="space-y-4">
              {activityFeed.map((event) => (
                <article key={event.id} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{event.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
                    </div>
                    <Badge className={`border ${getActivityTypeClasses(event.type)}`}>{event.type}</Badge>
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {event.time}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                <TrendingUp className="h-3.5 w-3.5" />
                Hiring Health Metrics
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Core hiring signals</h2>
            </div>

            <div className="space-y-3">
              {platformHealth.map((metric) => (
                <article key={metric.label} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md">
                        <metric.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                        <p className="text-xs text-slate-500">Current team average</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{metric.value}</p>
                      <p className="text-xs font-semibold text-orange-600">{metric.change}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </RecruiterAdminLayout>
  );
}
