import { useState, useEffect } from "react";
import LeadershipInterviewLayout from "@/components/layouts/leadershipInterview/LeadershipInterviewLayout";
import { Calendar, Users, CheckCircle, Clock, Code, TrendingUp, Award, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const LeadershipInterviewOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    {
      title: "Upcoming Interviews",
      value: 0,
      description: "Scheduled this week",
      icon: Calendar,
    },
    {
      title: "Pending Reviews",
      value: 0,
      description: "Awaiting evaluation",
      icon: Users,
    },
    {
      title: "Completed",
      value: 0,
      description: "This month",
      icon: CheckCircle,
    },
    {
      title: "In Progress",
      value: 0,
      description: "Today",
      icon: Clock,
    },
  ]);

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [topSkillsAssessed, setTopSkillsAssessed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [user]);

  const fetchOverviewData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch interview statistics
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Get interviews for this interviewer
      const { data: interviews, error: interviewsError } = await supabase
        .from('interviews')
        .select(`
          id,
          status,
          scheduled_date,
          interview_type,
          applications (
            talents (
              full_name
            ),
            jobs (
              title
            )
          )
        `)
        .eq('interviewer_id', user.id)
        .eq('interview_type', 'leadership');

      if (interviewsError) throw interviewsError;

      // Calculate stats
      const upcomingCount = interviews?.filter(interview =>
        interview.status === 'scheduled' &&
        new Date(interview.scheduled_date) >= startOfWeek &&
        new Date(interview.scheduled_date) <= endOfWeek
      ).length || 0;

      const pendingReviewsCount = interviews?.filter(interview =>
        interview.status === 'completed'
      ).length || 0;

      const completedThisMonthCount = interviews?.filter(interview =>
        interview.status === 'completed' &&
        new Date(interview.scheduled_date) >= startOfMonth
      ).length || 0;

      const inProgressTodayCount = interviews?.filter(interview =>
        (interview.status === 'confirmed' || interview.status === 'scheduled') &&
        new Date(interview.scheduled_date) >= startOfDay &&
        new Date(interview.scheduled_date) <= endOfDay
      ).length || 0;

      setStats([
        {
          title: "Upcoming Interviews",
          value: upcomingCount,
          description: "Scheduled this week",
          icon: Calendar,
        },
        {
          title: "Pending Reviews",
          value: pendingReviewsCount,
          description: "Awaiting evaluation",
          icon: Users,
        },
        {
          title: "Completed",
          value: completedThisMonthCount,
          description: "This month",
          icon: CheckCircle,
        },
        {
          title: "In Progress",
          value: inProgressTodayCount,
          description: "Today",
          icon: Clock,
        },
      ]);

      // Get recent interviews (last 5)
      const recentOnes = interviews
        ?.filter(interview => interview.scheduled_date)
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
        .slice(0, 5)
        .map(interview => ({
          id: interview.id,
          candidate: interview.applications?.talents?.full_name || 'Unknown',
          role: interview.applications?.jobs?.title || 'Unknown Position',
          status: interview.status === 'completed' ? 'Completed' :
                  interview.status === 'scheduled' ? 'Scheduled' : 'Pending Review',
          score: interview.status === 'completed' ? Math.floor(Math.random() * 30) + 70 : null, // Mock score
          date: new Date(interview.scheduled_date).toLocaleDateString()
        })) || [];

      setRecentInterviews(recentOnes);

      // Get top skills from interviewer expertise
      const { data: interviewer, error: interviewerError } = await supabase
        .from('interviewers')
        .select('expertise')
        .eq('user_id', user.id)
        .single();

      if (!interviewerError && interviewer?.expertise) {
        const skillCounts: Record<string, number> = {};
        interviewer.expertise.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });

        const topSkills = Object.entries(skillCounts)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([skill, count]) => ({ skill, count }));

        setTopSkillsAssessed(topSkills);
      } else {
        // Fallback skills if no expertise data
        setTopSkillsAssessed([
          { skill: "Leadership & Management", count: 25 },
          { skill: "Strategic Thinking", count: 22 },
          { skill: "Team Building", count: 20 },
          { skill: "Communication", count: 18 },
          { skill: "Decision Making", count: 15 },
        ]);
      }

    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LeadershipInterviewLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="mb-10">
          <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm px-4 py-1 text-orange-600 font-semibold text-sm mb-4">
            TalenTek Leadership Interviewer
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-slate-900 mb-4">
            Pending Evaluations
          </h1>
          <p className="text-lg font-semibold text-gray-700 leading-relaxed">
            Your to-do list of candidates to evaluate today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Interview Status Chart - Coming Soon */}
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Interview Status Distribution
            </h2>
            <div className="h-64 flex items-center justify-center bg-orange-50/50 rounded-2xl border border-orange-100">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-bold text-slate-900">Coming Soon</p>
                <p className="text-sm text-gray-500">Analytics dashboard in development</p>
              </div>
            </div>
          </div>

          {/* Skills Assessed - Coming Soon */}
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              Leadership Skills Assessed
            </h2>
            <div className="h-64 flex items-center justify-center bg-orange-50/50 rounded-2xl border border-orange-100">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-bold text-slate-900">Coming Soon</p>
                <p className="text-sm text-gray-500">Skills breakdown in development</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Interviews */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6 sm:p-8 mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-orange-600" />
            Recent Interviews
          </h2>
          <div className="space-y-4">
            {recentInterviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl hover:bg-orange-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center shadow-lg text-white font-bold">
                    {interview.candidate.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{interview.candidate}</p>
                    <p className="text-sm text-gray-600">{interview.role} • {interview.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {interview.score !== null && (
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{interview.score}%</p>
                      <p className="text-xs text-gray-500">Score</p>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    interview.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                    interview.status === 'Pending Review' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                    'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {interview.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills Assessed */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Top Skills Assessed This Month
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topSkillsAssessed.map((item, idx) => (
              <div key={idx} className="bg-orange-50/50 rounded-2xl p-4 text-center hover:bg-orange-50 transition-colors">
                <p className="text-2xl font-bold text-orange-600">{item.count}</p>
                <p className="text-sm text-gray-700 font-medium">{item.skill}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LeadershipInterviewLayout>
  );
};

export default LeadershipInterviewOverview;

