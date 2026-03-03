import LeadershipInterviewLayout from "@/components/layouts/leadershipInterview/LeadershipInterviewLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, Search, Crown, Star, Video, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Helper functions
const hasReview = (interview: any) => {
  if (!interview) return false;

  if (Array.isArray(interview.interview_reviews) && interview.interview_reviews.length > 0) {
    const review = interview.interview_reviews[0];
    return Boolean(review?.rating && review?.review_text?.toString().trim());
  }

  if (typeof interview.interview_reviews === "object" && interview.interview_reviews !== null) {
    return Boolean(
      interview.interview_reviews.rating &&
        interview.interview_reviews.review_text?.toString().trim()
    );
  }

  return false;
};

const getReview = (interview: any) => {
  if (!interview?.interview_reviews) return null;

  if (Array.isArray(interview.interview_reviews) && interview.interview_reviews.length > 0) {
    return interview.interview_reviews[0];
  }

  if (typeof interview.interview_reviews === "object" && interview.interview_reviews !== null) {
    return interview.interview_reviews;
  }

  return null;
};

interface InterviewCardProps {
  interview: any;
  onRefresh: () => void;
}

function InterviewCard({ interview, onRefresh }: InterviewCardProps) {
  const { toast } = useToast();
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "", duration: interview.duration_minutes || 60 });
  const [reviewData, setReviewData] = useState({ rating: 0, review_text: "" });
  const [completeReviewData, setCompleteReviewData] = useState({ rating: 0, review_text: "" });
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  const candidate = interview.applications?.talents;
  const job = interview.applications?.jobs;
  const company = job?.employers?.company_name;

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} at ${formattedTime}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Calendar className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const checkScheduleConflicts = async (newDate: string, newTime: string, duration: number) => {
    try {
      setCheckingConflicts(true);
      const dateTime = `${newDate}T${newTime}`;
      const targetDateTime = new Date(dateTime).getTime();
      const endTime = new Date(targetDateTime + duration * 60000).getTime();

      // Check interviewer conflicts
      const { data: interviewerConflicts } = await supabase
        .from("interviews")
        .select("*")
        .eq("interviewer_id", interview.interviewer_id)
        .neq("id", interview.id)
        .eq("status", "scheduled");

      const interviewerConflictMessages: string[] = [];
      interviewerConflicts?.forEach((conf) => {
        const confStart = new Date(conf.scheduled_date).getTime();
        const confEnd = new Date(confStart + (conf.duration_minutes || 60) * 60000).getTime();

        if ((targetDateTime < confEnd && endTime > confStart)) {
          interviewerConflictMessages.push(
            `Conflict with ${conf.applications?.talents?.full_name || "another interview"} on ${formatDateTime(conf.scheduled_date)}`
          );
        }
      });

      // Check candidate conflicts
      const { data: candidateConflicts } = await supabase
        .from("interviews")
        .select("*")
        .eq("applications.id", interview.applications.id)
        .neq("id", interview.id)
        .eq("status", "scheduled");

      const candidateConflictMessages: string[] = [];
      candidateConflicts?.forEach((conf) => {
        const confStart = new Date(conf.scheduled_date).getTime();
        const confEnd = new Date(confStart + (conf.duration_minutes || 60) * 60000).getTime();

        if ((targetDateTime < confEnd && endTime > confStart)) {
          candidateConflictMessages.push(
            `Candidate has another interview on ${formatDateTime(conf.scheduled_date)}`
          );
        }
      });

      const allConflicts = [...interviewerConflictMessages, ...candidateConflictMessages];
      setConflicts(allConflicts);

      return allConflicts.length === 0;
    } catch (error) {
      console.error("Error checking conflicts:", error);
      toast({
        title: "Error",
        description: "Failed to check schedule conflicts",
        variant: "destructive",
      });
      return true;
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleCompleteAndReview = () => {
    setCompleteReviewData({ rating: 0, review_text: "" });
    setShowCompleteModal(true);
  };

  const handleCompleteReviewSubmit = async () => {
    if (completeReviewData.rating === 0 || !completeReviewData.review_text.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a rating and review text",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReview("complete");

      const isAlreadyCompleted = interview.status === "completed";

      if (!isAlreadyCompleted) {
        const { error: updateError } = await supabase
          .from("interviews")
          .update({ status: "completed" })
          .eq("id", interview.id);

        if (updateError) throw updateError;
      }

      const { error: reviewError } = await supabase
        .from("interview_reviews")
        .insert({
          interview_id: interview.id,
          rating: completeReviewData.rating,
          review_text: completeReviewData.review_text,
        });

      if (reviewError) throw reviewError;

      toast({
        title: "Success",
        description: "Interview completed and review submitted",
      });

      setShowCompleteModal(false);
      onRefresh();
    } catch (error: any) {
      console.error("Error completing interview:", error);
      toast({
        title: "Error",
        description: "Failed to complete interview",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  const handleReschedule = () => {
    const currentDate = new Date(interview.scheduled_date);
    setRescheduleData({
      date: currentDate.toISOString().split("T")[0],
      time: currentDate.toTimeString().slice(0, 5),
      duration: interview.duration_minutes,
    });
    setConflicts([]);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      toast({
        title: "Validation Error",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    const hasNoConflicts = await checkScheduleConflicts(
      rescheduleData.date,
      rescheduleData.time,
      rescheduleData.duration
    );

    if (!hasNoConflicts) {
      return;
    }

    try {
      setSubmittingReview("reschedule");

      const newDateTime = `${rescheduleData.date}T${rescheduleData.time}`;

      const { error } = await supabase
        .from("interviews")
        .update({
          scheduled_date: newDateTime,
          duration_minutes: rescheduleData.duration,
        })
        .eq("id", interview.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Interview rescheduled successfully",
      });

      setShowRescheduleModal(false);
      setShowReviewModal(true); // Prompt for review after reschedule
      onRefresh();
    } catch (error: any) {
      console.error("Error rescheduling interview:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule interview",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  const handleReviewSubmit = async () => {
    if (reviewData.rating === 0 || !reviewData.review_text.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a rating and review text",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReview("review");

      const { error } = await supabase
        .from("interview_reviews")
        .insert({
          interview_id: interview.id,
          rating: reviewData.rating,
          review_text: reviewData.review_text,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });

      setShowReviewModal(false);
      onRefresh();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  const review = getReview(interview);

  return (
    <>
      <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-600" />
                {candidate?.full_name || "Unknown Candidate"}
              </h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {job?.title || "Unknown Position"} at {company || "Unknown Company"}
              </p>
            </div>
            <Badge className={`${getStatusColor(interview.status)}`}>
              {getStatusIcon(interview.status)}
              <span className="ml-1">{interview.status}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-orange-600" />
              <div>
                <p className="font-semibold text-gray-600">Scheduled Date</p>
                <p>{formatDateTime(interview.scheduled_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-orange-600" />
              <div>
                <p className="font-semibold text-gray-600">Duration</p>
                <p>{interview.duration_minutes || 60} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-orange-600" />
              <div>
                <p className="font-semibold text-gray-600">Email</p>
                <p>{candidate?.users?.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-orange-600" />
              <div>
                <p className="font-semibold text-gray-600">Phone</p>
                <p>{candidate?.phone_number || "N/A"}</p>
              </div>
            </div>
          </div>

          {interview.meet_link && (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-orange-600" />
                <a
                  href={interview.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 font-semibold"
                >
                  Join Interview
                </a>
              </div>
            </div>
          )}

          {review && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-800">Your Review</span>
              </div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (review.rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-green-800">{review.review_text}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {interview.status === "scheduled" && (
              <>
                <Button
                  onClick={handleCompleteAndReview}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Complete & Review
                </Button>
                <Button
                  onClick={handleReschedule}
                  variant="outline"
                  className="flex-1"
                >
                  Reschedule
                </Button>
              </>
            )}
            {interview.status === "completed" && !review && (
              <Button
                onClick={() => {
                  setReviewData({ rating: 0, review_text: "" });
                  setShowReviewModal(true);
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Add Review
              </Button>
            )}
            {interview.status === "pending" && (
              <Button
                onClick={handleReschedule}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Confirm Schedule
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <DialogDescription>
              Select a new date and time for the interview with {candidate?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Date</Label>
              <Input
                type="date"
                value={rescheduleData.date}
                onChange={(e) =>
                  setRescheduleData({ ...rescheduleData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>New Time</Label>
              <Input
                type="time"
                value={rescheduleData.time}
                onChange={(e) =>
                  setRescheduleData({ ...rescheduleData, time: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="15"
                max="240"
                value={rescheduleData.duration}
                onChange={(e) =>
                  setRescheduleData({
                    ...rescheduleData,
                    duration: parseInt(e.target.value),
                  })
                }
              />
            </div>

            {conflicts.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="font-semibold text-red-800 text-sm mb-2">
                  Schedule Conflicts:
                </p>
                <ul className="space-y-1">
                  {conflicts.map((conflict, i) => (
                    <li key={i} className="text-sm text-red-700">
                      • {conflict}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={handleRescheduleSubmit}
              disabled={
                submittingReview === "reschedule" ||
                checkingConflicts ||
                conflicts.length > 0
              }
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {checkingConflicts ? "Checking Schedule..." : "Confirm Reschedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Interview</DialogTitle>
            <DialogDescription>
              Share your feedback for {candidate?.full_name}'s leadership interview
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating (1-5 Stars)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      setReviewData({ ...reviewData, rating: star })
                    }
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Review Comments</Label>
              <textarea
                className="w-full border rounded-lg p-2 text-sm"
                rows={4}
                placeholder="Share your feedback about the candidate's performance..."
                value={reviewData.review_text}
                onChange={(e) =>
                  setReviewData({
                    ...reviewData,
                    review_text: e.target.value,
                  })
                }
              />
            </div>
            <Button
              onClick={handleReviewSubmit}
              disabled={submittingReview === "review"}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {submittingReview === "review" ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete & Review Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Interview & Submit Review</DialogTitle>
            <DialogDescription>
              Mark the interview as completed and provide your evaluation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                This action will mark the interview as complete and is permanent.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Rating (1-5 Stars)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      setCompleteReviewData({
                        ...completeReviewData,
                        rating: star,
                      })
                    }
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= completeReviewData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Review Comments</Label>
              <textarea
                className="w-full border rounded-lg p-2 text-sm"
                rows={4}
                placeholder="Share your feedback about the candidate's leadership qualities..."
                value={completeReviewData.review_text}
                onChange={(e) =>
                  setCompleteReviewData({
                    ...completeReviewData,
                    review_text: e.target.value,
                  })
                }
              />
            </div>
            <Button
              onClick={handleCompleteReviewSubmit}
              disabled={submittingReview === "complete"}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {submittingReview === "complete"
                ? "Completing..."
                : "Complete Interview & Submit Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LeadershipInterviewInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentInterviewerId, setCurrentInterviewerId] = useState<string | null>(null);

  // Fetch interviews data
  useEffect(() => {
    if (!user?.id) return;

    const fetchInterviewerId = async () => {
      try {
        const { data, error } = await supabase
          .from("interviewers")
          .select("id")
          .eq("user_id", user.id)
          .eq("interview_type", "leadership")
          .maybeSingle();

        if (error) throw error;

        if (!data?.id) {
          toast({
            title: "Not Found",
            description: "No leadership interviewer profile matched your account",
            variant: "destructive",
          });
          setCurrentInterviewerId(null);
          return;
        }

        setCurrentInterviewerId(data.id);
      } catch (error) {
        console.error("Error fetching interviewer:", error);
        toast({
          title: "Error",
          description: "Failed to load interviewer profile",
          variant: "destructive",
        });
      }
    };

    fetchInterviewerId();
  }, [user?.id, toast]);

  useEffect(() => {
    if (!currentInterviewerId) return;

    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("interviews")
          .select(`
            id,
            interview_type,
            status,
            scheduled_date,
            duration_minutes,
            meet_link,
            interviewer_id,
            interview_reviews(rating, review_text, created_at),
            applications(
              id,
              talents(
                id,
                full_name,
                phone_number,
                city,
                users(email)
              ),
              jobs(
                id,
                title,
                description,
                employment_type,
                experience_level,
                employers(company_name)
              )
            )
          `)
          .eq("interviewer_id", currentInterviewerId)
          .eq("interview_type", "leadership")
          .order("scheduled_date", { ascending: false });

        if (error) throw error;
        setInterviews(data || []);
      } catch (error: any) {
        console.error("Error fetching interviews:", error);
        toast({
          title: "Error",
          description: "Failed to load interviews",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [currentInterviewerId, toast, refreshKey]);

  // Filter interviews by tab and search
  useEffect(() => {
    let filtered = interviews;

    // Filter by tab
    const now = new Date();
    filtered = filtered.filter((interview) => {
      const interviewDate = new Date(interview.scheduled_date);
      const isUpcoming = interviewDate > now && interview.status === "scheduled";
      const isPending = interview.status === "pending";
      const isCompleted = interview.status === "completed";

      switch (activeTab) {
        case "upcoming":
          return isUpcoming;
        case "pending":
          return isPending;
        case "completed":
          return isCompleted;
        case "all":
          return true;
        default:
          return true;
      }
    });

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((interview) => {
        const candidateName =
          interview.applications?.talents?.full_name?.toLowerCase() || "";
        const jobTitle =
          interview.applications?.jobs?.title?.toLowerCase() || "";
        const company =
          interview.applications?.jobs?.employers?.company_name?.toLowerCase() ||
          "";
        return (
          candidateName.includes(term) ||
          jobTitle.includes(term) ||
          company.includes(term)
        );
      });
    }

    setFilteredInterviews(filtered);
  }, [interviews, activeTab, searchTerm]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <LeadershipInterviewLayout>
        <div className="flex items-center justify-center p-8">
          <p>Loading interviews...</p>
        </div>
      </LeadershipInterviewLayout>
    );
  }

  return (
    <LeadershipInterviewLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Crown className="w-8 h-8 text-orange-600" />
              Leadership Interviews
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and review leadership position interviews
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by candidate name, job title, or company..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    No interviews found for this tab
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredInterviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onRefresh={handleRefresh}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </LeadershipInterviewLayout>
  );
}