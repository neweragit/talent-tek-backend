import TechnicalInterviewLayout from "@/components/layouts/technicalInterview/TechnicalInterviewLayout";
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

const TechnicalInterviewInterviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentInterviewer, setCurrentInterviewer] = useState(null);
  const [filter, setFilter] = useState("all");
  const [submittingReview, setSubmittingReview] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, review_text: '' });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, interview: null });
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', duration: 60 });
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [reviewModal, setReviewModal] = useState({ open: false, interview: null });
  const [modalReviewData, setModalReviewData] = useState({ rating: 3, review_text: '' });
  const [completeReviewModal, setCompleteReviewModal] = useState({ open: false, interview: null });
  const [completeReviewData, setCompleteReviewData] = useState({ rating: 3, review_text: '' });

  useEffect(() => {
    if (user) {
      fetchInterviewerData();
    }
  }, [user]);

  useEffect(() => {
    if (currentInterviewer) {
      fetchInterviews();
    }
  }, [currentInterviewer, filter]);

  const fetchInterviewerData = async () => {
    try {
      const { data: interviewer, error } = await supabase
        .from('interviewers')
        .select('*')
        .eq('user_id', user.id)
        .eq('interview_type', 'technical')
        .single();

      if (error) throw error;
      setCurrentInterviewer(interviewer);
    } catch (error) {
      console.error('Error fetching interviewer data:', error);
      toast({
        title: "Error",
        description: "Failed to load interviewer profile",
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
        .eq('interviewer_id', currentInterviewer.id)
        .eq('interview_type', 'technical')
        .order('scheduled_date', { ascending: true });

      // Apply filter
      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log('Fetched interviews data:', data);
      if (data && data.length > 0) {
        console.log('First interview detailed structure:', JSON.stringify(data[0], null, 2));
      }
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
      console.error('Error completing interview and submitting review:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to complete interview and submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  const handleReschedule = async (interview) => {
    // Open reschedule modal instead of immediately updating status
    const currentDate = new Date(interview.scheduled_date);
    setRescheduleData({
      date: currentDate.toISOString().split('T')[0],
      time: currentDate.toTimeString().slice(0, 5),
      duration: interview.duration_minutes || 60
    });
    setRescheduleModal({ open: true, interview });
  };

  const checkScheduleConflicts = async (newDate, newTime, duration, excludeInterviewId) => {
    try {
      setCheckingConflicts(true);
      
      if (!newDate || !newTime || !currentInterviewer || !rescheduleModal.interview) {
        setConflicts([]);
        return true;
      }
      
      const scheduledDateTime = new Date(`${newDate}T${newTime}:00`);
      const endDateTime = new Date(scheduledDateTime.getTime() + (duration * 60000));
      
      // Check interviewer conflicts
      const { data: interviewerConflicts, error: interviewerError } = await supabase
        .from('interviews')
        .select('*')
        .eq('interviewer_id', currentInterviewer.id)
        .neq('id', excludeInterviewId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_date', scheduledDateTime.toISOString())
        .lte('scheduled_date', endDateTime.toISOString());

      if (interviewerError) throw interviewerError;

      // Get talent ID safely
      const talentId = rescheduleModal.interview?.applications?.talents?.id ||
                      rescheduleModal.interview?.applications?.talent_id;
      
      if (!talentId) {
        console.warn('No talent ID found for conflict checking');
        setConflicts([]);
        return true;
      }

      // Check candidate conflicts
      const { data: candidateConflicts, error: candidateError } = await supabase
        .from('interviews')
        .select(`
          *,
          applications!inner(
            talent_id,
            talents(full_name)
          )
        `)
        .eq('applications.talent_id', talentId)
        .neq('id', excludeInterviewId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_date', scheduledDateTime.toISOString())
        .lte('scheduled_date', endDateTime.toISOString());

      if (candidateError) throw candidateError;

      const allConflicts = [];
      
      if (interviewerConflicts?.length > 0) {
        allConflicts.push(`You have ${interviewerConflicts.length} other interview(s) at this time`);
      }
      
      if (candidateConflicts?.length > 0) {
        allConflicts.push(`Candidate has ${candidateConflicts.length} other interview(s) at this time`);
      }

      setConflicts(allConflicts);
      return allConflicts.length === 0;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setConflicts(['Unable to check conflicts - please verify manually']);
      return false;
    } finally {
      setCheckingConflicts(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    try {
      // Check for conflicts first
      const noConflicts = await checkScheduleConflicts(
        rescheduleData.date,
        rescheduleData.time,
        rescheduleData.duration,
        rescheduleModal.interview.id
      );

      if (!noConflicts && conflicts.length > 0) {
        toast({
          title: "Schedule Conflict",
          description: "Please choose a different time to avoid conflicts.",
          variant: "destructive",
        });
        return;
      }

      const newScheduledDate = new Date(`${rescheduleData.date}T${rescheduleData.time}:00`);
      
      const { error } = await supabase
        .from('interviews')
        .update({ 
          scheduled_date: newScheduledDate.toISOString(),
          duration_minutes: rescheduleData.duration,
          status: 'scheduled'
        })
        .eq('id', rescheduleModal.interview.id);

      if (error) throw error;

      setRescheduleModal({ open: false, interview: null });
      setRescheduleData({ date: '', time: '', duration: 60 });
      setConflicts([]);
      fetchInterviews();
      
      toast({
        title: "Interview Rescheduled",
        description: `Interview rescheduled to ${newScheduledDate.toLocaleDateString()} at ${newScheduledDate.toLocaleTimeString()}`,
      });
      
      // Show review modal after successful reschedule
      setReviewModal({ open: true, interview: rescheduleModal.interview });
    } catch (error) {
      console.error('Error rescheduling interview:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule interview",
        variant: "destructive",
      });
    }
  };

  const handleRescheduleCancel = () => {
    setRescheduleModal({ open: false, interview: null });
    setRescheduleData({ date: '', time: '', duration: 60 });
    setConflicts([]);
  };

  const handleReviewSubmit = async (interviewId) => {
    try {
      setSubmittingReview(interviewId);
      
      const { error } = await supabase
        .from('interview_reviews')
        .insert({
          interview_id: interviewId,
          rating: modalReviewData.rating,
          review_text: modalReviewData.review_text
        });

      if (error) throw error;

      // Close modal and refresh
      setReviewModal({ open: false, interview: null });
      setModalReviewData({ rating: 3, review_text: '' });
      fetchInterviews();
      
      toast({
        title: "Review Submitted",
        description: "Your interview evaluation has been saved successfully.",
      });
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

  const handleReviewCancel = () => {
    setReviewModal({ open: false, interview: null });
    setModalReviewData({ rating: 3, review_text: '' });
  };

  // Check conflicts whenever date/time changes
  useEffect(() => {
    if (rescheduleModal.open && rescheduleData.date && rescheduleData.time) {
      const debounceTimer = setTimeout(() => {
        checkScheduleConflicts(
          rescheduleData.date,
          rescheduleData.time,
          rescheduleData.duration,
          rescheduleModal.interview?.id
        );
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [rescheduleData.date, rescheduleData.time, rescheduleData.duration]);

  const handleNoShow = async (interviewId) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: 'no-show' })
        .eq('id', interviewId);

      if (error) throw error;

      fetchInterviews();
      toast({
        title: "Marked as No Show",
        description: "Candidate did not attend the scheduled interview.",
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

  const handleCancel = async (interviewId) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: 'cancelled' })
        .eq('id', interviewId);

      if (error) throw error;

      fetchInterviews();
      toast({
        title: "Interview Cancelled",
        description: "Interview has been cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling interview:', error);
      toast({
        title: "Error",
        description: "Failed to cancel interview",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = async (interviewId) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: 'confirmed' })
        .eq('id', interviewId);

      if (error) throw error;

      fetchInterviews();
      toast({
        title: "Interview Confirmed",
        description: "Interview has been confirmed and is ready to proceed.",
      });
    } catch (error) {
      console.error('Error confirming interview:', error);
      toast({
        title: "Error",
        description: "Failed to confirm interview",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async (interviewId) => {
    try {
      setSubmittingReview(interviewId);
      
      const { error } = await supabase
        .from('interview_reviews')
        .insert({
          interview_id: interviewId,
          rating: reviewData.rating,
          review_text: reviewData.review_text
        });

      if (error) throw error;

      // Reset form and refresh interviews
      setReviewData({ rating: 5, review_text: '' });
      fetchInterviews();
      
      toast({
        title: "Review Submitted",
        description: "Your interview feedback has been saved successfully.",
      });
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

  const hasReview = (interview) => {
    console.log('Checking hasReview for interview:', interview.id, {
      interview_reviews: interview.interview_reviews,
      rating: interview.rating,
      review_text: interview.review_text,
      status: interview.status
    });
    
    // Check if review data is in object format (one-to-one relationship)
    if (interview.interview_reviews && typeof interview.interview_reviews === 'object' && !Array.isArray(interview.interview_reviews)) {
      const hasReviewResult = interview.interview_reviews.rating && interview.interview_reviews.review_text && interview.interview_reviews.review_text.toString().trim() !== '';
      console.log('Single object review check result:', hasReviewResult, interview.interview_reviews);
      return hasReviewResult;
    }
    // Check if review data is in array format (for backward compatibility)
    if (interview.interview_reviews && Array.isArray(interview.interview_reviews) && interview.interview_reviews.length > 0) {
      const review = interview.interview_reviews[0];
      const hasReviewResult = review.rating && review.review_text && review.review_text.toString().trim() !== '';
      console.log('Array review check result:', hasReviewResult, review);
      return hasReviewResult;
    }
    // Check if review data is flattened (from JOIN query)
    if (interview.rating && interview.review_text) {
      const hasReviewResult = interview.review_text.toString().trim() !== '';
      console.log('Flattened review check result:', hasReviewResult);
      return hasReviewResult;
    }
    console.log('No review found');
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
      <TechnicalInterviewLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </TechnicalInterviewLayout>
    );
  }

  return (
    <TechnicalInterviewLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Interviews</h1>
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
                      ? "You don't have any interviews scheduled yet."
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
                      {interview.status === 'scheduled' && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleCompleteAndReview(interview)}
                              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                            >
                              <AlertCircle className="h-4 w-4" />
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
                            <Button 
                              variant="outline"
                              onClick={() => handleReschedule(interview)}
                              className="flex items-center gap-2"
                            >
                              <CalendarIcon className="h-4 w-4" />
                              Reschedule
                            </Button>
                          </div>
                          <p className="text-sm text-red-600">
                            ⚠️ Completing the interview will permanently mark it as finished and cannot be undone
                          </p>
                        </div>
                      )}
                      
                      {interview.status === 'confirmed' && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleCompleteAndReview(interview)}
                              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                            >
                              <AlertCircle className="h-4 w-4" />
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
                            <Button 
                              variant="outline"
                              onClick={() => handleReschedule(interview)}
                              className="flex items-center gap-2"
                            >
                              <CalendarIcon className="h-4 w-4" />
                              Reschedule
                            </Button>
                          </div>
                          <p className="text-sm text-red-600">
                            ⚠️ Completing the interview will permanently mark it as finished and cannot be undone
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
                      
                      {interview.status === 'rescheduled' && (
                        <div className="flex items-center gap-2 text-sm p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-700">
                            Interview rescheduled due to technical issues or other circumstances. Please coordinate with the candidate for a new time.
                          </span>
                        </div>
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
      </div>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModal.open} onOpenChange={(open) => !open && handleRescheduleCancel()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Reschedule Interview
            </DialogTitle>
            <DialogDescription>
              Select a new date and time for this interview. The system will check for conflicts automatically.
            </DialogDescription>
          </DialogHeader>
          
          {rescheduleModal.interview && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border">
                <p className="font-medium text-blue-900">
                  {rescheduleModal.interview.applications.talents.full_name}
                </p>
                <p className="text-sm text-blue-700">
                  {rescheduleModal.interview.applications.jobs.title}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">New Date</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData(prev => ({...prev, date: e.target.value}))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reschedule-time">New Time</Label>
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData(prev => ({...prev, time: e.target.value}))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <select
                  id="duration"
                  value={rescheduleData.duration}
                  onChange={(e) => setRescheduleData(prev => ({...prev, duration: parseInt(e.target.value)}))}
                  className="w-full p-2 border rounded"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              
              {/* Conflict Warnings */}
              {checkingConflicts && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Checking for schedule conflicts...
                </div>
              )}
              
              {conflicts.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Schedule Conflicts Detected
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {conflicts.length === 0 && rescheduleData.date && rescheduleData.time && !checkingConflicts && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  No conflicts - This time slot is available
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleRescheduleSubmit}
                  disabled={!rescheduleData.date || !rescheduleData.time || checkingConflicts || conflicts.length > 0}
                  className="flex-1"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Confirm Reschedule
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleRescheduleCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={reviewModal.open} onOpenChange={(open) => !open && handleReviewCancel()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Submit Interview Review
            </DialogTitle>
            <DialogDescription>
              Please provide your evaluation for this interview. This can only be submitted once.
            </DialogDescription>
          </DialogHeader>
          
          {reviewModal.interview && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="font-medium text-emerald-900">
                  {reviewModal.interview.applications.talents.full_name}
                </p>
                <p className="text-sm text-emerald-700">
                  {reviewModal.interview.applications.jobs.title}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  ✓ Interview successfully rescheduled
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="modal-rating">Rating (1-5 stars)</Label>
                  <select 
                    id="modal-rating"
                    value={modalReviewData.rating}
                    onChange={(e) => setModalReviewData(prev => ({...prev, rating: parseInt(e.target.value)}))}
                    className="w-full p-2 border rounded"
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''} {'★'.repeat(num)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modal-review">Professional Evaluation</Label>
                  <textarea
                    id="modal-review"
                    value={modalReviewData.review_text}
                    onChange={(e) => setModalReviewData(prev => ({...prev, review_text: e.target.value}))}
                    placeholder="Please provide your professional assessment of the candidate's suitability for this role, including communication skills, technical competency, cultural fit, and overall interview performance..."
                    className="w-full p-3 border rounded min-h-[120px] resize-none"
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {modalReviewData.review_text.length}/1000 characters
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Important:</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  This review can only be submitted once and cannot be edited afterward. Please ensure your evaluation is complete and accurate.
                </p>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => handleReviewSubmit(reviewModal.interview.id)}
                  disabled={submittingReview === reviewModal.interview.id || !modalReviewData.review_text.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {submittingReview === reviewModal.interview.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Review (Final)
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleReviewCancel}
                  disabled={submittingReview === reviewModal.interview.id}
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Interview & Submit Review Modal */}
      <Dialog open={completeReviewModal.open} onOpenChange={(open) => !open && setCompleteReviewModal({ open: false, interview: null })}>
        <DialogContent className="max-w-2xl" aria-describedby="complete-review-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              {completeReviewModal.interview?.status === 'completed' ? 'Add Review' : 'Complete Interview & Submit Review'}
            </DialogTitle>
            <p id="complete-review-description" className="text-sm text-red-600 mt-2">
              {completeReviewModal.interview?.status === 'completed' 
                ? '⚠️ Warning: This review will be permanently saved and cannot be edited afterward.'
                : '⚠️ Warning: This action will permanently complete the interview and submit your review. This cannot be undone.'}
            </p>
          </DialogHeader>
          
          {completeReviewModal.interview && (
            <div className="space-y-6">
              {/* Interview Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Interview Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Candidate:</span>
                    <div className="font-medium">{completeReviewModal.interview.applications?.talents?.full_name || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <div className="font-medium">{completeReviewModal.interview.applications?.jobs?.title || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Company:</span>
                    <div className="font-medium">{completeReviewModal.interview.applications?.jobs?.employers?.company_name || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <div className="font-medium">{completeReviewModal.interview.duration_minutes} minutes</div>
                  </div>
                </div>
              </div>

              {/* Red Warning Section */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  {completeReviewModal.interview?.status === 'completed' ? 'PERMANENT REVIEW' : 'PERMANENT ACTION'}
                </div>
                <p className="text-sm text-red-700">
                  {completeReviewModal.interview?.status === 'completed'
                    ? 'Once you submit this review, it will be permanently saved and cannot be edited or deleted afterward.'
                    : 'Once you submit this form, the interview will be marked as completed and your review will be permanently saved. You will not be able to edit or change this information afterward.'}
                </p>
              </div>

              {/* Rating Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Overall Rating *</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      variant={completeReviewData.rating >= num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCompleteReviewData(prev => ({...prev, rating: num}))}
                      className="p-2"
                      type="button"
                    >
                      <Star className={`w-4 h-4 ${completeReviewData.rating >= num ? 'fill-current' : ''}`} />
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {completeReviewData.rating === 1 && "Poor - Did not meet expectations"}
                  {completeReviewData.rating === 2 && "Below Average - Needs improvement"}
                  {completeReviewData.rating === 3 && "Average - Met basic expectations"}
                  {completeReviewData.rating === 4 && "Good - Exceeded expectations"}
                  {completeReviewData.rating === 5 && "Excellent - Outstanding performance"}
                </p>
              </div>

              {/* Review Text */}
              <div className="space-y-3">
                <Label htmlFor="complete-review-text" className="text-sm font-medium text-gray-700">
                  Review Comments * <span className="text-red-500">(Required)</span>
                </Label>
                <textarea
                  id="complete-review-text"
                  placeholder="Please provide detailed feedback about the candidate's performance, skills, communication, cultural fit, and overall assessment..."
                  value={completeReviewData.review_text}
                  onChange={(e) => setCompleteReviewData(prev => ({...prev, review_text: e.target.value}))}
                  className="w-full p-3 border rounded min-h-[120px] resize-none"
                  maxLength={2000}
                />
                <div className="text-xs text-gray-500 text-right">
                  {completeReviewData.review_text.length}/2000 characters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCompleteReviewModal({ open: false, interview: null })}
                  disabled={submittingReview === 'completing'}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCompleteReviewSubmit} 
                  disabled={submittingReview === 'completing' || !completeReviewData.review_text.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {submittingReview === 'completing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing Interview...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {completeReviewModal.interview?.status === 'completed' ? 'Submit Review' : 'Complete Interview & Submit Review'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TechnicalInterviewLayout>
  );
};

export default TechnicalInterviewInterviews;