import EmployerLayout from "@/components/layouts/EmployerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, Briefcase, Video, Phone, CheckCircle, XCircle, AlertCircle, CalendarIcon, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EmployerTalentAcquisitionInterviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTeamMember, setCurrentTeamMember] = useState(null);
  const [filter, setFilter] = useState("all");
  const [submittingReview, setSubmittingReview] = useState(null);
  const [completeReviewModal, setCompleteReviewModal] = useState({ open: false, interview: null });
  const [completeReviewData, setCompleteReviewData] = useState({ rating: 3, review_text: '' });

  useEffect(() => {
    if (user) {
      fetchTeamMemberData();
    }
  }, [user]);

  useEffect(() => {
    if (currentTeamMember) {
      fetchInterviews();
    }
  }, [currentTeamMember, filter]);

  const fetchTeamMemberData = async () => {
    try {
      const { data: teamMember, error } = await supabase
        .from('employer_team_members')
        .select(`
          id,
          first_name,
          last_name,
          role,
          employers (
            id,
            company_name
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCurrentTeamMember(teamMember);
    } catch (error) {
      console.error('Error fetching team member data:', error);
      toast({
        title: "Error",
        description: "Failed to load team member profile",
        variant: "destructive",
      });
    }
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('interviews')
        .select(`
          *,
          interview_reviews(rating, review_text, created_at),
          applications!inner(
            *,
            talents(full_name, phone_number, current_position, city),
            jobs!inner(
              title, employment_type, workplace,
              employers!inner(company_name)
            )
          )
        `)
        .eq('team_member_id', currentTeamMember.id)
        .eq('interview_type', 'talent-acquisition')
        .order('scheduled_date', { ascending: true });

      // Apply filter
      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log('Fetched interviews data:', data);
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'no-show':
        return <Badge className="bg-orange-100 text-orange-800">No Show</Badge>;
      case 'rescheduled':
        return <Badge className="bg-yellow-100 text-yellow-800">Rescheduled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCompleteAndReview = (interview) => {
    setCompleteReviewModal({ open: true, interview });
    setCompleteReviewData({ rating: 3, review_text: '' });
  };

  const handleCompleteReviewSubmit = async () => {
    if (!completeReviewModal.interview || !completeReviewData.review_text.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide review text before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReview('completing');

      // Check if interview is already completed (for add review case)
      const isAlreadyCompleted = completeReviewModal.interview.status === 'completed';
      
      if (!isAlreadyCompleted) {
        // First, mark interview as completed
        const { error: updateError } = await supabase
          .from('interviews')
          .update({ status: 'completed' })
          .eq('id', completeReviewModal.interview.id);

        if (updateError) throw updateError;
      }

      // Then, insert review into interview_reviews table
      const { error: reviewError } = await supabase
        .from('interview_reviews')
        .insert({
          interview_id: completeReviewModal.interview.id,
          rating: completeReviewData.rating,
          review_text: completeReviewData.review_text
        });

      if (reviewError) throw reviewError;

      toast({
        title: isAlreadyCompleted ? "Review Added" : "Interview Completed",
        description: isAlreadyCompleted 
          ? "Your review has been submitted successfully!"
          : "Interview marked as completed and your review has been submitted successfully!",
      });

      // Close modal and refresh
      setCompleteReviewModal({ open: false, interview: null });
      setCompleteReviewData({ rating: 3, review_text: '' });
      fetchInterviews();

    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  const handleNoShow = async (interviewId) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: 'no-show' })
        .eq('id', interviewId);

      if (error) throw error;

      fetchInterviews();
      toast({
        title: "Interview Updated",
        description: "Interview marked as no-show.",
      });
    } catch (error) {
      console.error('Error updating interview:', error);
      toast({
        title: "Error",
        description: "Failed to update interview status",
        variant: "destructive",
      });
    }
  };

  const hasReview = (interview) => {
    // Check if review data is in object format (one-to-one relationship)
    if (interview.interview_reviews && typeof interview.interview_reviews === 'object' && !Array.isArray(interview.interview_reviews)) {
      const hasReviewResult = interview.interview_reviews.rating && interview.interview_reviews.review_text && interview.interview_reviews.review_text.toString().trim() !== '';
      return hasReviewResult;
    }
    // Check if review data is in array format (for backward compatibility)
    if (interview.interview_reviews && Array.isArray(interview.interview_reviews) && interview.interview_reviews.length > 0) {
      const review = interview.interview_reviews[0];
      const hasReviewResult = review.rating && review.review_text && review.review_text.toString().trim() !== '';
      return hasReviewResult;
    }
    // Check if review data is flattened (from JOIN query)
    if (interview.rating && interview.review_text) {
      const hasReviewResult = interview.review_text.toString().trim() !== '';
      return hasReviewResult;
    }
    return false;
  };

  const getReview = (interview) => {
    // Return single object review data if available (one-to-one relationship)
    if (interview.interview_reviews && typeof interview.interview_reviews === 'object' && !Array.isArray(interview.interview_reviews) && hasReview(interview)) {
      return interview.interview_reviews;
    }
    // Return array review data if available (for backward compatibility)
    if (interview.interview_reviews && Array.isArray(interview.interview_reviews) && interview.interview_reviews.length > 0 && hasReview(interview)) {
      return interview.interview_reviews[0];
    }
    // Return flattened review data if available
    if (interview.rating && interview.review_text && hasReview(interview)) {
      return {
        rating: interview.rating,
        review_text: interview.review_text,
        created_at: interview.updated_at
      };
    }
    return null;
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Talent Acquisition Interviews</h1>
            <p className="text-muted-foreground">
              Manage your talent acquisition interviews and evaluations
            </p>
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-2">
            {['all', 'scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no-show'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
                className="capitalize"
              >
                {status === 'all' ? 'All' : status === 'no-show' ? 'No Show' : status.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Interviews List */}
        <div className="grid gap-4">
          {interviews.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No interviews found</h3>
                  <p className="text-muted-foreground">
                    {filter === 'all' 
                      ? "You don't have any talent acquisition interviews scheduled yet."
                      : `No ${filter === 'no-show' ? 'no show' : filter.replace('-', ' ')} interviews found.`
                    }
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            interviews.map((interview) => (
              <Card key={interview.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {interview.applications.talents.full_name}
                        </h3>
                        <p className="text-muted-foreground">
                          Applying for {interview.applications.jobs.title} at {interview.applications.jobs.employers.company_name}
                        </p>
                      </div>
                      {getStatusBadge(interview.status)}
                    </div>

                    {/* Candidate Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{interview.applications.talents.current_position || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{interview.applications.talents.city || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{interview.applications.talents.phone_number || 'Not provided'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(interview.scheduled_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(interview.scheduled_date)} ({interview.duration_minutes} minutes)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{interview.applications.jobs.employment_type} • {interview.applications.jobs.workplace}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meeting Link */}
                    {interview.meet_link && interview.status !== 'completed' && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Video className="h-4 w-4 text-blue-600" />
                        <a 
                          href={interview.meet_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Join Video Call
                        </a>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      {(interview.status === 'scheduled' || interview.status === 'confirmed') && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleCompleteAndReview(interview)}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Complete Interview & Submit Review
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleNoShow(interview.id)}
                              className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                            >
                              <XCircle className="h-4 w-4" />
                              No Show
                            </Button>
                          </div>
                          <p className="text-sm text-green-600">
                            ✓ Complete the interview and provide your evaluation of the candidate
                          </p>
                        </div>
                      )}
                      
                      {interview.status === 'completed' && hasReview(interview) && (
                        <div className="space-y-3 w-full">
                          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-emerald-800">✓ Evaluation Completed</h4>
                              <Badge className="bg-emerald-100 text-emerald-800">
                                {parseFloat(getReview(interview).rating).toFixed(1)} ⭐
                              </Badge>
                            </div>
                            <p className="text-sm text-emerald-700 mb-2">
                              {getReview(interview).review_text}
                            </p>
                            <p className="text-xs text-emerald-600">
                              Submitted on {new Date(getReview(interview).created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {interview.status === 'completed' && !hasReview(interview) && (
                        <Button 
                          onClick={() => handleCompleteAndReview(interview)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <Star className="h-4 w-4" />
                          Add Review
                        </Button>
                      )}
                      
                      {interview.status === 'no-show' && (
                        <div className="flex items-center gap-2 text-sm p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <XCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-orange-700">
                            Candidate did not attend the scheduled interview (No Show)
                          </span>
                        </div>
                      )}
                      
                      {interview.status === 'cancelled' && (
                        <div className="flex items-center gap-2 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-700">
                            Interview was cancelled
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Complete Interview & Review Modal */}
        <Dialog open={completeReviewModal.open} onOpenChange={(open) => {
          if (!open) {
            setCompleteReviewModal({ open: false, interview: null });
            setCompleteReviewData({ rating: 3, review_text: '' });
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Interview & Submit Review</DialogTitle>
              <DialogDescription>
                Evaluate the candidate's performance and provide feedback. This action will mark the interview as completed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <Label htmlFor="rating">Rating (1-5 stars)</Label>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCompleteReviewData({ ...completeReviewData, rating: star })}
                      className={`text-2xl ${
                        star <= completeReviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-500`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {completeReviewData.rating} star{completeReviewData.rating !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <Label htmlFor="review_text">Review & Feedback</Label>
                <Textarea
                  id="review_text"
                  placeholder="Share your thoughts about the candidate's performance, communication skills, experience, and fit for the role..."
                  value={completeReviewData.review_text}
                  onChange={(e) => setCompleteReviewData({ ...completeReviewData, review_text: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setCompleteReviewModal({ open: false, interview: null })}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteReviewSubmit}
                  disabled={submittingReview === 'completing' || !completeReviewData.review_text.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {submittingReview === 'completing' ? 'Submitting...' : 'Complete & Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </EmployerLayout>
  );
};

export default EmployerTalentAcquisitionInterviews;