import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
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
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Link,
  Mail,
  MapPin,
  Search,
  Users,
  XCircle,
  ExternalLink,
} from "lucide-react";

type ApplicationStatus = "pending" | "in-progress" | "rejected" | "maybe" | "archived";
type ApplicationStage = "to-contact" | "talent-acquisition" | "technical" | "leadership" | "offer" | "rejected-offer" | "hired" | null;

const statusOptions: Array<{ value: "all" | ApplicationStatus; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "rejected", label: "Rejected" },
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
    case "in-progress":
      return {
        label: "In Progress",
        badgeClassName: "border border-orange-200 bg-orange-100 text-orange-700",
        icon: Clock3,
      };
    case "rejected":
      return {
        label: "Rejected",
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
        icon: XCircle,
      };
    case "maybe":
      return {
        label: "Maybe",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: CheckCircle2,
      };
    case "archived":
      return {
        label: "Archived",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: Briefcase,
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
  if (lower === "in-progress" || lower === "rejected" || lower === "pending" || lower === "maybe" || lower === "archived") {
    return lower as ApplicationStatus;
  }
  return "pending";
};

const normalizeStage = (stage: string | null | undefined): ApplicationStage => {
  const lower = stage?.toLowerCase?.() ?? "";
  if (
    lower === "to-contact" ||
    lower === "talent-acquisition" ||
    lower === "technical" ||
    lower === "leadership" ||
    lower === "offer" ||
    lower === "rejected-offer" ||
    lower === "hired"
  ) {
    return lower as ApplicationStage;
  }
  return null;
};

const formatStageLabel = (stage: ApplicationStage) => {
  switch (stage) {
    case "to-contact":
      return "To Contact";
    case "talent-acquisition":
      return "Talent Acquisition";
    case "technical":
      return "Technical";
    case "leadership":
      return "Leadership";
    case "offer":
      return "Offer";
    case "rejected-offer":
      return "Rejected Offer";
    case "hired":
      return "Hired";
    default:
      return "";
  }
};

const getFriendlyApplicationStatus = (status: ApplicationStatus, stage: ApplicationStage) => {
  if (status === "rejected") return "Rejected";
  if (status === "pending" || (status === "in-progress" && !stage)) return "Pending Review";
  if (status === "maybe") return "In Consideration";
  if (status === "archived") return "Archived";

  if (status === "in-progress") {
    switch (stage) {
      case "to-contact": return "Under Review";
      case "talent-acquisition": return "TA Interview";
      case "technical": return "Technical Interview";
      case "leadership": return "Leadership Interview";
      case "offer": return "Offer Extended";
      case "rejected-offer": return "Offer Declined";
      case "hired": return "Hired";
      default: return "In Progress";
    }
  }
  return "Application";
};

const formatDate = (dateValue: string | null | undefined) => {
  if (!dateValue) return "Unknown";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatPostedAgo = (dateValue: string | null | undefined) => {
  if (!dateValue) return "Posted recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Posted recently";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays <= 0) return "Posted today";
  if (diffDays === 1) return "Posted 1 day ago";
  return `Posted ${diffDays} days ago`;
};

const normalizeTextArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const raw = trimmed.startsWith("{") && trimmed.endsWith("}") ? trimmed.slice(1, -1) : trimmed;
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getApplicationSummary = (application: { company: string; status: ApplicationStatus; cvName?: string }) => {
  switch (application.status) {
    case "in-progress":
      return `Your candidacy is still under active review at ${application.company}. Stay ready in case the hiring team reaches out quickly.`;
    case "rejected":
      return `Thanks for applying to ${application.company}. This role won’t move forward for now — good luck on the next one.`;
    case "maybe":
      return `Your profile is in consideration at ${application.company}. Keep your resume and availability updated.`;
    case "archived":
      return `This application at ${application.company} is archived for now.`;
    default:
      return application.cvName
        ? `Your direct candidacy is on file and ready for review by ${application.company}.`
        : `Your profile submission has been shared with ${application.company}.`;
  }
};

const getApplicationFooter = (status: ApplicationStatus) => {
  switch (status) {
    case "in-progress":
      return "Keep this role warm by reviewing the job page and preparing for the next step if the hiring team reaches out.";
    case "rejected":
      return "Keep applying to similar roles — each application improves your signal and your next match.";
    case "maybe":
      return "Stay responsive and keep your profile sharp while the team decides on next steps.";
    case "archived":
      return "Archive keeps this application in your history while you focus on newer opportunities.";
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
  location?: string;
  industry?: string;
  employmentType?: string;
  contractType?: string;
  experienceLevel?: string;
  jobLevel?: string;
  description?: string;
  createdAt?: string;
  skillsRequired: string[];
  companyLogoUrl?: string;
  cvName?: string;
  stage?: ApplicationStage;
};

const TalentApplications = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
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

  const selectedApplication = useMemo(() => {
    if (!selectedApplicationId) return null;
    return applications.find((application) => application.id === selectedApplicationId) ?? null;
  }, [applications, selectedApplicationId]);

  const applicationStats = useMemo(() => {
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
            stage,
            applied_at,
            job_id,
            jobs (
              id,
              title,
              description,
              location,
              workplace,
              employment_type,
              contract_type,
              experience_level,
              job_level,
              skills_required,
              created_at,
              employer_id,
              employers (company_name, logo_url, industry)
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
          description: record.jobs?.description || '',
          location: record.jobs?.location || 'Not specified',
          workplace: record.jobs?.workplace || 'Not specified',
          employmentType: record.jobs?.employment_type || 'Not specified',
          contractType: record.jobs?.contract_type || 'Not specified',
          experienceLevel: record.jobs?.experience_level || 'Not specified',
          jobLevel: record.jobs?.job_level || 'Not specified',
          industry: record.jobs?.employers?.industry || 'Not specified',
          createdAt: record.jobs?.created_at || record.applied_at,
          skillsRequired: normalizeTextArray(record.jobs?.skills_required),
          status: normalizeStatus(record.status),
          stage: normalizeStage(record.stage),
          appliedDate: formatDate(record.applied_at),
          jobId: record.job_id,
          contact: record.jobs?.employers?.company_name || 'N/A',
          companyLogoUrl: record.jobs?.employers?.logo_url || '',
          cvName: '',
        })).filter((app: any) => app.status !== "maybe" && app.status !== "archived");

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

  if (viewMode === "details" && selectedApplication) {
    const statusMeta = getStatusMeta(selectedApplication.status);
    const initials = getCompanyInitials(selectedApplication.company);

    return (
      <TalentLayout>
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
          <div className="mb-7">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="inline-flex h-12 items-center rounded-full border border-orange-200 bg-white px-8 text-base font-semibold text-orange-700 shadow-sm transition-colors hover:bg-orange-50"
            >
              <ArrowLeft className="mr-3 h-5 w-5 text-orange-700" />
              Back to Applications
            </button>
          </div>

          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div>
                <div className="mb-4 flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg">
                    {selectedApplication.companyLogoUrl ? (
                      <img
                        src={selectedApplication.companyLogoUrl}
                        alt={`${selectedApplication.company} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Career Opportunity</p>
                    <h1 className="mt-1 text-3xl font-bold text-slate-900">{selectedApplication.jobTitle}</h1>
                    <p className="mt-1 text-sm font-semibold text-orange-600">{selectedApplication.company}</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{selectedApplication.industry || "Industry"}</Badge>
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{selectedApplication.employmentType || "Type"}</Badge>
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{selectedApplication.workplace || "Workplace"}</Badge>
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{selectedApplication.experienceLevel || selectedApplication.jobLevel || "Experience"}</Badge>
                </div>

                <div className="grid gap-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedApplication.location || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Contract Type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedApplication.contractType || selectedApplication.employmentType || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Posted</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatPostedAgo(selectedApplication.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Experience</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedApplication.experienceLevel || selectedApplication.jobLevel || "Not specified"}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-[2rem] border border-orange-100 bg-white p-7 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900">Job Description</h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-600">
                    {selectedApplication.description || "Full role specifics are shared during the hiring process."}
                  </p>
                </div>

                <div className="mt-6 rounded-[2rem] border border-orange-100 bg-white p-7 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900">Role details</h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">Full role specifics are shared during the hiring process.</p>
                  {selectedApplication.skillsRequired.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedApplication.skillsRequired.map((skill, index) => (
                        <span key={`${skill}-${index}`} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <aside className="h-fit rounded-[2rem] border border-orange-100 bg-white p-7 shadow-lg">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-xl font-bold text-white shadow-md">
                  {initials}
                </div>
                <h3 className="mt-6 text-3xl font-bold text-slate-900">{selectedApplication.company}</h3>


                <div className="mt-6 space-y-3 text-sm font-semibold text-slate-700">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span>{selectedApplication.industry || "Industry"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-orange-500" />
                    <span>{[selectedApplication.employmentType, selectedApplication.workplace].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-orange-500" />
                    <span>{selectedApplication.jobLevel || selectedApplication.experienceLevel || "Not specified"}</span>
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  <Button
                    type="button"
                    disabled
                    className="h-14 w-full cursor-default rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-base font-semibold text-white shadow-md disabled:opacity-100"
                  >
                    <statusMeta.icon className="mr-2 h-5 w-5" />
                    {getFriendlyApplicationStatus(selectedApplication.status, selectedApplication.stage)}
                  </Button>
                
                </div>
              </aside>
            </div>
          </div>
        </div>
      </TalentLayout>
    );
  }

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

        <div className="relative z-[999] mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
            <Input
              placeholder="Search by company or job title..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 w-full rounded-3xl border-orange-200 bg-white pl-12 shadow-sm focus:border-orange-400 focus:ring-orange-400"
            />
          </div>

          <div className="relative z-[999] isolate w-full sm:w-[200px]">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | ApplicationStatus)}>
              <SelectTrigger className="h-12 w-full rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm">
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
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {getFriendlyApplicationStatus(application.status, application.stage)}
                        </p>
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
                      onClick={() => {
                        setSelectedApplicationId(application.id);
                        setViewMode("details");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
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
