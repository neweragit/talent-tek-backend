import TalentAcquisitionLayout from "@/components/layouts/talentAcquisition/TalentAcquisitionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, CheckCircle, Clock, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const TalentAcquisitionOverview = () => {
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
    { name: "Cancelled", value: 0 },
  ]);

  const [barData, setBarData] = useState([]);

  const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444"];

  useEffect(() => {
    if (user && !authLoading) {
      fetchInterviewerData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (currentInterviewer) {
      fetchDashboardData();
    }
  }, [currentInterviewer, selectedMonth]);

  const fetchInterviewerData = async () => {
    try {
      const { data: interviewer, error } = await supabase
        .from('interviewers')
        .select('*')
        .eq('user_id', user.id)
        .eq('interview_type', 'talent-acquisition')
        .single();

      if (error) {
        console.error('Error fetching interviewer data:', error);
        toast({
          title: "Error",
          description: "Failed to load interviewer profile",
          variant: "destructive",
        });
        return;
      }

      setCurrentInterviewer(interviewer);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load interviewer data",
        variant: "destructive",
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Current date for filtering
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch interviews data
      let query = supabase
        .from('interviews')
        .select(`
          *,
          applications!inner(
            *,
            talents(full_name),
            jobs!inner(
              title,
              employers!inner(company_name)
            )
          )
        `)
        .eq('interviewer_id', currentInterviewer.id)
        .eq('interview_type', 'talent-acquisition');

      // Apply month filter if not "all"
      if (selectedMonth !== "all") {
        const year = new Date().getFullYear();
        const month = parseInt(selectedMonth);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);
        
        query = query
          .gte('scheduled_date', monthStart.toISOString())
          .lte('scheduled_date', monthEnd.toISOString());
      }

      const { data: interviews, error: interviewsError } = await query;

      if (interviewsError) {
        throw interviewsError;
      }

      // Calculate stats
      const upcomingThisWeek = interviews.filter(interview => {
        const interviewDate = new Date(interview.scheduled_date);
        return interviewDate >= startOfWeek && interviewDate <= endOfWeek && interview.status === 'scheduled';
      }).length;

      const pendingReviews = interviews.filter(interview => 
        interview.status === 'completed' && !interview.interviewer_feedback
      ).length;

      const completedThisMonth = interviews.filter(interview => {
        const interviewDate = new Date(interview.scheduled_date);
        return interviewDate >= startOfMonth && 
               interviewDate <= endOfMonth && 
               interview.status === 'completed';
      }).length;

      const inProgressToday = interviews.filter(interview => {
        const interviewDate = new Date(interview.scheduled_date);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        return interviewDate >= today && 
               interviewDate <= todayEnd && 
               interview.status === 'in-progress';
      }).length;

      // Update stats
      setStats(prev => [
        { ...prev[0], value: upcomingThisWeek },
        { ...prev[1], value: pendingReviews },
        { ...prev[2], value: completedThisMonth },
        { ...prev[3], value: inProgressToday },
      ]);

      // Calculate pie chart data
      const completedCount = interviews.filter(i => i.status === 'completed').length;
      const pendingCount = interviews.filter(i => i.status === 'scheduled').length;
      const inProgressCount = interviews.filter(i => i.status === 'in-progress').length;
      const cancelledCount = interviews.filter(i => i.status === 'cancelled').length;

      setPieData([
        { name: "Completed", value: completedCount },
        { name: "Pending", value: pendingCount },
        { name: "In Progress", value: inProgressCount },
        { name: "Cancelled", value: cancelledCount },
      ]);

      // Calculate bar chart data (interviews per week for the last 8 weeks)
      const weeks = [];
      const currentDate = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - (i * 7) - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekInterviews = interviews.filter(interview => {
          const interviewDate = new Date(interview.scheduled_date);
          return interviewDate >= weekStart && interviewDate <= weekEnd;
        });

        weeks.push({
          week: `Week ${8-i}`,
          interviews: weekInterviews.length,
          completed: weekInterviews.filter(i => i.status === 'completed').length,
        });
      }
      setBarData(weeks);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <TalentAcquisitionLayout>
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground">
              Welcome back, {currentInterviewer?.full_name || user.email}! Here's your talent acquisition overview.
            </p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md bg-gradient-to-r ${stat.gradient}`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Interview Trends</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="interviews" fill="#8884d8" name="Total Interviews" />
                  <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Interview Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
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
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Interview Activity</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your latest talent acquisition interviews and reviews
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* This would be populated with actual recent interviews */}
                <div className="flex items-center">
                  <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Interview completed with John Doe
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Marketing Specialist position - 2 hours ago
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TalentAcquisitionLayout>
  );
};

export default TalentAcquisitionOverview;