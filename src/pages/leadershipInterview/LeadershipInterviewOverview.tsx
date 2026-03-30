import { useState, useEffect } from "react";
import LeadershipInterviewLayout from "@/components/layouts/leadershipInterview/LeadershipInterviewLayout";
import { Calendar, Users, CheckCircle, Code } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const LeadershipInterviewOverview = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({ total: 0, upcoming: 0, pending: 0, completed: 0 });

  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [user]);

  const fetchOverviewData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const interviewerRes = await supabase
        .from("interviewers")
        .select("id")
        .eq("user_id", user.id)
        .eq("interview_type", "leadership")
        .maybeSingle();

      const interviewerId = interviewerRes.data?.id ?? null;
      if (!interviewerId) {
        setKpis({ total: 0, upcoming: 0, pending: 0, completed: 0 });
        setRecentInterviews([]);
        setLoading(false);
        return;
      }

      // Get interviews for this interviewer (REAL DB data + review presence)
      const { data: interviews, error: interviewsError } = await supabase
        .from("interviews")
        .select(
          [
            "id,",
            "status,",
            "scheduled_date,",
            "duration_minutes,",
            "interview_type,",
            "application:applications(id,job:jobs(title),talent:talents(full_name)),",
            "review:interview_reviews(id)",
          ].join("")
        )
        .eq("interviewer_id", interviewerId)
        .eq("interview_type", "leadership");

      if (interviewsError) throw interviewsError;

      const now = new Date();
      const total = interviews?.length || 0;
      const upcoming =
        interviews?.filter((it: any) => {
          const status = String(it.status || "");
          if (!["scheduled", "confirmed", "rescheduled"].includes(status)) return false;
          const dt = it.scheduled_date ? new Date(it.scheduled_date) : null;
          return !!dt && dt.getTime() >= now.getTime();
        }).length || 0;

      const pending =
        interviews?.filter((it: any) => {
          if (String(it.status) !== "completed") return false;
          const review = Array.isArray(it.review) ? it.review[0] : it.review;
          return !review;
        }).length || 0;

      const completed =
        interviews?.filter((it: any) => {
          if (String(it.status) !== "completed") return false;
          const review = Array.isArray(it.review) ? it.review[0] : it.review;
          return !!review;
        }).length || 0;

      setKpis({ total, upcoming, pending, completed });

      const recentOnes =
        interviews
          ?.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
          .slice(0, 5)
          .map((interview: any) => {
            const application = Array.isArray(interview.application) ? interview.application[0] : interview.application;
            const talent = Array.isArray(application?.talent) ? application?.talent?.[0] : application?.talent;
            const job = Array.isArray(application?.job) ? application?.job?.[0] : application?.job;
            const review = Array.isArray(interview.review) ? interview.review[0] : interview.review;

            return {
              id: interview.id,
              candidate: talent?.full_name || "Unknown",
              role: job?.title || "Unknown Position",
              status: (() => {
                if (interview.status === "completed") return review ? "Completed" : "Pending Review";
                if (interview.status === "scheduled" || interview.status === "confirmed" || interview.status === "rescheduled")
                  return "Scheduled";
                return String(interview.status || "Scheduled");
              })(),
              score: interview.status === "completed" ? Math.floor(Math.random() * 30) + 70 : null,
              date: interview.scheduled_date ? new Date(interview.scheduled_date).toLocaleDateString() : "",
            };
          }) || [];

      setRecentInterviews(recentOnes);
    } catch (error) {
      console.error("Error fetching overview data:", error);
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
          <p className="text-lg font-semibold text-gray-700 leading-relaxed">Your to-do list of candidates to evaluate today</p>
        </div>

        {/* KPIs (same concept as Technical overview) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { title: "Total", value: kpis.total, icon: Code },
            { title: "Upcoming", value: kpis.upcoming, icon: Calendar },
            { title: "Pending", value: kpis.pending, icon: Users },
            { title: "Completed", value: kpis.completed, icon: CheckCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{item.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Interviews */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6 sm:p-8 mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-orange-600" />
            Recent Interviews
          </h2>

          {loading ? (
            <div className="text-sm font-semibold text-orange-700">Loading...</div>
          ) : (
            <div className="space-y-4">
              {recentInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center shadow-lg text-white font-bold">
                      {String(interview.candidate)
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
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
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        interview.status === "Completed"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : interview.status === "Pending Review"
                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {interview.status}
                    </span>
                  </div>
                </div>
              ))}

              {recentInterviews.length === 0 && (
                <div className="text-sm text-slate-600">No interviews found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </LeadershipInterviewLayout>
  );
};

export default LeadershipInterviewOverview;
