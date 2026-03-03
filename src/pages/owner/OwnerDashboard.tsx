import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, UserCog, TrendingUp, Activity, DollarSign, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface MonthlyStats {
  name: string;
  users: number;
  revenue: number;
}

interface UserTypeData {
  name: string;
  value: number;
  color: string;
}

export default function OwnerDashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<MonthlyStats[]>([]);
  const [userTypeData, setUserTypeData] = useState<UserTypeData[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUsersGrowth: 0,
    employers: 0,
    employersGrowth: 0,
    talents: 0,
    talentsGrowth: 0,
    interviewers: 0,
    interviewersGrowth: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      await Promise.all([
        loadUserStats(),
        loadMonthlyData(),
        loadUserDistribution(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserStats() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    const { count: lastMonthTotal } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', thisMonth.toISOString());

    const totalUsersGrowth = lastMonthTotal > 0
      ? Math.round(((totalUsers - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    // Employers
    const { count: employers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'employer');

    const { count: lastMonthEmployers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'employer')
      .lt('created_at', thisMonth.toISOString());

    const employersGrowth = lastMonthEmployers > 0
      ? Math.round(((employers - lastMonthEmployers) / lastMonthEmployers) * 100)
      : 0;

    // Talents
    const { count: talents } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'talent');

    const { count: lastMonthTalents } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'talent')
      .lt('created_at', thisMonth.toISOString());

    const talentsGrowth = lastMonthTalents > 0
      ? Math.round(((talents - lastMonthTalents) / lastMonthTalents) * 100)
      : 0;

    // Interviewers
    const { count: interviewers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'interviewer');

    const { count: lastMonthInterviewers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'interviewer')
      .lt('created_at', thisMonth.toISOString());

    const interviewersGrowth = lastMonthInterviewers > 0
      ? Math.round(((interviewers - lastMonthInterviewers) / lastMonthInterviewers) * 100)
      : 0;

    setStats({
      totalUsers: totalUsers || 0,
      totalUsersGrowth,
      employers: employers || 0,
      employersGrowth,
      talents: talents || 0,
      talentsGrowth,
      interviewers: interviewers || 0,
      interviewersGrowth,
    });
  }

  async function loadMonthlyData() {
    const monthlyStats: MonthlyStats[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      // Count users created in this month
      const { count: users } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lte('created_at', nextDate.toISOString());

      // Sum revenue for this month
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', date.toISOString())
        .lte('created_at', nextDate.toISOString());

      const revenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;

      monthlyStats.push({
        name: monthName,
        users: users || 0,
        revenue: revenue,
      });
    }

    setStatsData(monthlyStats);
  }

  async function loadUserDistribution() {
    const { count: talents } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'talent');

    const { count: employers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'employer');

    const { count: interviewers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'interviewer');

    setUserTypeData([
      { name: "Talents", value: talents || 0, color: "#ea580c" },
      { name: "Employers", value: employers || 0, color: "#fb923c" },
      { name: "Interviewers", value: interviewers || 0, color: "#fdba74" },
    ]);
  }

  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  if (isLoading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </OwnerLayout>
    );
  }
  return (
    <OwnerLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with TalenTek.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers.toLocaleString()}</p>
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    stats.totalUsersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    {stats.totalUsersGrowth >= 0 ? '+' : ''}{stats.totalUsersGrowth}% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Employers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.employers.toLocaleString()}</p>
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    stats.employersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    {stats.employersGrowth >= 0 ? '+' : ''}{stats.employersGrowth}% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Talents</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.talents.toLocaleString()}</p>
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    stats.talentsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    {stats.talentsGrowth >= 0 ? '+' : ''}{stats.talentsGrowth}% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Interviewers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.interviewers.toLocaleString()}</p>
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    stats.interviewersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    {stats.interviewersGrowth >= 0 ? '+' : ''}{stats.interviewersGrowth}% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#ea580c" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  );
}
