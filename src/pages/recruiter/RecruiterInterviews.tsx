import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Video,
} from "lucide-react";

type InterviewStatus = "scheduled" | "confirmed" | "completed" | "rescheduled" | "cancelled" | "No Show";
type InterviewFilter = "All" | InterviewStatus;

type InterviewRecord = {
  id: number;
  candidateName: string;
  applyingFor: string;
  company: string;
  status: InterviewStatus;
  locationLine: string;
  interviewType: string;
  phone: string;
  date: string;
  timeDuration: string;
  workMode: string;
  evaluationLabel: string;
  rating?: string;
  notes: string;
  submittedOn?: string;
  feedbackState?: "pending" | "sent";
};

const filters: InterviewFilter[] = [
  "All",
  "scheduled",
  "confirmed",
  "completed",
  "rescheduled",
  "cancelled",
  "No Show",
];

const interviews: InterviewRecord[] = [
  {
    id: 1,
    candidateName: "SEBABKHI FARESS EDDINE",
    applyingFor: "Backend Engineer",
    company: "Skyopilot",
    status: "completed",
    locationLine: "Algiers, Algeria",
    interviewType: "Technical Assessment Meeting",
    phone: "+213666949470",
    date: "Sunday, February 15, 2026",
    timeDuration: "09:15 AM (60 minutes)",
    workMode: "Full-time - On-site",
    evaluationLabel: "Evaluation Completed",
    rating: "5.0",
    notes: "Strong API architecture and confident debugging approach.",
    submittedOn: "14/02/2026",
    feedbackState: "pending",
  },
  {
    id: 2,
    candidateName: "MIRA BENALI",
    applyingFor: "Frontend Developer",
    company: "Skyopilot",
    status: "scheduled",
    locationLine: "Remote",
    interviewType: "React + TypeScript",
    phone: "+213555384210",
    date: "Tuesday, March 17, 2026",
    timeDuration: "10:30 AM (45 minutes)",
    workMode: "Full-time - Remote",
    evaluationLabel: "Upcoming Session",
    notes: "Focus on state management, accessibility, and performance trade-offs.",
    submittedOn: "Starts in 2 days",
  },
  {
    id: 3,
    candidateName: "YOUSSEF MEZIANE",
    applyingFor: "DevOps Engineer",
    company: "Skyopilot",
    status: "confirmed",
    locationLine: "Oran, Algeria",
    interviewType: "Infrastructure + CI/CD",
    phone: "+213770911222",
    date: "Wednesday, March 18, 2026",
    timeDuration: "02:00 PM (60 minutes)",
    workMode: "Full-time - Hybrid",
    evaluationLabel: "Upcoming Session",
    notes: "Assess incident response, Kubernetes fundamentals, and release pipelines.",
    submittedOn: "Starts in 3 days",
  },
  {
    id: 4,
    candidateName: "LINA HADDAD",
    applyingFor: "Mobile Developer",
    company: "Talentek Labs",
    status: "rescheduled",
    locationLine: "Remote",
    interviewType: "React Native Interview",
    phone: "+213661442908",
    date: "Thursday, March 19, 2026",
    timeDuration: "11:00 AM (45 minutes)",
    workMode: "Contract - Remote",
    evaluationLabel: "Upcoming Session",
    notes: "Review architecture choices and debugging strategy for native modules.",
    submittedOn: "Rescheduled to Thursday",
  },
  {
    id: 5,
    candidateName: "ADAM BOUZID",
    applyingFor: "Full Stack Engineer",
    company: "Talentek Labs",
    status: "completed",
    locationLine: "Constantine, Algeria",
    interviewType: "System Design + Coding",
    phone: "+213540118773",
    date: "Friday, March 13, 2026",
    timeDuration: "04:00 PM (75 minutes)",
    workMode: "Full-time - Hybrid",
    evaluationLabel: "Evaluation Completed",
    rating: "4.6",
    notes: "Good communication and clean problem-solving, minor gaps in scaling patterns.",
    submittedOn: "13/03/2026",
    feedbackState: "sent",
  },
  {
    id: 6,
    candidateName: "NOURA FERNANE",
    applyingFor: "QA Automation Engineer",
    company: "Skyopilot",
    status: "cancelled",
    locationLine: "Remote",
    interviewType: "Automation Framework Review",
    phone: "+213773450881",
    date: "Monday, March 16, 2026",
    timeDuration: "03:30 PM (45 minutes)",
    workMode: "Full-time - Remote",
    evaluationLabel: "Session Cancelled",
    notes: "Candidate requested cancellation due to schedule conflict.",
    submittedOn: "Awaiting reschedule",
  },
];

const isUpcomingStatus = (status: InterviewStatus) => {
  return status === "scheduled" || status === "confirmed" || status === "rescheduled";
};

const getStatusClasses = (status: InterviewStatus) => {
  if (status === "completed") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "confirmed") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "scheduled" || status === "rescheduled") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (status === "No Show") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
};

const EmployerInterviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InterviewFilter>("All");
  const navigate = useNavigate();

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        interview.candidateName.toLowerCase().includes(normalizedSearch) ||
        interview.applyingFor.toLowerCase().includes(normalizedSearch) ||
        interview.company.toLowerCase().includes(normalizedSearch);
      const matchesFilter = activeFilter === "All" || interview.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, searchQuery]);

  return (
    <RecruiterLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div>
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                TA Interview Portal
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
                Talent Acquisition Interviews
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                My Interviews
              </p>
              <p className="mt-2 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage your talent acquisition interviews and evaluations
              </p>
            </div>
          </div>
        </section>

        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
            <Input
              placeholder="Search by candidate, role, or company..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeFilter === filter
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredInterviews.length > 0 ? (
          <div className="grid gap-6">
            {filteredInterviews.map((interview) => (
              <article key={interview.id} className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl">
                {(() => {
                  const isCompleted = interview.status === "completed";
                  const isUpcoming = isUpcomingStatus(interview.status);
                  const actionLabel = isUpcoming
                    ? "Join Now"
                    : isCompleted
                      ? interview.feedbackState === "sent"
                        ? "Feedback Sent"
                        : "Leave Feedback"
                      : "View Details";
                  const isFeedbackSent = isCompleted && interview.feedbackState === "sent";

                  return (
                    <>
                <div className="mb-5 flex flex-col gap-4 border-b border-orange-100 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{interview.candidateName}</h2>
                    <p className="mt-2 text-base font-medium text-slate-600">
                      Applying for {interview.applyingFor} at {interview.company}
                    </p>
                  </div>
                  <Badge className={getStatusClasses(interview.status)}>{interview.status === "completed" ? "Completed" : interview.status}</Badge>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.locationLine}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Track</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.interviewType}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Phone</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.phone}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.date}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Time</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.timeDuration}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mode</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{interview.workMode}</p>
                  </div>
                </div>

                <div className="grid gap-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-orange-700">
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                      {interview.evaluationLabel}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{interview.notes}</p>
                    {interview.submittedOn ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {isCompleted ? `Submitted on ${interview.submittedOn}` : interview.submittedOn}
                      </p>
                    ) : null}
                  </div>

                  {interview.rating ? (
                    <div className="inline-flex items-center justify-center gap-1 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700">
                      {interview.rating}
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-700">
                      Pending
                    </div>
                  )}

                  <Button
                    disabled={isFeedbackSent}
                    className={`gap-2 rounded-full text-white shadow-md ${
                      isFeedbackSent
                        ? "bg-orange-300 hover:bg-orange-300"
                        : "bg-orange-600 hover:bg-orange-700"
                    }`}
                    onClick={() => !isFeedbackSent && navigate(`/recruiter/interviews/${interview.id}/review`)}
                  >
                    {isUpcoming ? (
                      <Video className="h-4 w-4" />
                    ) : isFeedbackSent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCompleted ? (
                      <MessageSquare className="h-4 w-4" />
                    ) : (
                      <Briefcase className="h-4 w-4" />
                    )}
                    {actionLabel}
                  </Button>
                </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Briefcase className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No interviews found</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Try switching your status filter or searching with a different keyword.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-orange-600" />
            Interview Calendar Synced
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-orange-600" />
            Evaluation Turnaround Tracked
          </span>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default EmployerInterviews;

