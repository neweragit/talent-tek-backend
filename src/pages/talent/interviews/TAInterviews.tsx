import { useEffect, useMemo, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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
  id: string;
  company: string;
  companyLogo: string;
  jobTitle: string;
  recruiterName: string;
  recruiterRole: string;
  date: string;
  time: string;
  duration: string;
  type: InterviewType;
  meetingLink?: string;
  status: InterviewStatus;
  notes?: string;
}

const getCompanyInitials = (company: string) => {
  const words = company
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "TT";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const toInterviewStatus = (status: string | null | undefined): InterviewStatus => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled" || normalized === "no-show") return "cancelled";
  return "upcoming";
};

const formatDateTime = (scheduledDate: string | null | undefined) => {
  if (!scheduledDate) return { date: "Unknown", time: "Unknown" };
  const date = new Date(scheduledDate);
  if (Number.isNaN(date.getTime())) return { date: "Unknown", time: "Unknown" };
  return {
    date: date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
};

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
    return `Prepare for your ${interview.type} interview with ${interview.company} and keep your examples ready for recruiter follow-up.`;
  }

  if (interview.status === "completed") {
    return `This interview is complete. Review what went well and tighten your story for the next stage.`;
  }

  return "This interview was cancelled. Keep monitoring your pipeline for rescheduled opportunities.";
};

export default function TAInterviews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    let ignore = false;

    const loadInterviews = async () => {
      setLoading(true);

      if (!user) {
        setInterviews([]);
        setLoading(false);
        return;
      }

      try {
        const { data: talent, error: talentError } = await supabase
          .from("talents")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (talentError) {
          throw talentError;
        }

        if (!talent?.id) {
          if (!ignore) setInterviews([]);
          return;
        }

        const { data: records, error: interviewError } = await supabase
          .from("interviews")
          .select(
            `
              id,
              status,
              scheduled_date,
              duration_minutes,
              meet_link,
              interview_type,
              applications!inner (
                id,
                talent_id,
                jobs (
                  title,
                  employers ( company_name, logo_url )
                )
              ),
              interviewers (
                full_name,
                role
              )
            `,
          )
          .eq("interview_type", "talent-acquisition")
          .eq("applications.talent_id", talent.id);

        if (interviewError) {
          throw interviewError;
        }

        const sortedRecords = [...(records || [])].sort((a: any, b: any) => {
          const aTime = new Date(a?.scheduled_date ?? 0).getTime();
          const bTime = new Date(b?.scheduled_date ?? 0).getTime();
          return bTime - aTime;
        });

        const mapped = sortedRecords.map((record: any) => {
          const companyName = record.applications?.jobs?.employers?.company_name || "Unknown Company";
          const { date, time } = formatDateTime(record.scheduled_date);
          const meetingLink = record.meet_link || undefined;

          return {
            id: String(record.id),
            company: companyName,
            companyLogo: getCompanyInitials(companyName),
            jobTitle: record.applications?.jobs?.title || "Unknown Role",
            recruiterName: record.interviewers?.full_name || "Recruiter",
            recruiterRole: record.interviewers?.role || "Recruiter",
            date,
            time,
            duration: `${record.duration_minutes ?? 30} mins`,
            type: meetingLink ? "video" : "in-person",
            meetingLink,
            status: toInterviewStatus(record.status),
            notes: undefined,
          } satisfies Interview;
        });

        if (!ignore) setInterviews(mapped);
      } catch (error) {
        console.error("Failed to load TA interviews", error);
        if (!ignore) {
          setInterviews([]);
          toast({
            title: "Unable to load interviews",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadInterviews();
    return () => {
      ignore = true;
    };
  }, [toast, user]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const matchesTab = activeTab === "upcoming" ? interview.status === "upcoming" : interview.status === "completed";
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        interview.company.toLowerCase().includes(normalizedSearch) ||
        interview.jobTitle.toLowerCase().includes(normalizedSearch) ||
        interview.recruiterName.toLowerCase().includes(normalizedSearch);

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

  return (
    <TalentLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              Talent Interviews
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              TA Interviews
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
              Track your talent acquisition conversations, prepare for upcoming recruiter calls, and review completed sessions in the same dashboard identity.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
              {resultsLabel}
            </div>
          </div>
        </section>

        <div className="relative z-[999] mb-8 grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <Input
                placeholder="Search by company, job title, or recruiter..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="relative z-[999] isolate flex w-full items-center rounded-3xl border border-orange-100 bg-white p-4 shadow-lg pointer-events-auto lg:max-w-[360px] lg:justify-self-end">
            <div className="grid h-12 w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={`relative flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all pointer-events-auto ${
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
                className={`relative flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all pointer-events-auto ${
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

        {loading ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white/90 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-md">
              <Clock3 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Loading interviews</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Fetching your current TA interviews from the database.
            </p>
          </div>
        ) : filteredInterviews.length > 0 ? (
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
                          {interview.recruiterName} · {interview.recruiterRole}
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
                    ) : null}
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
            <h2 className="text-2xl font-bold text-slate-900">No interviews match these filters</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Try a different company name, role, or tab. Your interview sessions will appear here as soon as they match.
            </p>
          </div>
        )}
      </div>
    </TalentLayout>
  );
}
