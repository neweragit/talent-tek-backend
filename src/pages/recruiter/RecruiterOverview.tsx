import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

type TeamFilter = "all" | "Engineering" | "Product" | "Operations" | "Growth" | "Customer Success";
type PriorityFilter = "all" | "Urgent" | "Steady" | "New";

type RecruiterStat = {
  label: string;
  value: number | string;
  desc: string;
  icon: typeof Briefcase;
};

type ApplicationOpening = {
  id: number;
  role: string;
  team: Exclude<TeamFilter, "all">;
  location: string;
  monthlyApplications: number;
  newThisWeek: number;
  recruiter: string;
  priority: Exclude<PriorityFilter, "all">;
  applicants: string[];
};

type HiringRateItem = {
  id: number;
  role: string;
  team: Exclude<TeamFilter, "all">;
  fillRate: number;
  hired: number;
  interviewing: number;
  avgDays: number;
  openSeats: number;
  priority: Exclude<PriorityFilter, "all">;
};

const stats: RecruiterStat[] = [
  { label: "Active Jobs", value: 18, desc: "Roles live across teams", icon: Briefcase },
  { label: "Applications", value: 284, desc: "Candidates this month", icon: Users },
  { label: "Interviews", value: 41, desc: "Upcoming conversations", icon: CalendarDays },
  { label: "Offer Rate", value: "24%", desc: "Shortlist to offer", icon: TrendingUp },
];

const applicationOpenings: ApplicationOpening[] = [
  {
    id: 1,
    role: "Senior Frontend Engineer",
    team: "Engineering",
    location: "Remote, Africa",
    monthlyApplications: 54,
    newThisWeek: 12,
    recruiter: "Nadia",
    priority: "Urgent",
    applicants: ["Sarah Kim", "Daniel James", "Rita Mensah"],
  },
  {
    id: 2,
    role: "Product Designer",
    team: "Product",
    location: "Lagos, Nigeria",
    monthlyApplications: 38,
    newThisWeek: 7,
    recruiter: "Ibrahim",
    priority: "Steady",
    applicants: ["Maya Cole", "Omar Ali", "Jane Okafor"],
  },
  {
    id: 3,
    role: "Talent Operations Analyst",
    team: "Operations",
    location: "Hybrid, Nairobi",
    monthlyApplications: 46,
    newThisWeek: 9,
    recruiter: "Samira",
    priority: "New",
    applicants: ["Amina Yusuf", "Chris Doe", "Leila Noor"],
  },
  {
    id: 4,
    role: "Growth Marketing Lead",
    team: "Growth",
    location: "Remote, EMEA",
    monthlyApplications: 27,
    newThisWeek: 5,
    recruiter: "Nadia",
    priority: "Steady",
    applicants: ["Tina West", "Joseph Reed", "Abel Grant"],
  },
  {
    id: 5,
    role: "Customer Success Manager",
    team: "Customer Success",
    location: "Accra, Ghana",
    monthlyApplications: 33,
    newThisWeek: 6,
    recruiter: "Ibrahim",
    priority: "Urgent",
    applicants: ["Martha Bell", "Idris Kane", "Yasmin Noor"],
  },
  {
    id: 6,
    role: "Backend Engineer",
    team: "Engineering",
    location: "Kigali, Rwanda",
    monthlyApplications: 49,
    newThisWeek: 11,
    recruiter: "Samira",
    priority: "Urgent",
    applicants: ["David Hall", "Joy Adebayo", "Kelvin Obi"],
  },
];

const hiringRateItems: HiringRateItem[] = [
  {
    id: 1,
    role: "Senior Frontend Engineer",
    team: "Engineering",
    fillRate: 82,
    hired: 3,
    interviewing: 5,
    avgDays: 18,
    openSeats: 1,
    priority: "Urgent",
  },
  {
    id: 2,
    role: "Product Designer",
    team: "Product",
    fillRate: 67,
    hired: 2,
    interviewing: 4,
    avgDays: 22,
    openSeats: 1,
    priority: "Steady",
  },
  {
    id: 3,
    role: "Talent Operations Analyst",
    team: "Operations",
    fillRate: 74,
    hired: 2,
    interviewing: 3,
    avgDays: 15,
    openSeats: 2,
    priority: "New",
  },
  {
    id: 4,
    role: "Growth Marketing Lead",
    team: "Growth",
    fillRate: 58,
    hired: 1,
    interviewing: 4,
    avgDays: 27,
    openSeats: 1,
    priority: "Steady",
  },
  {
    id: 5,
    role: "Customer Success Manager",
    team: "Customer Success",
    fillRate: 79,
    hired: 2,
    interviewing: 2,
    avgDays: 14,
    openSeats: 1,
    priority: "Urgent",
  },
  {
    id: 6,
    role: "Backend Engineer",
    team: "Engineering",
    fillRate: 71,
    hired: 2,
    interviewing: 6,
    avgDays: 20,
    openSeats: 2,
    priority: "Urgent",
  },
];

const getPriorityClasses = (priority: PriorityFilter) => {
  switch (priority) {
    case "Urgent":
      return "border border-orange-200 bg-orange-50 text-orange-700";
    case "New":
      return "border border-orange-200 bg-white text-orange-700";
    default:
      return "border border-orange-200 bg-orange-100 text-orange-700";
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((segment) => segment[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function EmployerOverview() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const filteredApplicationOpenings = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return applicationOpenings.filter((opening) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        opening.role.toLowerCase().includes(normalizedSearch) ||
        opening.recruiter.toLowerCase().includes(normalizedSearch) ||
        opening.applicants.some((applicant) => applicant.toLowerCase().includes(normalizedSearch));
      const matchesTeam = teamFilter === "all" || opening.team === teamFilter;
      const matchesPriority = priorityFilter === "all" || opening.priority === priorityFilter;

      return matchesSearch && matchesTeam && matchesPriority;
    });
  }, [priorityFilter, searchQuery, teamFilter]);

  const filteredHiringRateItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return hiringRateItems.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0 || item.role.toLowerCase().includes(normalizedSearch);
      const matchesTeam = teamFilter === "all" || item.team === teamFilter;
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;

      return matchesSearch && matchesTeam && matchesPriority;
    });
  }, [priorityFilter, searchQuery, teamFilter]);

  const overviewLabel =
    filteredApplicationOpenings.length === applicationOpenings.length
      ? `Showing all ${applicationOpenings.length} active openings`
      : `Showing ${filteredApplicationOpenings.length} of ${applicationOpenings.length} active openings`;

  const resetFilters = () => {
    setSearchQuery("");
    setTeamFilter("all");
    setPriorityFilter("all");
  };

  return (
    <RecruiterLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Recruiter Overview
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Build your pipeline at a glance
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Track open roles, candidate momentum, and hiring performance with the same polished dashboard identity used across the talent overview.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                  {overviewLabel}
                </div>
                <Button
                  onClick={() => navigate("/super-admin-company/pipeline")}
                  className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
                >
                  <ArrowRight className="h-4 w-4" />
                  Review Pipeline
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
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search roles, recruiters, or candidates..."
                className="h-12 rounded-2xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={teamFilter} onValueChange={(value) => setTeamFilter(value as TeamFilter)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
              <SelectItem value="Customer Success">Customer Success</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="Steady">Steady</SelectItem>
              <SelectItem value="New">New</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold text-slate-700">
            Focus on priority openings, latest applicants, and positions most likely to close this sprint.
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="whitespace-nowrap rounded-full border-orange-600 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset Filters
            </span>
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                  <Users className="h-3.5 w-3.5" />
                  Applications per Month
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Openings with the highest inbound flow</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Scroll through active roles, see who is applying, and quickly spot which recruiters are carrying the most volume.
                </p>
              </div>
              <div className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
                {filteredApplicationOpenings.length} roles
              </div>
            </div>

            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
              {filteredApplicationOpenings.map((opening) => (
                <article key={opening.id} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{opening.role}</h3>
                        <Badge className={getPriorityClasses(opening.priority)}>{opening.priority}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-orange-500" />{opening.team}</span>
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-orange-500" />{opening.location}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{opening.monthlyApplications}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Applications</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">New this week</p>
                      <p className="mt-1 text-lg font-bold text-orange-600">+{opening.newThisWeek}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recruiter owner</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{opening.recruiter}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-orange-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recent applicants</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {opening.applicants.map((applicant) => (
                        <div key={applicant} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-xs font-bold text-white">
                            {getInitials(applicant)}
                          </span>
                          {applicant}
                        </div>
                      ))}
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
                  <Target className="h-3.5 w-3.5" />
                  Hiring Rate per Position
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Positions closest to conversion</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Track fill rate, active interviews, and average closing speed in one scrollable list so high-conversion roles stay visible.
                </p>
              </div>
              <div className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
                {filteredHiringRateItems.length} positions
              </div>
            </div>

            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
              {filteredHiringRateItems.map((item) => (
                <article key={item.id} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{item.role}</h3>
                        <Badge className={getPriorityClasses(item.priority)}>{item.priority}</Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-600">{item.team}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{item.fillRate}%</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Fill rate</p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500" style={{ width: `${item.fillRate}%` }} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Hired</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-slate-900"><CheckCircle2 className="h-4 w-4 text-orange-500" />{item.hired}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Interviewing</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-slate-900"><Users className="h-4 w-4 text-orange-500" />{item.interviewing}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Avg. time</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-slate-900"><Clock3 className="h-4 w-4 text-orange-500" />{item.avgDays} days</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Open seats</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-slate-900"><Briefcase className="h-4 w-4 text-orange-500" />{item.openSeats}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </RecruiterLayout>
  );
}

