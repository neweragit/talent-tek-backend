import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Building2, Briefcase, DollarSign, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface MonthlyData {
  month: string;
  talents: number;
  employers: number;
  interviewers: number;
  revenue: number;
}

interface RevenueData {
  month: string;
  subscriptions: number;
  services: number;
}

export default function OwnerStatistics() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("6months");
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [stats, setStats] = useState({
    totalGrowth: 0,
    employerGrowth: 0,
    jobMatches: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  async function loadStatistics() {
    try {
      setIsLoading(true);
      await Promise.all([
        loadMonthlyGrowth(),
        loadRevenueData(),
        loadKeyMetrics(),
      ]);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast({
        title: "Error",
        description: "Failed to load statistics.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMonthlyGrowth() {
    const months = getMonthsRange();
    const monthlyStats: MonthlyData[] = [];

    for (const month of months) {
      const startDate = new Date(month.year, month.monthIndex, 1);
      const endDate = new Date(month.year, month.monthIndex + 1, 0, 23, 59, 59);

      // Count users by role
      const { data: talents } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('user_role', 'talent')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: employers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('user_role', 'employer')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: interviewers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('user_role', 'interviewer')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get revenue for the month
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed');

      const revenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;

      monthlyStats.push({
        month: month.label,
        talents: talents?.length || 0,
        employers: employers?.length || 0,
        interviewers: interviewers?.length || 0,
        revenue: revenue,
      });
    }

    setMonthlyData(monthlyStats);
  }

  async function loadRevenueData() {
    const months = getMonthsRange();
    const revenueStats: RevenueData[] = [];

    for (const month of months) {
      const startDate = new Date(month.year, month.monthIndex, 1);
      const endDate = new Date(month.year, month.monthIndex + 1, 0, 23, 59, 59);

      // Subscription revenue
      const { data: subscriptionPayments } = await supabase
        .from('payments')
        .select('amount, subscription_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .not('subscription_id', 'is', null);

      // Service/other revenue
      const { data: servicePayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .is('subscription_id', null);

      const subscriptions = subscriptionPayments?.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;
      const services = servicePayments?.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;

      revenueStats.push({
        month: month.label,
        subscriptions: subscriptions,
        services: services,
      });
    }

    setRevenueData(revenueStats);
  }

  async function loadKeyMetrics() {
    const months = getMonthsRange();
    const firstMonth = new Date(months[0].year, months[0].monthIndex, 1);
    const lastMonth = new Date(months[months.length - 1].year, months[months.length - 1].monthIndex + 1, 0);

    // Calculate growth percentages
    const { count: currentUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .lte('created_at', lastMonth.toISOString());

    const { count: previousUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', firstMonth.toISOString());

    const totalGrowth = previousUsers > 0 
      ? Math.round(((currentUsers - previousUsers) / previousUsers) * 100)
      : 0;

    // Employer growth
    const { count: currentEmployers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'employer')
      .lte('created_at', lastMonth.toISOString());

    const { count: previousEmployers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_role', 'employer')
      .lt('created_at', firstMonth.toISOString());

    const employerGrowth = previousEmployers > 0
      ? Math.round(((currentEmployers - previousEmployers) / previousEmployers) * 100)
      : 0;

    // Total revenue in current period
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .gte('created_at', firstMonth.toISOString())
      .lte('created_at', lastMonth.toISOString())
      .eq('status', 'completed');

    const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0) || 0;

    // Job matches (you may need to adjust based on your schema)
    const { count: jobMatches } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .gte('created_at', firstMonth.toISOString())
      .lte('created_at', lastMonth.toISOString());

    setStats({
      totalGrowth,
      employerGrowth,
      jobMatches: jobMatches || 0,
      totalRevenue,
    });
  }

  function getMonthsRange() {
    const months: { label: string; year: number; monthIndex: number }[] = [];
    const monthCount = timeRange === '1month' ? 1 : timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
    
    const now = new Date();
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
      });
    }
    
    return months;
  }

  if (isLoading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Platform Statistics</h1>
            <p className="text-gray-600 mt-2">Comprehensive analytics and insights</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-orange-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Total Growth</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">+{stats.totalGrowth}%</p>
              <p className="text-sm text-gray-500 mt-2">User base expansion</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Employer Growth</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">+{stats.employerGrowth}%</p>
              <p className="text-sm text-gray-500 mt-2">Companies joined</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-orange-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Job Matches</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.jobMatches.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-2">Successful placements</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-gray-500 mt-2">Selected period</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth by Type */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">User Growth by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Bar dataKey="talents" fill="#a855f7" name="Talents" />
                  <Bar dataKey="employers" fill="#3b82f6" name="Employers" />
                  <Bar dataKey="interviewers" fill="#10b981" name="Interviewers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <Tooltip />
                  <Area type="monotone" dataKey="subscriptions" stackId="1" stroke="#ea580c" fill="#fb923c" name="Subscriptions" />
                  <Area type="monotone" dataKey="services" stackId="1" stroke="#f97316" fill="#fdba74" name="Services" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Total User Growth Trend */}
        <Card className="border-orange-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Total User Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip />
                <Line type="monotone" dataKey="talents" stroke="#a855f7" strokeWidth={3} name="Talents" />
                <Line type="monotone" dataKey="employers" stroke="#3b82f6" strokeWidth={3} name="Employers" />
                <Line type="monotone" dataKey="interviewers" stroke="#10b981" strokeWidth={3} name="Interviewers" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
