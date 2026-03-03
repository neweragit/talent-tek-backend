import LeadershipInterviewLayout from "@/components/layouts/leadershipInterview/LeadershipInterviewLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, User, Mail, Phone, MapPin, Briefcase, Calendar, Star, Award, Edit2, Save, X, UserCheck, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type InterviewerProfile = {
  id: string | number;
  email?: string;
  full_name?: string;
  name?: string;
  phone?: string;
  location?: string;
  specialization?: string;
  years_experience?: number;
  bio?: string;
  profile_picture?: string;
  created_at?: string;
  email_notifications?: boolean;
  sms_reminders?: boolean;
  available_urgent?: boolean;
  focus_areas?: string;
  interview_style?: string;
  [key: string]: unknown;
};

const LeadershipInterviewProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [currentInterviewer, setCurrentInterviewer] = useState<InterviewerProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<InterviewerProfile>>({});
  const [activeTab, setActiveTab] = useState("profile");

  // Statistics
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    pendingReviews: 0,
    averageRating: 0,
    upcomingInterviews: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      let interviewer = null;

      if (user?.id) {
        const { data, error } = await supabase
          .from('interviewers')
          .select('*')
          .eq('user_id', user.id)
          .eq('interview_type', 'leadership')
          .maybeSingle();

        if (error) {
          console.error('Error fetching interviewer by user_id:', error);
        }

        interviewer = data;
      }

      if (!interviewer && user?.email) {
        const { data, error } = await supabase
          .from('interviewers')
          .select('*')
          .eq('email', user.email)
          .eq('interview_type', 'leadership')
          .maybeSingle();

        if (error) {
          console.error('Error fetching interviewer by email:', error);
        }

        interviewer = data;
      }

      if (!interviewer) {
        toast({
          title: "Not Found",
          description: "No leadership interviewer profile matched your account",
          variant: "destructive",
        });
        return;
      }

      setCurrentInterviewer(interviewer as InterviewerProfile);
      setEditedProfile(interviewer as InterviewerProfile);

      // Get statistics
      const { data: interviewsData, error: statsError } = await supabase
        .from('interviews')
        .select('*')
        .eq('interviewer_id', interviewer.id)
        .eq('interview_type', 'leadership');

      if (!statsError && interviewsData) {
        const totalInterviews = interviewsData.length;
        const completedInterviews = interviewsData.filter(i => i.status === 'completed').length;
        const pendingReviews = interviewsData.filter(i => i.status === 'completed' && !i.feedback_submitted).length;
        const upcomingInterviews = interviewsData.filter(i => 
          new Date(i.scheduled_date) > new Date() && i.status !== 'completed'
        ).length;
        
        // Calculate average rating from feedback scores
        const completedWithRatings = interviewsData.filter(i => 
          i.status === 'completed' && i.overall_score
        );
        const averageRating = completedWithRatings.length > 0 
          ? completedWithRatings.reduce((sum, i) => sum + i.overall_score, 0) / completedWithRatings.length
          : 0;

        setStats({
          totalInterviews,
          completedInterviews,
          pendingReviews,
          averageRating: parseFloat(averageRating.toFixed(1)),
          upcomingInterviews
        });
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentInterviewer?.id) return;
    
    try {
      const { error } = await supabase
        .from('interviewers')
        .update(editedProfile)
        .eq('id', currentInterviewer.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
        return;
      }

      setCurrentInterviewer((prev) => ({
        ...(prev ?? { id: currentInterviewer.id }),
        ...editedProfile,
      }));
      setEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(currentInterviewer ?? {});
    setEditing(false);
  };

  if (loading) {
    return (
      <LeadershipInterviewLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </LeadershipInterviewLayout>
    );
  }

  return (
    <LeadershipInterviewLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Crown className="h-8 w-8 text-orange-500" />
              Leadership Interviewer Profile
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your profile and interview settings
            </p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="bg-orange-600 hover:bg-orange-700">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancelEdit} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border-b w-full justify-start rounded-none h-auto p-0 mb-6">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none px-6 py-3 transition-all text-gray-700"
            >
              <User className="h-4 w-4 mr-2" />
              Profile Information
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none px-6 py-3 transition-all text-gray-700"
            >
              <Award className="h-4 w-4 mr-2" />
              Interview Statistics
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none px-6 py-3 transition-all text-gray-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Information */}
          <TabsContent value="profile">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg">
                  <CardContent className="p-6 text-center">
                    <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-orange-100">
                      <AvatarImage src={currentInterviewer?.profile_picture} />
                      <AvatarFallback className="text-3xl bg-orange-50 text-orange-600">
                        <Crown className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentInterviewer?.full_name || currentInterviewer?.name || 'Leadership Interviewer'}
                    </h2>
                    
                    <Badge className="bg-orange-100 text-orange-800 mb-4">
                      <Crown className="h-3 w-3 mr-1" />
                      Leadership Specialist
                    </Badge>
                    
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-gray-600">{currentInterviewer?.email}</span>
                      </div>
                      
                      {currentInterviewer?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-gray-600">{currentInterviewer.phone}</span>
                        </div>
                      )}
                      
                      {currentInterviewer?.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-gray-600">{currentInterviewer.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-gray-600">
                          Active since {new Date(currentInterviewer?.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-orange-500" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={
                            editing
                              ? editedProfile.full_name ?? editedProfile.name ?? ''
                              : currentInterviewer?.full_name ?? currentInterviewer?.name ?? ''
                          }
                          onChange={(e) => editing && setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                          disabled={!editing}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={currentInterviewer?.email || ''}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={editing ? editedProfile.phone || '' : currentInterviewer?.phone || ''}
                          onChange={(e) => editing && setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!editing}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editing ? editedProfile.location || '' : currentInterviewer?.location || ''}
                          onChange={(e) => editing && setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                          disabled={!editing}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-orange-500" />
                      Professional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="specialization">Leadership Specialization</Label>
                      <Input
                        id="specialization"
                        value={editing ? editedProfile.specialization || '' : currentInterviewer?.specialization || 'Executive Leadership Assessment'}
                        onChange={(e) => editing && setEditedProfile(prev => ({ ...prev, specialization: e.target.value }))}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        value={editing ? editedProfile.years_experience || '' : currentInterviewer?.years_experience || ''}
                        onChange={(e) => editing && setEditedProfile(prev => ({ ...prev, years_experience: parseInt(e.target.value) }))}
                        disabled={!editing}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        value={editing ? editedProfile.bio || '' : currentInterviewer?.bio || ''}
                        onChange={(e) => editing && setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!editing}
                        rows={4}
                        className="mt-1"
                        placeholder="Describe your leadership interview expertise and background..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="statistics">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="shadow-lg border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.totalInterviews}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-green-600">{stats.completedInterviews}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.pendingReviews}</p>
                    </div>
                    <Edit2 className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Rating</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.averageRating}</p>
                    </div>
                    <Star className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-500" />
                  Interview Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Interview Completion Rate</span>
                      <span>{stats.totalInterviews > 0 ? Math.round((stats.completedInterviews / stats.totalInterviews) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${stats.totalInterviews > 0 ? (stats.completedInterviews / stats.totalInterviews) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Review Completion Rate</span>
                      <span>{stats.completedInterviews > 0 ? Math.round(((stats.completedInterviews - stats.pendingReviews) / stats.completedInterviews) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${stats.completedInterviews > 0 ? ((stats.completedInterviews - stats.pendingReviews) / stats.completedInterviews) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.upcomingInterviews}</p>
                      <p className="text-sm text-blue-800">Upcoming Interviews</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.averageRating}/10</p>
                      <p className="text-sm text-green-800">Average Score</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">Leadership</p>
                      <p className="text-sm text-orange-800">Specialization</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="settings">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-500" />
                    Interview Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive emails about new interviews and updates</p>
                    </div>
                    <Switch 
                      defaultChecked={currentInterviewer?.email_notifications !== false}
                      disabled={!editing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">SMS Reminders</Label>
                      <p className="text-sm text-gray-500">Get text reminders for upcoming interviews</p>
                    </div>
                    <Switch 
                      defaultChecked={currentInterviewer?.sms_reminders === true}
                      disabled={!editing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Available for Urgent Interviews</Label>
                      <p className="text-sm text-gray-500">Allow scheduling of same-day interviews</p>
                    </div>
                    <Switch 
                      defaultChecked={currentInterviewer?.available_urgent !== false}
                      disabled={!editing}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-orange-500" />
                    Leadership Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="focus_areas">Primary Focus Areas</Label>
                      <Textarea
                        id="focus_areas"
                        value={editing ? editedProfile.focus_areas || '' : currentInterviewer?.focus_areas || 'Strategic Leadership, Team Management, Executive Decision Making'}
                        onChange={(e) => editing && setEditedProfile(prev => ({ ...prev, focus_areas: e.target.value }))}
                        disabled={!editing}
                        rows={3}
                        className="mt-1"
                        placeholder="E.g., Strategic Leadership, Team Management, Change Management..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="interview_style">Interview Style</Label>
                      <Textarea
                        id="interview_style"
                        value={editing ? editedProfile.interview_style || '' : currentInterviewer?.interview_style || 'Behavioral-based questions focused on leadership scenarios and decision-making processes'}
                        onChange={(e) => editing && setEditedProfile(prev => ({ ...prev, interview_style: e.target.value }))}
                        disabled={!editing}
                        rows={3}
                        className="mt-1"
                        placeholder="Describe your interview approach and methodology..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {['Strategic Thinking', 'Team Leadership', 'Change Management', 'Executive Presence', 'Decision Making', 'Vision & Innovation'].map((skill) => (
                        <Badge key={skill} className="bg-orange-100 text-orange-800">
                          <Crown className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LeadershipInterviewLayout>
  );
};

export default LeadershipInterviewProfile;