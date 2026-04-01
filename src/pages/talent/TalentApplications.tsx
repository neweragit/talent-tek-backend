import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TalentLayout from "@/components/layouts/TalentLayout";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { type ApplicationStatus } from "@/lib/talentApplications";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  Search,
  XCircle,
} from "lucide-react";

const statusOptions: Array<{ value: "all" | ApplicationStatus; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "interview", label: "Interview Scheduled" },
  { value: "in-progress", label: "In Progress" },
  { value: "rejected", label: "Updates" },
];

const getCompanyInitials = (company: string) => {
  const words = company
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "TT";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const getStatusMeta = (status: ApplicationStatus) => {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: Clock3,
      };
    case "interview":
      return {
        label: "Interview Scheduled",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: CalendarDays,
      };
    case "in-progress":
      return {
        label: "In Progress",
        badgeClassName: "border border-orange-200 bg-orange-100 text-orange-700",
        icon: Clock3,
      };
    case "rejected":
      return {
        label: "Update",
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
        icon: XCircle,
      };
    default:
      return {
        label: "Application",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: Briefcase,
      };
  }
};

const normalizeStatus = (status: string): ApplicationStatus => {
  const lower = status?.toLowerCase?.() ?? "";
  if (lower === "interview" || lower === "in-progress" || lower === "rejected" || lower === "pending") {
    return lower as ApplicationStatus;
  }
  return "pending";
};

const formatDate = (dateValue: string | null | undefined) => {
  if (!dateValue) return "Unknown";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const getApplicationSummary = (application: { company: string; status: ApplicationStatus; cvName?: string }) => {
  switch (application.status) {
    case "interview":
      return `Your application with ${application.company} is already moving forward. Keep your CV and interview story sharp for the next conversation.`;
    case "in-progress":
      return `Your candidacy is still under active review at ${application.company}. Stay ready in case the hiring team reaches out quickly.`;
    case "rejected":
      return `Thanks for applying to ${application.company}. This role won’t move forward for now — good luck on the next one.`;
    default:
      return application.cvName
        ? `Your direct candidacy is on file and ready for review by ${application.company}.`
        : `Your profile submission has been shared with ${application.company}.`;
  }
};

const getApplicationFooter = (status: ApplicationStatus) => {
  switch (status) {
    case "interview":
      return "Review the job again and prepare for interview follow-up with a clear story about your recent work.";
    case "in-progress":
      return "Keep this role warm by reviewing the job page and preparing for the next step if the hiring team reaches out.";
    case "rejected":
      return "Keep applying to similar roles — each application improves your signal and your next match.";
    default:
      return "Keep your documents polished so you can move fast if the employer responds.";
  }
};

type TalentAppCard = {
  id: string;
  company: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedDate: string;
  jobId?: string;
  contact?: string;
  workplace?: string;
  companyLogoUrl?: string;
  cvName?: string;
};

const TalentApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [applications, setApplications] = useState<TalentAppCard[]>([]);
  const [loading, setLoading] = useState(true);
  const submittedApplicationId =
    typeof location.state === "object" && location.state && "submittedApplicationId" in location.state
      ? String(location.state.submittedApplicationId)
      : null;

  const isFiltering = statusFilter !== "all" || searchQuery.trim() !== "";

  const filteredApplications = useMemo(() => {
    if (!isFiltering) {
      return applications;
    }

    const normalizedSearch = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = statusFilter === "all" || application.status === statusFilter;
      const matchesSearch =
        normalizedSearch === "" ||
        application.company.toLowerCase().includes(normalizedSearch) ||
        application.jobTitle.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [applications, isFiltering, searchQuery, statusFilter]);

  const applicationStats = useMemo(() => {
    const interviewCount = applications.filter((application) => application.status === "interview").length;
    const inProgressCount = applications.filter((application) => application.status === "in-progress").length;
    const closedCount = applications.filter((application) => application.status === "rejected").length;

    return [
      {
        label: "Total Applications",
        value: applications.length,
        detail: "Roles currently tracked",
        icon: Briefcase,
      },
      {
        label: "In Progress",
        value: inProgressCount,
        detail: "Under active review",
        icon: Clock3,
      },
      {
        label: "Interviews",
        value: interviewCount,
        detail: "Next-step conversations",
        icon: CheckCircle2,
      },
      {
        label: "Updates",
        value: closedCount,
        detail: "Application updates",
        icon: XCircle,
      },
    ];
  }, [applications]);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);

      if (!user) {
        setApplications([]);
        setLoading(false);
        return;
      }

      try {
        const { data: talent, error: talentError } = await supabase
          .from('talents')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (talentError) {
          throw talentError;
        }

        if (!talent?.id) {
          setApplications([]);
          setLoading(false);
          return;
        }

        const { data: records, error: appError } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            applied_at,
            job_id,
            jobs (
              id,
              title,
              workplace,
              employer_id,
              employers (company_name, logo_url)
            )
          `)
          .eq('talent_id', talent.id)
          .order('applied_at', { ascending: false });

        if (appError) {
          throw appError;
        }

        const mapped = (records || []).map((record: any) => ({
          id: record.id,
          company: record.jobs?.employers?.company_name || record.jobs?.title || 'Unknown Company',
          jobTitle: record.jobs?.title || 'Unknown Role',
          workplace: record.jobs?.workplace || 'Not specified',
          status: normalizeStatus(record.status),
          appliedDate: formatDate(record.applied_at),
          jobId: record.job_id,
          contact: record.jobs?.employers?.company_name || 'N/A',
          companyLogoUrl: record.jobs?.employers?.logo_url || '',
          cvName: '',
        }));

        setApplications(mapped);
      } catch (error) {
        console.error('Failed to load applications', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [user]);

  const resultsLabel =
    filteredApplications.length === applications.length
      ? `Showing all ${applications.length} applications`
      : `Showing ${filteredApplications.length} of ${applications.length} applications`;

  return (
    <TalentLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Application Pipeline
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                My Applications
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Review where each candidacy stands, keep an eye on active conversations, and jump back into any role with the same bold talent identity used across your dashboard.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {applicationStats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</div>
                  <p className="mt-1 text-sm text-slate-600">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
              <Input
                placeholder="Search by company or job title..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-12 h-12 rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | ApplicationStatus)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-orange-700">Loading applications...</div>
        ) : filteredApplications.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredApplications.map((application) => {
              const statusMeta = getStatusMeta(application.status);
              const StatusIcon = statusMeta.icon;
              const isNewSubmission = submittedApplicationId === application.id;

              return (
                <article
                  key={application.id}
                  className={`group relative overflow-hidden rounded-3xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                    isNewSubmission
                      ? "border-orange-300 shadow-2xl shadow-orange-200/50"
                      : "border-orange-100 shadow-lg"
                  }`}
                >
                  {isNewSubmission ? (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500" />
                  ) : null}

                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-lg">
                        {application.companyLogoUrl ? (
                          <img
                            src={application.companyLogoUrl}
                            alt={`${application.company} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white">
                            {getCompanyInitials(application.company)}
                          </div>
                        )}
                      </div>
                      <div>
                        {isNewSubmission ? (
                          <div className="mb-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                            New Submission
                          </div>
                        ) : null}
                        <h2 className="text-xl font-bold leading-tight text-slate-900">{application.jobTitle}</h2>
                        <p className="mt-1 text-sm font-semibold text-orange-600">{application.company}</p>
                        <p className="mt-1 text-xs text-gray-500">Applied {application.appliedDate}</p>
                      </div>
                    </div>

                    <Badge className={statusMeta.badgeClassName}>{statusMeta.label}</Badge>
                  </div>

                  <p className="mb-5 text-sm leading-6 text-gray-600">{getApplicationSummary(application)}</p>

                  <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Applied</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{application.appliedDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Company</p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-900">{application.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Stage</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{statusMeta.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Workplace</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{application.workplace || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>



                  <div className="flex flex-col gap-4 border-t border-orange-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-sm leading-6 text-slate-600">
                      {getApplicationFooter(application.status)}
                    </p>
                    <Button
                      type="button"
                      onClick={() => application.jobId && navigate(`/talent/job/${application.jobId}`)}
                      className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Job
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No applications yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              You haven’t applied to any jobs yet. Browse jobs and apply to start tracking your applications here.
            </p>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No applications match these filters</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Try a different company name, job title, or status filter. Your applications will appear here again as soon as the search matches them.
            </p>
          </div>
        )}
      </div>
    </TalentLayout>
  );
};

export default TalentApplications;
