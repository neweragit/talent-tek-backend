import { useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Globe2,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";

type RangeKey = "30d" | "90d" | "180d" | "365d";

type HeadlineStat = {
  label: string;
  value: string;
  desc: string;
  trend: string;
  icon: typeof DollarSign;
};

type FunnelStage = {
  stage: string;
  value: number;
  rate: string;
  note: string;
};

type RegionMetric = {
  id: number;
  region: string;
  revenue: string;
  companies: number;
  talentShare: number;
  activation: string;
  growth: string;
  status: "Leading" | "Scaling" | "Watch";
};

type SegmentMetric = {
  id: number;
  segment: string;
  share: number;
  change: string;
  active: string;
  efficiency: string;
};

type BenchmarkMetric = {
  label: string;
  value: string;
  change: string;
  icon: typeof ShieldCheck;
};

const statsByRange: Record<RangeKey, HeadlineStat[]> = {
  "30d": [
    { label: "Revenue Run Rate", value: "$148,200", desc: "Projected annualized billing", trend: "+9.8%", icon: DollarSign },
    { label: "Active Companies", value: "186", desc: "Paying organizations this month", trend: "+8.1%", icon: Building2 },
    { label: "Verified Talents", value: "5,482", desc: "Profiles available for matching", trend: "+12.6%", icon: Briefcase },
    { label: "Interview Throughput", value: "1,924", desc: "Completed interviews in 30 days", trend: "+6.4%", icon: UserCog },
  ],
  "90d": [
    { label: "Revenue Run Rate", value: "$139,400", desc: "Projected annualized billing", trend: "+7.2%", icon: DollarSign },
    { label: "Active Companies", value: "174", desc: "Paying organizations in quarter", trend: "+6.7%", icon: Building2 },
    { label: "Verified Talents", value: "5,031", desc: "Profiles available for matching", trend: "+10.2%", icon: Briefcase },
    { label: "Interview Throughput", value: "5,318", desc: "Completed interviews in quarter", trend: "+5.9%", icon: UserCog },
  ],
  "180d": [
    { label: "Revenue Run Rate", value: "$128,900", desc: "Projected annualized billing", trend: "+6.1%", icon: DollarSign },
    { label: "Active Companies", value: "162", desc: "Paying organizations in half-year", trend: "+5.3%", icon: Building2 },
    { label: "Verified Talents", value: "4,688", desc: "Profiles available for matching", trend: "+8.8%", icon: Briefcase },
    { label: "Interview Throughput", value: "9,764", desc: "Completed interviews in half-year", trend: "+4.7%", icon: UserCog },
  ],
  "365d": [
    { label: "Revenue Run Rate", value: "$121,600", desc: "Projected annualized billing", trend: "+11.4%", icon: DollarSign },
    { label: "Active Companies", value: "149", desc: "Paying organizations in year", trend: "+14.8%", icon: Building2 },
    { label: "Verified Talents", value: "4,102", desc: "Profiles available for matching", trend: "+18.1%", icon: Briefcase },
    { label: "Interview Throughput", value: "17,430", desc: "Completed interviews in year", trend: "+13.7%", icon: UserCog },
  ],
};

const funnelStages: FunnelStage[] = [
  { stage: "Visitors", value: 48210, rate: "100%", note: "Top-of-funnel product traffic" },
  { stage: "Signups", value: 12340, rate: "25.6%", note: "Visitor to account conversion" },
  { stage: "Verified Profiles", value: 6840, rate: "55.4%", note: "Profiles reaching platform-ready quality" },
  { stage: "Qualified Interviews", value: 2148, rate: "31.4%", note: "Profiles progressing into assessment" },
  { stage: "Placements", value: 412, rate: "19.2%", note: "Interview-to-hire conversion" },
];

const regionalMetrics: RegionMetric[] = [
  { id: 1, region: "North Africa", revenue: "$42,600", companies: 58, talentShare: 34, activation: "87%", growth: "+11.8%", status: "Leading" },
  { id: 2, region: "West Africa", revenue: "$27,400", companies: 41, talentShare: 23, activation: "82%", growth: "+8.6%", status: "Scaling" },
  { id: 3, region: "GCC", revenue: "$36,900", companies: 29, talentShare: 16, activation: "91%", growth: "+13.1%", status: "Leading" },
  { id: 4, region: "East Africa", revenue: "$19,800", companies: 33, talentShare: 17, activation: "78%", growth: "+6.2%", status: "Scaling" },
  { id: 5, region: "Europe", revenue: "$12,300", companies: 14, talentShare: 10, activation: "69%", growth: "+2.7%", status: "Watch" },
];

const segmentMetrics: SegmentMetric[] = [
  { id: 1, segment: "Enterprise recruiters", share: 28, change: "+6.4%", active: "52 accounts", efficiency: "Highest ARR per logo" },
  { id: 2, segment: "Growth-stage companies", share: 35, change: "+8.9%", active: "84 accounts", efficiency: "Fastest monthly expansion" },
  { id: 3, segment: "Independent talents", share: 24, change: "+10.2%", active: "3,920 profiles", efficiency: "Strongest onboarding velocity" },
  { id: 4, segment: "Interview partners", share: 13, change: "+4.1%", active: "176 experts", efficiency: "Stable completion quality" },
];

const benchmarkMetrics: BenchmarkMetric[] = [
  { label: "Profile approval SLA", value: "4h 18m", change: "-42m", icon: ShieldCheck },
  { label: "Median time to shortlist", value: "2.8 days", change: "-0.4d", icon: Clock3 },
  { label: "Placement success rate", value: "19.2%", change: "+1.8%", icon: BadgeCheck },
  { label: "Employer renewal rate", value: "91%", change: "+3.7%", icon: CalendarDays },
  { label: "Search-to-interview rate", value: "14.6%", change: "+0.9%", icon: ScanSearch },
  { label: "Platform NPS proxy", value: "62", change: "+5", icon: Target },
];

const monthlyTrend = [
  { month: "Oct", revenue: 62, talent: 48, companies: 34 },
  { month: "Nov", revenue: 68, talent: 56, companies: 39 },
  { month: "Dec", revenue: 73, talent: 61, companies: 44 },
  { month: "Jan", revenue: 79, talent: 67, companies: 51 },
  { month: "Feb", revenue: 85, talent: 74, companies: 57 },
  { month: "Mar", revenue: 92, talent: 81, companies: 63 },
];

const getRegionStatusClasses = (status: RegionMetric["status"]) => {
  if (status === "Leading") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Scaling") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
};

const getRangeLabel = (range: RangeKey) => {
  if (range === "30d") return "Last 30 days";
  if (range === "90d") return "Last 90 days";
  if (range === "180d") return "Last 6 months";
  return "Last 12 months";
};

export default function OwnerStatistics() {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("180d");

  const headlineStats = useMemo(() => statsByRange[selectedRange], [selectedRange]);

  return (
    <OwnerLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Owner Analytics
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Statistics Command Center
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Monitor revenue quality, marketplace conversion, regional expansion, and operating benchmarks from one richer owner dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                  Snapshot window: {getRangeLabel(selectedRange)}
                </div>
                <Button className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-lg hover:from-orange-700 hover:to-orange-600">
                  <TrendingUp className="h-4 w-4" />
                  Refresh Analytics
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {headlineStats.map((stat) => (
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
            Showing marketplace performance for {getRangeLabel(selectedRange).toLowerCase()} across revenue, conversion, adoption, and operations.
          </div>
          <div className="flex flex-nowrap gap-3">
            <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as RangeKey)}>
              <SelectTrigger className="h-12 w-52 rounded-full border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="180d">Last 6 months</SelectItem>
                <SelectItem value="365d">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedRange("180d")}
              className="rounded-full border-orange-600 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 hover:text-white"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Conversion Funnel
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Marketplace flow from visit to placement</h2>
              </div>
              <Badge className="border border-orange-200 bg-orange-50 text-orange-700">Live blended conversion</Badge>
            </div>

            <div className="space-y-4">
              {funnelStages.map((stage) => (
                <div key={stage.stage} className="rounded-3xl border border-orange-100 bg-orange-50/35 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{stage.stage}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{stage.value.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600">{stage.rate}</p>
                      <p className="text-xs text-slate-500">step conversion</p>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500" style={{ width: stage.rate }} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{stage.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                <TrendingUp className="h-3.5 w-3.5" />
                Monthly Trend
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Revenue, talent, and company momentum</h2>
            </div>

            <div className="space-y-4">
              {monthlyTrend.map((item) => (
                <div key={item.month} className="rounded-3xl border border-orange-100 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{item.month}</p>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Progressive growth
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-slate-600">
                        <span>Revenue index</span>
                        <span className="font-semibold text-slate-900">{item.revenue}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-orange-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500" style={{ width: `${item.revenue}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-slate-600">
                        <span>Talent activation</span>
                        <span className="font-semibold text-slate-900">{item.talent}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-orange-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${item.talent}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-slate-600">
                        <span>Company acquisition</span>
                        <span className="font-semibold text-slate-900">{item.companies}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-orange-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600" style={{ width: `${item.companies}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                  <Globe2 className="h-3.5 w-3.5" />
                  Regional Performance
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Expansion quality by market</h2>
              </div>
              <Badge className="border border-orange-200 bg-orange-50 text-orange-700">5 regions tracked</Badge>
            </div>

            <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
              {regionalMetrics.map((region) => (
                <article key={region.id} className="rounded-3xl border border-orange-100 p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{region.region}</h3>
                      <p className="mt-1 text-sm text-slate-600">{region.companies} active companies contributing to regional demand</p>
                    </div>
                    <Badge className={getRegionStatusClasses(region.status)}>{region.status}</Badge>
                  </div>

                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Revenue</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{region.revenue}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Growth</p>
                      <p className="mt-1 text-lg font-bold text-emerald-600">{region.growth}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Talent share</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{region.talentShare}%</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Activation</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{region.activation}</p>
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
                  Segment Mix
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Who is driving platform value</h2>
              </div>
              <Badge className="border border-orange-200 bg-orange-50 text-orange-700">Weighted by active usage</Badge>
            </div>

            <div className="space-y-4">
              {segmentMetrics.map((segment) => (
                <div key={segment.id} className="rounded-3xl border border-orange-100 bg-orange-50/30 p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{segment.segment}</h3>
                      <p className="mt-1 text-sm text-slate-600">{segment.active}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">{segment.share}%</p>
                      <p className="text-xs font-semibold text-emerald-600">{segment.change}</p>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500" style={{ width: `${segment.share}%` }} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{segment.efficiency}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Operational Benchmarks
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Execution quality across the marketplace</h2>
            </div>
            <Badge className="border border-orange-200 bg-orange-50 text-orange-700">Owner-level KPIs</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {benchmarkMetrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-orange-100 bg-orange-50/30 p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                  <metric.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
                <div className="mt-2 text-3xl font-bold text-slate-900">{metric.value}</div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {metric.change}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </OwnerLayout>
  );
}
