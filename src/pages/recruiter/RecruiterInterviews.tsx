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

type InterviewStatus = "scheduled" | "confirmed" | "completed" | "rescheduled" | "cancelled" | "no-show";
type InterviewFilter = "All" | InterviewStatus;

type InterviewRecord = {
  id: string;
  candidateName: string;
  applyingFor: string;
  company: string;
  status: InterviewStatus;
  locationLine: string;
  interviewType: "technical" | "leadership" | "talent-acquisition";
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
};

const filters: InterviewFilter[] = [
  "All",
  "scheduled",
  "confirmed",
  "completed",
  "rescheduled",
  "cancelled",
  "no-show",
];

const isUpcomingStatus = (status: InterviewStatus) => {
  return status === "scheduled" || status === "confirmed" || status === "rescheduled";
};

const getStatusClasses = (status: InterviewStatus) => {
  if (status === "completed") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "confirmed") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "scheduled" || status === "rescheduled") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "no-show") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
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

const EmployerInterviews = () => {
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
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
          .select("id, employer:employers(company_name)")
          .eq("user_id", user.id)
          .maybeSingle();

        const teamMemberId = membershipRes.data?.id ?? null;
        const companyName =
          (Array.isArray((membershipRes.data as any)?.employer)
            ? (membershipRes.data as any)?.employer?.[0]?.company_name
            : (membershipRes.data as any)?.employer?.company_name) || "";

        if (!teamMemberId) {
          setRecords([]);
          setLoading(false);
          return;
        }

        const interviewsRes = await supabase
          .from("interviews")
          .select(
            [
              "id,",
              "interview_type,",
              "status,",
              "scheduled_date,",
              "duration_minutes,",
              "meet_link,",
              "application:applications(id,job:jobs(title,location,workplace,employment_type),talent:talents(full_name,phone_number,city)),",
              "review:interview_reviews(rating,review_text,created_at)",
            ].join("")
          )
          .eq("team_member_id", teamMemberId)
          .order("scheduled_date", { ascending: false });

        if (interviewsRes.error) throw interviewsRes.error;

        const mapped: InterviewRecord[] = (interviewsRes.data ?? []).map((row: any) => {
          const talent = Array.isArray(row?.application?.talent) ? row.application.talent[0] : row?.application?.talent;
          const job = Array.isArray(row?.application?.job) ? row.application.job[0] : row?.application?.job;
          const review = Array.isArray(row?.review) ? row.review[0] : row?.review;

          const interviewType = row.interview_type as InterviewRecord["interviewType"];
          const status = row.status as InterviewStatus;
          const isCompleted = status === "completed";

          return {
            id: row.id,
            candidateName: talent?.full_name || "Unknown Candidate",
            applyingFor: job?.title || "Role",
            company: companyName || "Company",
            status,
            locationLine: talent?.city || job?.location || "Remote",
            interviewType,
            phone: talent?.phone_number || "",
            scheduledAt: row.scheduled_date,
            durationMinutes: Number(row.duration_minutes) || 60,
            meetLink: row.meet_link,
            workMode: `${job?.employment_type || ""}${job?.workplace ? ` - ${job.workplace}` : ""}`.trim() || "—",
            evaluationLabel: isCompleted ? "Evaluation Completed" : isUpcomingStatus(status) ? "Upcoming Session" : "Interview",
            rating: review?.rating ? Number(review.rating) : undefined,
            reviewText: review?.review_text || undefined,
            notes: review?.review_text || (isCompleted ? "No notes submitted yet." : "Ready when you are."),
            submittedOn: review?.created_at ? format(new Date(review.created_at), "dd/MM/yyyy") : undefined,
            feedbackState: review ? "sent" : isCompleted ? "pending" : undefined,
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

  const updateInterviewStatus = async (interview: InterviewRecord, nextStatus: InterviewStatus) => {
    setActionLoadingId(interview.id);
    try {
      const { error } = await supabase
        .from("interviews")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", interview.id);

      if (error) throw error;

      setRecords((prev) => prev.map((it) => (it.id === interview.id ? { ...it, status: nextStatus } : it)));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update interview",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
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
                  const actionLabel =
                    isUpcoming && interview.meetLink
                      ? "Join Now"
                      : isCompleted
                      ? interview.feedbackState === "sent"
                        ? "Feedback Sent"
                        : "Leave Feedback"
                      : "View Details";
                  const isFeedbackSent = isCompleted && interview.feedbackState === "sent";
                  const canJoin = isUpcoming && !!interview.meetLink && !isFeedbackSent;
                  const formattedDate = interview.scheduledAt
                    ? format(new Date(interview.scheduledAt), "EEEE, MMMM d, yyyy")
                    : "—";
                  const formattedTime = interview.scheduledAt ? format(new Date(interview.scheduledAt), "hh:mm a") : "—";

                  return (
                    <>
                <div className="mb-5 flex flex-col gap-4 border-b border-orange-100 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{interview.candidateName}</h2>
                    <p className="mt-2 text-base font-medium text-slate-600">
                      Applying for {interview.applyingFor} at {interview.company}
                    </p>
                  </div>
                  <Badge className={getStatusClasses(interview.status)}>{interview.status === "completed" ? "Completed" : interview.status}</Badge>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.locationLine}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Track</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {interview.interviewType === "talent-acquisition"
                        ? "Talent Acquisition"
                        : interview.interviewType === "technical"
                        ? "Technical"
                        : "Leadership"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Phone</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.phone || "—"}</p>
                  </div>
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
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mode</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.workMode}</p>
                  </div>
                </div>

                <div className="grid gap-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
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

                  {interview.rating ? (
                    <div className="inline-flex items-center justify-center gap-1 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700">
                      {renderRatingStars(interview.rating)}
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700">
                      Pending
                    </div>
                  )}

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
                        if (interview.status === "scheduled") {
                          void updateInterviewStatus(interview, "confirmed");
                        }
                        return;
                      }
                      if (isCompleted) {
                        openReview(interview);
                        return;
                      }
                    }}
                  >
                    {isUpcoming ? (
                      <Video className="h-4 w-4" />
                    ) : isFeedbackSent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCompleted ? (
                      <MessageSquare className="h-4 w-4" />
                    ) : (
                      <Briefcase className="h-4 w-4" />
                    )}
                    {actionLabel}
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {isUpcomingStatus(interview.status) && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionLoadingId === interview.id}
                      className="rounded-full border-orange-200 text-slate-700 hover:bg-orange-50"
                      onClick={() => void updateInterviewStatus(interview, "completed")}
                    >
                      Mark completed
                    </Button>
                  )}
                  {interview.status !== "cancelled" && interview.status !== "completed" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionLoadingId === interview.id}
                      className="rounded-full border-orange-200 text-slate-700 hover:bg-orange-50"
                      onClick={() => void updateInterviewStatus(interview, "cancelled")}
                    >
                      Cancel
                    </Button>
                  )}
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
                {reviewSaving ? "Saving..." : "Save Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RecruiterLayout>
  );
};

export default EmployerInterviews;

