import { useEffect, useMemo, useState } from "react";
import LeadershipInterviewLayout from "@/components/layouts/leadershipInterview/LeadershipInterviewLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "@/components/ui/star-rating";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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

type InterviewRecord = {
  id: string;
  candidateName: string;
  applyingFor: string;
  company: string;
  status: InterviewStatus;
  locationLine: string;
  interviewType: "leadership";
  phone: string;
  scheduledAt: string;
  durationMinutes: number;
  meetLink?: string | null;
  workMode: string;
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

const statusCounts = (records: InterviewRecord[]) => {
  return records.reduce<Record<InterviewFilter, number>>(
    (acc, interview) => {
      acc.All += 1;
      acc[interview.status] += 1;
      return acc;
    },
    {
      All: 0,
      scheduled: 0,
      completed: 0,
      "no-show": 0,
    }
  );
};

const isUpcomingStatus = (status: InterviewStatus) => {
  return status === "scheduled";
};

const safeTitle = (value?: string | null) => {
  if (!value) return "";
  return value
    .split("-")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
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

const LeadershipInterviewInterviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InterviewFilter>("All");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<InterviewRecord[]>([]);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<InterviewRecord | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [noShowLoadingId, setNoShowLoadingId] = useState<string | null>(null);
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
        const interviewerRes = await supabase
          .from("interviewers")
          .select("id, employer:employers(company_name)")
          .eq("user_id", user.id)
          .eq("interview_type", "leadership")
          .maybeSingle();

        const interviewerId = interviewerRes.data?.id ?? null;
        const resolvedCompany =
          (Array.isArray((interviewerRes.data as any)?.employer)
            ? (interviewerRes.data as any)?.employer?.[0]?.company_name
            : (interviewerRes.data as any)?.employer?.company_name) || "";

        if (!interviewerId) {
          setRecords([]);
          setLoading(false);
          return;
        }

        const interviewsRes = await supabase
          .from("interviews")
          .select(
            [
              "id,",
              "status,",
              "scheduled_date,",
              "duration_minutes,",
              "meet_link,",
              "application:applications(id,job:jobs(title,location,workplace,employment_type),talent:talents(full_name,phone_number,city,resume_url)),",
              "review:interview_reviews(rating,review_text,created_at)",
            ].join("")
          )
          .eq("interviewer_id", interviewerId)
          .eq("interview_type", "leadership")
          .in("status", ["scheduled", "completed", "no-show"])
          .order("scheduled_date", { ascending: false });

        if (interviewsRes.error) throw interviewsRes.error;

        const mapped: InterviewRecord[] = (interviewsRes.data ?? []).map((row: any) => {
          const application = Array.isArray(row.application) ? row.application[0] : row.application;
          const talent = Array.isArray(application?.talent) ? application?.talent?.[0] : application?.talent;
          const job = Array.isArray(application?.job) ? application?.job?.[0] : application?.job;

          const status = row.status as InterviewStatus;
          const scheduled = row.scheduled_date ? new Date(row.scheduled_date) : new Date();

          const review = Array.isArray(row.review) ? row.review[0] : row.review;
          const rating = review?.rating ? Number(review.rating) : undefined;
          const reviewText = review?.review_text || "";
          const resumeUrl = firstNonEmptyResumeUrl(toFixed3ResumeUrls(talent?.resume_url));
          const submittedOn = review?.created_at ? format(new Date(review.created_at), "dd/MM/yyyy") : undefined;
          const scheduledAt = scheduled.toISOString();
          const isUpcoming = isUpcomingStatus(status);

          const evaluationLabel =
            status === "completed"
              ? reviewText
                ? "Feedback submitted"
                : "Needs feedback"
              : status === "no-show"
              ? "No-show session"
              : isUpcoming
              ? "Upcoming session"
              : "Interview";

          const workModeParts = [safeTitle(job?.employment_type), safeTitle(job?.workplace)].filter(Boolean);
          const workMode = workModeParts.length ? workModeParts.join(" - ") : "";
          const locationLine = talent?.city || job?.location || "\u2014";

          return {
            id: row.id,
            candidateName: talent?.full_name || "Candidate",
            applyingFor: job?.title || "Leadership Interview",
            company: resolvedCompany || "",
            status,
            locationLine,
            interviewType: "leadership",
            phone: talent?.phone_number || "",
            scheduledAt,
            durationMinutes: Number(row.duration_minutes) || 60,
            meetLink: row.meet_link ?? null,
            workMode,
            evaluationLabel,
            rating,
            notes: reviewText || (status === "completed" ? "No feedback submitted yet." : "Ready when you are."),
            submittedOn,
            feedbackState: reviewText ? "sent" : "pending",
            reviewText: reviewText || "",
            resumeUrl: resumeUrl || undefined,
          };
        });

        setRecords(mapped);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load leadership interviews",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [toast, user?.id]);

  const filteredInterviews = useMemo(() => {
    return records.filter((interview) => {
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        interview.candidateName.toLowerCase().includes(normalizedSearch) ||
        interview.applyingFor.toLowerCase().includes(normalizedSearch) ||
        interview.company.toLowerCase().includes(normalizedSearch);
      const matchesFilter = activeFilter === "All" || interview.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, records, searchQuery]);

  const openReview = (interview: InterviewRecord) => {
    setReviewTarget(interview);
    setReviewRating(interview.rating ?? 5);
    setReviewText(interview.reviewText ?? "");
    setReviewOpen(true);
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
      // Update interview status to completed
      const { error: statusError } = await supabase
        .from("interviews")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", reviewTarget.id);

      if (statusError) throw statusError;


      setRecords((prev) =>
        prev.map((it) =>
          it.id === reviewTarget.id
            ? {
                ...it,
                rating: reviewRating,
                reviewText,
                notes: reviewText,
                feedbackState: "sent",
                submittedOn: format(new Date(), "dd/MM/yyyy"),
                evaluationLabel: "Feedback submitted",
                status: "completed",
              }
            : it
        )
      );

      toast({ title: "Review saved", description: "Interview review submitted successfully." });
      setReviewOpen(false);
      setReviewTarget(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save review",
        variant: "destructive",
      });
    } finally {
      setReviewSaving(false);
    }
  };

  const markInterviewNoShow = async (interview: InterviewRecord) => {
    const confirmed = window.confirm(
      "Mark this interview as no-show? Use this when the candidate did not attend or a technical issue prevented the interview."
    );
    if (!confirmed) return;

    setNoShowLoadingId(interview.id);
    try {
      const { error } = await supabase
        .from("interviews")
        .update({ status: "no-show", updated_at: new Date().toISOString() })
        .eq("id", interview.id);

      if (error) throw error;

      setRecords((prev) =>
        prev.map((it) =>
          it.id === interview.id
            ? {
                ...it,
                status: "no-show",
                evaluationLabel: "No-show session",
                notes: "Marked as no-show. Candidate did not attend or technical issues blocked the interview.",
              }
            : it
        )
      );

      toast({ title: "Marked as no-show", description: "Interview status updated to no-show." });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update interview status",
        variant: "destructive",
      });
    } finally {
      setNoShowLoadingId(null);
    }
  };

  return (
    <LeadershipInterviewLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div>
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Leadership Interview Portal
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
                Leadership Interviews
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">My Interviews</p>
              <p className="mt-2 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage your leadership interviews and feedback
              </p>
            </div>
          </div>
        </section>

        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <Input
                placeholder="Search by candidate, role, or company..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as InterviewFilter)}>
              <SelectTrigger className="h-12 rounded-xl border-orange-200 focus:ring-orange-400">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All ({statusCounts(records).All})</SelectItem>
                <SelectItem value="scheduled">Scheduled ({statusCounts(records).scheduled})</SelectItem>
                <SelectItem value="completed">Completed ({statusCounts(records).completed})</SelectItem>
                <SelectItem value="no-show">No-show ({statusCounts(records)["no-show"]})</SelectItem>
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
              <article
                key={interview.id}
                className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl"
              >
                {(() => {
                  const isCompleted = interview.status === "completed";
                  const isUpcoming = isUpcomingStatus(interview.status);
                  const isFeedbackSent = interview.feedbackState === "sent";
                  const canJoin = isUpcoming && !!interview.meetLink;
                  const canMarkNoShow = interview.status === "scheduled";

                  const formattedDate = interview.scheduledAt
                    ? format(new Date(interview.scheduledAt), "EEEE, MMMM d, yyyy")
                    : "\u2014";
                  const formattedTime = interview.scheduledAt
                    ? format(new Date(interview.scheduledAt), "hh:mm a")
                    : "\u2014";

                  return (
                    <>
                      <div className="mb-5 flex flex-col gap-4 border-b border-orange-100 pb-5 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{interview.candidateName}</h2>
                          <p className="mt-2 text-base font-medium text-slate-600">
                            Applying for {interview.applyingFor} at {interview.company}
                          </p>
                        </div>
                        <Badge className={getStatusClasses(interview.status)}>
                          {interview.status === "completed" ? "Completed" : interview.status}
                        </Badge>
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

                      <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                        <div className="mb-6">
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

                        <div className="space-y-3">
                          <div className="flex gap-2">
                            {canJoin && (
                              <Button
                                className="flex-1 gap-2 rounded-lg bg-orange-600 text-white shadow-md hover:bg-orange-700"
                                disabled={isCompleted}
                                onClick={() => {
                                  window.open(interview.meetLink as string, "_blank", "noopener,noreferrer");
                                }}
                              >
                                <Video className="h-4 w-4" />
                                Join Now
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              disabled={isCompleted || cvLoading}
                              className="flex-1 rounded-lg border-orange-200 text-slate-700 hover:bg-orange-50"
                              onClick={() => openCvPreview(interview)}
                            >
                              View Resume
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              disabled={isFeedbackSent || isCompleted}
                              className={`flex-1 gap-2 rounded-lg text-white shadow-md ${
                                isFeedbackSent ? "bg-orange-300 hover:bg-orange-300" : "bg-orange-600 hover:bg-orange-700"
                              }`}
                              onClick={() => {
                                if (isFeedbackSent) return;
                                openReview(interview);
                              }}
                            >
                              {isFeedbackSent ? <CheckCircle2 className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                              {isFeedbackSent ? "Feedback Sent" : "Submit Feedback"}
                            </Button>

                            {canMarkNoShow && (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={noShowLoadingId === interview.id || isCompleted}
                                className="flex-1 rounded-lg border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() => void markInterviewNoShow(interview)}
                              >
                                {noShowLoadingId === interview.id ? "Saving..." : "No-show"}
                              </Button>
                            )}
                          </div>

                          {canMarkNoShow && (
                            <p className="text-xs font-medium text-slate-500">
                              Use No-show when the candidate did not attend or a technical issue prevented the interview.
                            </p>
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
            <DialogDescription className="sr-only">Leave a rating and feedback for this interview.</DialogDescription>
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
              <p className="mb-2 text-sm font-semibold text-slate-700">Feedback</p>
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
                {reviewSaving ? "Saving..." : "Save Review"}
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
    </LeadershipInterviewLayout>
  );
};

export default LeadershipInterviewInterviews;
