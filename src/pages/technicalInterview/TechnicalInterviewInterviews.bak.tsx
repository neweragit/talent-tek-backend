// Legacy WIP version (kept for reference during UI rewrite)
import TechnicalInterviewLayout from "@/components/layouts/technicalInterview/TechnicalInterviewLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Briefcase, CalendarDays, CheckCircle2, Clock3, MessageSquare, Search, Sparkles, Star, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type InterviewStatus = "scheduled" | "confirmed" | "completed" | "rescheduled" | "cancelled" | "no-show";

type InterviewFilter = "All" | InterviewStatus;

type InterviewRecord = {
  id: string;
  candidateName: string;
  applyingFor: string;
  company: string;
  status: InterviewStatus;
  locationLine: string;
  interviewType: "technical";
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

const safeTitle = (value?: string | null) => {
  if (!value) return "";
  return value
    .split("-")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
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

const TechnicalInterviewInterviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InterviewFilter>("All");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [companyName, setCompanyName] = useState("");

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
        const interviewerRes = await supabase
          .from("interviewers")
          .select("id, employer:employers(company_name)")
          .eq("user_id", user.id)
          .eq("interview_type", "technical")
          .maybeSingle();

        const interviewerId = interviewerRes.data?.id ?? null;
        const resolvedCompany =
          (Array.isArray((interviewerRes.data as any)?.employer)
            ? (interviewerRes.data as any)?.employer?.[0]?.company_name
            : (interviewerRes.data as any)?.employer?.company_name) || "";
        setCompanyName(resolvedCompany);
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
              "application:applications(id,job:jobs(title,location,workplace,employment_type),talent:talents(full_name,phone_number,city)),",
              "review:interview_reviews(rating,review_text,created_at)",
            ].join("")
          )
          .eq("interviewer_id", interviewerId)
          .eq("interview_type", "technical")
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
          const submittedOn = review?.created_at ? format(new Date(review.created_at), "dd/MM/yyyy") : undefined;
          const scheduledAt = scheduled.toISOString();
          const isUpcoming = isUpcomingStatus(status);

          const evaluationLabel =
            status === "cancelled"
              ? "Session cancelled"
              : status === "completed"
              ? reviewText
                ? "Feedback submitted"
                : "Needs feedback"
              : isUpcoming
              ? "Upcoming session"
              : "In progress";

          const workModeParts = [safeTitle(job?.employment_type), safeTitle(job?.workplace)].filter(Boolean);
          const workMode = workModeParts.length ? workModeParts.join(" • ") : "";
          const locationLine = talent?.city || job?.location || "—";

          return {
            id: row.id,
            candidateName: talent?.full_name || "Candidate",
            applyingFor: job?.title || "Technical Interview",
            company: resolvedCompany || "",
            status,
            locationLine,
            interviewType: "technical",
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
          };
        });

        setRecords(mapped);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load technical interviews",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [toast, user?.id]);

  const filteredRecords = useMemo(() => {
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
                notes: reviewText,
                feedbackState: "sent",
                submittedOn: format(new Date(), "dd/MM/yyyy"),
              }
            : it
        )
      );

      toast({ title: "Feedback saved", description: "Your feedback was submitted." });
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
    <TechnicalInterviewLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="mb-10">
          <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm px-4 py-1 text-orange-600 font-semibold text-sm mb-4">
            TalenTek Technical Interviewer
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-slate-900 mb-4">
            Interviews
          </h1>
          <p className="text-lg font-semibold text-gray-700 leading-relaxed">
            Assess coding skills, algorithms, and system design
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
            <Input
              placeholder="Search by candidate or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-full h-12"
            />
          </div>
        </div>

        {/* Interview Cards */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-12 text-center">
            <p className="text-lg font-bold text-slate-900">Loading interviews…</p>
            <p className="text-sm text-gray-500">Please wait a moment</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center shadow-lg text-white font-bold text-lg">
                        {interview.candidateName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{interview.candidateName}</h3>
                        <p className="text-sm text-gray-600">{interview.position}</p>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        interview.statusLabel === "Completed"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : interview.statusLabel === "Pending Review"
                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                          : interview.statusLabel === "Cancelled"
                          ? "bg-slate-100 text-slate-700 border border-slate-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {interview.statusLabel}
                    </Badge>
                  </div>

                  {/* Info Section */}
                  <div className="bg-orange-50/50 rounded-2xl p-4 mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        Date
                      </span>
                      <span className="font-semibold text-slate-900">{interview.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-400" />
                        Time
                      </span>
                      <span className="font-semibold text-slate-900">{interview.time}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Code className="w-4 h-4 text-orange-400" />
                        Focus
                      </span>
                      <span className="font-semibold text-slate-900">{interview.focus}</span>
                    </div>
                    {typeof interview.rating === "number" && (
                      <div className="flex items-center justify-between text-sm pt-1">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Star className="w-4 h-4 text-orange-400" />
                          Rating
                        </span>
                        <span className="font-semibold text-slate-900">{interview.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {interview.meetLink ? (
                      <Button
                        className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg"
                        asChild
                      >
                        <a href={interview.meetLink} target="_blank" rel="noopener noreferrer">
                          <Video className="w-4 h-4" />
                          Join Meeting
                        </a>
                      </Button>
                    ) : (
                      <Button disabled className="flex-1 gap-2 rounded-full bg-orange-200 text-white shadow-lg">
                        <Video className="w-4 h-4" />
                        No Link
                      </Button>
                    )}

                    {(interview.statusLabel === "Pending Review" || interview.statusLabel === "Completed") && (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
                        onClick={() => openReview(interview)}
                      >
                        {interview.statusLabel === "Pending Review" ? "Leave Feedback" : "Edit Feedback"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredInterviews.length === 0 && (
              <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-bold text-slate-900">No interviews found</p>
                <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
              </div>
            )}
          </>
        )}

        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Technical Interview Feedback</DialogTitle>
              <DialogDescription className="sr-only">Leave a rating and feedback for this interview.</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-700">Candidate</p>
                <p className="text-base font-bold text-slate-900">{reviewTarget?.candidateName}</p>
                <p className="text-sm font-medium text-slate-600">{reviewTarget?.position}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Rating</p>
                <StarRatingInput value={reviewRating} onChange={setReviewRating} disabled={reviewSaving} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Feedback</p>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your technical evaluation feedback..."
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
      </div>
    </TechnicalInterviewLayout>
  );
};

export default TechnicalInterviewInterviews;
