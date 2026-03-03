import React, { useState, useEffect } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Video,
  Phone,
  CheckCircle,
  AlertCircle,
  Play,
  Download,
  Lightbulb,
} from "lucide-react";

interface Interview {
  id: number;
  company: string;
  companyLogo: string;
  jobTitle: string;
  interviewerName: string;
  interviewerRole: string;
  date: string;
  time: string;
  duration: string;
  type: "video" | "phone" | "in-person";
  meetingLink?: string;
  status: "upcoming" | "completed" | "cancelled";
  topics?: string[];
  feedback?: string;
  applicationId: number;
  scheduledDate: string;
}

const ITInterviews = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTalent, setCurrentTalent] = useState(null);

  // Load talent profile and interviews
  useEffect(() => {
    const loadInterviews = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Get current talent data
        const { data: talentData, error: talentError } = await supabase
          .from('talents')
          .select('id, full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (talentError) {
          console.error('Error loading talent:', talentError);
          throw talentError;
        }

        if (!talentData) {
          toast({
            title: "Profile Not Found",
            description: "Please complete your talent profile first.",
            variant: "destructive",
          });
          return;
        }

        setCurrentTalent(talentData);

        // Load technical interviews for this talent
        const { data: interviewData, error: interviewError } = await supabase
          .from('interviews')
          .select(`
            id,
            interview_type,
            status,
            scheduled_date,
            duration_minutes,
            meet_link,
            created_at,
            application_id,
            applications!inner (
              id,
              talent_id,
              jobs!inner (
                id,
                title,
                employers!inner (
                  id,
                  company_name,
                  logo_url
                )
              )
            ),
            interviewers (
              id,
              full_name,
              role
            )
          `)
          .eq('applications.talent_id', talentData.id)
          .eq('interview_type', 'technical')
          .order('scheduled_date', { ascending: false });

        if (interviewError) {
          console.error('Error loading interviews:', interviewError);
          throw interviewError;
        }

        console.log('🎯 Technical interviews loaded:', interviewData);

        // Transform interviews to match component format
        const transformedInterviews: Interview[] = (interviewData || []).map(interview => {
          const application = Array.isArray(interview.applications) 
            ? interview.applications[0] 
            : interview.applications;
          const job = Array.isArray(application?.jobs) 
            ? application.jobs[0] 
            : application?.jobs;
          const employer = Array.isArray(job?.employers) 
            ? job.employers[0] 
            : job?.employers;
          const interviewer = Array.isArray(interview.interviewers) 
            ? interview.interviewers[0] 
            : interview.interviewers;

          const scheduledDate = new Date(interview.scheduled_date);
          const now = new Date();
          
          // Determine status based on scheduled date and current status
          let displayStatus = interview.status;
          if (interview.status === 'scheduled' || interview.status === 'confirmed') {
            displayStatus = scheduledDate > now ? 'upcoming' : 'completed';
          }

          return {
            id: interview.id,
            applicationId: application?.id || 0,
            company: employer?.company_name || 'Unknown Company',
            companyLogo: employer?.company_name?.substring(0, 2).toUpperCase() || 'UK',
            jobTitle: job?.title || 'Unknown Position',
            interviewerName: interviewer?.full_name || 'You (Employer)',
            interviewerRole: interviewer?.role || 'Hiring Manager',
            date: scheduledDate.toLocaleDateString('en-GB'),
            time: scheduledDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            duration: `${interview.duration_minutes || 60} mins`,
            type: 'video' as const,
            meetingLink: interview.meet_link || undefined,
            status: displayStatus as 'upcoming' | 'completed' | 'cancelled',
            scheduledDate: interview.scheduled_date,
            topics: ['System design', 'Code review', 'Technical skills', 'Problem solving']
          };
        });

        setInterviews(transformedInterviews);
        
      } catch (error) {
        console.error('Error loading interviews:', error);
        toast({
          title: "Error",
          description: "Failed to load interviews. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadInterviews();
    }
  }, [user, authLoading, toast]);

  const handleJoinMeeting = (link?: string) => {
    if (link) {
      window.open(link, "_blank");
      toast({
        title: "Opening meeting link",
        description: "Joining the interview...",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      case "completed":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "cancelled":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5" />;
      case "phone":
        return <Phone className="w-5 h-5" />;
      case "in-person":
        return <MapPin className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Upcoming
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const upcomingInterviews = interviews.filter((i) => i.status === "upcoming");
  const completedInterviews = interviews.filter((i) => i.status === "completed");

  if (loading || authLoading) {
    return (
      <TalentLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading interviews...</div>
        </div>
      </TalentLayout>
    );
  }

  if (!currentTalent) {
    return (
      <TalentLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-gray-600">
            <p>Talent profile not found</p>
            <p className="text-sm">Please complete your profile setup</p>
          </div>
        </div>
      </TalentLayout>
    );
  }

  const InterviewCard = ({ interview }: { interview: Interview }) => (
    <div
      className={`rounded-xl border-2 p-6 transition-all hover:shadow-lg ${getStatusColor(
        interview.status
      )}`}
    >
      <div className="space-y-5">
        {/* Header with Company and Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
              {interview.companyLogo}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {interview.jobTitle}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {interview.company}
              </p>
            </div>
          </div>
          {getStatusBadge(interview.status)}
        </div>

        {/* Interviewer Info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-700 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-purple-600 dark:text-purple-300" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {interview.interviewerName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {interview.interviewerRole}
            </p>
          </div>
        </div>

        {/* Interview Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {interview.date}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {interview.time}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full font-medium">
              {interview.duration}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-purple-600">{getTypeIcon(interview.type)}</div>
            <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
              {interview.type}
            </span>
          </div>
        </div>

        {/* Discussion Topics */}
        {interview.topics && interview.topics.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Discussion Topics
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {interview.topics.map((topic, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-200"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {interview.feedback && interview.status === "completed" && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-l-4 border-green-500">
            <p className="text-sm font-semibold text-green-900 dark:text-green-200 mb-1">
              Feedback
            </p>
            <p className="text-sm text-green-800 dark:text-green-300">
              {interview.feedback}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {interview.status === "upcoming" && (
            <>
              <Button
                onClick={() => handleJoinMeeting(interview.meetingLink)}
                className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
                disabled={!interview.meetingLink}
              >
                <Play className="w-4 h-4" />
                {interview.meetingLink ? 'Join Meeting' : 'Meeting Link Pending'}
              </Button>
            </>
          )}
          {interview.status === "completed" && (
            <>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4" />
                Next Steps
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Summary
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <TalentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Technical Interviews
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Your technical interviews with engineering teams
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Upcoming ({upcomingInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed ({completedInterviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming */}
          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {upcomingInterviews.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {upcomingInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No upcoming interviews scheduled
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed */}
          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedInterviews.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {completedInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No completed interviews yet
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TalentLayout>
  );
};

export default ITInterviews;
