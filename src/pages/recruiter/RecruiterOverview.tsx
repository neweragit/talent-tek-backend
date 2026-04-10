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
  ThumbsDown,
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
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [stats, setStats] = useState<RecruiterStat[]>([
    { label: "Candidates", value: 0, desc: "Applications received", icon: Users },
    { label: "Interviews", value: 0, desc: "Interview records", icon: CalendarDays },
    { label: "Active Jobs", value: 0, desc: "Published roles", icon: Briefcase },
    { label: "Outcomes", value: "0 hired · 0 declined", desc: "Final decisions", icon: Target },
  ]);
  const [hiredCount, setHiredCount] = useState(0);
  const [declinedCount, setDeclinedCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadOverview = async () => {
      setLoadingOverview(true);

      if (!user?.id) {
        if (!ignore) {
          setStats((previous) =>
            previous.map((stat) => {
              if (stat.label === "Outcomes") {
                return { ...stat, value: "0 hired · 0 declined" };
              }
              return { ...stat, value: 0 };
            }),
          );
          setHiredCount(0);
          setDeclinedCount(0);
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

        if (!employerId) return;

        const { data: jobRows, error: jobsError } = await supabase
          .from("jobs")
          .select("id, status")
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
              .select("id, job_id, talent_id, status, stage")
              .in("job_id", jobIds)
          : { data: [], error: null };

        if (appsError) {
          throw appsError;
        }

        const applications = (appRows || []).map((row) => asRecord(row));
        const applicationIds = applications.map((app) => asNullableString(app.id)).filter(Boolean) as string[];

        const [offersResult, interviewsResult] = await Promise.all([
          applicationIds.length
            ? supabase
                .from("offers")
                .select("application_id, status, updated_at")
                .in("application_id", applicationIds)
                .order("updated_at", { ascending: false })
            : { data: [], error: null },
          applicationIds.length
            ? supabase.from("interviews").select("application_id, status").in("application_id", applicationIds)
            : { data: [], error: null },
        ]);

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

        const isHired = (app: Record<string, unknown>) => {
          const appId = asNullableString(app.id);
          const offerStatus = appId ? offerStatusByApplicationId.get(appId) : undefined;
          if (offerStatus === "accepted") return true;
          return asNullableString(app.stage) === "hired";
        };

        const isDeclined = (app: Record<string, unknown>) => {
          const appId = asNullableString(app.id);
          const offerStatus = appId ? offerStatusByApplicationId.get(appId) : undefined;
          if (offerStatus === "refused" || offerStatus === "rejected") return true;
          const status = asNullableString(app.status);
          const stage = asNullableString(app.stage);
          return status === "rejected" || stage === "rejected-offer";
        };

        const hired = applications.filter(isHired).length;
        const declined = applications.filter(isDeclined).length;
        const interviews = (interviewsResult.data || []).length;

        if (!ignore) {
          setHiredCount(hired);
          setDeclinedCount(declined);
          setStats([
            { label: "Candidates", value: applications.length, desc: "Applications received", icon: Users },
            { label: "Interviews", value: interviews, desc: "Interview records", icon: CalendarDays },
            { label: "Active Jobs", value: activeJobs.length, desc: "Published roles", icon: Briefcase },
            { label: "Outcomes", value: `${hired} hired · ${declined} declined`, desc: "Final decisions", icon: Target },
          ]);
        }
      } catch (error) {
        console.error("Failed to load recruiter overview", error);
        if (!ignore) {
          setHiredCount(0);
          setDeclinedCount(0);
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

  const overviewLabel = loadingOverview ? "Loading overview..." : "Recruiter performance snapshot";

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

        <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                <Sparkles className="h-3.5 w-3.5" />
                Hiring Health
              </div>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Team outcomes at a glance</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Track pipeline momentum from applications to interviews and outcomes so every recruiter sees the live status.
              </p>
            </div>
            <Button
              onClick={() => navigate("/recruiter/pipeline")}
              className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
            >
              <ArrowRight className="h-4 w-4" />
              Open Pipeline
            </Button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-3xl border border-orange-100 bg-orange-50/50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-orange-600">Outcome Breakdown</h3>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-orange-500" />Hired</span>
                    <span>{hiredCount}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500"
                      style={{
                        width: `${Math.min(100, Math.round((hiredCount / Math.max(hiredCount + declinedCount, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-orange-500" />Declined</span>
                    <span>{declinedCount}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
                      style={{
                        width: `${Math.min(100, Math.round((declinedCount / Math.max(hiredCount + declinedCount, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-orange-600">Totals</h3>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><Users className="h-4 w-4 text-orange-500" />Candidates</span>
                  <span className="text-lg font-bold text-slate-900">{stats.find((stat) => stat.label === "Candidates")?.value ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><CalendarDays className="h-4 w-4 text-orange-500" />Interviews</span>
                  <span className="text-lg font-bold text-slate-900">{stats.find((stat) => stat.label === "Interviews")?.value ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><Briefcase className="h-4 w-4 text-orange-500" />Active jobs</span>
                  <span className="text-lg font-bold text-slate-900">{stats.find((stat) => stat.label === "Active Jobs")?.value ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </RecruiterLayout>
  );
}

