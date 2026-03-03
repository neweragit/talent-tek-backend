import LeadershipInterviewLayout from "@/components/layouts/leadershipInterview/LeadershipInterviewLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, CheckCircle, Clock, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const LeadershipInterviewOverview = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentInterviewer, setCurrentInterviewer] = useState(null);
  
  const [stats, setStats] = useState([
    {
      title: "Upcoming Interviews",
      value: 0,
      description: "Scheduled this week",
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Pending Reviews",
      value: 0,
      description: "Awaiting evaluation",
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Completed Interviews",
      value: 0,
      description: "This month",
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "In Progress",
      value: 0,
      description: "Today",
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
    },
  ]);

  const [pieData, setPieData] = useState([
    { name: "Completed", value: 0 },
    { name: "Pending", value: 0 },
    { name: "In Progress", value: 0 },
  ]);

  const [barData, setBarData] = useState([
    { month: "Jan", interviews: 0 },
    { month: "Feb", interviews: 0 },
    { month: "Mar", interviews: 0 },
    { month: "Apr", interviews: 0 },
    { month: "May", interviews: 0 },
    { month: "Jun", interviews: 0 },
  ]);

  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Load interviewer data and statistics
  useEffect(() => {
    loadInterviewerData();
  }, [user]);

  const loadInterviewerData = async () => {
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

      setCurrentInterviewer(interviewer);

      // Get interviews for this leadership interviewer
      const { data: interviews, error: interviewsError } = await supabase
        .from('interviews')
        .select(`
          *,
          applications (
            id,
            talents (
              full_name,
              users (
                email
              )
            ),
            jobs (
              title
            )
          )
        `)
        .eq('interviewer_id', interviewer.id)
        .eq('interview_type', 'leadership');

      if (interviewsError) {
        console.error('Error fetching interviews:', interviewsError);
        return;
      }

      // Process interviews data for dashboard
      const now = new Date();
      const today = now.toDateString();
      const thisWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcoming = interviews?.filter(interview => {
        const interviewDate = new Date(interview.scheduled_date);
        return interviewDate > now && interviewDate <= thisWeek;
      }) || [];

      const pendingReviews = interviews?.filter(interview => 
        interview.status === 'completed' && !interview.feedback_submitted
      ) || [];

      const completedThisMonth = interviews?.filter(interview => {
        const interviewDate = new Date(interview.scheduled_date);
        return interviewDate.getMonth() === now.getMonth() && 
               interviewDate.getFullYear() === now.getFullYear() &&
               interview.status === 'completed';
      }) || [];

      const inProgressToday = interviews?.filter(interview => {
        const interviewDate = new Date(interview.scheduled_date);
        return interviewDate.toDateString() === today && 
               interview.status === 'in_progress';
      }) || [];

      // Update stats
      setStats([
        {
          title: "Upcoming Interviews",
          value: upcoming.length,
          description: "Scheduled this week",
          icon: Calendar,
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          title: "Pending Reviews",
          value: pendingReviews.length,
          description: "Awaiting evaluation",
          icon: Users,
          gradient: "from-purple-500 to-pink-500",
        },
        {
          title: "Completed Interviews",
          value: completedThisMonth.length,
          description: "This month",
          icon: CheckCircle,
          gradient: "from-green-500 to-emerald-500",
        },
        {
          title: "In Progress",
          value: inProgressToday.length,
          description: "Today",
          icon: Clock,
          gradient: "from-orange-500 to-red-500",
        },
      ]);

      // Process pie chart data
      const completedCount = interviews?.filter(i => i.status === 'completed')?.length || 0;
      const pendingCount = interviews?.filter(i => i.status === 'scheduled')?.length || 0; 
      const inProgressCount = interviews?.filter(i => i.status === 'in_progress')?.length || 0;

      setPieData([
        { name: "Completed", value: completedCount },
        { name: "Pending", value: pendingCount },
        { name: "In Progress", value: inProgressCount },
      ]);

      // Set upcoming interviews for display
      setUpcomingInterviews(upcoming.slice(0, 5));

      // Generate recent activity
      const recentInterviews = interviews
        ?.filter(i => i.status === 'completed')
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
        .slice(0, 5)
        .map(interview => ({
          id: interview.id,
          type: 'interview_completed',
          message: `Completed leadership interview with ${interview.applications?.talents?.full_name || 'candidate'}`,
          time: new Date(interview.scheduled_date).toLocaleDateString(),
          candidate: interview.applications?.talents?.full_name || 'Unknown',
        })) || [];

      setRecentActivity(recentInterviews);

    } catch (error) {
      console.error('Error loading interviewer data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leadership Interview Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {currentInterviewer?.full_name || currentInterviewer?.name || user?.email}! Here's your leadership interview overview.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="thismonth">This Month</SelectItem>
                <SelectItem value="lastmonth">Last Month</SelectItem>
                <SelectItem value="thisquarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`}></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart - Interview Status */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-orange-500" />
                Interview Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart - Monthly Interviews */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Monthly Interview Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="interviews" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Upcoming Interviews & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Interviews */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingInterviews.length > 0 ? (
                  upcomingInterviews.map((interview, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Crown className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {interview.applications?.talents?.full_name || 'Candidate'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {interview.applications?.jobs?.title || 'Position'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(interview.scheduled_date).toLocaleDateString()} at{' '}
                          {new Date(interview.scheduled_date).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No upcoming interviews scheduled</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LeadershipInterviewLayout>
  );
};

export default LeadershipInterviewOverview;