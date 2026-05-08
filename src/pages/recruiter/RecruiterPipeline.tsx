import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import CvViewer from "@/components/CvViewer";
import { format, isSameDay } from "date-fns";
import { jsPDF } from "jspdf";
import talentekLogo from "@/logo/logo.jfif";
import {
  Users,
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Star,
  Sparkles,
  Mail,
  Phone,
  FileText,
  ChevronRight,
  UserCheck,
  UserX,
  Archive,
  Clock,
  Loader2,
  Briefcase,
  GraduationCap,
  Building,
  CheckCircle,
  Ban,
  Video,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StarRatingInput } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ApplicationStatus = "pending" | "in-progress" | "rejected" | "maybe" | "archived";
type ApplicationStage = "to-contact" | "talent-acquisition" | "technical" | "leadership" | "offer" | "rejected-offer" | "hired" | null;

interface RecruiterJob {
  id: string;
  title: string;
  department: string;
  location: string;
  contractType?: string;
  employmentType?: string;
  workplace?: string;
  experienceLevel?: string;
  status?: string;
}

interface EmployerProfileData {
  companyName: string;
  logoUrl: string;
  repFirstName: string;
  repLastName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

interface Application {
  id: string;
  talentId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  matchScore: number;
  status: ApplicationStatus;
  stage: ApplicationStage;
  jobId: string;
  experience: string;
  skills: string[];
  currentCompany: string;
  coverLetter: string;
  cvUrl?: string;
  currentPosition?: string;
  educationLevel?: string;
  jobTypes?: string[];
  workLocation?: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  has_carte_entrepreneur?: boolean | null;
  taReviewRating?: number;
  taReviewText?: string;
  taReviewSubmittedOn?: string;
  technicalFeedbackRating?: number;
  technicalFeedbackText?: string;
  technicalFeedbackSubmittedOn?: string;
  leadershipFeedbackRating?: number;
  leadershipFeedbackText?: string;
  leadershipFeedbackSubmittedOn?: string;
  taInterviewId?: string;
  taInterviewMeetLink?: string;
  taInterviewScheduledAt?: string;
  taInterviewStatus?: "scheduled" | "confirmed" | "completed" | "rescheduled" | "no-show";
}

interface InterviewerOption {
  id: string;
  fullName: string;
  email: string;
}

type AvailabilityStatus = "idle" | "checking" | "available" | "conflict" | "error";

type PipelineTabId = "all" | "in-progress" | "maybe" | "rejected" | "archived";

const filterTabs = [
  { id: "all", label: "All Applications", status: "pending" },
  { id: "in-progress", label: "Hiring Pipeline", status: "in-progress" },
  { id: "maybe", label: "Maybe", status: "maybe" },
  { id: "rejected", label: "Rejected", status: "rejected" },
  { id: "archived", label: "Archived", status: "archived" },
];

const pipelineStages = [
  { id: "to-contact", label: "To Contact" },
  { id: "talent-acquisition", label: "Talent Acquisition" },
  { id: "technical", label: "Technical" },
  { id: "leadership", label: "Leadership" },
  { id: "offer", label: "Offer" },
  { id: "rejected-offer", label: "Rejected Offers" },
  { id: "hired", label: "Hired" },
];

const formatStageForDisplay = (stage: ApplicationStage): string => {
  if (!stage) return "";
  return stage
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const WORKDAY_START_TIME = "07:30";
const WORKDAY_END_TIME = "23:00";

const toHHMM = (date: Date) => {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const ceilToNextMinute = (date: Date) => {
  const d = new Date(date);
  if (d.getSeconds() > 0 || d.getMilliseconds() > 0) {
    d.setMinutes(d.getMinutes() + 1);
  }
  d.setSeconds(0, 0);
  return d;
};

const formatSafeDate = (date: Date | null | undefined, pattern: string) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  return format(date, pattern);
};

const toLocalDateTimeInputValue = (date: Date | string | null | undefined) => {
  if (!date) return "";
  const parsed = typeof date === "string" ? new Date(date) : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
};

const maxTime = (a: string, b: string) => (a.localeCompare(b) >= 0 ? a : b);

const computeOfferResponseDeadline = (responseDays: number): Date => {
  const safeDays = Number.isFinite(responseDays) ? Math.max(1, Math.floor(responseDays)) : 7;
  const deadline = new Date();
  deadline.setHours(23, 59, 59, 999);
  deadline.setDate(deadline.getDate() + safeDays);
  return deadline;
};

export default function EmployerPipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PipelineTabId>("all");
  const PIPELINE_TAB_STORAGE_KEY = "recruiter-pipeline-active-tab";
  const PIPELINE_JOB_STORAGE_KEY = "recruiter-pipeline-selected-job";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [cvDialogOpen, setCvDialogOpen] = useState(false);
  const [cvDialogUrl, setCvDialogUrl] = useState("");
  const [cvLoading, setCvLoading] = useState(false);
  const [cvDialogError, setCvDialogError] = useState("");
  const [inlineCvUrl, setInlineCvUrl] = useState("");
  const [inlineCvLoading, setInlineCvLoading] = useState(false);
  const [inlineCvError, setInlineCvError] = useState("");
  const [applicationBusyById, setApplicationBusyById] = useState<Record<string, boolean>>({});
  const [confirmMoveOpen, setConfirmMoveOpen] = useState(false);
  const [pendingMoveStatus, setPendingMoveStatus] = useState<ApplicationStatus | null>(null);
  
  const [pipelineMode, setPipelineMode] = useState<"hiring" | "onboarding">("hiring");

  const [currentEmployerId, setCurrentEmployerId] = useState<string | null>(null);
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | null>(null);
  const [currentRecruiterName, setCurrentRecruiterName] = useState<string>("");
  const [currentCompanyName, setCurrentCompanyName] = useState<string>("");
  const [currentCompanyLogoUrl, setCurrentCompanyLogoUrl] = useState<string>("");
  const [currentEmployerProfile, setCurrentEmployerProfile] = useState<EmployerProfileData>({
    companyName: "",
    logoUrl: "",
    repFirstName: "",
    repLastName: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
  });

  const applicationCountByJobId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of applications) {
      if (!app.jobId) continue;
      counts.set(app.jobId, (counts.get(app.jobId) ?? 0) + 1);
    }
    return counts;
  }, [applications]);

  const selectedJobDetails = useMemo(() => jobs.find((job) => job.id === selectedJob) ?? null, [jobs, selectedJob]);

  const formatApplicationCount = (count: number) => {
    if (!Number.isFinite(count) || count < 0) return "0";
    if (count > 99) return "99+";
    return String(count);
  };

  const getJobStatusLabel = (status?: string | null) => {
    if (status === "published") return "Published";
    if (status === "unpublished") return "Unpublished";
    if (status === "archived") return "Archived";
    return status ? String(status) : "Unpublished";
  };

  const getJobStatusClasses = (status?: string | null) => {
    if (status === "published") return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "archived") return "border border-amber-200 bg-amber-50 text-amber-700";
    return "border border-slate-200 bg-slate-50 text-slate-700";
  };

  // Interview scheduling state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [candidateForInterview, setCandidateForInterview] = useState<Application | null>(null);
  const [scheduledDay, setScheduledDay] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState<string>("07:30");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [meetLink, setMeetLink] = useState<string>("");
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState<string>("");
  const [scheduledDatePickerOpen, setScheduledDatePickerOpen] = useState(false);

  // Talent acquisition feedback state
  const [showTaReviewDialog, setShowTaReviewDialog] = useState(false);
  const [taReviewCandidate, setTaReviewCandidate] = useState<Application | null>(null);
  const [taReviewRating, setTaReviewRating] = useState<number>(5);
  const [taReviewText, setTaReviewText] = useState<string>("");
  const [taReviewSaving, setTaReviewSaving] = useState(false);

  const [showTaRescheduleDialog, setShowTaRescheduleDialog] = useState(false);
  const [taRescheduleCandidate, setTaRescheduleCandidate] = useState<Application | null>(null);
  const [taRescheduleDateTime, setTaRescheduleDateTime] = useState<string>("");
  const [taRescheduleSaving, setTaRescheduleSaving] = useState(false);

  // Technical interview scheduling state (from Talent Acquisition -> Technical)
  const [showTechnicalDialog, setShowTechnicalDialog] = useState(false);
  const [candidateForTechnical, setCandidateForTechnical] = useState<Application | null>(null);
  const [technicalInterviewers, setTechnicalInterviewers] = useState<InterviewerOption[]>([]);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>("");
  const [technicalInterviewersLoading, setTechnicalInterviewersLoading] = useState(false);
  const [technicalDay, setTechnicalDay] = useState<Date | undefined>(undefined);
  const [technicalDatePickerOpen, setTechnicalDatePickerOpen] = useState(false);
  const [technicalTime, setTechnicalTime] = useState<string>("07:30");
  const [technicalDurationMinutes, setTechnicalDurationMinutes] = useState<number>(60);
  const [technicalMeetLink, setTechnicalMeetLink] = useState<string>("");
  const [technicalSchedulingLoading, setTechnicalSchedulingLoading] = useState(false);
  const [technicalAvailabilityStatus, setTechnicalAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [technicalAvailabilityMessage, setTechnicalAvailabilityMessage] = useState<string>("");
  const [technicalDialogMode, setTechnicalDialogMode] = useState<"schedule" | "reschedule">("schedule");

  // Leadership interview scheduling state (from Technical -> Leadership)
  const [showLeadershipDialog, setShowLeadershipDialog] = useState(false);
  const [candidateForLeadership, setCandidateForLeadership] = useState<Application | null>(null);
  const [leadershipInterviewers, setLeadershipInterviewers] = useState<InterviewerOption[]>([]);
  const [selectedLeadershipInterviewerId, setSelectedLeadershipInterviewerId] = useState<string>("");
  const [leadershipInterviewersLoading, setLeadershipInterviewersLoading] = useState(false);
  const [leadershipDay, setLeadershipDay] = useState<Date | undefined>(undefined);
  const [leadershipDatePickerOpen, setLeadershipDatePickerOpen] = useState(false);
  const [leadershipTime, setLeadershipTime] = useState<string>("07:30");
  const [leadershipDurationMinutes, setLeadershipDurationMinutes] = useState<number>(60);
  const [leadershipMeetLink, setLeadershipMeetLink] = useState<string>("");
  const [leadershipSchedulingLoading, setLeadershipSchedulingLoading] = useState(false);
  const [leadershipAvailabilityStatus, setLeadershipAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [leadershipAvailabilityMessage, setLeadershipAvailabilityMessage] = useState<string>("");
  const [leadershipDialogMode, setLeadershipDialogMode] = useState<"schedule" | "reschedule">("schedule");

  // Offer creation state (from Technical -> Offer)
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [candidateForOffer, setCandidateForOffer] = useState<Application | null>(null);
  const [offerSalary, setOfferSalary] = useState<string>("");
  const [offerStartDay, setOfferStartDay] = useState<Date | undefined>(undefined);
  const [offerDatePickerOpen, setOfferDatePickerOpen] = useState(false);
  const [offerBenefits, setOfferBenefits] = useState<string>("");
  const [offerResponseDays, setOfferResponseDays] = useState<number>(7);
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerPreviewLoading, setOfferPreviewLoading] = useState(false);
  const [offerPreviewUrl, setOfferPreviewUrl] = useState<string>("");
  const [offerPreviewError, setOfferPreviewError] = useState<string>("");
  const [offerPdfBlob, setOfferPdfBlob] = useState<Blob | null>(null);

  // View mode: kanban for "in-progress" tab, list for everything else
  const viewMode = activeTab === "in-progress" ? "pipeline" : "list";

  useEffect(() => {
    setSelectedCandidate(null);
  }, [activeTab]);

  const extractCvsObjectPathFromResumeUrl = (resumeUrl: string): string | null => {
    const match = resumeUrl.match(/cvs\/(.+)$/);
    return match ? match[1] : null;
  };

  const toFixed3ResumeUrls = (value: unknown): [string, string, string] => {
    if (Array.isArray(value)) {
      const a = value.map((v) => (typeof v === "string" ? v : "")).slice(0, 3);
      return [(a[0] ?? "").trim(), (a[1] ?? "").trim(), (a[2] ?? "").trim()];
    }
    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim();
      return [trimmed, "", ""];
    }
    return ["", "", ""];
  };

  const firstNonEmptyResumeUrl = (urls: readonly string[]) => urls.find((u) => String(u).trim()) ?? "";

  const createCvPreviewUrl = async (application: Application) => {
    if (!application.cvUrl) {
      throw new Error("No CV available for this candidate.");
    }

    const objectPath = extractCvsObjectPathFromResumeUrl(application.cvUrl);
    if (!objectPath) {
      throw new Error("Could not resolve CV storage path.");
    }

    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(objectPath, 60);
    if (error) throw error;

    const signedUrl = data?.signedUrl;
    if (!signedUrl) throw new Error("Signed URL was not returned.");

    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error("Failed to fetch CV");

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const openCvPreview = async (application: Application) => {
    if (cvLoading) return;
    setCvDialogError("");
    setCvLoading(true);

    try {
      const blobUrl = await createCvPreviewUrl(application);
      setCvDialogUrl(blobUrl);
      setCvDialogOpen(true);
    } catch (err) {
      console.error("Failed to create CV preview:", err);
      setCvDialogError(err instanceof Error ? err.message : "Failed to open CV preview.");
      setCvDialogUrl("");
      setCvDialogOpen(true);
    } finally {
      setCvLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "all") {
      if (inlineCvUrl) URL.revokeObjectURL(inlineCvUrl);
      setInlineCvUrl("");
      setInlineCvError("");
      setInlineCvLoading(false);
      return;
    }

    if (!selectedCandidate) {
      if (inlineCvUrl) URL.revokeObjectURL(inlineCvUrl);
      setInlineCvUrl("");
      setInlineCvError("");
      setInlineCvLoading(false);
      return;
    }

    let cancelled = false;
    setInlineCvLoading(true);
    setInlineCvError("");

    createCvPreviewUrl(selectedCandidate)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        if (inlineCvUrl) URL.revokeObjectURL(inlineCvUrl);
        setInlineCvUrl(url);
      })
      .catch((err) => {
        if (cancelled) return;
        setInlineCvError(err instanceof Error ? err.message : "Failed to load CV preview.");
        if (inlineCvUrl) {
          URL.revokeObjectURL(inlineCvUrl);
          setInlineCvUrl("");
        }
      })
      .finally(() => {
        if (!cancelled) setInlineCvLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedCandidate?.id]);

  const scheduledDateTime = useMemo(() => {
    if (!scheduledDay) return null;
    const [hh, mm] = scheduledTime.split(":").map((v) => Number(v));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

    const dt = new Date(scheduledDay);
    dt.setHours(hh, mm, 0, 0);

    // Enforce business hours: 07:30 - 23:00
    const mins = hh * 60 + mm;
    const startMins = 7 * 60 + 30;
    const endMins = 23 * 60;
    if (mins < startMins || mins > endMins) return null;

    const nowFloor = ceilToNextMinute(new Date());
    if (isSameDay(dt, nowFloor) && dt.getTime() < nowFloor.getTime()) return null;

    return dt;
  }, [scheduledDay, scheduledTime]);

  const technicalDateTime = useMemo(() => {
    if (!technicalDay) return null;
    const [hh, mm] = technicalTime.split(":").map((v) => Number(v));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

    const dt = new Date(technicalDay);
    dt.setHours(hh, mm, 0, 0);

    // Enforce business hours: 07:30 - 23:00
    const mins = hh * 60 + mm;
    const startMins = 7 * 60 + 30;
    const endMins = 23 * 60;
    if (mins < startMins || mins > endMins) return null;

    const nowFloor = ceilToNextMinute(new Date());
    if (isSameDay(dt, nowFloor) && dt.getTime() < nowFloor.getTime()) return null;

    return dt;
  }, [technicalDay, technicalTime]);

  const leadershipDateTime = useMemo(() => {
    if (!leadershipDay) return null;
    const [hh, mm] = leadershipTime.split(":").map((v) => Number(v));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

    const dt = new Date(leadershipDay);
    dt.setHours(hh, mm, 0, 0);

    // Enforce business hours: 07:30 - 23:00
    const mins = hh * 60 + mm;
    const startMins = 7 * 60 + 30;
    const endMins = 23 * 60;
    if (mins < startMins || mins > endMins) return null;

    const nowFloor = ceilToNextMinute(new Date());
    if (isSameDay(dt, nowFloor) && dt.getTime() < nowFloor.getTime()) return null;

    return dt;
  }, [leadershipDay, leadershipTime]);

  const minTimeForDay = (day?: Date) => {
    if (!day) return WORKDAY_START_TIME;
    const now = new Date();
    if (!isSameDay(day, now)) return WORKDAY_START_TIME;
    return maxTime(WORKDAY_START_TIME, toHHMM(ceilToNextMinute(now)));
  };

  useEffect(() => {
    if (!scheduledDay) return;
    const min = minTimeForDay(scheduledDay);
    if (scheduledTime < min) setScheduledTime(min);
  }, [scheduledDay, scheduledTime]);

  useEffect(() => {
    if (!technicalDay) return;
    const min = minTimeForDay(technicalDay);
    if (technicalTime < min) setTechnicalTime(min);
  }, [technicalDay, technicalTime]);

  useEffect(() => {
    if (!leadershipDay) return;
    const min = minTimeForDay(leadershipDay);
    if (leadershipTime < min) setLeadershipTime(min);
  }, [leadershipDay, leadershipTime]);

  const openScheduleInterviewDialog = async (candidate: Application) => {
    // Close the candidate details card so it doesn't "jump" stages after scheduling.
    setSelectedCandidate(null);
    setCandidateForInterview(candidate);
    setScheduledDay(undefined);
    setScheduledTime("07:30");
    setDurationMinutes(60);
    setMeetLink("");
    setShowScheduleDialog(true);
    setAvailabilityStatus("idle");
    setAvailabilityMessage("");
    setScheduledDatePickerOpen(false);

    // Resolve employer + current team member context
    if (user?.id) {
      try {
        let resolvedEmployerId: string | null = null;
        let resolvedTeamMemberId: string | null = null;

        const { data: employerByOwner } = await supabase
          .from("employers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (employerByOwner?.id) {
          resolvedEmployerId = employerByOwner.id;
        }

        const { data: teamMembership } = await supabase
          .from("employer_team_members")
          .select("id, employer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        resolvedTeamMemberId = teamMembership?.id ?? null;
        if (!resolvedEmployerId) {
          resolvedEmployerId = teamMembership?.employer_id ?? null;
        }

        setCurrentEmployerId(resolvedEmployerId);
        setCurrentTeamMemberId(resolvedTeamMemberId);
      } catch (err) {
        console.error("Failed to resolve employer context:", err);
      }
    }
  };

  const generateMeetLink = () => {
    // Generate a unique meet link (UUID-based)
    const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newMeetLink = `https://meet.talentek.com/${uniqueId}`;
    setMeetLink(newMeetLink);
    toast({
      title: "Meet Link Generated",
      description: "Meet link generated successfully.",
    });
  };

  const generateTechnicalMeetLink = () => {
    const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newMeetLink = `https://meet.talentek.com/${uniqueId}`;
    setTechnicalMeetLink(newMeetLink);
    toast({
      title: "Meet Link Generated",
      description: "Meet link generated successfully.",
    });
  };

  const generateLeadershipMeetLink = () => {
    const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newMeetLink = `https://meet.talentek.com/${uniqueId}`;
    setLeadershipMeetLink(newMeetLink);
    toast({
      title: "Meet Link Generated",
      description: "Meet link generated successfully.",
    });
  };

  useEffect(() => {
    const checkAvailability = async () => {
      if (!showScheduleDialog) return;

      if (!scheduledDateTime) {
        setAvailabilityStatus("idle");
        setAvailabilityMessage("");
        return;
      }

      const effectiveTeamMemberId = currentTeamMemberId;

      if (!effectiveTeamMemberId) {
        setAvailabilityStatus("error");
        setAvailabilityMessage("This recruiter account is not linked to an employer team member.");
        return;
      }

      setAvailabilityStatus("checking");
      setAvailabilityMessage("Checking availability...");

      try {
        const dayStart = new Date(scheduledDateTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const { data, error } = await supabase
          .from("interviews")
          .select("id, scheduled_date, duration_minutes, status")
          .eq("team_member_id", effectiveTeamMemberId)
          .gte("scheduled_date", dayStart.toISOString())
          .lt("scheduled_date", dayEnd.toISOString())
          .in("status", ["scheduled", "confirmed", "rescheduled"]);

        if (error) throw error;

        const newStart = scheduledDateTime.getTime();
        const newEnd = newStart + durationMinutes * 60_000;

        const conflict = (data ?? [])
          .map((row: any) => {
            const start = new Date(row.scheduled_date).getTime();
            const end = start + (Number(row.duration_minutes) || 60) * 60_000;
            return { id: row.id, start, end };
          })
          .find((row: any) => newStart < row.end && newEnd > row.start);

        if (conflict) {
          setAvailabilityStatus("conflict");
          setAvailabilityMessage(
            `Not available: conflict with another interview (${format(new Date(conflict.start), "HH:mm")}–${format(
              new Date(conflict.end),
              "HH:mm"
            )}).`
          );
          return;
        }

        if (candidateForInterview?.talentId) {
          const { data: candidateRows, error: candidateError } = await supabase
            .from("interviews")
            .select("id, scheduled_date, duration_minutes, status, applications!inner(talent_id)")
            .eq("applications.talent_id", candidateForInterview.talentId)
            .gte("scheduled_date", dayStart.toISOString())
            .lt("scheduled_date", dayEnd.toISOString())
            .in("status", ["scheduled", "confirmed", "rescheduled"]);

          if (candidateError) throw candidateError;

          const candidateConflict = (candidateRows ?? [])
            .map((row: any) => {
              const start = new Date(row.scheduled_date).getTime();
              const end = start + (Number(row.duration_minutes) || 60) * 60_000;
              return { id: row.id, start, end };
            })
            .find((row: any) => newStart < row.end && newEnd > row.start);

          if (candidateConflict) {
            setAvailabilityStatus("conflict");
            setAvailabilityMessage(
              `Candidate has another interview at ${format(
                new Date(candidateConflict.start),
                "HH:mm"
              )}–${format(new Date(candidateConflict.end), "HH:mm")}.`
            );
            return;
          }
        }

        setAvailabilityStatus("available");
        setAvailabilityMessage("Available.");
      } catch (err) {
        setAvailabilityStatus("error");
        setAvailabilityMessage(err instanceof Error ? err.message : "Failed to check availability.");
      }
    };

    void checkAvailability();
  }, [
    showScheduleDialog,
    scheduledDateTime,
    durationMinutes,
    currentTeamMemberId,
    candidateForInterview?.talentId,
  ]);

  useEffect(() => {
    const checkTechnicalAvailability = async () => {
      if (!showTechnicalDialog) return;

      if (!technicalDateTime || !selectedInterviewerId) {
        setTechnicalAvailabilityStatus("idle");
        setTechnicalAvailabilityMessage("");
        return;
      }

      setTechnicalAvailabilityStatus("checking");
      setTechnicalAvailabilityMessage("Checking availability...");

      try {
        const dayStart = new Date(technicalDateTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const { data, error } = await supabase
          .from("interviews")
          .select("id, scheduled_date, duration_minutes, status")
          .eq("interviewer_id", selectedInterviewerId)
          .gte("scheduled_date", dayStart.toISOString())
          .lt("scheduled_date", dayEnd.toISOString())
          .in("status", ["scheduled", "confirmed", "rescheduled"]);

        if (error) throw error;

        const newStart = technicalDateTime.getTime();
        const newEnd = newStart + technicalDurationMinutes * 60_000;

        const conflict = (data ?? [])
          .map((row: any) => {
            const start = new Date(row.scheduled_date).getTime();
            const end = start + (Number(row.duration_minutes) || 60) * 60_000;
            return { id: row.id, start, end };
          })
          .find((row: any) => newStart < row.end && newEnd > row.start);

        if (conflict) {
          setTechnicalAvailabilityStatus("conflict");
          setTechnicalAvailabilityMessage(
            `Not available (${format(new Date(conflict.start), "HH:mm")}–${format(new Date(conflict.end), "HH:mm")}).`
          );
          return;
        }

        if (candidateForTechnical?.talentId) {
          const { data: candidateRows, error: candidateError } = await supabase
            .from("interviews")
            .select("id, scheduled_date, duration_minutes, status, applications!inner(talent_id)")
            .eq("applications.talent_id", candidateForTechnical.talentId)
            .gte("scheduled_date", dayStart.toISOString())
            .lt("scheduled_date", dayEnd.toISOString())
            .in("status", ["scheduled", "confirmed", "rescheduled"]);

          if (candidateError) throw candidateError;

          const candidateConflict = (candidateRows ?? [])
            .map((row: any) => {
              const start = new Date(row.scheduled_date).getTime();
              const end = start + (Number(row.duration_minutes) || 60) * 60_000;
              return { id: row.id, start, end };
            })
            .find((row: any) => newStart < row.end && newEnd > row.start);

          if (candidateConflict) {
            setTechnicalAvailabilityStatus("conflict");
            setTechnicalAvailabilityMessage(
              `Candidate has another interview at ${format(
                new Date(candidateConflict.start),
                "HH:mm"
              )}–${format(new Date(candidateConflict.end), "HH:mm")}.`
            );
            return;
          }
        }

        setTechnicalAvailabilityStatus("available");
        setTechnicalAvailabilityMessage("Available.");
      } catch (err) {
        setTechnicalAvailabilityStatus("error");
        setTechnicalAvailabilityMessage(err instanceof Error ? err.message : "Failed to check availability.");
      }
    };

    void checkTechnicalAvailability();
  }, [showTechnicalDialog, technicalDateTime, technicalDurationMinutes, selectedInterviewerId, candidateForTechnical?.talentId]);

  useEffect(() => {
    const checkLeadershipAvailability = async () => {
      if (!showLeadershipDialog) return;

      if (!leadershipDateTime || !selectedLeadershipInterviewerId) {
        setLeadershipAvailabilityStatus("idle");
        setLeadershipAvailabilityMessage("");
        return;
      }

      setLeadershipAvailabilityStatus("checking");
      setLeadershipAvailabilityMessage("Checking availability...");

      try {
        const dayStart = new Date(leadershipDateTime);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const { data, error } = await supabase
          .from("interviews")
          .select("id, scheduled_date, duration_minutes, status")
          .eq("interviewer_id", selectedLeadershipInterviewerId)
          .gte("scheduled_date", dayStart.toISOString())
          .lt("scheduled_date", dayEnd.toISOString())
          .in("status", ["scheduled", "confirmed", "rescheduled"]);

        if (error) throw error;

        const newStart = leadershipDateTime.getTime();
        const newEnd = newStart + leadershipDurationMinutes * 60_000;

        const conflict = (data ?? [])
          .map((row: any) => {
            const start = new Date(row.scheduled_date).getTime();
            const end = start + (Number(row.duration_minutes) || 60) * 60_000;
            return { id: row.id, start, end };
          })
          .find((row: any) => newStart < row.end && newEnd > row.start);

        if (conflict) {
          setLeadershipAvailabilityStatus("conflict");
          setLeadershipAvailabilityMessage(
            `Not available (${format(new Date(conflict.start), "HH:mm")}–${format(new Date(conflict.end), "HH:mm")}).`
          );
          return;
        }

        if (candidateForLeadership?.talentId) {
          const { data: candidateRows, error: candidateError } = await supabase
            .from("interviews")
            .select("id, scheduled_date, duration_minutes, status, applications!inner(talent_id)")
            .eq("applications.talent_id", candidateForLeadership.talentId)
            .gte("scheduled_date", dayStart.toISOString())
            .lt("scheduled_date", dayEnd.toISOString())
            .in("status", ["scheduled", "confirmed", "rescheduled"]);

          if (candidateError) throw candidateError;

          const candidateConflict = (candidateRows ?? [])
            .map((row: any) => {
              const start = new Date(row.scheduled_date).getTime();
              const end = start + (Number(row.duration_minutes) || 60) * 60_000;
              return { id: row.id, start, end };
            })
            .find((row: any) => newStart < row.end && newEnd > row.start);

          if (candidateConflict) {
            setLeadershipAvailabilityStatus("conflict");
            setLeadershipAvailabilityMessage(
              `Candidate has another interview at ${format(
                new Date(candidateConflict.start),
                "HH:mm"
              )}–${format(new Date(candidateConflict.end), "HH:mm")}.`
            );
            return;
          }
        }

        setLeadershipAvailabilityStatus("available");
        setLeadershipAvailabilityMessage("Available.");
      } catch (err) {
        setLeadershipAvailabilityStatus("error");
        setLeadershipAvailabilityMessage(err instanceof Error ? err.message : "Failed to check availability.");
      }
    };

    void checkLeadershipAvailability();
  }, [
    showLeadershipDialog,
    leadershipDateTime,
    leadershipDurationMinutes,
    selectedLeadershipInterviewerId,
    candidateForLeadership?.talentId,
  ]);

  const handleScheduleInterview = async () => {
    if (!candidateForInterview || !scheduledDateTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (availabilityStatus === "conflict") {
      toast({
        title: "Time Not Available",
        description: availabilityMessage || "This time slot conflicts with another interview.",
        variant: "destructive",
      });
      return;
    }

    if (availabilityStatus === "error") {
      toast({
        title: "Cannot Schedule",
        description: availabilityMessage || "Unable to verify availability.",
        variant: "destructive",
      });
      return;
    }

    setSchedulingLoading(true);

    try {
      // interviews.team_member_id and interviews.created_by reference employer_team_members.id (not users.id)
      const effectiveTeamMemberId = currentTeamMemberId;

      if (!effectiveTeamMemberId) {
        throw new Error("Your recruiter account is not linked to an employer team member.");
      }

      const { error } = await supabase
        .from("interviews")
        .insert({
          application_id: candidateForInterview.id,
          interview_type: "talent-acquisition",
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: durationMinutes,
          team_member_id: effectiveTeamMemberId,
          meet_link: meetLink || null,
          created_by: effectiveTeamMemberId,
          status: "scheduled",
        })
        .select();

      if (error) throw error;

      // Move candidate to next stage
      await supabase
        .from("applications")
        .update({ stage: "talent-acquisition", updated_at: new Date().toISOString() })
        .eq("id", candidateForInterview.id);

      // Update local applications
      setApplications((prev) =>
        prev.map((app) =>
          app.id === candidateForInterview.id ? { ...app, stage: "talent-acquisition" } : app
        )
      );

      toast({
        title: "Interview Scheduled",
        description: `Interview scheduled for ${candidateForInterview.name}`,
      });

      // Ensure the pipeline card isn't open after moving stage.
      setSelectedCandidate(null);
      setShowScheduleDialog(false);
      setCandidateForInterview(null);
    } catch (err) {
      console.error("Failed to schedule interview:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to schedule interview",
        variant: "destructive",
      });
    } finally {
      setSchedulingLoading(false);
    }
  };

  const updateApplication = async (applicationId: string, patch: Partial<{ status: ApplicationStatus; stage: ApplicationStage }>) => {
    const previous = applications.find((a) => a.id === applicationId);
    if (!previous) return;

    setApplicationBusyById((prev) => ({ ...prev, [applicationId]: true }));

    const nextApp = { ...previous, ...patch };
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? nextApp : a)));
    setSelectedCandidate((prev) => (prev?.id === applicationId ? nextApp : prev));

    try {
      const { error } = await supabase
        .from("applications")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", applicationId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update application:", err);
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? previous : a)));
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update application.",
        variant: "destructive",
      });
    } finally {
      setApplicationBusyById((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const movePendingToContact = async (app: Application) => {
    if (applicationBusyById[app.id]) return;
    // Close first so the candidate doesn't "jump" stages inside the same open dialog.
    setSelectedCandidate(null);
    await updateApplication(app.id, { status: "in-progress", stage: "to-contact" });
    toast({ title: "Moved to To Contact", description: `${app.name} is now in your hiring pipeline.` });
  };

  const archiveApplication = async (app: Application) => {
    if (applicationBusyById[app.id]) return;
    setSelectedCandidate(null);
    await updateApplication(app.id, { status: "rejected", stage: null });
    toast({ title: "Rejected", description: `${app.name} has been rejected.` });
  };

  const openTaReviewDialog = (candidate: Application) => {
    if (candidate.taInterviewStatus === "completed") {
      toast({
        title: "Interview Completed",
        description: "This talent acquisition interview is already completed.",
        variant: "destructive",
      });
      return;
    }

    setSelectedCandidate(null);
    setTaReviewCandidate(candidate);
    setTaReviewRating(candidate.taReviewRating ?? 5);
    setTaReviewText(candidate.taReviewText ?? "");
    setShowTaReviewDialog(true);
  };

  const openTaInterviewLink = (candidate: Application) => {
    if (candidate.taInterviewStatus === "completed") {
      toast({
        title: "Interview Completed",
        description: "This talent acquisition interview is already completed.",
        variant: "destructive",
      });
      return;
    }

    if (!candidate.taInterviewMeetLink) {
      toast({
        title: "No Join Link",
        description: "This talent acquisition interview does not have a meet link yet.",
        variant: "destructive",
      });
      return;
    }

    window.open(candidate.taInterviewMeetLink, "_blank", "noopener,noreferrer");
  };

  const openTaRescheduleDialog = (candidate: Application) => {
    if (candidate.taInterviewStatus === "completed") {
      toast({
        title: "Interview Completed",
        description: "This talent acquisition interview is already completed.",
        variant: "destructive",
      });
      return;
    }

    if (!candidate.taInterviewId) {
      toast({
        title: "No Interview Linked",
        description: "This talent acquisition candidate does not have a scheduled interview yet.",
        variant: "destructive",
      });
      return;
    }

    setSelectedCandidate(null);
    setTaRescheduleCandidate(candidate);
    setTaRescheduleDateTime(toLocalDateTimeInputValue(candidate.taInterviewScheduledAt));
    setShowTaRescheduleDialog(true);
  };

  const saveTaReschedule = async () => {
    if (!taRescheduleCandidate?.taInterviewId || !taRescheduleDateTime) return;

    setTaRescheduleSaving(true);
    try {
      const nextIso = new Date(taRescheduleDateTime).toISOString();

      const { error } = await supabase
        .from("interviews")
        .update({
          scheduled_date: nextIso,
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", taRescheduleCandidate.taInterviewId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === taRescheduleCandidate.id
            ? {
                ...app,
                taInterviewScheduledAt: nextIso,
                taInterviewStatus: "scheduled",
              }
            : app
        )
      );

      setSelectedCandidate((prev) =>
        prev?.id === taRescheduleCandidate.id
          ? {
              ...prev,
              taInterviewScheduledAt: nextIso,
              taInterviewStatus: "scheduled",
            }
          : prev
      );

      toast({
        title: "Interview Rescheduled",
        description: "Talent acquisition interview time updated successfully.",
      });

      setShowTaRescheduleDialog(false);
      setTaRescheduleCandidate(null);
      setTaRescheduleDateTime("");
    } catch (err) {
      console.error("Failed to reschedule TA interview:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reschedule talent acquisition interview.",
        variant: "destructive",
      });
    } finally {
      setTaRescheduleSaving(false);
    }
  };

  const submitTaReview = async () => {
    setTaReviewSaving(true);
    try {
      const submittedOn = format(new Date(), "dd/MM/yyyy");

      if (taReviewCandidate?.taInterviewId) {
        const { error } = await supabase
          .from("interview_reviews")
          .upsert(
            {
              interview_id: taReviewCandidate.taInterviewId,
              rating: taReviewRating,
              review_text: taReviewText || null,
            },
            { onConflict: "interview_id" }
          );

        if (error) throw error;

        const { error: interviewError } = await supabase
          .from("interviews")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", taReviewCandidate.taInterviewId);

        if (interviewError) throw interviewError;
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === taReviewCandidate?.id
            ? {
                ...app,
                taReviewRating,
                taReviewText,
                taReviewSubmittedOn: submittedOn,
                taInterviewStatus: "completed",
              }
            : app
        )
      );
      setSelectedCandidate((prev) =>
        prev?.id === taReviewCandidate?.id
          ? {
              ...prev,
              taReviewRating,
              taReviewText,
              taReviewSubmittedOn: submittedOn,
              taInterviewStatus: "completed",
            }
          : prev
      );

      toast({
        title: "Feedback saved",
        description: "Talent acquisition feedback submitted successfully.",
      });
      setShowTaReviewDialog(false);
      setTaReviewCandidate(null);
    } catch (err) {
      console.error("Failed to save TA feedback:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save talent acquisition feedback.",
        variant: "destructive",
      });
    } finally {
      setTaReviewSaving(false);
    }
  };

  const openTechnicalInterviewDialog = async (app: Application, mode: "schedule" | "reschedule" = "schedule") => {
    // Close the candidate details card so it doesn't "jump" stages after moving to Technical.
    setSelectedCandidate(null);
    setTechnicalDialogMode(mode);
    setCandidateForTechnical(app);
    setSelectedInterviewerId("");
    setTechnicalDay(undefined);
    setTechnicalDatePickerOpen(false);
    setTechnicalTime("07:30");
    setTechnicalDurationMinutes(60);
    setTechnicalMeetLink("");
    setTechnicalAvailabilityStatus("idle");
    setTechnicalAvailabilityMessage("");
    setShowTechnicalDialog(true);
    setTechnicalInterviewers([]);
    setTechnicalInterviewersLoading(true);

    if (!currentEmployerId) {
      setTechnicalInterviewersLoading(false);
      toast({
        title: "No Company Found",
        description: "We could not find the company linked to this recruiter account.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("interviewers")
        .select("id, full_name, email, status, interview_type, employer_id")
        .eq("employer_id", currentEmployerId)
        .eq("interview_type", "technical")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: InterviewerOption[] = (data ?? []).map((row: any) => ({
        id: row.id,
        fullName: row.full_name || "Unnamed interviewer",
        email: row.email || "",
      }));
      setTechnicalInterviewers(mapped);
      if (mapped.length > 0) {
        setSelectedInterviewerId(mapped[0].id);
      }
    } catch (err) {
      console.error("Failed to load interviewers:", err);
      toast({
        title: "Failed to load interviewers",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setTechnicalInterviewersLoading(false);
    }
  };

  const handleScheduleTechnicalInterview = async () => {
    if (!candidateForTechnical || !technicalDateTime || !selectedInterviewerId) {
      toast({
        title: "Missing Information",
        description: "Please select an interviewer, date, and time.",
        variant: "destructive",
      });
      return;
    }

    if (technicalAvailabilityStatus === "conflict") {
      toast({
        title: "Not Available",
        description: technicalAvailabilityMessage || "This time is not available for the selected interviewer.",
        variant: "destructive",
      });
      return;
    }

    if (technicalAvailabilityStatus === "error") {
      toast({
        title: "Cannot Schedule",
        description: technicalAvailabilityMessage || "Unable to verify availability.",
        variant: "destructive",
      });
      return;
    }

    if (!currentTeamMemberId) {
      toast({
        title: "Cannot Schedule",
        description: "This recruiter account is not linked to an employer team member.",
        variant: "destructive",
      });
      return;
    }

    setTechnicalSchedulingLoading(true);
    try {
      const { error } = await supabase
        .from("interviews")
        .insert({
          application_id: candidateForTechnical.id,
          interviewer_id: selectedInterviewerId,
          interview_type: "technical",
          scheduled_date: technicalDateTime.toISOString(),
          duration_minutes: technicalDurationMinutes,
          meet_link: technicalMeetLink || null,
          team_member_id: null,
          created_by: currentTeamMemberId,
          status: "scheduled",
        })
        .select();

      if (error) throw error;

      await updateApplication(candidateForTechnical.id, { stage: "technical" });

      toast({
        title: "Technical Interview Scheduled",
        description: `Scheduled for ${candidateForTechnical.name}`,
      });

      setShowTechnicalDialog(false);
      setCandidateForTechnical(null);
    } catch (err) {
      console.error("Failed to schedule technical interview:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to schedule interview",
        variant: "destructive",
      });
    } finally {
      setTechnicalSchedulingLoading(false);
    }
  };

  const openLeadershipInterviewDialog = async (app: Application, mode: "schedule" | "reschedule" = "schedule") => {
    // Close the candidate details card so it doesn't "jump" stages after moving to Leadership.
    setSelectedCandidate(null);
    setLeadershipDialogMode(mode);
    setCandidateForLeadership(app);
    setSelectedLeadershipInterviewerId("");
    setLeadershipDay(undefined);
    setLeadershipDatePickerOpen(false);
    setLeadershipTime("07:30");
    setLeadershipDurationMinutes(60);
    setLeadershipMeetLink("");
    setLeadershipAvailabilityStatus("idle");
    setLeadershipAvailabilityMessage("");
    setShowLeadershipDialog(true);
    setLeadershipInterviewers([]);
    setLeadershipInterviewersLoading(true);

    if (!currentEmployerId) {
      setLeadershipInterviewersLoading(false);
      toast({
        title: "No Company Found",
        description: "We could not find the company linked to this recruiter account.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("interviewers")
        .select("id, full_name, email, status, interview_type, employer_id")
        .eq("employer_id", currentEmployerId)
        .eq("interview_type", "leadership")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: InterviewerOption[] = (data ?? []).map((row: any) => ({
        id: row.id,
        fullName: row.full_name || "Unnamed interviewer",
        email: row.email || "",
      }));
      setLeadershipInterviewers(mapped);
      if (mapped.length > 0) {
        setSelectedLeadershipInterviewerId(mapped[0].id);
      }
    } catch (err) {
      console.error("Failed to load interviewers:", err);
      toast({
        title: "Failed to load interviewers",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLeadershipInterviewersLoading(false);
    }
  };

  const handleScheduleLeadershipInterview = async () => {
    if (!candidateForLeadership || !leadershipDateTime || !selectedLeadershipInterviewerId) {
      toast({
        title: "Missing Information",
        description: "Please select an interviewer, date, and time.",
        variant: "destructive",
      });
      return;
    }

    if (leadershipAvailabilityStatus === "conflict") {
      toast({
        title: "Not Available",
        description: leadershipAvailabilityMessage || "This time is not available for the selected interviewer.",
        variant: "destructive",
      });
      return;
    }

    if (leadershipAvailabilityStatus === "error") {
      toast({
        title: "Cannot Schedule",
        description: leadershipAvailabilityMessage || "Unable to verify availability.",
        variant: "destructive",
      });
      return;
    }

    if (!currentTeamMemberId) {
      toast({
        title: "Cannot Schedule",
        description: "This recruiter account is not linked to an employer team member.",
        variant: "destructive",
      });
      return;
    }

    setLeadershipSchedulingLoading(true);
    try {
      const { error } = await supabase
        .from("interviews")
        .insert({
          application_id: candidateForLeadership.id,
          interviewer_id: selectedLeadershipInterviewerId,
          interview_type: "leadership",
          scheduled_date: leadershipDateTime.toISOString(),
          duration_minutes: leadershipDurationMinutes,
          meet_link: leadershipMeetLink || null,
          team_member_id: null,
          created_by: currentTeamMemberId,
          status: "scheduled",
        })
        .select();

      if (error) throw error;

      await updateApplication(candidateForLeadership.id, { stage: "leadership" });

      toast({
        title: "Leadership Interview Scheduled",
        description: `Scheduled for ${candidateForLeadership.name}`,
      });

      setShowLeadershipDialog(false);
      setCandidateForLeadership(null);
    } catch (err) {
      console.error("Failed to schedule leadership interview:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to schedule interview",
        variant: "destructive",
      });
    } finally {
      setLeadershipSchedulingLoading(false);
    }
  };

  const getJobForApplication = (app: Application): RecruiterJob | null => {
    return jobs.find((j) => j.id === app.jobId) ?? null;
  };

  const openOfferDialog = (app: Application) => {
    // Close the candidate details card so it doesn't "jump" stages after moving to Offer.
    setSelectedCandidate(null);
    setCandidateForOffer(app);
    setOfferSalary("");
    setOfferStartDay(undefined);
    setOfferDatePickerOpen(false);
    setOfferBenefits("");
    setOfferResponseDays(7);
    setOfferPreviewUrl("");
    setOfferPreviewError("");
    setOfferPdfBlob(null);
    setShowOfferDialog(true);
  };

  const urlToDataUrl = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }
          reject(new Error("Could not read image data."));
        };
        reader.onerror = () => reject(new Error("Could not read logo file."));
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const buildOfferPdfBlob = async () => {
    if (!candidateForOffer) return;

    const job = getJobForApplication(candidateForOffer);
    if (!job) {
      toast({
        title: "Missing Job",
        description: "We couldn't find the job details for this application.",
        variant: "destructive",
      });
      return;
    }

    if (!offerSalary.trim() || !offerStartDay) {
      toast({
        title: "Missing Information",
        description: "Please fill in salary and start date.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(offerResponseDays) || offerResponseDays < 1) {
      toast({
        title: "Invalid Response Time",
        description: "Response time must be at least 1 day.",
        variant: "destructive",
      });
      return;
    }

    setOfferPreviewLoading(true);
    setOfferPreviewError("");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const salaryValue = offerSalary.trim();
      const salaryStored = salaryValue.toLowerCase().includes("dzd") ? salaryValue : `${salaryValue} DZD`;
      const startDateStored = formatSafeDate(offerStartDay, "MMMM d, yyyy");
      const issueDateStored = format(new Date(), "MMMM d, yyyy");
      const responseDeadlineStored = format(computeOfferResponseDeadline(offerResponseDays), "MMMM d, yyyy");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 52;
      const contentWidth = pageWidth - marginX * 2;
      let y = 60;

      const color = {
        blue: [109, 151, 209] as const,
        text: [33, 37, 41] as const,
        subtle: [211, 220, 232] as const,
      };

      const repFullName = [currentEmployerProfile.repFirstName, currentEmployerProfile.repLastName]
        .map((v) => String(v || "").trim())
        .filter(Boolean)
        .join(" ");
      const recruiterFullName = String(currentRecruiterName || "").trim() || String(user?.email || "").trim() || "Recruiter";
      const repAddressLine = [currentEmployerProfile.address, currentEmployerProfile.city]
        .map((v) => String(v || "").trim())
        .filter(Boolean)
        .join(", ");
      const repPostalLine = [currentEmployerProfile.zipCode, currentEmployerProfile.country]
        .map((v) => String(v || "").trim())
        .filter(Boolean)
        .join(" ");

      const candidateName = String(candidateForOffer.name || "Candidate").trim();
      const candidateAddress = String(candidateForOffer.location || "").trim();
      const candidateEmail = String(candidateForOffer.email || "").trim();

      const contractType = String(job.contractType || "").trim();
      const employmentType = String(job.employmentType || "").trim();
      const workplace = String(job.workplace || "").trim();
      const experienceLevel = String(job.experienceLevel || "").trim();
      const workLocation = String(job.location || "").trim() || "Not specified";

      const writeParagraph = (
        text: string,
        options?: { lineHeight?: number; fontSize?: number; fontWeight?: "normal" | "bold" },
      ) => {
        const lineHeight = options?.lineHeight ?? 23;
        const fontSize = options?.fontSize ?? 13;
        const fontWeight = options?.fontWeight ?? "normal";
        doc.setFont("times", fontWeight);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color.text);
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, marginX, y);
        y += lines.length * lineHeight;
      };

      const writeStyledParagraph = (
        runs: Array<{ text: string; fontWeight?: "normal" | "bold" }>,
        options?: { lineHeight?: number; fontSize?: number },
      ) => {
        const lineHeight = options?.lineHeight ?? 23;
        const fontSize = options?.fontSize ?? 13;
        const maxX = marginX + contentWidth;
        let x = marginX;
        let currentY = y;

        doc.setFontSize(fontSize);
        doc.setTextColor(...color.text);

        for (const run of runs) {
          const weight = run.fontWeight ?? "normal";
          const tokens = run.text.split(/(\s+)/).filter((token) => token.length > 0);

          for (const token of tokens) {
            const isWhitespace = /^\s+$/.test(token);
            doc.setFont("times", weight);
            const tokenWidth = doc.getTextWidth(token);

            if (!isWhitespace && x + tokenWidth > maxX) {
              currentY += lineHeight;
              x = marginX;
            }

            if (isWhitespace && x === marginX) {
              continue;
            }

            doc.text(token, x, currentY);
            x += tokenWidth;
          }
        }

        y = currentY + lineHeight;
      };

      const ensureRoom = (neededHeight: number) => {
        if (y + neededHeight <= pageHeight - 74) return;
        doc.addPage();
        y = 60;
      };

      const getImageFormat = (dataUrl: string) => (dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG");

      // Add a subtle center watermark logo behind content.
      const watermarkLogoDataUrl = await urlToDataUrl(talentekLogo);
      if (watermarkLogoDataUrl) {
        try {
          const anyDoc = doc as any;
          if (typeof anyDoc.setGState === "function" && typeof anyDoc.GState === "function") {
            anyDoc.setGState(new anyDoc.GState({ opacity: 0.03 }));
            const watermarkSize = 300;
            doc.addImage(
              watermarkLogoDataUrl,
              getImageFormat(watermarkLogoDataUrl),
              (pageWidth - watermarkSize) / 2,
              (pageHeight - watermarkSize) / 2,
              watermarkSize,
              watermarkSize,
            );
            anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
          } else {
            // Fallback when opacity APIs are unavailable.
            doc.setTextColor(235, 235, 235);
            doc.setFont("times", "bold");
            doc.setFontSize(52);
            doc.text("TALENTEK", pageWidth / 2, pageHeight / 2, { align: "center" });
          }
        } catch {
          // Ignore watermark rendering issues and continue.
        }
      }

      const companyLogoDataUrl = currentCompanyLogoUrl ? await urlToDataUrl(currentCompanyLogoUrl) : null;
      if (companyLogoDataUrl) {
        try {
          doc.addImage(companyLogoDataUrl, getImageFormat(companyLogoDataUrl), marginX, y - 8, 54, 54);
        } catch {
          // Ignore logo rendering issues and continue with text-only header.
        }
      }

      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...color.text);
      doc.text(currentCompanyName || "Company", marginX + 66, y + 10);

      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...color.text);
      if (repFullName) doc.text(repFullName, marginX + 66, y + 28);
      if (repAddressLine) doc.text(repAddressLine, marginX + 66, y + 43);
      if (repPostalLine) doc.text(repPostalLine, marginX + 66, y + 58);

      const rightX = pageWidth - marginX;
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...color.blue);
      doc.text(candidateName, rightX, y + 80, { align: "right" });

      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...color.text);
      if (candidateAddress) doc.text(candidateAddress, rightX, y + 95, { align: "right" });
      if (candidateEmail) doc.text(candidateEmail, rightX, y + 110, { align: "right" });

      y += 136;
      doc.setDrawColor(...color.subtle);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 24;

      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...color.text);
      doc.text("Subject: Employment Offer", marginX, y);

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(`${workLocation}, ${issueDateStored}`, rightX, y, { align: "right" });

      y += 28;
      writeStyledParagraph(
        [
          { text: "Madam/Sir " },
          { text: `${candidateName},`, fontWeight: "bold" },
        ],
        { fontSize: 14, lineHeight: 24 },
      );
      y += 10;

      writeStyledParagraph(
        [
          {
            text: "We are pleased to offer you a position within our organization under the employment terms described below. You are being offered the role of ",
          },
          { text: `${job.title || "this role"}`, fontWeight: "bold" },
          { text: " under a " },
          { text: `${contractType || "standard"}`, fontWeight: "bold" },
          { text: " contract, with an " },
          { text: `${employmentType || "full-time"}`, fontWeight: "bold" },
          { text: " schedule, a " },
          { text: `${workplace || "hybrid"}`, fontWeight: "bold" },
          { text: " work mode, based in " },
          { text: `${workLocation}`, fontWeight: "bold" },
          { text: " with an expected start date of " },
          { text: `${startDateStored}.`, fontWeight: "bold" },
        ],
        { fontSize: 13, lineHeight: 23 },
      );
      y += 10;

      writeStyledParagraph(
        [
          { text: "The proposed compensation and profile alignment for this position are provided below. Your compensation will be " },
          { text: `${salaryStored}.`, fontWeight: "bold" },
    
        ],
        { fontSize: 13, lineHeight: 23 },
      );
      y += 10;

      writeStyledParagraph(
        [
          { text: "You are kindly requested to communicate your decision no later than " },
          { text: `${responseDeadlineStored}.`, fontWeight: "bold" },
          { text: " If no response is received by this date, this employment offer will be considered declined." },
        ],
        { fontSize: 14, lineHeight: 24 },
      );
      y += 12;

      doc.setFont("times", "normal");
      doc.setFontSize(13);
      doc.setTextColor(...color.text);
      doc.text("Please accept the expression of my distinguished consideration.", marginX, y);
      y += 24;
      doc.setFont("times", "bold");
      doc.text(recruiterFullName, marginX, y);
      y += 18;
      doc.setFont("times", "normal");
      doc.text(currentCompanyName || "Company", marginX, y);

      doc.setTextColor(120, 120, 120);
      doc.setFont("times", "normal");
      doc.setFontSize(8);
      doc.text("All rights reserved to Talentek", pageWidth / 2, pageHeight - 18, { align: "center" });

      const blob = doc.output("blob");
      const previewUrl = URL.createObjectURL(blob);
      setOfferPdfBlob(blob);
      setOfferPreviewUrl(previewUrl);
    } catch (err) {
      setOfferPreviewError(err instanceof Error ? err.message : "Failed to generate offer PDF preview.");
      setOfferPdfBlob(null);
      setOfferPreviewUrl("");
    } finally {
      setOfferPreviewLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!candidateForOffer || !offerPdfBlob) {
      toast({
        title: "Preview required",
        description: "Please click Show Result first to generate the offer PDF.",
        variant: "destructive",
      });
      return;
    }

    const job = getJobForApplication(candidateForOffer);
    if (!job) {
      toast({
        title: "Missing Job",
        description: "We couldn't find the job details for this application.",
        variant: "destructive",
      });
      return;
    }

    if (!offerSalary.trim() || !offerStartDay) {
      toast({
        title: "Missing Information",
        description: "Please fill in salary and start date.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isFinite(offerResponseDays) || offerResponseDays < 1) {
      toast({
        title: "Invalid Response Time",
        description: "Response time must be at least 1 day.",
        variant: "destructive",
      });
      return;
    }

    setOfferSaving(true);
    try {
      const salaryValue = offerSalary.trim();
      const salaryStored = salaryValue.toLowerCase().includes("dzd") ? salaryValue : `${salaryValue} DZD`;
      const startDateStored = formatSafeDate(offerStartDay, "yyyy-MM-dd");
      const responseDeadlineStored = computeOfferResponseDeadline(offerResponseDays).toISOString();

      const objectPath = [
        currentEmployerId || "employer",
        candidateForOffer.id,
        `offer-${Date.now()}.pdf`,
      ].join("/");

      const { error: uploadError } = await supabase.storage.from("offers").upload(objectPath, offerPdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("offers").getPublicUrl(objectPath);
      const offerUrl = publicData?.publicUrl || objectPath;

      const { error } = await supabase
        .from("offers")
        .insert({
          application_id: candidateForOffer.id,
          position: job.title,
          salary: salaryStored,
          start_date: startDateStored,
          work_location: job.location || null,
          benefits_perks: offerBenefits.trim() ? offerBenefits.trim() : null,
          status: "pending",
          offre_url: offerUrl,
          response_deadline: responseDeadlineStored,
        })
        .select();

      if (error) throw error;

      await updateApplication(candidateForOffer.id, { stage: "offer" });

      toast({ title: "Offer created", description: `Offer prepared for ${candidateForOffer.name}.` });

      setShowOfferDialog(false);
      setCandidateForOffer(null);
      setOfferPreviewUrl("");
      setOfferPdfBlob(null);
      setOfferPreviewError("");
    } catch (err) {
      console.error("Failed to create offer:", err);
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";
      const isStorageRlsError =
        /row-level security|violates row-level security policy|new row violates/i.test(errorMessage);

      if (isStorageRlsError) {
        console.info(
          "Expected offers storage policies: insert 1i5ycnr_0 (SELECT), insert 1i5ycnr_1 (INSERT), insert 1i5ycnr_2 (UPDATE), insert 1i5ycnr_3 (DELETE).",
        );
      }

      toast({
        title: "Error",
        description: isStorageRlsError
          ? "Upload blocked by Storage policy. Apply offers policies: insert 1i5ycnr_0, insert 1i5ycnr_1, insert 1i5ycnr_2, insert 1i5ycnr_3, then retry."
          : err instanceof Error
          ? err.message
          : "Failed to create offer",
        variant: "destructive",
      });
    } finally {
      setOfferSaving(false);
    }
  };

  useEffect(() => {
    const loadApplications = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let resolvedEmployerId: string | null = null;
        let resolvedTeamMemberId: string | null = null;

        const { data: employerByOwner } = await supabase
          .from("employers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (employerByOwner?.id) {
          resolvedEmployerId = employerByOwner.id;
        }

        const { data: teamMembership } = await supabase
          .from("employer_team_members")
          .select("id, employer_id, first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle();

        resolvedTeamMemberId = teamMembership?.id ?? null;
        const recruiterFullName = [teamMembership?.first_name, teamMembership?.last_name]
          .map((value) => String(value || "").trim())
          .filter(Boolean)
          .join(" ");
        setCurrentRecruiterName(recruiterFullName);
        if (!resolvedEmployerId) {
          resolvedEmployerId = teamMembership?.employer_id ?? null;
        }

        setCurrentEmployerId(resolvedEmployerId);
        setCurrentTeamMemberId(resolvedTeamMemberId);

        if (resolvedEmployerId) {
          const { data: employerProfile } = await supabase
            .from("employers")
            .select("company_name, logo_url, rep_first_name, rep_last_name, address, city, zip_code, country")
            .eq("id", resolvedEmployerId)
            .maybeSingle();

          setCurrentCompanyName(employerProfile?.company_name || "");
          setCurrentCompanyLogoUrl(employerProfile?.logo_url || "");
          setCurrentEmployerProfile({
            companyName: employerProfile?.company_name || "",
            logoUrl: employerProfile?.logo_url || "",
            repFirstName: employerProfile?.rep_first_name || "",
            repLastName: employerProfile?.rep_last_name || "",
            address: employerProfile?.address || "",
            city: employerProfile?.city || "",
            zipCode: employerProfile?.zip_code || "",
            country: employerProfile?.country || "",
          });
        }

        if (!resolvedEmployerId) {
          toast({
            title: "No Company Found",
            description: "We could not find the company linked to this recruiter account.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Load jobs for this company
        const { data: jobRows, error: jobsError } = await supabase
          .from("jobs")
          .select("id,title,profession,location,contract_type,employment_type,workplace,experience_level,status")
          .eq("employer_id", resolvedEmployerId)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        const jobsData: RecruiterJob[] = (jobRows || []).map((row: any) => ({
          id: row.id,
          title: row.title || "Untitled Position",
          department: row.profession || "",
          location: row.location || "",
          contractType: row.contract_type || "",
          employmentType: row.employment_type || "",
          workplace: row.workplace || "",
          experienceLevel: row.experience_level || "",
          status: row.status || null,
        }));

        setJobs(jobsData);

        if (jobsData.length > 0 && !selectedJob) {
          let savedJobId: string | null = null;
          try {
            savedJobId = window.localStorage.getItem(PIPELINE_JOB_STORAGE_KEY);
          } catch (err) {
            // ignore localStorage errors
          }

          const fallbackJobId = jobsData[0]?.id ?? null;
          const preferredJobId = savedJobId && jobsData.some((job) => job.id === savedJobId) ? savedJobId : fallbackJobId;

          if (preferredJobId) {
            setSelectedJob(preferredJobId);
          }
        }

        const jobIds = jobsData.map((j) => j.id);

        // Load applications for these jobs
        const { data: applicationRows, error: appsError } = await supabase
          .from("applications")
          .select("id, job_id, talent_id, status, match_score, applied_at, stage, resume_url")
          .in("job_id", jobIds);

        if (appsError) throw appsError;

        const apps = applicationRows || [];
        const applicationIds = apps.map((a: any) => a.id).filter(Boolean);

        const talentIds = [...new Set(apps.map((a: any) => a.talent_id).filter(Boolean))];

        const offerStatusByApplicationId = new Map<string, string>();
        if (applicationIds.length > 0) {
          const { data: offerRows, error: offersError } = await supabase
            .from("offers")
            .select("application_id, status, updated_at, created_at")
            .in("application_id", applicationIds)
            .order("updated_at", { ascending: false });

          if (!offersError && offerRows) {
            for (const row of offerRows as any[]) {
              const appId = row.application_id as string | undefined;
              const status = row.status as string | undefined;
              if (!appId || !status) continue;
              if (!offerStatusByApplicationId.has(appId)) {
                offerStatusByApplicationId.set(appId, status);
              }
            }
          }
        }

        const taReviewByApplicationId = new Map<string, { interviewId?: string; meetLink?: string; scheduledAt?: string; status?: string; rating?: number; text?: string; submittedOn?: string }>();
        const technicalFeedbackByApplicationId = new Map<string, { rating?: number; text?: string; submittedOn?: string }>();
        const leadershipFeedbackByApplicationId = new Map<string, { rating?: number; text?: string; submittedOn?: string }>();

        if (applicationIds.length > 0) {
          const taInterviewsRes = await supabase
            .from("interviews")
            .select("id, application_id, scheduled_date, meet_link, status, review:interview_reviews(rating, review_text, created_at)")
            .eq("interview_type", "talent-acquisition")
            .in("application_id", applicationIds)
            .order("scheduled_date", { ascending: false });

          if (!taInterviewsRes.error && taInterviewsRes.data) {
            for (const row of taInterviewsRes.data as any[]) {
              const appId = row.application_id as string | undefined;
              if (!appId || taReviewByApplicationId.has(appId)) continue;

              const interviewId = row.id as string | undefined;
              const meetLink = row.meet_link as string | undefined;
              const scheduledAt = row.scheduled_date ? format(new Date(row.scheduled_date), "dd/MM/yyyy") : undefined;
              const review = Array.isArray(row.review) ? row.review[0] : row.review;
              taReviewByApplicationId.set(appId, {
                interviewId,
                meetLink,
                scheduledAt,
                status: row.status as string | undefined,
                rating: review?.rating ? Number(review.rating) : undefined,
                text: review?.review_text || undefined,
                submittedOn: review?.created_at ? format(new Date(review.created_at), "dd/MM/yyyy") : undefined,
              });
            }
          }

          const technicalInterviewsRes = await supabase
            .from("interviews")
            .select("application_id, scheduled_date, review:interview_reviews(rating, review_text, created_at)")
            .eq("interview_type", "technical")
            .in("application_id", applicationIds)
            .order("scheduled_date", { ascending: false });

          if (!technicalInterviewsRes.error && technicalInterviewsRes.data) {
            for (const row of technicalInterviewsRes.data as any[]) {
              const appId = row.application_id as string | undefined;
              if (!appId || technicalFeedbackByApplicationId.has(appId)) continue;

              const review = Array.isArray(row.review) ? row.review[0] : row.review;
              if (!review) continue;

              technicalFeedbackByApplicationId.set(appId, {
                rating: review.rating ? Number(review.rating) : undefined,
                text: review.review_text || undefined,
                submittedOn: review.created_at ? format(new Date(review.created_at), "dd/MM/yyyy") : undefined,
              });
            }
          }

          const leadershipInterviewsRes = await supabase
            .from("interviews")
            .select("application_id, scheduled_date, review:interview_reviews(rating, review_text, created_at)")
            .eq("interview_type", "leadership")
            .in("application_id", applicationIds)
            .order("scheduled_date", { ascending: false });

          if (!leadershipInterviewsRes.error && leadershipInterviewsRes.data) {
            for (const row of leadershipInterviewsRes.data as any[]) {
              const appId = row.application_id as string | undefined;
              if (!appId || leadershipFeedbackByApplicationId.has(appId)) continue;

              const review = Array.isArray(row.review) ? row.review[0] : row.review;
              if (!review) continue;

              leadershipFeedbackByApplicationId.set(appId, {
                rating: review.rating ? Number(review.rating) : undefined,
                text: review.review_text || undefined,
                submittedOn: review.created_at ? format(new Date(review.created_at), "dd/MM/yyyy") : undefined,
              });
            }
          }
        }

        // Load talent info to build applicant rows
        const { data: talentRows, error: talentsError } = await supabase
          .from("talents")
          .select(
            "id, user_id, full_name, phone_number, city, years_of_experience, short_bio, skills, resume_url, current_position, education_level, job_types, work_location, linkedin_url, github_url, portfolio_url, has_carte_entrepreneur"
          )
          .in("id", talentIds);

        if (talentsError) throw talentsError;

        const talentById = new Map<string, any>((talentRows || []).map((t: any) => [t.id, t]));

        const userIds = [...new Set((talentRows || []).map((t: any) => t.user_id).filter(Boolean))];

        const { data: userRows, error: userError } = await supabase
          .from("users")
          .select("id, email")
          .in("id", userIds);

        if (userError) throw userError;

        const emailByUserId = new Map<string, any>((userRows || []).map((u: any) => [u.id, u.email]));

        const mappedApplications: Application[] = apps.map((app: any) => {
          const talent = talentById.get(app.talent_id as string) as any | undefined;
          const email = talent?.user_id ? (emailByUserId.get(talent.user_id as string) as string | undefined) : undefined;
          const appResumeUrl = typeof app.resume_url === "string" ? (app.resume_url as string) : "";
          const talentResumeUrl = firstNonEmptyResumeUrl(toFixed3ResumeUrls(talent?.resume_url));
          const resumeUrl = appResumeUrl || talentResumeUrl || "";
          const taReview = taReviewByApplicationId.get(app.id as string);
          const technicalFeedback = technicalFeedbackByApplicationId.get(app.id as string);
          const leadershipFeedback = leadershipFeedbackByApplicationId.get(app.id as string);
          const offerStatus = offerStatusByApplicationId.get(app.id as string);
          const stageFromDb = app.stage as ApplicationStage;
          const effectiveStage =
            offerStatus === "accepted"
              ? ("hired" as ApplicationStage)
              : offerStatus === "refused" || offerStatus === "rejected"
                ? ("rejected-offer" as ApplicationStage)
                : stageFromDb;

          return {
            id: app.id,
            talentId: app.talent_id,
            name: talent?.full_name || "",
            email: email || "",
            phone: talent?.phone_number || "",
            location: talent?.city || "",
            appliedDate: formatAppliedDate(app.applied_at),
            matchScore: Number(app.match_score) || 0,
            status: app.status as ApplicationStatus,
            stage: effectiveStage,
            jobId: app.job_id,
            experience: talent?.years_of_experience || "",
            skills: (talent?.skills as string[]) || [],
            currentCompany: "",
            coverLetter: talent?.short_bio || "",
            cvUrl: resumeUrl || undefined,
            currentPosition: talent?.current_position || "",
            educationLevel: talent?.education_level || "",
            jobTypes: (talent?.job_types as string[]) || [],
            workLocation: (talent?.work_location as string[]) || [],
            linkedinUrl: talent?.linkedin_url || "",
            githubUrl: talent?.github_url || "",
            portfolioUrl: talent?.portfolio_url || "",
            taReviewRating: taReview?.rating,
            taReviewText: taReview?.text,
            taReviewSubmittedOn: taReview?.submittedOn,
            taInterviewId: taReview?.interviewId,
            taInterviewMeetLink: taReview?.meetLink,
            taInterviewScheduledAt: taReview?.scheduledAt,
            taInterviewStatus: taReview?.status as Application["taInterviewStatus"],
            technicalFeedbackRating: technicalFeedback?.rating,
            technicalFeedbackText: technicalFeedback?.text,
            technicalFeedbackSubmittedOn: technicalFeedback?.submittedOn,
            leadershipFeedbackRating: leadershipFeedback?.rating,
            leadershipFeedbackText: leadershipFeedback?.text,
            leadershipFeedbackSubmittedOn: leadershipFeedback?.submittedOn,
          };
        });

        setApplications(mappedApplications);
      } catch (err) {
        console.error("Failed loading applications:", err);
        toast({
          title: "Failed to load applications",
          description: err instanceof Error ? err.message : "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadApplications();
  }, [user?.id, toast]);

  const formatAppliedDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return "";
    }
  };

  const getFilteredApplications = () => {
    return applications.filter((app) => {
      if (selectedJob && app.jobId !== selectedJob) return false;
      if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !app.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !app.location.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      const tabConfig = filterTabs.find((t) => t.id === activeTab);
      if (tabConfig && tabConfig.status) {
        return app.status === tabConfig.status;
      }
      return true;
    });
  };

  const filteredApplications = getFilteredApplications();

  const getTabCount = (tabId: string) => {
    return applications.filter((app) => {
      if (selectedJob && app.jobId !== selectedJob) return false;
      const tabConfig = filterTabs.find((t) => t.id === tabId);
      if (tabConfig && tabConfig.status) {
        return app.status === tabConfig.status;
      }
      return true;
    }).length;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-orange-600 bg-orange-50 border-orange-200";
    if (score >= 60) return "text-orange-500 bg-orange-50/50 border-orange-100";
    return "text-orange-400 bg-orange-50/30 border-orange-100";
  };

  const renderRatingStars = (rating?: number, sizeClass = "w-3 h-3") => {
    if (typeof rating !== "number" || !Number.isFinite(rating)) return null;
    const filled = Math.max(0, Math.min(5, Math.round(rating)));

    return (
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${i < filled ? "text-orange-600 fill-orange-600" : "text-orange-200"}`}
          />
        ))}
      </span>
    );
  };

  type FeedbackKey = "talent-acquisition" | "technical" | "leadership";

  const getFeedbackItem = (app: Application, key: FeedbackKey) => {
    if (key === "technical") {
      return {
        key,
        label: "Technical Feedback",
        rating: app.technicalFeedbackRating,
        text: app.technicalFeedbackText,
        submittedOn: app.technicalFeedbackSubmittedOn,
      };
    }

    if (key === "leadership") {
      return {
        key,
        label: "Leadership Feedback",
        rating: app.leadershipFeedbackRating,
        text: app.leadershipFeedbackText,
        submittedOn: app.leadershipFeedbackSubmittedOn,
      };
    }

    return {
      key,
      label: "Talent Acquisition Feedback",
      rating: app.taReviewRating,
      text: app.taReviewText,
      submittedOn: app.taReviewSubmittedOn,
    };
  };

  const getFeedbackStack = (app: Application, stage: ApplicationStage): ReturnType<typeof getFeedbackItem>[] => {
    if (stage === "talent-acquisition") return [getFeedbackItem(app, "talent-acquisition")];
    if (stage === "technical") return [getFeedbackItem(app, "technical"), getFeedbackItem(app, "talent-acquisition")];
    if (stage === "leadership") {
      return [
        getFeedbackItem(app, "leadership"),
        getFeedbackItem(app, "technical"),
        getFeedbackItem(app, "talent-acquisition"),
      ];
    }
    if (stage === "offer") {
      return [
        getFeedbackItem(app, "leadership"),
        getFeedbackItem(app, "technical"),
        getFeedbackItem(app, "talent-acquisition"),
      ];
    }

    return [];
  };

  const getStatusLabel = (status: ApplicationStatus): string => {
    const statusMap: Record<ApplicationStatus, string> = {
      pending: "Pending",
      "in-progress": "In Progress",
      rejected: "Rejected",
      maybe: "Maybe",
      archived: "Archived",
    };
    return statusMap[status] || status;
  };

  const getDisplayStatusLabel = (app: Application): string => {
    if (app.stage === "hired") return "Hired";
    if (app.stage === "rejected-offer") return "Rejected Offers";
    return getStatusLabel(app.status);
  };

  const handleMoveCandidate = async (newStatus: ApplicationStatus) => {
    if (!selectedCandidate) return;
    setPendingMoveStatus(newStatus);
    setConfirmMoveOpen(true);
  };

  const confirmMoveCandidate = async () => {
    if (!selectedCandidate || !pendingMoveStatus) return;

    const newStatus = pendingMoveStatus;
    const updatedApp = { ...selectedCandidate, status: newStatus, stage: newStatus === "in-progress" ? ("to-contact" as ApplicationStage) : null };
    setApplications((prev) =>
      prev.map((app) => (app.id === selectedCandidate.id ? updatedApp : app))
    );

    toast({
      title: `Moved to ${getStatusLabel(newStatus)}`,
      description: `${selectedCandidate.name} has been moved.`,
    });

    setShowMoveDialog(false);
    setConfirmMoveOpen(false);
    setPendingMoveStatus(null);
    setSelectedCandidate(null);

    try {
      await supabase
        .from("applications")
        .update({ status: newStatus, stage: newStatus === "in-progress" ? "to-contact" : null, updated_at: new Date().toISOString() })
        .eq("id", selectedCandidate.id);
    } catch (err) {
      console.error("Failed to update application status:", err);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    }
  };

  const confirmStyle = useMemo(() => {
    if (!pendingMoveStatus) {
      return {
        label: "this action",
        icon: UserCheck,
        tone: "bg-orange-100 text-orange-700",
        button: "bg-orange-600 hover:bg-orange-700",
      };
    }
    if (pendingMoveStatus === "rejected") {
      return {
        label: "Rejected",
        icon: UserX,
        tone: "bg-red-100 text-red-700",
        button: "bg-red-600 hover:bg-red-700",
      };
    }
    if (pendingMoveStatus === "archived") {
      return {
        label: "Archived",
        icon: Archive,
        tone: "bg-amber-100 text-amber-700",
        button: "bg-amber-600 hover:bg-amber-700",
      };
    }
    if (pendingMoveStatus === "maybe") {
      return {
        label: "Maybe",
        icon: Clock,
        tone: "bg-orange-100 text-orange-700",
        button: "bg-orange-600 hover:bg-orange-700",
      };
    }
    return {
      label: "To Contact",
      icon: UserCheck,
      tone: "bg-emerald-100 text-emerald-700",
      button: "bg-emerald-600 hover:bg-emerald-700",
    };
  }, [pendingMoveStatus]);

  const getApplicationsByStage = (stageId: ApplicationStage) => {
    return applications.filter(
      (app) =>
        selectedJob && app.jobId === selectedJob &&
        app.status === "in-progress" &&
        app.stage === stageId
    );
  };

  useEffect(() => {
    try {
      const savedTab = window.localStorage.getItem(PIPELINE_TAB_STORAGE_KEY);
      if (!savedTab) return;
      const isValidTab = filterTabs.some((t) => t.id === savedTab);
      if (isValidTab) setActiveTab(savedTab as PipelineTabId);
    } catch (err) {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PIPELINE_TAB_STORAGE_KEY, activeTab);
    } catch (err) {
      // ignore
    }
  }, [activeTab]);

  useEffect(() => {
    if (!selectedJob) return;

    try {
      window.localStorage.setItem(PIPELINE_JOB_STORAGE_KEY, selectedJob);
    } catch (err) {
      // ignore
    }
  }, [selectedJob]);

  return (
    <RecruiterLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <span className="inline-block rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-orange-600 font-semibold text-xs uppercase tracking-[0.16em] mb-4 shadow-sm backdrop-blur-sm">
            TalenTek Recruiter Portal
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-slate-900 mb-4">
            Hiring Pipeline
          </h1>
          <p className="text-base sm:text-lg font-medium text-slate-600 leading-7 mb-1 max-w-2xl">
            Track and manage candidates through your hiring process
          </p>
        </div>

        {/* AI Scoring Banner */}
        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI-Powered Match Scoring</h3>
              <p className="text-slate-600 text-sm">
                Each candidate is automatically scored based on skills, experience, and job requirements
              </p>
            </div>
          </div>
        </div>

        {/* Job Selection & Search */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              <div className="w-full sm:w-[420px]">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Job</label>
                <Select value={selectedJob || ""} onValueChange={setSelectedJob} disabled={loading || jobs.length === 0}>
                  <SelectTrigger className="h-12 rounded-full border-2 border-orange-300 bg-white text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 font-medium">
                    {selectedJobDetails ? (
                      <div className="flex w-full items-center justify-between gap-3 overflow-hidden">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate text-sm font-bold text-slate-900">
                            <span className="truncate">{selectedJobDetails.title}</span>
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-100 px-2 text-xs font-extrabold text-orange-700">
                              {formatApplicationCount(applicationCountByJobId.get(selectedJobDetails.id) ?? 0)}
                            </span>
                          </div>
                        </div>
                        <Badge className={`shrink-0 rounded-full ${getJobStatusClasses(selectedJobDetails.status ?? null)}`}>
                          {getJobStatusLabel(selectedJobDetails.status ?? null)}
                        </Badge>
                      </div>
                    ) : (
                      <SelectValue placeholder="Choose a job position..." />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 truncate font-semibold text-slate-900">
                              <span className="truncate">{job.title}</span>
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-100 px-2 text-xs font-extrabold text-orange-700">
                                {formatApplicationCount(applicationCountByJobId.get(job.id) ?? 0)}
                              </span>
                            </div>
                          </div>
                          <Badge className={`shrink-0 rounded-full ${getJobStatusClasses(job.status ?? null)}`}>
                            {getJobStatusLabel(job.status ?? null)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Search Candidates</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-600" />
                  <Input
                    placeholder="Search by name, email, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading}
                    className="pl-10 rounded-full border-2 border-orange-300 bg-white text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterTabs.map((tab) => {
            if (tab.id === "in-progress") {
              return (
                <Popover key={tab.id}>
                  <PopoverTrigger asChild>
                    <button
                      onClick={() => setActiveTab(tab.id as PipelineTabId)}
                      className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                        activeTab === tab.id
                          ? "bg-orange-600 text-white shadow-md"
                          : "bg-white border border-orange-200 text-slate-700 hover:bg-orange-50"
                      }`}
                    >
                      {pipelineMode === "hiring" ? "Hiring Pipeline" : "Onboarding"}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id ? "bg-white/20" : "bg-orange-100 text-orange-600"
                      }`}>
                        {getTabCount(tab.id)}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 border-orange-200">
                    <div className="flex flex-col gap-1">
                      <button
                        className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          pipelineMode === "hiring" ? "bg-orange-50 text-orange-700 font-semibold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                        onClick={() => {
                          setPipelineMode("hiring");
                          setActiveTab("in-progress");
                        }}
                      >
                        Hiring Pipeline
                      </button>
                      <button
                        className={`text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          pipelineMode === "onboarding" ? "bg-orange-50 text-orange-700 font-semibold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                        onClick={() => {
                          setPipelineMode("onboarding");
                          setActiveTab("in-progress");
                        }}
                      >
                        Onboarding
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PipelineTabId)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-white border border-orange-200 text-slate-700 hover:bg-orange-50"
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-white/20" : "bg-orange-100 text-orange-600"
                }`}>
                  {getTabCount(tab.id)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-orange-700">Loading applications...</p>
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === "list" && activeTab === "all" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-3xl border border-orange-100 shadow-lg p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto mb-3 shadow-md">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Applications Found</h3>
                  <p className="text-slate-600 text-sm">No candidates match your current filters</p>
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const initials = app.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const isSelected = selectedCandidate?.id === app.id;

                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        if (applicationBusyById[app.id]) return;
                        if (isSelected) return;
                        setSelectedCandidate(app);
                      }}
                      className={[
                        "w-full text-left bg-white rounded-2xl border shadow-md p-4 transition-all",
                        isSelected ? "border-orange-300 shadow-lg" : "border-orange-100 hover:shadow-lg hover:border-orange-200",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 truncate">{app.name}</h3>
                              <Badge className="px-2 py-0.5 text-[10px] bg-orange-100 text-orange-700 border border-orange-200">
                                {getDisplayStatusLabel(app)}
                              </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-orange-500" />
                                {app.email || "—"}
                              </span>
                              <span className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
                                {app.has_carte_entrepreneur ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <Ban className="w-3 h-3" />
                                )}
                                {app.has_carte_entrepreneur ? "Entrepreneur card: Yes" : "Entrepreneur card: No"}
                              </span>
                              {app.phone ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-orange-500" />
                                  {app.phone}
                                </span>
                              ) : null}
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-orange-500" />
                                {app.location || "—"}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3 text-orange-500" />
                                Applied {app.appliedDate || "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full border ${getScoreColor(app.matchScore)} flex items-center gap-1`}>
                          <Sparkles className="w-3 h-3" />
                          <span className="font-bold text-xs">{app.matchScore}%</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {app.skills.slice(0, 5).map((skill, index) => (
                          <Badge
                            key={`${app.id}-skills-${index}-${skill}`}
                            className="rounded-full border border-orange-200 bg-orange-50 text-orange-700"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
                        {app.currentPosition ? (
                          <span className="flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-orange-500" />
                            <span className="font-semibold text-slate-800">Position:</span> {app.currentPosition}
                          </span>
                        ) : null}
                        {app.educationLevel ? (
                          <span className="flex items-center gap-2">
                            <GraduationCap className="w-3 h-3 text-orange-500" />
                            <span className="font-semibold text-slate-800">Education:</span> {app.educationLevel}
                          </span>
                        ) : null}
                        {app.experience ? (
                          <span className="flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3 text-orange-500" />
                            <span className="font-semibold text-slate-800">Experience:</span> {app.experience}
                          </span>
                        ) : null}
                        {app.jobTypes && app.jobTypes.length > 0 ? (
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">Type:</span> {app.jobTypes.slice(0, 2).join(", ")}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-lg">
              <div className="grid gap-2 grid-cols-4">
                {(activeTab as string) !== "maybe" ? (
                  <button
                    type="button"
                    onClick={() => selectedCandidate && handleMoveCandidate("maybe")}
                    className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-white p-2 text-center text-xs font-medium transition-all hover:border-orange-400 hover:bg-orange-50"
                    disabled={!selectedCandidate || !!(selectedCandidate && applicationBusyById[selectedCandidate.id])}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-600">
                      <Clock className="h-3 w-3 text-white" />
                    </div>
                    <span className="truncate text-slate-900">Maybe</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => selectedCandidate && handleMoveCandidate("rejected")}
                  className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-white p-2 text-center text-xs font-medium transition-all hover:border-orange-400 hover:bg-orange-50"
                  disabled={!selectedCandidate || !!(selectedCandidate && applicationBusyById[selectedCandidate.id])}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-600">
                    <UserX className="h-3 w-3 text-white" />
                  </div>
                  <span className="truncate text-slate-900">Rejected</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectedCandidate && handleMoveCandidate("archived")}
                  className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-white p-2 text-center text-xs font-medium transition-all hover:border-orange-400 hover:bg-orange-50"
                  disabled={!selectedCandidate || !!(selectedCandidate && applicationBusyById[selectedCandidate.id])}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-600">
                    <Archive className="h-3 w-3 text-white" />
                  </div>
                  <span className="truncate text-slate-900">Archived</span>
                </button>

                <button
                  type="button"
                  onClick={() => selectedCandidate && handleMoveCandidate("in-progress")}
                  className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-white p-2 text-center text-xs font-medium transition-all hover:border-orange-400 hover:bg-orange-50"
                  disabled={!selectedCandidate || !!(selectedCandidate && applicationBusyById[selectedCandidate.id])}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-600">
                    <UserCheck className="h-3 w-3 text-white" />
                  </div>
                  <span className="truncate text-slate-900">To Contact</span>
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/30 p-4 min-h-[420px]">
                {inlineCvLoading ? (
                  <div className="h-full flex items-center justify-center text-sm font-semibold text-orange-700">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading resume...
                  </div>
                ) : inlineCvError ? (
                  <div className="h-full flex items-center justify-center text-sm font-semibold text-orange-700">
                    {inlineCvError}
                  </div>
                ) : inlineCvUrl ? (
                  <CvViewer fileUrl={inlineCvUrl} />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm font-semibold text-slate-500">
                    Select a candidate to view the resume.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && viewMode === "list" && activeTab !== "all" && (
          <div className="grid gap-4">
            {filteredApplications.length === 0 ? (
              <div className="bg-white rounded-3xl border border-orange-100 shadow-lg p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Applications Found</h3>
                <p className="text-slate-600">No candidates match your current filters</p>
              </div>
            ) : (
              filteredApplications.map((app) => {
                const initials = app.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-orange-100 shadow-md p-4 hover:shadow-lg transition-all hover:border-orange-200"
                  >
                    <div
                      className="flex items-center gap-4 mb-3 cursor-pointer"
                      onClick={() => {
                        if (applicationBusyById[app.id]) return;
                        if (selectedCandidate?.id === app.id) return;
                        setSelectedCandidate(app);
                      }}
                    >
                      <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">{app.name}</h3>
                          <Badge className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 border border-orange-200">
                            {getDisplayStatusLabel(app)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {app.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {app.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            Applied {new Date(app.appliedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {app.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={`${app.id}-dialog-skills-${index}-${skill}`}
                              className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {app.skills.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-slate-500">
                              +{app.skills.length - 3} more
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-2">
                          {app.currentPosition && (
                            <span>
                              <span className="font-medium text-slate-700">Position:</span> {app.currentPosition}
                            </span>
                          )}
                          {app.educationLevel && (
                            <span>
                              <span className="font-medium text-slate-700">Education:</span> {app.educationLevel}
                            </span>
                          )}
                          {app.jobTypes && app.jobTypes.length > 0 && (
                            <span>
                              <span className="font-medium text-slate-700">Type:</span> {app.jobTypes.slice(0, 2).join(", ")}
                            </span>
                          )}
                          {app.workLocation && app.workLocation.length > 0 && (
                            <span>
                              <span className="font-medium text-slate-700">Work:</span> {app.workLocation.slice(0, 2).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`px-3 py-1.5 rounded-full border ${getScoreColor(app.matchScore)} flex items-center gap-1 flex-shrink-0`}>
                        <Sparkles className="w-3 h-3" />
                        <span className="font-bold text-sm">{app.matchScore}%</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pipeline View */}
        {!loading && viewMode === "pipeline" && (
          pipelineMode === "onboarding" ? (
            <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Coming Soon</h3>
              <p className="text-slate-600">The Onboarding view is currently under development.</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {pipelineStages.map((stage) => {
                const stageApplications = getApplicationsByStage(stage.id as ApplicationStage);
                return (
                  <div
                    key={stage.id}
                    className="w-80 flex-shrink-0"
                  >
                    {/* Stage Header */}
                    <div className="bg-orange-600 rounded-t-2xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">{stage.label}</h3>
                        <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                          {stageApplications.length}
                        </span>
                      </div>
                    </div>

                    {/* Stage Cards */}
                    <div className="bg-orange-50/40 rounded-b-2xl p-3 min-h-[400px] space-y-3 border border-t-0 border-orange-100">
                      {stageApplications.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          No candidates in this stage
                        </div>
                      ) : (
                        stageApplications.map((app) => {
                          const initials = app.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);

                          return (
                            <div
                              key={app.id}
                              onClick={() => {
                                if (applicationBusyById[app.id]) return;
                                if (selectedCandidate?.id === app.id) return;
                                setSelectedCandidate(app);
                              }}
                              className="bg-white rounded-xl border border-orange-100 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 truncate">{app.name}</h4>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <span className="truncate">{app.email}</span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
                                      {app.has_carte_entrepreneur ? (
                                        <CheckCircle className="w-3 h-3" />
                                      ) : (
                                        <Ban className="w-3 h-3" />
                                      )}
                                      {app.has_carte_entrepreneur ? "Entrepreneur card: Yes" : "Entrepreneur card: No"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {app.location}
                                </span>
                                <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(app.matchScore)}`}>
                                  {app.matchScore}%
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                                <CalendarIcon className="w-3 h-3" />
                                Applied {app.appliedDate || "—"}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {app.skills.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={`${app.id}-stage-dialog-skills-${index}-${skill}`}
                                    className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>

                              <div className="mt-2 grid gap-1 text-[11px] text-slate-600">
                                {app.currentPosition ? (
                                  <span>
                                    <span className="font-semibold text-slate-700">Position:</span> {app.currentPosition}
                                  </span>
                                ) : null}
                                {app.educationLevel ? (
                                  <span>
                                    <span className="font-semibold text-slate-700">Education:</span> {app.educationLevel}
                                  </span>
                                ) : null}
                                {app.jobTypes && app.jobTypes.length > 0 ? (
                                  <span>
                                    <span className="font-semibold text-slate-700">Type:</span> {app.jobTypes.slice(0, 2).join(", ")}
                                  </span>
                                ) : null}
                              </div>

                              {stage.id === "talent-acquisition" && (
                                <>
                                  <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold text-slate-600">TA Review</span>
                                      {typeof app.taReviewRating === "number" ? (
                                        renderRatingStars(app.taReviewRating, "w-3 h-3")
                                      ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                          Pending
                                        </span>
                                      )}
                                    </div>
                                    {app.taReviewText ? (
                                      <p className="text-xs text-slate-700 line-clamp-3">{app.taReviewText}</p>
                                    ) : (
                                      <p className="text-xs text-slate-500">No review yet.</p>
                                    )}
                                    {app.taReviewSubmittedOn && (
                                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        Submitted {app.taReviewSubmittedOn}
                                      </p>
                                    )}
                                  </div>

                                  <div className="mt-3 flex gap-2">
                                    <p className="text-[11px] font-semibold text-slate-600">
                                      Open the candidate to take action.
                                    </p>
                                  </div>
                                </>
                              )}

                              {stage.id === "technical" && (
                                <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-600">Technical Feedback</span>
                                    {typeof app.technicalFeedbackRating === "number" ? (
                                      renderRatingStars(app.technicalFeedbackRating, "w-3 h-3")
                                    ) : (
                                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                  {app.technicalFeedbackText ? (
                                    <p className="text-xs text-slate-700 line-clamp-3">{app.technicalFeedbackText}</p>
                                  ) : (
                                    <p className="text-xs text-slate-500">No feedback yet.</p>
                                  )}
                                  {app.technicalFeedbackSubmittedOn && (
                                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                      Submitted {app.technicalFeedbackSubmittedOn}
                                    </p>
                                  )}
                                </div>
                              )}

                              {stage.id === "leadership" && (
                                <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-600">Leadership Feedback</span>
                                    {typeof app.leadershipFeedbackRating === "number" ? (
                                      renderRatingStars(app.leadershipFeedbackRating, "w-3 h-3")
                                    ) : (
                                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                  {app.leadershipFeedbackText ? (
                                    <p className="text-xs text-slate-700 line-clamp-3">{app.leadershipFeedbackText}</p>
                                  ) : (
                                    <p className="text-xs text-slate-500">No feedback yet.</p>
                                  )}
                                  {app.leadershipFeedbackSubmittedOn && (
                                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                      Submitted {app.leadershipFeedbackSubmittedOn}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )
        )}
      </div>

      {/* CV Preview Dialog */}
      <Dialog open={cvDialogOpen} onOpenChange={setCvDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>CV Preview</DialogTitle>
            <DialogDescription className="sr-only">Preview the candidate CV document.</DialogDescription>
          </DialogHeader>
          {cvLoading && (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          )}
          {cvDialogError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {cvDialogError}
            </div>
          )}
          {cvDialogUrl && !cvLoading && (
            <div className="flex-1 overflow-auto">
              <CvViewer fileUrl={cvDialogUrl} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Candidate Details Dialog */}
      <Dialog
        open={viewMode === "pipeline" && !!selectedCandidate && !showMoveDialog && !cvDialogOpen}
        onOpenChange={(open) => !open && setSelectedCandidate(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {selectedCandidate.name}'s Application
                </DialogTitle>
                <DialogDescription className="sr-only">Candidate details and actions.</DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-5 mt-4 pb-6">
                <div className="rounded-2xl border border-orange-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Application snapshot</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">{selectedCandidate.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-orange-500" />
                          Applied {selectedCandidate.appliedDate || "—"}
                        </span>
                        <Badge className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-700">
                          {getDisplayStatusLabel(selectedCandidate)}
                        </Badge>
                        {selectedCandidate.stage ? (
                          <Badge className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs text-slate-700">
                            {formatStageForDisplay(selectedCandidate.stage)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${getScoreColor(selectedCandidate.matchScore)}`}>
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-bold">{selectedCandidate.matchScore}%</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">Email:</span>
                      <span className="text-slate-600">{selectedCandidate.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">Phone:</span>
                      <span className="text-slate-600">{selectedCandidate.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">Location:</span>
                      <span className="text-slate-600">{selectedCandidate.location || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">Position:</span>
                      <span className="text-slate-600">{selectedCandidate.currentPosition || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">Education:</span>
                      <span className="text-slate-600">{selectedCandidate.educationLevel || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">Experience:</span>
                      <span className="text-slate-600">{selectedCandidate.experience || "—"}</span>
                    </div>
                  </div>

                  {selectedCandidate.skills?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedCandidate.skills.slice(0, 8).map((skill, index) => (
                        <Badge
                          key={`${selectedCandidate.id}-profile-skill-${index}-${skill}`}
                          className="rounded-full border border-orange-200 bg-orange-50 text-orange-700"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Interviewer Feedback Stack */}
                  {selectedCandidate.stage && selectedCandidate.stage !== "to-contact" ? (
                    <div className="space-y-3">
                      {getFeedbackStack(selectedCandidate, selectedCandidate.stage).map((item) => (
                        <div key={item.key} className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-slate-700">{item.label}</h3>
                            {typeof item.rating === "number" ? (
                              renderRatingStars(item.rating, "w-4 h-4")
                            ) : (
                              <span className="text-xs font-bold text-slate-500">Pending</span>
                            )}
                          </div>
                          {item.text ? (
                            <p className="text-sm font-medium text-slate-700">{item.text}</p>
                          ) : null}
                          {item.submittedOn && (
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                              Submitted {item.submittedOn}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}

                {/* View CV Button */}
                <Button
                  variant="outline"
                  onClick={() => openCvPreview(selectedCandidate)}
                  disabled={cvLoading}
                  className="w-full rounded-xl border-orange-300 bg-transparent px-4 py-3 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {cvLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading CV...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      View Resume
                    </>
                  )}
                </Button>
                </div>
              </div>

              {/* Sticky Actions (always visible) */}
              <div className="border-t border-orange-100 pt-4 mt-2 bg-white">
                <div className="flex flex-col gap-2">
                  {selectedCandidate?.stage === "to-contact" ? (
                    <Button
                      variant="outline"
                      onClick={() => void openScheduleInterviewDialog(selectedCandidate)}
                      className="w-full rounded-xl border-orange-300 bg-transparent px-4 py-3 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                      disabled={!!applicationBusyById[selectedCandidate.id]}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Schedule Interview
                    </Button>
                  ) : null}

                  {selectedCandidate?.stage === "talent-acquisition" ? (
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const isTaInterviewCompleted = selectedCandidate.taInterviewStatus === "completed";

                        return (
                          <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openTaInterviewLink(selectedCandidate)}
                          className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                          disabled={!!applicationBusyById[selectedCandidate.id] || isTaInterviewCompleted}
                          title={isTaInterviewCompleted ? "This talent acquisition interview is completed." : undefined}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openTaReviewDialog(selectedCandidate)}
                          className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                          disabled={!!applicationBusyById[selectedCandidate.id] || isTaInterviewCompleted}
                          title={isTaInterviewCompleted ? "This talent acquisition interview is completed." : undefined}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Feedback
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openTaRescheduleDialog(selectedCandidate)}
                          className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                          disabled={!!applicationBusyById[selectedCandidate.id] || isTaInterviewCompleted}
                          title={isTaInterviewCompleted ? "This talent acquisition interview is completed." : undefined}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Reschedule
                        </Button>
                          </div>
                        );
                      })()}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleMoveCandidate("rejected")}
                          className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                          disabled={!!applicationBusyById[selectedCandidate.id]}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Move to Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void openTechnicalInterviewDialog(selectedCandidate, "schedule")}
                          className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                          disabled={!!applicationBusyById[selectedCandidate.id]}
                        >
                          {applicationBusyById[selectedCandidate.id] ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Move to Technical"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {selectedCandidate?.stage === "technical" ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void openLeadershipInterviewDialog(selectedCandidate, "schedule")}
                          className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                          disabled={!!applicationBusyById[selectedCandidate.id]}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Schedule Leadership
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void openTechnicalInterviewDialog(selectedCandidate, "reschedule")}
                          className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                          disabled={!!applicationBusyById[selectedCandidate.id]}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Reschedule Technical
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openOfferDialog(selectedCandidate)}
                          className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                          disabled={!!applicationBusyById[selectedCandidate.id]}
                        >
                          <Building className="w-4 h-4 mr-2" />
                          Move to Offer
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleMoveCandidate("rejected")}
                        className="w-full rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                        disabled={!!applicationBusyById[selectedCandidate.id]}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Move to Reject
                      </Button>
                    </div>
                  ) : null}

                  {selectedCandidate?.stage === "leadership" ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void openLeadershipInterviewDialog(selectedCandidate, "reschedule")}
                        className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                        disabled={!!applicationBusyById[selectedCandidate.id]}
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Reschedule Leadership
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openOfferDialog(selectedCandidate)}
                        className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                        disabled={!!applicationBusyById[selectedCandidate.id]}
                      >
                        <Building className="w-4 h-4 mr-2" />
                        Move to Offer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleMoveCandidate("rejected")}
                        className="rounded-xl border-orange-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-all hover:bg-transparent hover:text-orange-800"
                        disabled={!!applicationBusyById[selectedCandidate.id]}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Move to Reject
                      </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTaReviewDialog} onOpenChange={setShowTaReviewDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Talent Acquisition Feedback</DialogTitle>
            <DialogDescription className="sr-only">Leave a rating and feedback for the talent acquisition interview.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-700">Candidate</p>
              <p className="text-base font-bold text-slate-900">{taReviewCandidate?.name}</p>
              <p className="text-sm font-medium text-slate-600">
                {taReviewCandidate?.taInterviewScheduledAt || "Testing mode - no interview linked yet"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Rating</p>
              <StarRatingInput value={taReviewRating} onChange={setTaReviewRating} disabled={taReviewSaving} />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Feedback</p>
              <Textarea
                value={taReviewText}
                onChange={(e) => setTaReviewText(e.target.value)}
                placeholder="Write your feedback..."
                className="min-h-28 rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border-orange-200 text-slate-700 hover:bg-orange-50"
                disabled={taReviewSaving}
                onClick={() => setShowTaReviewDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                disabled={taReviewSaving}
                onClick={() => void submitTaReview()}
              >
                {taReviewSaving ? "Saving..." : "Save Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTaRescheduleDialog} onOpenChange={setShowTaRescheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Reschedule Talent Acquisition Interview</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update the date and time for the linked talent acquisition interview.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Candidate</p>
              <p className="text-base font-bold text-slate-900">{taRescheduleCandidate?.name}</p>
              <p className="text-sm font-medium text-slate-600">
                {taRescheduleCandidate?.taInterviewScheduledAt || "No scheduled interview linked yet"}
              </p>
            </div>

            <div>
              <label htmlFor="ta-reschedule-date" className="mb-2 block text-sm font-semibold text-slate-700">
                New Date & Time
              </label>
              <Input
                id="ta-reschedule-date"
                type="datetime-local"
                value={taRescheduleDateTime}
                onChange={(event) => setTaRescheduleDateTime(event.target.value)}
                className="rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border-orange-200 text-slate-700 hover:bg-orange-50"
                disabled={taRescheduleSaving}
                onClick={() => setShowTaRescheduleDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                disabled={taRescheduleSaving || !taRescheduleDateTime || !taRescheduleCandidate?.taInterviewId}
                onClick={() => void saveTaReschedule()}
              >
                {taRescheduleSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Candidate Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Move {selectedCandidate?.name} to...
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-1">
              Select the new status for this candidate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            <div className="grid gap-2 grid-cols-4">
              {(activeTab as string) !== "maybe" ? (
                <button
                  onClick={() => handleMoveCandidate("maybe")}
                  className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-white p-2 text-center text-xs font-medium transition-all hover:border-orange-400 hover:bg-orange-50"
                >
                  <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-slate-900">Maybe</span>
                </button>
              ) : null}

              <button
                onClick={() => handleMoveCandidate("rejected")}
                className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-white p-2 text-center text-xs font-medium transition-all hover:border-orange-400 hover:bg-orange-50"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center">
                  <UserX className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-900">Rejected</span>
              </button>

              <button
                onClick={() => handleMoveCandidate("rejected")}
                className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-white p-2 text-center text-xs font-medium transition-all hover:border-orange-400 hover:bg-orange-50"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center">
                  <UserX className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-900">Reject</span>
              </button>

              <button
                onClick={() => handleMoveCandidate("in-progress")}
                className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-white p-2 text-center text-xs font-medium transition-all hover:border-orange-400 hover:bg-orange-50"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center">
                  <UserCheck className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-900">To Contact</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Move Dialog */}
      <Dialog open={confirmMoveOpen} onOpenChange={setConfirmMoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Confirm move</DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-1">
              {selectedCandidate && pendingMoveStatus
                ? `Move ${selectedCandidate.name} to ${confirmStyle.label}?`
                : "Confirm this action."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${confirmStyle.tone}`}>
              <confirmStyle.icon className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {pendingMoveStatus ? confirmStyle.label : "Status change"}
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full border-orange-200 text-slate-700 hover:bg-orange-50"
              onClick={() => {
                setConfirmMoveOpen(false);
                setPendingMoveStatus(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className={`flex-1 rounded-full text-white ${confirmStyle.button}`}
              onClick={confirmMoveCandidate}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Schedule Interview - {candidateForInterview?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Schedule a new interview for this candidate.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-orange-600">Interview Type:</span> Talent Acquisition
              </p>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Scheduled Date & Time</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <Popover open={scheduledDatePickerOpen} onOpenChange={setScheduledDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-between rounded-lg border-2 border-orange-300 bg-white px-3 text-left font-medium text-slate-700 hover:bg-orange-50"
                      >
                        <span className={scheduledDay ? "text-slate-700" : "text-slate-400"}>
                          {formatSafeDate(scheduledDay, "EEEE, MMMM d, yyyy") || "Select interview date"}
                        </span>
                        <CalendarIcon className="h-4 w-4 text-orange-600" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-orange-200" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDay}
                        onSelect={(day) => {
                          setScheduledDay(day);
                          if (day) setScheduledDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Time</label>
                    <Input
                      type="time"
                      step={60}
                      min={minTimeForDay(scheduledDay)}
                      max={WORKDAY_END_TIME}
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="rounded-lg border-2 border-orange-300 h-11 font-medium"
                    />
                    <p className="mt-1 text-xs font-medium text-slate-500">Allowed: 07:30–23:00</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={15}
                      max={480}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="rounded-lg border-2 border-orange-300 h-11 font-medium"
                    />
                  </div>
                </div>
              </div>

              {(availabilityStatus === "checking" ||
                availabilityStatus === "available" ||
                availabilityStatus === "conflict" ||
                availabilityStatus === "error") && (
                <div
                  className={[
                    "mt-3 p-3 rounded-xl border text-sm font-medium",
                    availabilityStatus === "available"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : availabilityStatus === "conflict"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : availabilityStatus === "checking"
                      ? "bg-orange-50 border-orange-200 text-orange-800"
                      : "bg-slate-50 border-slate-200 text-slate-700",
                  ].join(" ")}
                >
                  {availabilityMessage}
                </div>
              )}
            </div>

            {/* Meet Link */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Meet Link</h3>
                <Button
                  onClick={generateMeetLink}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 bg-white text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                  Generate Link
                </Button>
              </div>
              {meetLink ? (
                <div className="p-3 bg-white rounded-lg border border-orange-200 font-mono text-sm text-slate-700 break-all">
                  {meetLink}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Click "Generate Link" to create a meet link for this interview</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-orange-100">
              <Button
                onClick={() => setShowScheduleDialog(false)}
                variant="outline"
                className="flex-1 rounded-lg border-orange-300 text-slate-700 hover:bg-orange-50"
                disabled={schedulingLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleInterview}
                className="flex-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                disabled={
                  schedulingLoading ||
                  !scheduledDateTime ||
                  availabilityStatus === "checking" ||
                  availabilityStatus === "conflict" ||
                  availabilityStatus === "error"
                }
              >
                {schedulingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Technical Interview Dialog */}
      <Dialog open={showTechnicalDialog} onOpenChange={setShowTechnicalDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Technical Interview - {candidateForTechnical?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Schedule a technical interview and check interviewer availability.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Interviewer */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-slate-700">Select Interviewer</label>
                {technicalInterviewersLoading && (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading...
                  </span>
                )}
              </div>
              <select
                value={selectedInterviewerId}
                onChange={(e) => setSelectedInterviewerId(e.target.value)}
                disabled={technicalInterviewersLoading || technicalInterviewers.length === 0}
                className="w-full rounded-lg border-2 border-orange-300 h-11 font-medium px-3 bg-white text-slate-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {technicalInterviewersLoading ? (
                  <option value="" disabled>
                    Loading interviewers...
                  </option>
                ) : technicalInterviewers.length === 0 ? (
                  <option value="" disabled>
                    No technical interviewers found
                  </option>
                ) : (
                  technicalInterviewers.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.fullName}{it.email ? ` • ${it.email}` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Scheduled Date & Time</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <div className="grid grid-cols-1 gap-2">
                    <Popover open={technicalDatePickerOpen} onOpenChange={setTechnicalDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full justify-between rounded-lg border-2 border-orange-300 bg-white px-3 text-left font-medium text-slate-700 hover:bg-orange-50"
                        >
                          <span className={technicalDay ? "text-slate-700" : "text-slate-400"}>
                            {formatSafeDate(technicalDay, "EEEE, MMMM d, yyyy") || "Select date"}
                          </span>
                          <CalendarIcon className="h-4 w-4 text-orange-600" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-orange-200" align="start">
                        <Calendar
                          mode="single"
                          selected={technicalDay}
                          onSelect={(day) => {
                            setTechnicalDay(day);
                            if (day) setTechnicalDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs font-medium text-slate-500">
                      Pick the date for this technical interview.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Time</label>
                      {technicalAvailabilityStatus === "conflict" && (
                        <span className="text-xs font-bold text-red-600">Not available</span>
                      )}
                    </div>
                    <Input
                      type="time"
                      step={60}
                      min={minTimeForDay(technicalDay)}
                      max={WORKDAY_END_TIME}
                      value={technicalTime}
                      onChange={(e) => setTechnicalTime(e.target.value)}
                      className="rounded-lg border-2 border-orange-300 h-11 font-medium"
                    />
                    <p className="mt-1 text-xs font-medium text-slate-500">Allowed: 07:30–23:00</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={15}
                      max={480}
                      step={5}
                      value={technicalDurationMinutes}
                      onChange={(e) => setTechnicalDurationMinutes(Number(e.target.value))}
                      className="rounded-lg border-2 border-orange-300 h-11 font-medium"
                    />
                  </div>
                </div>
              </div>

              {(technicalAvailabilityStatus === "checking" ||
                technicalAvailabilityStatus === "available" ||
                technicalAvailabilityStatus === "conflict" ||
                technicalAvailabilityStatus === "error") && (
                <div
                  className={[
                    "mt-3 p-3 rounded-xl border text-sm font-medium",
                    technicalAvailabilityStatus === "available"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : technicalAvailabilityStatus === "conflict"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : technicalAvailabilityStatus === "checking"
                      ? "bg-orange-50 border-orange-200 text-orange-800"
                      : "bg-slate-50 border-slate-200 text-slate-700",
                  ].join(" ")}
                >
                  {technicalAvailabilityMessage}
                </div>
              )}
            </div>

            {/* Meet Link */}
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Meet Link</h3>
                <Button
                  onClick={generateTechnicalMeetLink}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 bg-white text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                  Generate Link
                </Button>
              </div>
              {technicalMeetLink ? (
                <div className="p-3 bg-white rounded-lg border border-orange-200 font-mono text-sm text-slate-700 break-all">
                  {technicalMeetLink}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Click "Generate Link" to create a meet link for this interview</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-orange-100">
              <Button
                onClick={() => setShowTechnicalDialog(false)}
                variant="outline"
                className="flex-1 rounded-lg border-orange-300 text-slate-700 hover:bg-orange-50"
                disabled={technicalSchedulingLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleTechnicalInterview}
                className="flex-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                disabled={
                  technicalSchedulingLoading ||
                  !candidateForTechnical ||
                  !selectedInterviewerId ||
                  !technicalDateTime ||
                  technicalAvailabilityStatus === "checking" ||
                  technicalAvailabilityStatus === "conflict" ||
                  technicalAvailabilityStatus === "error"
                }
              >
                {technicalSchedulingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {technicalDialogMode === "reschedule" ? "Rescheduling..." : "Scheduling..."}
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {technicalDialogMode === "reschedule"
                      ? "Reschedule Technical Interview"
                      : "Schedule Technical Interview"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Leadership Interview Dialog */}
      <Dialog open={showLeadershipDialog} onOpenChange={setShowLeadershipDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Leadership Interview - {candidateForLeadership?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Schedule a leadership interview and check interviewer availability.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Interviewer */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-slate-700">Select Interviewer</label>
                {leadershipInterviewersLoading && (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading...
                  </span>
                )}
              </div>
              <select
                value={selectedLeadershipInterviewerId}
                onChange={(e) => setSelectedLeadershipInterviewerId(e.target.value)}
                disabled={leadershipInterviewersLoading || leadershipInterviewers.length === 0}
                className="w-full rounded-lg border-2 border-orange-300 h-11 font-medium px-3 bg-white text-slate-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {leadershipInterviewersLoading ? (
                  <option value="" disabled>
                    Loading interviewers...
                  </option>
                ) : leadershipInterviewers.length === 0 ? (
                  <option value="" disabled>
                    No leadership interviewers found
                  </option>
                ) : (
                  leadershipInterviewers.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.fullName}{it.email ? ` • ${it.email}` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Scheduled Date & Time</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <div className="grid grid-cols-1 gap-2">
                    <Popover open={leadershipDatePickerOpen} onOpenChange={setLeadershipDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full justify-between rounded-lg border-2 border-orange-300 bg-white px-3 text-left font-medium text-slate-700 hover:bg-orange-50"
                        >
                          <span className={leadershipDay ? "text-slate-700" : "text-slate-400"}>
                            {formatSafeDate(leadershipDay, "EEEE, MMMM d, yyyy") || "Select date"}
                          </span>
                          <CalendarIcon className="h-4 w-4 text-orange-600" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-orange-200" align="start">
                        <Calendar
                          mode="single"
                          selected={leadershipDay}
                          onSelect={(day) => {
                            setLeadershipDay(day);
                            if (day) setLeadershipDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs font-medium text-slate-500">
                      Pick the date for this leadership interview.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Time</label>
                      {leadershipAvailabilityStatus === "conflict" && (
                        <span className="text-xs font-bold text-red-600">Not available</span>
                      )}
                    </div>
                    <Input
                      type="time"
                      step={60}
                      min={minTimeForDay(leadershipDay)}
                      max={WORKDAY_END_TIME}
                      value={leadershipTime}
                      onChange={(e) => setLeadershipTime(e.target.value)}
                      className="rounded-lg border-2 border-orange-300 h-11 font-medium"
                    />
                    <p className="mt-1 text-xs font-medium text-slate-500">Allowed: 07:30–23:00</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (minutes)</label>
                    <Input
                      type="number"
                      min={15}
                      max={480}
                      step={5}
                      value={leadershipDurationMinutes}
                      onChange={(e) => setLeadershipDurationMinutes(Number(e.target.value))}
                      className="rounded-lg border-2 border-orange-300 h-11 font-medium"
                    />
                  </div>
                </div>
              </div>

              {(leadershipAvailabilityStatus === "checking" ||
                leadershipAvailabilityStatus === "available" ||
                leadershipAvailabilityStatus === "conflict" ||
                leadershipAvailabilityStatus === "error") && (
                <div
                  className={[
                    "mt-3 p-3 rounded-xl border text-sm font-medium",
                    leadershipAvailabilityStatus === "available"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : leadershipAvailabilityStatus === "conflict"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : leadershipAvailabilityStatus === "checking"
                      ? "bg-orange-50 border-orange-200 text-orange-800"
                      : "bg-slate-50 border-slate-200 text-slate-700",
                  ].join(" ")}
                >
                  {leadershipAvailabilityMessage}
                </div>
              )}
            </div>

            {/* Meet Link */}
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Meet Link</h3>
                <Button
                  onClick={generateLeadershipMeetLink}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 bg-white text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                  Generate Link
                </Button>
              </div>
              {leadershipMeetLink ? (
                <div className="p-3 bg-white rounded-lg border border-orange-200 font-mono text-sm text-slate-700 break-all">
                  {leadershipMeetLink}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Click "Generate Link" to create a meet link for this interview</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-orange-100">
              <Button
                onClick={() => setShowLeadershipDialog(false)}
                variant="outline"
                className="flex-1 rounded-lg border-orange-300 text-slate-700 hover:bg-orange-50"
                disabled={leadershipSchedulingLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleLeadershipInterview}
                className="flex-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                disabled={
                  leadershipSchedulingLoading ||
                  !candidateForLeadership ||
                  !selectedLeadershipInterviewerId ||
                  !leadershipDateTime ||
                  leadershipAvailabilityStatus === "checking" ||
                  leadershipAvailabilityStatus === "conflict" ||
                  leadershipAvailabilityStatus === "error"
                }
              >
                {leadershipSchedulingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {leadershipDialogMode === "reschedule" ? "Rescheduling..." : "Scheduling..."}
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {leadershipDialogMode === "reschedule"
                      ? "Reschedule Leadership Interview"
                      : "Schedule Leadership Interview"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Create Offer - {candidateForOffer?.name}
            </DialogTitle>
            <DialogDescription className="sr-only">Create a job offer for this candidate.</DialogDescription>
          </DialogHeader>

          {candidateForOffer ? (
            <div className="space-y-6 mt-4">
              {(() => {
                const job = getJobForApplication(candidateForOffer);
                return (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{job?.title ?? "Job"}</p>
                    <p className="mt-1 text-sm text-slate-600">{job?.location ?? "—"}</p>
                  </div>
                );
              })()}

              {/* Feedback stack */}
              <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Interviewer Feedback</h3>
                <div className="space-y-3">
                  {getFeedbackStack(candidateForOffer, "offer").map((item) => (
                    <div key={item.key} className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-700">{item.label}</h4>
                        {typeof item.rating === "number" ? (
                          renderRatingStars(item.rating, "w-4 h-4")
                        ) : (
                          <span className="text-xs font-bold text-slate-500">No feedback yet</span>
                        )}
                      </div>
                      {item.text ? (
                        <p className="text-sm font-medium text-slate-700">{item.text}</p>
                      ) : (
                        <p className="text-sm text-slate-600">No interviewer feedback has been submitted yet.</p>
                      )}
                      {item.submittedOn && (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Submitted {item.submittedOn}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(() => {
                const job = getJobForApplication(candidateForOffer);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Position</label>
                      <Input
                        value={job?.title ?? ""}
                        readOnly
                        className="rounded-lg border-2 border-orange-200 h-11 font-medium bg-orange-50/40 text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Work Location</label>
                      <Input
                        value={job?.location ?? ""}
                        readOnly
                        className="rounded-lg border-2 border-orange-200 h-11 font-medium bg-orange-50/40 text-slate-700"
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Salary (DZD)</label>
                  <div className="relative">
                    <Input
                      value={offerSalary}
                      onChange={(e) => setOfferSalary(e.target.value)}
                      placeholder="e.g. 450,000"
                      className="rounded-lg border-2 border-orange-300 h-11 font-medium pr-14"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      DZD
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                  <div className="grid grid-cols-1 gap-2">
                    <Popover open={offerDatePickerOpen} onOpenChange={setOfferDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full justify-between rounded-lg border-2 border-orange-300 bg-white px-3 text-left font-medium text-slate-700 hover:bg-orange-50"
                        >
                          <span className={offerStartDay ? "text-slate-700" : "text-slate-400"}>
                            {formatSafeDate(offerStartDay, "EEEE, MMMM d, yyyy") || "Select start date"}
                          </span>
                          <CalendarIcon className="h-4 w-4 text-orange-600" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-orange-200" align="start">
                        <Calendar
                          mode="single"
                          selected={offerStartDay}
                          onSelect={(day) => {
                            setOfferStartDay(day);
                            if (day) setOfferDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs font-medium text-slate-500">
                      Pick the official joining date for this offer letter.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Benefits & Perks</label>
                <textarea
                  value={offerBenefits}
                  onChange={(e) => setOfferBenefits(e.target.value)}
                  placeholder="One benefit per line (optional)"
                  className="w-full min-h-28 rounded-xl border-2 border-orange-300 bg-white p-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Response Time (Days)</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={offerResponseDays}
                  onChange={(e) => setOfferResponseDays(Number(e.target.value))}
                  placeholder="e.g. 7"
                  className="rounded-lg border-2 border-orange-300 h-11 font-medium"
                />
                <p className="mt-1 text-xs font-medium text-slate-500">
                  If the candidate does not respond before this deadline, the offer is auto-rejected.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-orange-100">
                <Button
                  onClick={() => setShowOfferDialog(false)}
                  variant="outline"
                  className="flex-1 rounded-lg border-orange-300 text-slate-700 hover:bg-orange-50"
                  disabled={offerSaving || offerPreviewLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void buildOfferPdfBlob()}
                  variant="outline"
                  className="flex-1 rounded-lg border-orange-300 text-orange-700 hover:bg-orange-50 font-medium"
                  disabled={offerSaving || offerPreviewLoading || !candidateForOffer}
                >
                  {offerPreviewLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCreateOffer}
                  className="flex-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                  disabled={offerSaving || offerPreviewLoading || !candidateForOffer || !offerPdfBlob}
                >
                  {offerSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 mr-2" />
                      Confirm Offer
                    </>
                  )}
                </Button>
              </div>

              {offerPreviewError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {offerPreviewError}
                </div>
              ) : null}

              {offerPreviewUrl ? (
                <div className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Offer PDF Preview</p>
                  <div className="h-[460px] overflow-hidden rounded-xl border border-orange-100">
                    <CvViewer fileUrl={offerPreviewUrl} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </RecruiterLayout>
  );
}
