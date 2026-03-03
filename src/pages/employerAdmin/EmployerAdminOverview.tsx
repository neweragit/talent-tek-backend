import { useState, useEffect } from "react";
import EmployerAdminLayout from "@/components/layouts/EmployerAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, UserCheck, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function EmployerAdminOverview() {
  const { toast } = useToast();
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployers: 0,
    activeEmployers: 0,
    totalInterviews: 0,
    avgPerEmployer: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [employerPerformanceData, setEmployerPerformanceData] = useState([]);

  // Generate available months (last 12 months including current)
  const availableMonths = [];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    availableMonths.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    });
  }

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Load total employers
      const { data: employers, error: employersError } = await supabase
        .from("employers")
        .select("id, company_name, created_at");

      if (employersError) throw employersError;

      // Load active employers (those with jobs)
      const { data: activeEmployers, error: activeError } = await supabase
        .from("employers")
        .select("id")
        .in("id", 
          await supabase
            .from("jobs")
            .select("employer_id")
            .then(res => res.data?.map(j => j.employer_id) || [])
        );

      // Load applications (interviews) for selected month
      const [yearStr, monthStr] = selectedMonth.split('-');
      const selectedYear = parseInt(yearStr);
      const selectedMonthNum = parseInt(monthStr);
      const firstDayOfMonth = new Date(selectedYear, selectedMonthNum, 1);
      const lastDayOfMonth = new Date(selectedYear, selectedMonthNum + 1, 0);

      const { data: interviews, error: interviewsError } = await supabase
        .from("applications")
        .select("id, employer_id, applied_at")
        .gte("applied_at", firstDayOfMonth.toISOString())
        .lte("applied_at", lastDayOfMonth.toISOString());

      if (interviewsError) throw interviewsError;

      // Load monthly growth data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: allApplications, error: allAppError } = await supabase
        .from("applications")
        .select("applied_at, employer_id")
        .gte("applied_at", sixMonthsAgo.toISOString())
        .order("applied_at", { ascending: true });

      if (allAppError) throw allAppError;

      // Process monthly data
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyStats = {};
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${monthNames[date.getMonth()]}`;
        monthlyStats[monthKey] = { month: monthKey, recruiters: 0, interviews: 0 };
      }

      // Count employers by month
      employers?.forEach(emp => {
        const empDate = new Date(emp.created_at);
        const monthKey = monthNames[empDate.getMonth()];
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].recruiters += 1;
        }
      });

      // Cumulative recruiters
      let cumulativeRecruiters = 0;
      Object.keys(monthlyStats).forEach(month => {
        cumulativeRecruiters += monthlyStats[month].recruiters;
        monthlyStats[month].recruiters = cumulativeRecruiters;
      });

      // Count interviews by month
      allApplications?.forEach(app => {
        const appDate = new Date(app.applied_at);
        const monthKey = monthNames[appDate.getMonth()];
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].interviews += 1;
        }
      });

      // Load employer performance
      const employerInterviewCounts = {};
      interviews?.forEach(interview => {
        employerInterviewCounts[interview.employer_id] = (employerInterviewCounts[interview.employer_id] || 0) + 1;
      });

      const performanceData = await Promise.all(
        Object.entries(employerInterviewCounts)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 6)
          .map(async ([employerId, count]) => {
            const employer = employers?.find(e => e.id === employerId);
            return {
              name: employer?.company_name?.substring(0, 15) || "Unknown",
              interviews: count as number,
            };
          })
      );

      setStats({
        totalEmployers: employers?.length || 0,
        activeEmployers: new Set(interviews?.map(i => i.employer_id)).size || 0,
        totalInterviews: interviews?.length || 0,
        avgPerEmployer: employers?.length > 0 ? parseFloat((((interviews?.length || 0) / employers.length)).toFixed(1)) : 0,
      });

      setMonthlyData(Object.values(monthlyStats));
      setEmployerPerformanceData(performanceData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: `Failed to load dashboard data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <EmployerAdminLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Recruiter Performance</h1>
              <p className="text-gray-600 mt-2">Track Talent Acquisition interviews and team activity</p>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month.key} value={month.key}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-orange-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Total Recruiters</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEmployers}</p>
                <p className="text-sm text-gray-500 mt-2">Total employers</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Active Recruiters</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeEmployers}</p>
                <p className="text-sm text-gray-500 mt-2">{stats.totalEmployers > 0 ? Math.round((stats.activeEmployers / stats.totalEmployers) * 100) : 0}% of team</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Interviews This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalInterviews}</p>
                <p className="text-sm text-gray-500 mt-2">Talent Acquisition</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Avg Per Recruiter</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgPerEmployer}</p>
                <p className="text-sm text-gray-500 mt-2">Interviews/month</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recruiter Growth */}
            <Card className="border-orange-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Recruiter & Interview Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#888888" />
                    <YAxis stroke="#888888" />
                    <Tooltip />
                    <Line type="monotone" dataKey="recruiters" stroke="#a855f7" strokeWidth={3} name="Recruiters" />
                    <Line type="monotone" dataKey="interviews" stroke="#3b82f6" strokeWidth={3} name="TA Interviews" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recruiter Performance */}
            <Card className="border-orange-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Top Recruiters (This Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={employerPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888888" />
                    <YAxis stroke="#888888" />
                    <Tooltip />
                    <Bar dataKey="interviews" fill="#3b82f6" name="TA Interviews" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </EmployerAdminLayout>
  );
}
