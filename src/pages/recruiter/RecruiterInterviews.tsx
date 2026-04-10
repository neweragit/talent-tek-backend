import { useEffect, useMemo, useState } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StarRatingInput } from "@/components/ui/star-rating";
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

type InterviewStatus = "scheduled" | "completed" | "no-show";
type InterviewFilter = "All" | InterviewStatus;
type InterviewTypeFilter = "all" | "talent-acquisition" | "technical" | "leadership";

type InterviewRecord = {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<InterviewRecord[]>([]);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<InterviewRecord | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<InterviewRecord | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
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

        const mapped: InterviewRecord[] = Array.from(uniqueRows.values()).map((row: any) => {
          const talent = Array.isArray(row?.application?.talent) ? row.application.talent[0] : row?.application?.talent;
          const job = Array.isArray(row?.application?.job) ? row.application.job[0] : row?.application?.job;
          const review = Array.isArray(row?.review) ? row.review[0] : row?.review;
          const resumeUrl = firstNonEmptyResumeUrl(toFixed3ResumeUrls(talent?.resume_url));

          const interviewType = row.interview_type as InterviewRecord["interviewType"];
          const status = row.status as InterviewStatus;
          const isCompleted = status === "completed";

          return {
            id: row.id,
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
            feedbackState: review ? "sent" : isCompleted ? "pending" : undefined,
            resumeUrl: resumeUrl || undefined,
          };
        });

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

      return matchesSearch && matchesFilter && matchesType;
    });
  }, [activeFilter, activeInterviewType, records, searchQuery]);

  const openReview = (interview: InterviewRecord) => {
    setReviewTarget(interview);
    setReviewRating(interview.rating ?? 5);
    setReviewText(interview.reviewText ?? "");
    setReviewOpen(true);
  };

  const openReschedule = (interview: InterviewRecord) => {
    setRescheduleTarget(interview);
    setRescheduleDateTime(toLocalDateTimeInputValue(interview.scheduledAt));
    setRescheduleOpen(true);
  };

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

  const submitReview = async () => {
    if (!reviewTarget) return;

    setReviewSaving(true);
    try {
      const { error } = await supabase
        .from("interview_reviews")
        .upsert(
          {
            interview_id: reviewTarget.id,
            rating: reviewRating,
            review_text: reviewText || null,
          },
          { onConflict: "interview_id" }
        );

      if (error) throw error;

      setRecords((prev) =>
        prev.map((it) =>
          it.id === reviewTarget.id
            ? {
                ...it,
                rating: reviewRating,
                reviewText,
                feedbackState: "sent",
                submittedOn: format(new Date(), "dd/MM/yyyy"),
              }
            : it
        )
      );

      toast({ title: "Feedback saved", description: "Interview feedback submitted successfully." });
      setReviewOpen(false);
      setReviewTarget(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save feedback",
        variant: "destructive",
      });
    } finally {
      setReviewSaving(false);
    }
  };

  const saveReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDateTime) return;

    setRescheduleSaving(true);
    try {
      const nextIso = new Date(rescheduleDateTime).toISOString();
      const { error } = await supabase
        .from("interviews")
        .update({
          scheduled_date: nextIso,
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rescheduleTarget.id);

      if (error) throw error;

      setRecords((prev) =>
        prev.map((it) =>
          it.id === rescheduleTarget.id
            ? {
                ...it,
                scheduledAt: nextIso,
                status: "scheduled",
                evaluationLabel: "Upcoming Session",
              }
            : it
        )
      );

      toast({
        title: "Interview updated",
        description:
          rescheduleTarget.interviewType === "talent-acquisition"
            ? "Interview time updated successfully."
            : "Interview rescheduled successfully.",
      });

      setRescheduleOpen(false);
      setRescheduleTarget(null);
      setRescheduleDateTime("");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reschedule interview",
        variant: "destructive",
      });
    } finally {
      setRescheduleSaving(false);
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
                Manage your talent acquisition interviews and evaluations
              </p>
            </div>
          </div>
        </section>

        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
            <Input
              placeholder="Search by candidate, role, or company..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {interviewTypeFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveInterviewType(filter.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeInterviewType === filter.id
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {filter.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeInterviewType === filter.id ? "bg-white/20 text-white" : "bg-white text-orange-700"
                  }`}
                >
                  {interviewTypeCounts[filter.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeFilter === filter
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {filter}
              </button>
            ))}
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
          <div className="grid gap-6">
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

                          {canPrimaryAction && (
                            <Button
                              disabled={isFeedbackSent}
                              className={`gap-2 rounded-full text-white shadow-md ${
                                isFeedbackSent
                                  ? "bg-orange-300 hover:bg-orange-300"
                                  : "bg-orange-600 hover:bg-orange-700"
                              }`}
                              onClick={() => {
                                if (isFeedbackSent) return;
                                if (canJoin) {
                                  window.open(interview.meetLink as string, "_blank", "noopener,noreferrer");
                                  return;
                                }
                              }}
                            >
                              {canJoin ? (
                                <Video className="h-4 w-4" />
                              ) : (
                                <MessageSquare className="h-4 w-4" />
                              )}
                              {primaryActionLabel}
                            </Button>
                          )}

                          {isTaInterview && (
                            <Button
                              disabled={isFeedbackSent}
                              className={`gap-2 rounded-full text-white shadow-md ${
                                isFeedbackSent
                                  ? "bg-orange-300 hover:bg-orange-300"
                                  : "bg-orange-600 hover:bg-orange-700"
                              }`}
                              onClick={() => {
                                if (isFeedbackSent) return;
                                openReview(interview);
                              }}
                            >
                              {isFeedbackSent ? <CheckCircle2 className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                              {isFeedbackSent ? "Feedback Sent" : "Submit Feedback"}
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            disabled={cvLoading}
                            className="rounded-full border-orange-200 text-slate-700 hover:bg-orange-50"
                            onClick={() => openCvPreview(interview)}
                          >
                            View Resume
                          </Button>

                          {(interview.status !== "completed" || isFeedbackSent) && (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
                              onClick={() => openReschedule(interview)}
                            >
                              {interview.interviewType === "talent-acquisition" ? "Edit Time" : "Reschedule"}
                            </Button>
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

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Interview Feedback</DialogTitle>
            <DialogDescription className="sr-only">Set rating and feedback for this interview.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-700">Candidate</p>
              <p className="text-base font-bold text-slate-900">{reviewTarget?.candidateName}</p>
              <p className="text-sm font-medium text-slate-600">{reviewTarget?.applyingFor}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Rating</p>
              <StarRatingInput value={reviewRating} onChange={setReviewRating} disabled={reviewSaving} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Feedback</p>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your feedback..."
                className="min-h-28 rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border-orange-200 text-slate-700 hover:bg-orange-50"
                disabled={reviewSaving}
                onClick={() => setReviewOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                disabled={reviewSaving || !reviewTarget}
                onClick={() => void submitReview()}
              >
                {reviewSaving ? "Saving..." : "Save Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {rescheduleTarget?.interviewType === "talent-acquisition" ? "Edit Interview Time" : "Reschedule Interview"}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {rescheduleTarget?.interviewType === "talent-acquisition"
                ? "Update the date and time for this TA interview."
                : "Set a new date and time for this interview."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Candidate</p>
              <p className="text-base font-bold text-slate-900">{rescheduleTarget?.candidateName}</p>
              <p className="text-sm font-medium text-slate-600">{rescheduleTarget?.applyingFor}</p>
            </div>

            <div>
              <label htmlFor="reschedule-date" className="mb-2 block text-sm font-semibold text-slate-700">
                New Date & Time
              </label>
              <Input
                id="reschedule-date"
                type="datetime-local"
                value={rescheduleDateTime}
                onChange={(event) => setRescheduleDateTime(event.target.value)}
                className="rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border-orange-200 text-slate-700 hover:bg-orange-50"
                disabled={rescheduleSaving}
                onClick={() => setRescheduleOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                disabled={rescheduleSaving || !rescheduleDateTime || !rescheduleTarget}
                onClick={() => void saveReschedule()}
              >
                {rescheduleSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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


