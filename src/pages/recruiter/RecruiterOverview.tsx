import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type TeamLabel = "Engineering" | "Product" | "Operations" | "Growth" | "Customer Success";
type PriorityFilter = "all" | "Urgent" | "Steady" | "New";

type RecruiterStat = {
  label: string;
  value: number | string;
  desc: string;
  icon: typeof Briefcase;
};

type ApplicationOpening = {
  id: string;
  role: string;
  team: TeamLabel;
  location: string;
  monthlyApplications: number;
  newThisWeek: number;
  recruiter: string;
  priority: Exclude<PriorityFilter, "all">;
  applicants: string[];
};

type HiringRateItem = {
  id: string;
  role: string;
  team: TeamLabel;
  fillRate: number;
  hired: number;
  interviewing: number;
  avgDays: number;
  openSeats: number;
  priority: Exclude<PriorityFilter, "all">;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return value ? String(value) : "";
};

const asNullableString = (value: unknown): string | null => {
  const str = asString(value).trim();
  return str.length > 0 ? str : null;
};

const toTeamFilter = (profession: string | null | undefined, title: string | null | undefined): TeamLabel => {
  const haystack = `${profession ?? ""} ${title ?? ""}`.toLowerCase();
  if (/(frontend|backend|full[- ]?stack|engineer|developer|devops|software|data|qa|mobile)/.test(haystack)) {
    return "Engineering";
  }
  if (/(product|designer|ux|ui|research)/.test(haystack)) {
    return "Product";
  }
  if (/(growth|marketing|seo|brand|content)/.test(haystack)) {
    return "Growth";
  }
  if (/(customer|support|success|account)/.test(haystack)) {
    return "Customer Success";
  }
  return "Operations";
};

const toPriority = (monthlyApplications: number, newThisWeek: number, createdAt: string | null | undefined): Exclude<PriorityFilter, "all"> => {
  const created = createdAt ? new Date(createdAt) : null;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (created && !Number.isNaN(created.getTime()) && created >= weekAgo && newThisWeek > 0) {
    return "New";
  }

  if (monthlyApplications <= 5) {
    return "Urgent";
  }

  return "Steady";
};

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [stats, setStats] = useState<RecruiterStat[]>([
    { label: "Active Jobs", value: 0, desc: "Roles live across teams", icon: Briefcase },
    { label: "Applications", value: 0, desc: "Candidates this month", icon: Users },
    { label: "Interviews", value: 0, desc: "Upcoming conversations", icon: CalendarDays },
    { label: "Offer Rate", value: "0%", desc: "Shortlist to offer", icon: TrendingUp },
  ]);
  const [applicationOpenings, setApplicationOpenings] = useState<ApplicationOpening[]>([]);
  const [hiringRateItems, setHiringRateItems] = useState<HiringRateItem[]>([]);

  useEffect(() => {
    let ignore = false;

    const loadOverview = async () => {
      setLoadingOverview(true);

      if (!user?.id) {
        if (!ignore) {
          setApplicationOpenings([]);
          setHiringRateItems([]);
          setStats((previous) =>
            previous.map((stat) =>
              stat.label === "Offer Rate" ? { ...stat, value: "0%" } : { ...stat, value: 0 },
            ),
          );
          setLoadingOverview(false);
        }
        return;
      }

      try {
        const { data: membership, error: membershipError } = await supabase
          .from("employer_team_members")
          .select("employer_id, first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipError) {
          throw membershipError;
        }

        const memberRecord = asRecord(membership);
        const employerId = asNullableString(memberRecord.employer_id);
        const recruiterName =
          [asNullableString(memberRecord.first_name), asNullableString(memberRecord.last_name)]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          user.name ||
          "Recruiter";

        if (!employerId) {
          if (!ignore) {
            setApplicationOpenings([]);
            setHiringRateItems([]);
          }
          return;
        }

        const { data: jobRows, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, profession, location, positions_available, status, created_at")
          .eq("employer_id", employerId)
          .order("created_at", { ascending: false });

        if (jobsError) {
          throw jobsError;
        }

        const jobs = (jobRows || []).map((row) => asRecord(row));
        const activeJobs = jobs.filter((job) => asNullableString(job.status) === "published");
        const jobIds = jobs.map((job) => asNullableString(job.id)).filter(Boolean) as string[];

        const { data: appRows, error: appsError } = jobIds.length
          ? await supabase
              .from("applications")
              .select("id, job_id, talent_id, stage, applied_at")
              .in("job_id", jobIds)
          : { data: [], error: null };

        if (appsError) {
          throw appsError;
        }

        const applications = (appRows || []).map((row) => asRecord(row));
        const applicationIds = applications.map((app) => asNullableString(app.id)).filter(Boolean) as string[];
        const talentIds = Array.from(
          new Set(applications.map((app) => asNullableString(app.talent_id)).filter(Boolean) as string[]),
        );

        const [talentsResult, offersResult, interviewsResult] = await Promise.all([
          talentIds.length ? supabase.from("talents").select("id, full_name").in("id", talentIds) : { data: [], error: null },
          applicationIds.length
            ? supabase
                .from("offers")
                .select("application_id, status, updated_at")
                .in("application_id", applicationIds)
                .order("updated_at", { ascending: false })
            : { data: [], error: null },
          applicationIds.length
            ? supabase.from("interviews").select("application_id, scheduled_date, status").in("application_id", applicationIds)
            : { data: [], error: null },
        ]);

        if (talentsResult.error) {
          throw talentsResult.error;
        }

        const talentNameById = new Map<string, string>(
          (talentsResult.data || [])
            .map((row) => {
              const record = asRecord(row);
              const id = asNullableString(record.id);
              const name = asNullableString(record.full_name);
              if (!id || !name) return null;
              return [id, name] as const;
            })
            .filter(Boolean) as Array<readonly [string, string]>,
        );

        const offerStatusByApplicationId = new Map<string, string>();
        if (!offersResult.error && offersResult.data) {
          for (const row of offersResult.data as unknown[]) {
            const record = asRecord(row);
            const appId = asNullableString(record.application_id);
            const status = asNullableString(record.status);
            if (!appId || !status) continue;
            if (!offerStatusByApplicationId.has(appId)) {
              offerStatusByApplicationId.set(appId, status);
            }
          }
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const toEffectiveStage = (app: Record<string, unknown>) => {
          const appId = asNullableString(app.id);
          const offerStatus = appId ? offerStatusByApplicationId.get(appId) : undefined;
          if (offerStatus === "accepted") return "hired";
          if (offerStatus === "refused" || offerStatus === "rejected") return "rejected-offer";
          return asNullableString(app.stage);
        };

        const applicationsThisMonth = applications.filter((app) => {
          const appliedAt = asNullableString(app.applied_at);
          if (!appliedAt) return false;
          const date = new Date(appliedAt);
          return !Number.isNaN(date.getTime()) && date >= startOfMonth;
        });

        const interviews = (interviewsResult.data || []).map((row) => asRecord(row));
        const upcomingInterviews = interviews.filter((row) => {
          const scheduled = asNullableString(row.scheduled_date);
          const status = asNullableString(row.status)?.toLowerCase();
          if (!scheduled) return false;
          const date = new Date(scheduled);
          if (Number.isNaN(date.getTime()) || date < now) return false;
          return status === "scheduled" || status === "confirmed" || status === "rescheduled";
        });

        const totalOffers = (offersResult.data || []).length;
        const offerRateValue =
          applications.length > 0 ? `${Math.round((totalOffers / applications.length) * 100)}%` : "0%";

        const appsByJobId = new Map<string, Record<string, unknown>[]>(jobIds.map((id) => [id, []]));
        for (const app of applications) {
          const jobId = asNullableString(app.job_id);
          if (!jobId) continue;
          const list = appsByJobId.get(jobId) ?? [];
          list.push(app);
          appsByJobId.set(jobId, list);
        }

        const computedOpenings: ApplicationOpening[] = activeJobs.map((job) => {
          const jobId = asString(job.id);
          const title = asString(job.title) || "Open role";
          const profession = asNullableString(job.profession);
          const location = asString(job.location) || "Remote";
          const createdAt = asNullableString(job.created_at);
          const team = toTeamFilter(profession, title);
          const appsForJob = appsByJobId.get(jobId) ?? [];

          const monthlyApplications = appsForJob.filter((app) => {
            const appliedAt = asNullableString(app.applied_at);
            if (!appliedAt) return false;
            const date = new Date(appliedAt);
            return !Number.isNaN(date.getTime()) && date >= startOfMonth;
          }).length;

          const newThisWeek = appsForJob.filter((app) => {
            const appliedAt = asNullableString(app.applied_at);
            if (!appliedAt) return false;
            const date = new Date(appliedAt);
            return !Number.isNaN(date.getTime()) && date >= weekAgo;
          }).length;

          const priority = toPriority(monthlyApplications, newThisWeek, createdAt);

          const applicants = appsForJob
            .slice()
            .sort((a, b) => {
              const aDate = new Date(asNullableString(a.applied_at) ?? 0).getTime();
              const bDate = new Date(asNullableString(b.applied_at) ?? 0).getTime();
              return bDate - aDate;
            })
            .slice(0, 3)
            .map((app) => talentNameById.get(asString(app.talent_id)) ?? "Candidate");

          return {
            id: jobId,
            role: title,
            team,
            location,
            monthlyApplications,
            newThisWeek,
            recruiter: recruiterName,
            priority,
            applicants,
          };
        });

        const computedHiringRates: HiringRateItem[] = activeJobs.map((job) => {
          const jobId = asString(job.id);
          const title = asString(job.title) || "Open role";
          const profession = asNullableString(job.profession);
          const team = toTeamFilter(profession, title);
          const appsForJob = appsByJobId.get(jobId) ?? [];

          const positionsAvailable = Number(asString(job.positions_available) || "1") || 1;
          const hiredApps = appsForJob.filter((app) => toEffectiveStage(app) === "hired");
          const hired = hiredApps.length;

          const interviewing = appsForJob.filter((app) => {
            const stage = toEffectiveStage(app);
            return stage === "talent-acquisition" || stage === "technical" || stage === "leadership";
          }).length;

          const openSeats = Math.max(positionsAvailable - hired, 0);
          const fillRate = Math.max(0, Math.min(100, Math.round((hired / positionsAvailable) * 100)));

          const avgDays = (() => {
            const durations = hiredApps
              .map((app) => {
                const appliedAt = asNullableString(app.applied_at);
                if (!appliedAt) return null;
                const applied = new Date(appliedAt);
                if (Number.isNaN(applied.getTime())) return null;
                return Math.max(0, Math.round((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)));
              })
              .filter((value): value is number => typeof value === "number");

            if (durations.length === 0) return 0;
            return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
          })();

          const monthlyApplications = appsForJob.filter((app) => {
            const appliedAt = asNullableString(app.applied_at);
            if (!appliedAt) return false;
            const date = new Date(appliedAt);
            return !Number.isNaN(date.getTime()) && date >= startOfMonth;
          }).length;

          const newThisWeek = appsForJob.filter((app) => {
            const appliedAt = asNullableString(app.applied_at);
            if (!appliedAt) return false;
            const date = new Date(appliedAt);
            return !Number.isNaN(date.getTime()) && date >= weekAgo;
          }).length;

          const priority = toPriority(monthlyApplications, newThisWeek, asNullableString(job.created_at));

          return {
            id: jobId,
            role: title,
            team,
            fillRate,
            hired,
            interviewing,
            avgDays,
            openSeats,
            priority,
          };
        });

        if (!ignore) {
          setStats([
            { label: "Active Jobs", value: activeJobs.length, desc: "Roles live across teams", icon: Briefcase },
            { label: "Applications", value: applicationsThisMonth.length, desc: "Candidates this month", icon: Users },
            { label: "Interviews", value: upcomingInterviews.length, desc: "Upcoming conversations", icon: CalendarDays },
            { label: "Offer Rate", value: offerRateValue, desc: "Shortlist to offer", icon: TrendingUp },
          ]);
          setApplicationOpenings(computedOpenings);
          setHiringRateItems(computedHiringRates);
        }
      } catch (error) {
        console.error("Failed to load recruiter overview", error);
        if (!ignore) {
          setApplicationOpenings([]);
          setHiringRateItems([]);
          toast({
            title: "Unable to load overview",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) setLoadingOverview(false);
      }
    };

    void loadOverview();
    return () => {
      ignore = true;
    };
  }, [toast, user?.id, user?.name]);

  const filteredApplicationOpenings = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return applicationOpenings.filter((opening) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        opening.role.toLowerCase().includes(normalizedSearch) ||
        opening.recruiter.toLowerCase().includes(normalizedSearch) ||
        opening.applicants.some((applicant) => applicant.toLowerCase().includes(normalizedSearch));
      const matchesPriority = priorityFilter === "all" || opening.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [applicationOpenings, priorityFilter, searchQuery]);

  const filteredHiringRateItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return hiringRateItems.filter((item) => {
      const matchesSearch = normalizedSearch.length === 0 || item.role.toLowerCase().includes(normalizedSearch);
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [hiringRateItems, priorityFilter, searchQuery]);

  const overviewLabel = loadingOverview
    ? "Loading overview..."
    : filteredApplicationOpenings.length === applicationOpenings.length
      ? `Showing all ${applicationOpenings.length} active openings`
      : `Showing ${filteredApplicationOpenings.length} of ${applicationOpenings.length} active openings`;

  const resetFilters = () => {
    setSearchQuery("");
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
                  onClick={() => navigate("/recruiter/pipeline")}
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

        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
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

