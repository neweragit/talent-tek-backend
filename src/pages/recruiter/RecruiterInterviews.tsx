import { useEffect, useMemo, useState } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import CvViewer from "@/components/CvViewer";

type InterviewStatus = "scheduled" | "confirmed" | "completed" | "no-show";
type InterviewFilter = "All" | InterviewStatus;
type InterviewTypeFilter = "all" | "talent-acquisition" | "technical" | "leadership";
type InterviewJobFilter = "all" | string;

type InterviewRecord = {
  id: string;
  applicationId: string | null;
  candidateName: string;
  applyingFor: string;
  company: string;
  status: InterviewStatus;
  interviewType: "technical" | "leadership" | "talent-acquisition";
  scheduledAt: string;
  durationMinutes: number;
  meetLink?: string | null;
  evaluationLabel: string;
  rating?: number;
  notes: string;
  submittedOn?: string;
  feedbackState?: "pending" | "sent";
  reviewText?: string;
  resumeUrl?: string;
};

const filters: InterviewFilter[] = [
  "All",
  "scheduled",
  "confirmed",
  "completed",
  "no-show",
];

const interviewTypeFilters: Array<{ id: InterviewTypeFilter; label: string }> = [
  { id: "all", label: "All Types" },
  { id: "talent-acquisition", label: "TA" },
  { id: "technical", label: "Technical" },
  { id: "leadership", label: "Leadership" },
];

const getInterviewTypeLabel = (type: InterviewRecord["interviewType"]) => {
  if (type === "talent-acquisition") return "Talent Acquisition";
  if (type === "technical") return "Technical";
  return "Leadership";
};

const isUpcomingStatus = (status: InterviewStatus) => {
  return status === "scheduled";
};

const getStatusClasses = (status: InterviewStatus) => {
  if (status === "completed") {
    return "border-orange-200 bg-orange-100 text-orange-700";
  }

  if (status === "confirmed") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "scheduled") {
    return "border-orange-300 bg-orange-50 text-orange-800";
  }

  return "border-orange-200 bg-orange-50/70 text-orange-700";
};

const toLocalDateTimeInputValue = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const renderRatingStars = (rating?: number, sizeClass = "h-4 w-4") => {
  if (typeof rating !== "number" || !Number.isFinite(rating)) return null;
  const filled = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${i < filled ? "text-orange-600 fill-orange-600" : "text-orange-200"}`}
        />
      ))}
    </span>
  );
};

const toFixed3ResumeUrls = (value: unknown): [string, string, string] => {
  if (Array.isArray(value)) {
    const a = value.map((v) => (typeof v === "string" ? v : "")).slice(0, 3);
    return [(a[0] ?? "").trim(), (a[1] ?? "").trim(), (a[2] ?? "").trim()];
  }
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    return [trimmed, "", ""];
  }
  return ["", "", ""];
};

const firstNonEmptyResumeUrl = (urls: readonly string[]) => urls.find((u) => String(u).trim()) ?? "";

const extractCvsObjectPathFromResumeUrl = (resumeUrl: string): string | null => {
  const match = resumeUrl.match(/cvs\/(.+)$/);
  return match ? match[1] : null;
};

const EmployerInterviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InterviewFilter>("All");
  const [activeInterviewType, setActiveInterviewType] = useState<InterviewTypeFilter>("all");
  const [activeJobFilter, setActiveJobFilter] = useState<InterviewJobFilter>("all");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [cvDialogOpen, setCvDialogOpen] = useState(false);
  const [cvDialogUrl, setCvDialogUrl] = useState("");
  const [cvLoading, setCvLoading] = useState(false);
  const [cvDialogError, setCvDialogError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const membershipRes = await supabase
          .from("employer_team_members")
          .select("id, employer_id, employer:employers(company_name)")
          .eq("user_id", user.id)
          .maybeSingle();

        const teamMemberId = membershipRes.data?.id ?? null;
        const employerId = membershipRes.data?.employer_id ?? null;
        const companyName =
          (Array.isArray((membershipRes.data as any)?.employer)
            ? (membershipRes.data as any)?.employer?.[0]?.company_name
            : (membershipRes.data as any)?.employer?.company_name) || "";

        if (!teamMemberId || !employerId) {
          setRecords([]);
          setLoading(false);
          return;
        }

        const selectQuery = [
          "id,",
          "interview_type,",
          "status,",
          "scheduled_date,",
          "duration_minutes,",
          "meet_link,",
          "application_id,",
          "application:applications(id,job:jobs(title,location,workplace,employment_type),talent:talents(full_name,phone_number,city,resume_url)),",
          "review:interview_reviews(rating,review_text,created_at)",
        ].join("");

        const taInterviewsRes = await supabase
          .from("interviews")
          .select(selectQuery)
          .eq("interview_type", "talent-acquisition")
          .eq("team_member_id", teamMemberId)
          .in("status", ["scheduled", "completed", "no-show"])
          .order("scheduled_date", { ascending: false });

        if (taInterviewsRes.error) throw taInterviewsRes.error;

        const jobsRes = await supabase.from("jobs").select("id").eq("employer_id", employerId);
        if (jobsRes.error) throw jobsRes.error;

        const employerJobIds = (jobsRes.data ?? []).map((job: { id: string }) => job.id).filter(Boolean);
        let employerApplicationIds: string[] = [];

        if (employerJobIds.length > 0) {
          const applicationsRes = await supabase
            .from("applications")
            .select("id")
            .in("job_id", employerJobIds);

          if (applicationsRes.error) throw applicationsRes.error;
          employerApplicationIds = (applicationsRes.data ?? [])
            .map((application: { id: string }) => application.id)
            .filter(Boolean);
        }

        let employerTypeInterviews: any[] = [];

        if (employerApplicationIds.length > 0) {
          const otherTypesRes = await supabase
            .from("interviews")
            .select(selectQuery)
            .in("application_id", employerApplicationIds)
            .in("interview_type", ["technical", "leadership"])
            .in("status", ["scheduled", "completed", "no-show"])
            .order("scheduled_date", { ascending: false });

          if (otherTypesRes.error) throw otherTypesRes.error;
          employerTypeInterviews = otherTypesRes.data ?? [];
        }

        const uniqueRows = [
          ...(taInterviewsRes.data ?? []),
          ...employerTypeInterviews,
        ].reduce<Map<string, any>>((acc, row) => {
          if (row?.id && !acc.has(row.id)) {
            acc.set(row.id, row);
          }
          return acc;
        }, new Map());

        const applicationIds = Array.from(uniqueRows.values())
          .map((row: any) => row?.application_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0);

        const offeredApplicationIds = new Set<string>();

        if (applicationIds.length > 0) {
          const offersRes = await supabase.from("offers").select("application_id").in("application_id", applicationIds);
          if (offersRes.error) throw offersRes.error;

          for (const row of offersRes.data ?? []) {
            if (row?.application_id) {
              offeredApplicationIds.add(row.application_id);
            }
          }
        }

        const mapped: InterviewRecord[] = Array.from(uniqueRows.values()).map((row: any) => {
          const talent = Array.isArray(row?.application?.talent) ? row.application.talent[0] : row?.application?.talent;
          const job = Array.isArray(row?.application?.job) ? row.application.job[0] : row?.application?.job;
          const review = Array.isArray(row?.review) ? row.review[0] : row?.review;
          const resumeUrl = firstNonEmptyResumeUrl(toFixed3ResumeUrls(talent?.resume_url));

          const interviewType = row.interview_type as InterviewRecord["interviewType"];
          const status = row.status as InterviewStatus;
          const isCompleted = status === "completed";
          const feedbackState = (review ? "sent" : isCompleted ? "pending" : undefined) as InterviewRecord["feedbackState"];

          return {
            id: row.id,
            applicationId: row.application_id ?? null,
            candidateName: talent?.full_name || "Unknown Candidate",
            applyingFor: job?.title || "Role",
            company: companyName || "Company",
            status,
            interviewType,
            scheduledAt: row.scheduled_date,
            durationMinutes: Number(row.duration_minutes) || 60,
            meetLink: row.meet_link,
            evaluationLabel: isCompleted ? "Evaluation Completed" : isUpcomingStatus(status) ? "Upcoming Session" : "Interview",
            rating: review?.rating ? Number(review.rating) : undefined,
            reviewText: review?.review_text || undefined,
            notes: review?.review_text || (isCompleted ? "No notes submitted yet." : "Ready when you are."),
            submittedOn: review?.created_at ? format(new Date(review.created_at), "dd/MM/yyyy") : undefined,
            feedbackState,
            resumeUrl: resumeUrl || undefined,
          };
        }).filter((record) => !record.applicationId || !offeredApplicationIds.has(record.applicationId));

        setRecords(mapped);
      } catch (err) {
        console.error("Failed to load interviews:", err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load interviews",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [toast, user?.id]);

  const interviewTypeCounts = useMemo(() => {
    return records.reduce<Record<InterviewTypeFilter, number>>(
      (acc, interview) => {
        acc.all += 1;
        if (interview.interviewType === "talent-acquisition") acc["talent-acquisition"] += 1;
        if (interview.interviewType === "technical") acc.technical += 1;
        if (interview.interviewType === "leadership") acc.leadership += 1;
        return acc;
      },
      {
        all: 0,
        "talent-acquisition": 0,
        technical: 0,
        leadership: 0,
      }
    );
  }, [records]);

  const interviewStatusCounts = useMemo(() => {
    return records.reduce<Record<InterviewFilter, number>>(
      (acc, interview) => {
        acc.All += 1;
        acc[interview.status] += 1;
        return acc;
      },
      {
        All: 0,
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        "no-show": 0,
      }
    );
  }, [records]);

  const jobFilters = useMemo(() => {
    const counts = new Map<string, number>();

    for (const interview of records) {
      const jobName = interview.applyingFor.trim();
      if (!jobName) continue;
      counts.set(jobName, (counts.get(jobName) ?? 0) + 1);
    }

    return [
      { id: "all" as const, label: "All Jobs", count: records.length },
      ...Array.from(counts.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, count]) => ({ id: label, label, count })),
    ];
  }, [records]);

  const filteredInterviews = useMemo(() => {
    return records.filter((interview) => {
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        interview.candidateName.toLowerCase().includes(normalizedSearch) ||
        interview.applyingFor.toLowerCase().includes(normalizedSearch) ||
        interview.company.toLowerCase().includes(normalizedSearch);
      const matchesFilter = activeFilter === "All" || interview.status === activeFilter;
      const matchesType = activeInterviewType === "all" || interview.interviewType === activeInterviewType;
      const matchesJob = activeJobFilter === "all" || interview.applyingFor === activeJobFilter;

      return matchesSearch && matchesFilter && matchesType && matchesJob;
    });
  }, [activeFilter, activeInterviewType, activeJobFilter, records, searchQuery]);

  const openCvPreview = async (interview: InterviewRecord) => {
    if (cvLoading) return;
    setCvDialogError("");
    setCvLoading(true);

    try {
      if (!interview.resumeUrl) {
        throw new Error("No resume available for this candidate.");
      }

      const objectPath = extractCvsObjectPathFromResumeUrl(interview.resumeUrl);
      if (!objectPath) {
        throw new Error("Could not resolve resume storage path.");
      }

      const { data, error } = await supabase.storage.from("cvs").createSignedUrl(objectPath, 60);
      if (error) throw error;

      const signedUrl = data?.signedUrl;
      if (!signedUrl) throw new Error("Signed URL was not returned.");

      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Failed to fetch resume");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setCvDialogUrl(blobUrl);
      setCvDialogOpen(true);
    } catch (err) {
      setCvDialogError(err instanceof Error ? err.message : "Failed to open resume preview.");
      setCvDialogOpen(true);
    } finally {
      setCvLoading(false);
    }
  };

  return (
    <RecruiterLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div>
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                TA Interview Portal
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
                Talent Acquisition Interviews
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                My Interviews
              </p>
              <p className="mt-2 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage your talent acquisition interviews and feedback
              </p>
            </div>
          </div>
        </section>

        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_220px] lg:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <Input
                placeholder="Search by candidate, role, or company..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            <Select value={activeInterviewType} onValueChange={(value) => setActiveInterviewType(value as InterviewTypeFilter)}>
              <SelectTrigger className="h-12 rounded-xl border-orange-200 focus:ring-orange-400">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {interviewTypeFilters.map((filter) => (
                  <SelectItem key={filter.id} value={filter.id}>
                    {filter.label} ({interviewTypeCounts[filter.id]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeJobFilter} onValueChange={(value) => setActiveJobFilter(value)}>
              <SelectTrigger className="h-12 rounded-xl border-orange-200 focus:ring-orange-400">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                {jobFilters.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.label} ({job.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as InterviewFilter)}>
              <SelectTrigger className="h-12 rounded-xl border-orange-200 focus:ring-orange-400">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All ({interviewStatusCounts.All})</SelectItem>
                <SelectItem value="scheduled">Scheduled ({interviewStatusCounts.scheduled})</SelectItem>
                <SelectItem value="confirmed">Confirmed ({interviewStatusCounts.confirmed})</SelectItem>
                <SelectItem value="completed">Completed ({interviewStatusCounts.completed})</SelectItem>
                <SelectItem value="no-show">No-show ({interviewStatusCounts["no-show"]})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white p-10 shadow-xl">
            <div className="flex items-center gap-3 text-slate-700 font-semibold">
              <Clock3 className="h-5 w-5 text-orange-600" />
              Loading interviews...
            </div>
          </div>
        ) : filteredInterviews.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredInterviews.map((interview) => (
              <article key={interview.id} className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl">
                {(() => {
                  const isCompleted = interview.status === "completed";
                  const isUpcoming = isUpcomingStatus(interview.status);
                  const isTaInterview = interview.interviewType === "talent-acquisition";
                  const isFeedbackSent = isTaInterview && interview.feedbackState === "sent";
                  const canJoin = isUpcoming && !!interview.meetLink;
                  const canPrimaryAction = canJoin;
                  const primaryActionLabel = canJoin
                    ? "Join Now"
                    : "View Only";
                  const formattedDate = interview.scheduledAt
                    ? format(new Date(interview.scheduledAt), "EEEE, MMMM d, yyyy")
                    : "—";
                  const formattedTime = interview.scheduledAt ? format(new Date(interview.scheduledAt), "hh:mm a") : "—";
                  const interviewTypeLabel = getInterviewTypeLabel(interview.interviewType);

                  return (
                    <>
                      <div className="mb-5 flex flex-col gap-4 border-b border-orange-100 pb-5 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{interview.candidateName}</h2>
                          <p className="mt-2 text-base font-medium text-slate-600">
                            Applying for {interview.applyingFor} at {interview.company}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge className="border-orange-200 bg-orange-50 text-orange-700">{interviewTypeLabel}</Badge>
                            <Badge className={getStatusClasses(interview.status)}>
                              {interview.status === "completed" ? "Completed" : interview.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">{formattedDate}</p>
                        </div>
                        <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Time</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {formattedTime} ({interview.durationMinutes} minutes)
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 md:grid-cols-[1fr_auto] md:items-center">
                        <div>
                          <p className="inline-flex items-center gap-2 text-sm font-bold text-orange-700">
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                            {interview.evaluationLabel}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-700">{interview.notes}</p>
                          {interview.submittedOn ? (
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              {isCompleted ? `Submitted on ${interview.submittedOn}` : interview.submittedOn}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {interview.rating ? (
                            <div className="inline-flex items-center justify-center gap-1 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700">
                              {renderRatingStars(interview.rating)}
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700">
                              Pending
                            </div>
                          )}

                        </div>
                      </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Briefcase className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No interviews found</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Try switching your status filter or searching with a different keyword.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-orange-600" />
            Interview Calendar Synced
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-orange-600" />
            Evaluation Turnaround Tracked
          </span>
        </div>
      </div>

      <Dialog open={cvDialogOpen} onOpenChange={setCvDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Resume Preview</DialogTitle>
            <DialogDescription className="sr-only">Preview the candidate resume document.</DialogDescription>
          </DialogHeader>
          {cvLoading && (
            <div className="flex items-center justify-center h-96">
              <Clock3 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          )}
          {cvDialogError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {cvDialogError}
            </div>
          )}
          {cvDialogUrl && !cvLoading && !cvDialogError && (
            <div className="flex-1 overflow-hidden rounded-xl border border-orange-100">
              <CvViewer fileUrl={cvDialogUrl} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </RecruiterLayout>
  );
};

export default EmployerInterviews;


