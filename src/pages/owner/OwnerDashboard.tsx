import { useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
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
    { label: "MRR", value: "$124,300", desc: "Recurring revenue base", trend: "+8.3%", icon: DollarSign },
    { label: "Companies", value: "180", desc: "Paying organizations", trend: "+8.2%", icon: Building2 },
    { label: "New Talents", value: "134", desc: "Joined this month", trend: "+15.3%", icon: Briefcase },
    { label: "Interviewers", value: "175", desc: "Verified interviewers", trend: "+5.7%", icon: UserCog },
  ],
  january: [
    { label: "MRR", value: "$111,900", desc: "Recurring revenue base", trend: "+6.1%", icon: DollarSign },
    { label: "Companies", value: "164", desc: "Paying organizations", trend: "+4.9%", icon: Building2 },
    { label: "New Talents", value: "118", desc: "Joined in January", trend: "+9.8%", icon: Briefcase },
    { label: "Interviewers", value: "161", desc: "Verified interviewers", trend: "+4.2%", icon: UserCog },
  ],
  february: [
    { label: "MRR", value: "$118,600", desc: "Recurring revenue base", trend: "+7.2%", icon: DollarSign },
    { label: "Companies", value: "171", desc: "Paying organizations", trend: "+6.4%", icon: Building2 },
    { label: "New Talents", value: "126", desc: "Joined in February", trend: "+12.4%", icon: Briefcase },
    { label: "Interviewers", value: "169", desc: "Verified interviewers", trend: "+5.1%", icon: UserCog },
  ],
  march: [
    { label: "MRR", value: "$124,300", desc: "Recurring revenue base", trend: "+8.3%", icon: DollarSign },
    { label: "Companies", value: "180", desc: "Paying organizations", trend: "+8.2%", icon: Building2 },
    { label: "New Talents", value: "134", desc: "Joined in March", trend: "+15.3%", icon: Briefcase },
    { label: "Interviewers", value: "175", desc: "Verified interviewers", trend: "+5.7%", icon: UserCog },
  ],
};

const revenueStreams: RevenueStream[] = [
  { id: 1, stream: "Growth Plan", region: "North Africa", accounts: 38, mrr: "$39,200", growth: "+12.1%", status: "Strong" },
  { id: 2, stream: "Enterprise Plan", region: "GCC", accounts: 12, mrr: "$28,900", growth: "+9.4%", status: "Strong" },
  { id: 3, stream: "Professional Plan", region: "West Africa", accounts: 44, mrr: "$21,600", growth: "+7.3%", status: "Healthy" },
  { id: 4, stream: "Starter Plan", region: "East Africa", accounts: 61, mrr: "$16,200", growth: "+5.8%", status: "Healthy" },
  { id: 5, stream: "Interview Credits", region: "Global", accounts: 76, mrr: "$11,700", growth: "+3.2%", status: "Watch" },
  { id: 6, stream: "API Add-ons", region: "Europe", accounts: 18, mrr: "$6,700", growth: "+10.4%", status: "Healthy" },
];

const userDistribution: UserDistribution[] = [
  { id: 1, segment: "Talents", activeUsers: 5120, newUsers: 384, share: 52, retention: "84%", note: "Strong pipeline velocity" },
  { id: 2, segment: "Super Admin Companies", activeUsers: 1820, newUsers: 71, share: 19, retention: "89%", note: "Stable account expansion" },
  { id: 3, segment: "Interviewers", activeUsers: 1460, newUsers: 63, share: 15, retention: "81%", note: "Improving completion quality" },
  { id: 4, segment: "Observers & Stakeholders", activeUsers: 930, newUsers: 42, share: 9, retention: "74%", note: "Needs stronger engagement" },
  { id: 5, segment: "Owners/Admins", activeUsers: 470, newUsers: 18, share: 5, retention: "91%", note: "High product stickiness" },
];

const activityFeed: ActivityItem[] = [
  {
    id: 1,
    title: "Enterprise annual contract renewed",
    detail: "BlueGrid Technologies upgraded to Enterprise + API Add-ons (ARR +$42k)",
    time: "18 min ago",
    type: "Revenue",
  },
  {
    id: 2,
    title: "Weekly talent onboarding peak",
    detail: "93 verified talents completed profile onboarding in the last 24h",
    time: "47 min ago",
    type: "Growth",
  },
  {
    id: 3,
    title: "Payment retry anomaly flagged",
    detail: "8 failed retries in GCC cluster; automated dunning flow is active",
    time: "1h 22m ago",
    type: "Risk",
  },
  {
    id: 4,
    title: "Interviewer quality trend up",
    detail: "Pass-through calibration rose from 72% to 79% week over week",
    time: "2h 05m ago",
    type: "Growth",
  },
  {
    id: 5,
    title: "Large invoice settled",
    detail: "Nexa Logistics settled invoice #TK-03411 ($9,800)",
    time: "3h 10m ago",
    type: "Revenue",
  },
];

const platformHealth = [
  { label: "Platform uptime", value: "99.95%", change: "+0.12%", icon: ShieldCheck },
  { label: "Avg API latency", value: "186 ms", change: "-14 ms", icon: Cpu },
  { label: "Interview completion", value: "83.4%", change: "+2.8%", icon: CheckCircle2 },
  { label: "Support first response", value: "6m 40s", change: "-1m 08s", icon: Clock3 },
  { label: "Revenue run rate", value: "$1.49M", change: "+9.6%", icon: Banknote },
];

const getStatusClasses = (status: RevenueStream["status"]) => {
  if (status === "Strong") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Healthy") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
};

const getActivityTypeClasses = (type: ActivityItem["type"]) => {
  if (type === "Revenue") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (type === "Growth") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
};

export default function OwnerDashboard() {
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>("all");

  const stats = useMemo(() => statsByMonth[selectedMonth], [selectedMonth]);

  return (
    <OwnerLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Owner Overview
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                TalenTek Global Control Center
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Review revenue momentum, user distribution, and live platform movement in one realistic command dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                  Live snapshot updated every 15 minutes
                </div>
                <Button className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-lg hover:from-orange-700 hover:to-orange-600">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Snapshot
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</div>
                  <p className="mt-1 text-sm text-slate-600">{stat.desc}</p>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
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
            Showing {selectedMonth === "all" ? "all-time consolidated" : `${selectedMonth} 2026`} owner metrics.
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
              className="rounded-full border-orange-600 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 hover:text-white"
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
                  Revenue Stream List
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Monthly revenue by stream</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Replace chart placeholders with real pipeline data across plan tiers, regions, and account counts.
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
                      <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-emerald-600">
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
                  User Distribution List
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Active user composition</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Segment-level distribution with retention and month-over-month intake replacing static visuals.
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
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500" style={{ width: `${segment.share}%` }} />
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
                      <p className="mt-1 text-lg font-bold text-emerald-600">{segment.retention}</p>
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
                  Live Activity
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Platform activity feed</h2>
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
                Health Metrics
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Core platform signals</h2>
            </div>

            <div className="space-y-3">
              {platformHealth.map((metric) => (
                <article key={metric.label} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                        <metric.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                        <p className="text-xs text-slate-500">Cross-region average</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{metric.value}</p>
                      <p className="text-xs font-semibold text-emerald-600">{metric.change}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </OwnerLayout>
  );
}
