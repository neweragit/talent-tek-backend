import { useMemo, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Phone,
  Play,
  Search,
  User,
  Video,
} from "lucide-react";

type InterviewType = "video" | "phone" | "in-person";
type InterviewStatus = "upcoming" | "completed" | "cancelled";

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
  type: InterviewType;
  meetingLink?: string;
  status: InterviewStatus;
  notes?: string;
}

const technicalInterviewsSeed: Interview[] = [
  {
    id: 1,
    company: "Andela",
    companyLogo: "AN",
    jobTitle: "Senior Frontend Engineer",
    interviewerName: "Nora Mensah",
    interviewerRole: "Engineering Manager",
    date: "24/11/2025",
    time: "03:30 PM",
    duration: "60 mins",
    type: "video",
    meetingLink: "https://meet.google.com/it-demo-room",
    status: "upcoming",
    notes: "Deep-dive session focused on React architecture, testing decisions, and real-world debugging trade-offs.",
  },
  {
    id: 2,
    company: "Moniepoint",
    companyLogo: "MP",
    jobTitle: "Platform Engineer",
    interviewerName: "Tolu Adebayo",
    interviewerRole: "Principal Engineer",
    date: "16/11/2025",
    time: "11:00 AM",
    duration: "75 mins",
    type: "video",
    meetingLink: "https://zoom.us/j/technical-review",
    status: "completed",
    notes: "Covered API reliability, observability strategy, and production incident response process with the platform team.",
  },
];

const getInterviewTypeMeta = (type: InterviewType) => {
  switch (type) {
    case "video":
      return { label: "Video", icon: Video };
    case "phone":
      return { label: "Phone", icon: Phone };
    case "in-person":
      return { label: "In-person", icon: MapPin };
    default:
      return { label: "Interview", icon: CalendarDays };
  }
};

const getInterviewStatusMeta = (status: InterviewStatus) => {
  switch (status) {
    case "upcoming":
      return {
        label: "Upcoming",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: Clock3,
      };
    case "completed":
      return {
        label: "Completed",
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
        icon: CheckCircle2,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
        icon: CalendarDays,
      };
    default:
      return {
        label: "Interview",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: CalendarDays,
      };
  }
};

const getInterviewSummary = (interview: Interview) => {
  if (interview.notes) {
    return interview.notes;
  }

  if (interview.status === "upcoming") {
    return `Prepare for your ${interview.type} interview with ${interview.company} and keep your architecture decisions clear and concise.`;
  }

  if (interview.status === "completed") {
    return "This interview is complete. Review your trade-off explanations and sharpen your examples for the next stage.";
  }

  return "This interview was cancelled. Keep tracking your pipeline for rescheduled technical rounds.";
};

const ITInterviews = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [interviews] = useState<Interview[]>(technicalInterviewsSeed);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const matchesTab = activeTab === "upcoming" ? interview.status === "upcoming" : interview.status === "completed";
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        interview.company.toLowerCase().includes(normalizedSearch) ||
        interview.jobTitle.toLowerCase().includes(normalizedSearch) ||
        interview.interviewerName.toLowerCase().includes(normalizedSearch);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, interviews, searchQuery]);

  const upcomingCount = interviews.filter((interview) => interview.status === "upcoming").length;
  const completedCount = interviews.filter((interview) => interview.status === "completed").length;

  const resultsLabel =
    filteredInterviews.length === interviews.length
      ? `Showing all ${interviews.length} interviews`
      : `Showing ${filteredInterviews.length} of ${interviews.length} interviews`;

  const handleJoinMeeting = (link?: string) => {
    if (!link) {
      return;
    }

    window.open(link, "_blank");
    toast({
      title: "Opening meeting link",
      description: "Joining interview session...",
    });
  };

  const handleDownloadMaterials = () => {
    toast({
      title: "Materials requested",
      description: "Your interview resources are being prepared.",
    });
  };

  const handleViewFeedback = () => {
    toast({
      title: "Feedback unavailable",
      description: "Detailed interviewer feedback is not attached yet.",
    });
  };

  return (
    <TalentLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              Technical Interviews
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Technical Interviews
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
              Track your technical interview pipeline, follow your completed rounds, and keep next-step actions in one clean interface.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
              {resultsLabel}
            </div>
          </div>
        </section>

        <div className="mb-8 grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <Input
                placeholder="Search by company, job title, or interviewer..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="flex w-full items-center rounded-3xl border border-orange-100 bg-white p-4 shadow-lg lg:max-w-[360px] lg:justify-self-end">
            <div className="grid h-12 w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={`flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                  activeTab === "upcoming"
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                <Clock3 className="h-4 w-4" />
                Upcoming ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                className={`flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                  activeTab === "completed"
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Completed ({completedCount})
              </button>
            </div>
          </div>
        </div>

        {filteredInterviews.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredInterviews.map((interview) => {
              const statusMeta = getInterviewStatusMeta(interview.status);
              const typeMeta = getInterviewTypeMeta(interview.type);
              const StatusIcon = statusMeta.icon;
              const TypeIcon = typeMeta.icon;

              return (
                <article
                  key={interview.id}
                  className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                        {interview.companyLogo}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold leading-tight text-slate-900">{interview.jobTitle}</h2>
                        <p className="mt-1 text-sm font-semibold text-orange-600">{interview.company}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {interview.interviewerName} · {interview.interviewerRole}
                        </p>
                      </div>
                    </div>

                    <Badge className={statusMeta.badgeClassName}>{statusMeta.label}</Badge>
                  </div>

                  <p className="mb-5 text-sm leading-6 text-gray-600">{getInterviewSummary(interview)}</p>

                  <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{interview.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Time</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{interview.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Type</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{typeMeta.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Duration</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{interview.duration}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{interview.company}</Badge>
                    <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{statusMeta.label}</Badge>
                    <Badge variant="outline" className="border-orange-200 bg-white text-orange-700">
                      {typeMeta.label}
                    </Badge>
                  </div>

                  <div className="flex border-t border-orange-100 pt-5">
                    {interview.status === "upcoming" ? (
                      <div className="ml-auto flex items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => handleJoinMeeting(interview.meetingLink)}
                          className="gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                        >
                          <Play className="h-4 w-4" />
                          Join Meeting
                        </Button>
                        <Button
                          type="button"
                          onClick={handleDownloadMaterials}
                          className="gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md hover:from-orange-600 hover:to-orange-500"
                        >
                          <FileText className="h-4 w-4" />
                          Materials
                        </Button>
                      </div>
                    ) : (
                      <div className="ml-auto flex flex-wrap gap-3">
                        <Button
                          type="button"
                          onClick={handleViewFeedback}
                          className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          View Feedback
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <CalendarDays className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No interviews in this stage</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Your technical interviews will appear here as soon as they are scheduled or completed.
            </p>
          </div>
        )}
      </div>
    </TalentLayout>
  );
};

export default ITInterviews;
