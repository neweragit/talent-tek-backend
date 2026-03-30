import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import CvViewer from "@/components/CvViewer";
import { format, isSameDay } from "date-fns";
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
  GripVertical,
  ChevronRight,
  UserCheck,
  UserX,
  Archive,
  Clock,
  Loader2,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
}

interface Application {
  id: string;
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
  taReviewRating?: number;
  taReviewText?: string;
  taReviewSubmittedOn?: string;
  technicalFeedbackRating?: number;
  technicalFeedbackText?: string;
  technicalFeedbackSubmittedOn?: string;
  leadershipFeedbackRating?: number;
  leadershipFeedbackText?: string;
  leadershipFeedbackSubmittedOn?: string;
}

interface InterviewerOption {
  id: string;
  fullName: string;
  email: string;
}

type AvailabilityStatus = "idle" | "checking" | "available" | "conflict" | "error";

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

const maxTime = (a: string, b: string) => (a.localeCompare(b) >= 0 ? a : b);

export default function EmployerPipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState<Application | null>(null);
  const [cvDialogOpen, setCvDialogOpen] = useState(false);
  const [cvDialogUrl, setCvDialogUrl] = useState("");
  const [cvLoading, setCvLoading] = useState(false);
  const [cvDialogError, setCvDialogError] = useState("");
  const [applicationBusyById, setApplicationBusyById] = useState<Record<string, boolean>>({});
  
  const [currentEmployerId, setCurrentEmployerId] = useState<string | null>(null);
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | null>(null);

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

  // Technical interview scheduling state (from Talent Acquisition -> Technical)
  const [showTechnicalDialog, setShowTechnicalDialog] = useState(false);
  const [candidateForTechnical, setCandidateForTechnical] = useState<Application | null>(null);
  const [technicalInterviewers, setTechnicalInterviewers] = useState<InterviewerOption[]>([]);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>("");
  const [technicalInterviewersLoading, setTechnicalInterviewersLoading] = useState(false);
  const [technicalDay, setTechnicalDay] = useState<Date | undefined>(undefined);
  const [technicalTime, setTechnicalTime] = useState<string>("07:30");
  const [technicalDurationMinutes, setTechnicalDurationMinutes] = useState<number>(60);
  const [technicalMeetLink, setTechnicalMeetLink] = useState<string>("");
  const [technicalSchedulingLoading, setTechnicalSchedulingLoading] = useState(false);
  const [technicalAvailabilityStatus, setTechnicalAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [technicalAvailabilityMessage, setTechnicalAvailabilityMessage] = useState<string>("");

  // Leadership interview scheduling state (from Technical -> Leadership)
  const [showLeadershipDialog, setShowLeadershipDialog] = useState(false);
  const [candidateForLeadership, setCandidateForLeadership] = useState<Application | null>(null);
  const [leadershipInterviewers, setLeadershipInterviewers] = useState<InterviewerOption[]>([]);
  const [selectedLeadershipInterviewerId, setSelectedLeadershipInterviewerId] = useState<string>("");
  const [leadershipInterviewersLoading, setLeadershipInterviewersLoading] = useState(false);
  const [leadershipDay, setLeadershipDay] = useState<Date | undefined>(undefined);
  const [leadershipTime, setLeadershipTime] = useState<string>("07:30");
  const [leadershipDurationMinutes, setLeadershipDurationMinutes] = useState<number>(60);
  const [leadershipMeetLink, setLeadershipMeetLink] = useState<string>("");
  const [leadershipSchedulingLoading, setLeadershipSchedulingLoading] = useState(false);
  const [leadershipAvailabilityStatus, setLeadershipAvailabilityStatus] = useState<AvailabilityStatus>("idle");
  const [leadershipAvailabilityMessage, setLeadershipAvailabilityMessage] = useState<string>("");

  // Offer creation state (from Technical -> Offer)
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [candidateForOffer, setCandidateForOffer] = useState<Application | null>(null);
  const [offerSalary, setOfferSalary] = useState<string>("");
  const [offerStartDay, setOfferStartDay] = useState<Date | undefined>(undefined);
  const [offerBenefits, setOfferBenefits] = useState<string>("");
  const [offerSaving, setOfferSaving] = useState(false);

  // View mode: kanban for "in-progress" tab, list for everything else
  const viewMode = activeTab === "in-progress" ? "pipeline" : "list";

  const extractCvsObjectPathFromResumeUrl = (resumeUrl: string): string | null => {
    const match = resumeUrl.match(/cvs\/(.+)$/);
    return match ? match[1] : null;
  };

  const openCvPreview = async (application: Application) => {
    if (cvLoading) return;
    setCvDialogError("");
    setCvLoading(true);

    if (!application.cvUrl) {
      setCvLoading(false);
      setCvDialogError("No CV available for this candidate.");
      setCvDialogUrl("");
      setCvDialogOpen(true);
      return;
    }

    const objectPath = extractCvsObjectPathFromResumeUrl(application.cvUrl);
    if (!objectPath) {
      setCvLoading(false);
      setCvDialogError("Could not resolve CV storage path.");
      setCvDialogUrl("");
      setCvDialogOpen(true);
      return;
    }

    try {
      const { data, error } = await supabase.storage.from("cvs").createSignedUrl(objectPath, 60);
      if (error) throw error;

      const signedUrl = data?.signedUrl;
      if (!signedUrl) throw new Error("Signed URL was not returned.");

      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Failed to fetch CV");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setCvDialogUrl(blobUrl);
      setCvLoading(false);
      setCvDialogOpen(true);
    } catch (err) {
      console.error("Failed to create CV preview:", err);
      setCvLoading(false);
      setCvDialogError(err instanceof Error ? err.message : "Failed to open CV preview.");
      setCvDialogUrl("");
      setCvDialogOpen(true);
    }
  };

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
      description: "Share this link with the candidate",
    });
  };

  const generateTechnicalMeetLink = () => {
    const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newMeetLink = `https://meet.talentek.com/${uniqueId}`;
    setTechnicalMeetLink(newMeetLink);
    toast({
      title: "Meet Link Generated",
      description: "Share this link with the candidate and interviewer",
    });
  };

  const generateLeadershipMeetLink = () => {
    const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newMeetLink = `https://meet.talentek.com/${uniqueId}`;
    setLeadershipMeetLink(newMeetLink);
    toast({
      title: "Meet Link Generated",
      description: "Share this link with the candidate and interviewer",
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

        setTechnicalAvailabilityStatus("available");
        setTechnicalAvailabilityMessage("Available.");
      } catch (err) {
        setTechnicalAvailabilityStatus("error");
        setTechnicalAvailabilityMessage(err instanceof Error ? err.message : "Failed to check availability.");
      }
    };

    void checkTechnicalAvailability();
  }, [showTechnicalDialog, technicalDateTime, technicalDurationMinutes, selectedInterviewerId]);

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

        setLeadershipAvailabilityStatus("available");
        setLeadershipAvailabilityMessage("Available.");
      } catch (err) {
        setLeadershipAvailabilityStatus("error");
        setLeadershipAvailabilityMessage(err instanceof Error ? err.message : "Failed to check availability.");
      }
    };

    void checkLeadershipAvailability();
  }, [showLeadershipDialog, leadershipDateTime, leadershipDurationMinutes, selectedLeadershipInterviewerId]);

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
    await updateApplication(app.id, { status: "archived", stage: null });
    toast({ title: "Archived", description: `${app.name} has been archived.` });
  };

  const openTechnicalInterviewDialog = async (app: Application) => {
    // Close the candidate details card so it doesn't "jump" stages after moving to Technical.
    setSelectedCandidate(null);
    setCandidateForTechnical(app);
    setSelectedInterviewerId("");
    setTechnicalDay(undefined);
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

  const openLeadershipInterviewDialog = async (app: Application) => {
    // Close the candidate details card so it doesn't "jump" stages after moving to Leadership.
    setSelectedCandidate(null);
    setCandidateForLeadership(app);
    setSelectedLeadershipInterviewerId("");
    setLeadershipDay(undefined);
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
    setOfferBenefits("");
    setShowOfferDialog(true);
  };

  const handleCreateOffer = async () => {
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

    setOfferSaving(true);
    try {
      const salaryValue = offerSalary.trim();
      const salaryStored = salaryValue.toLowerCase().includes("dzd") ? salaryValue : `${salaryValue} DZD`;
      const startDateStored = format(offerStartDay, "yyyy-MM-dd");

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
        })
        .select();

      if (error) throw error;

      await updateApplication(candidateForOffer.id, { stage: "offer" });

      toast({ title: "Offer created", description: `Offer prepared for ${candidateForOffer.name}.` });

      setShowOfferDialog(false);
      setCandidateForOffer(null);
    } catch (err) {
      console.error("Failed to create offer:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create offer",
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
          .select("id, employer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        resolvedTeamMemberId = teamMembership?.id ?? null;
        if (!resolvedEmployerId) {
          resolvedEmployerId = teamMembership?.employer_id ?? null;
        }

        setCurrentEmployerId(resolvedEmployerId);
        setCurrentTeamMemberId(resolvedTeamMemberId);

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
          .select("id,title,profession,location")
          .eq("employer_id", resolvedEmployerId)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        const jobsData: RecruiterJob[] = (jobRows || []).map((row: any) => ({
          id: row.id,
          title: row.title || "Untitled Position",
          department: row.profession || "",
          location: row.location || "",
        }));

        setJobs(jobsData);

        if (jobsData.length > 0 && !selectedJob) {
          setSelectedJob(jobsData[0].id);
        }

        const jobIds = jobsData.map((j) => j.id);

        // Load applications for these jobs
        const { data: applicationRows, error: appsError } = await supabase
          .from("applications")
          .select("id, job_id, talent_id, status, match_score, applied_at, stage")
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

        const taReviewByApplicationId = new Map<string, { rating?: number; text?: string; submittedOn?: string }>();
        const technicalFeedbackByApplicationId = new Map<string, { rating?: number; text?: string; submittedOn?: string }>();
        const leadershipFeedbackByApplicationId = new Map<string, { rating?: number; text?: string; submittedOn?: string }>();

        if (applicationIds.length > 0) {
          const taInterviewsRes = await supabase
            .from("interviews")
            .select("application_id, scheduled_date, review:interview_reviews(rating, review_text, created_at)")
            .eq("interview_type", "talent-acquisition")
            .in("application_id", applicationIds)
            .order("scheduled_date", { ascending: false });

          if (!taInterviewsRes.error && taInterviewsRes.data) {
            for (const row of taInterviewsRes.data as any[]) {
              const appId = row.application_id as string | undefined;
              if (!appId || taReviewByApplicationId.has(appId)) continue;

              const review = Array.isArray(row.review) ? row.review[0] : row.review;
              if (!review) continue;

              taReviewByApplicationId.set(appId, {
                rating: review.rating ? Number(review.rating) : undefined,
                text: review.review_text || undefined,
                submittedOn: review.created_at ? format(new Date(review.created_at), "dd/MM/yyyy") : undefined,
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
          .select("id, user_id, full_name, phone_number, city, years_of_experience, short_bio, skills, resume_url, current_position, education_level, job_types, work_location, linkedin_url, github_url, portfolio_url")
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
          const resumeUrl = talent?.resume_url as string | undefined;
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
            cvUrl: resumeUrl,
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

    // Optimistic UI update
    const updatedApp = { ...selectedCandidate, status: newStatus, stage: newStatus === "in-progress" ? "to-contact" as ApplicationStage : selectedCandidate.stage };
    setApplications((prev) =>
      prev.map((app) => (app.id === selectedCandidate.id ? updatedApp : app))
    );

    toast({
      title: `Moved to ${getStatusLabel(newStatus)}`,
      description: `${selectedCandidate.name} has been moved.`,
    });

    setShowMoveDialog(false);
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

  const handleDragStart = (e: React.DragEvent, candidate: Application) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stageId: ApplicationStage) => {
    e.preventDefault();
    if (!draggedCandidate) return;

    const candidate = draggedCandidate;
    const previousStage = candidate.stage;

    setApplications((prev) => prev.map((app) => (app.id === candidate.id ? { ...app, stage: stageId } : app)));
    setDraggedCandidate(null);

    void (async () => {
      try {
        const { error } = await supabase
          .from("applications")
          .update({ stage: stageId, updated_at: new Date().toISOString() })
          .eq("id", candidate.id);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update pipeline stage:", err);
        setApplications((prev) =>
          prev.map((app) => (app.id === candidate.id ? { ...app, stage: previousStage } : app))
        );
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update pipeline stage.",
          variant: "destructive",
        });
      }
    })();
  };

  const getApplicationsByStage = (stageId: ApplicationStage) => {
    return applications.filter(
      (app) =>
        selectedJob && app.jobId === selectedJob &&
        app.status === "in-progress" &&
        app.stage === stageId
    );
  };

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
              <div className="w-full sm:w-72">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Position</label>
                <Select value={selectedJob || ""} onValueChange={setSelectedJob} disabled={loading || jobs.length === 0}>
                  <SelectTrigger className="rounded-full border-2 border-orange-300 bg-white text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 font-medium">
                    <SelectValue placeholder="Choose a job position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
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
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-sm font-semibold text-orange-700">Loading applications...</p>
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === "list" && (
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
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                        {initials}
                      </div>

                      {/* Candidate Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name & Status */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">{app.name}</h3>
                          <Badge className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 border border-orange-200">
                            {getDisplayStatusLabel(app)}
                          </Badge>
                        </div>

                        {/* Contact Info */}
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

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5">
                          {app.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
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

                        {/* Additional Info Row */}
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

                      {/* Match Score */}
                      <div className={`px-3 py-1.5 rounded-full border ${getScoreColor(app.matchScore)} flex items-center gap-1 flex-shrink-0`}>
                        <Star className="w-3 h-3" />
                        <span className="font-bold text-sm">{app.matchScore}%</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pipeline View - Drag and Drop */}
        {!loading && viewMode === "pipeline" && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {pipelineStages.map((stage) => {
                const stageApplications = getApplicationsByStage(stage.id as ApplicationStage);
                return (
                  <div
                    key={stage.id}
                    className="w-80 flex-shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id as ApplicationStage)}
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
                              draggable
                              onDragStart={(e) => handleDragStart(e, app)}
                              onClick={() => {
                                if (applicationBusyById[app.id]) return;
                                if (selectedCandidate?.id === app.id) return;
                                setSelectedCandidate(app);
                              }}
                              className="bg-white rounded-xl border border-orange-100 shadow-sm p-4 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <GripVertical className="w-4 h-4 text-orange-300" />
                                <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 truncate">{app.name}</h4>
                                  <p className="text-xs text-slate-500 truncate">{app.email}</p>
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
      <Dialog open={!!selectedCandidate && !showMoveDialog && !cvDialogOpen} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
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
                <div className="space-y-6 mt-4 pb-6">
                {/* Pipeline Status */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div>
                    <p className="text-sm text-slate-600">Pipeline:</p>
                  <p className="font-bold text-orange-600">{getDisplayStatusLabel(selectedCandidate)}</p>
                  </div>
                </div>

                {/* AI Match Score */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">AI Candidate Scoring</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold text-slate-700">Match Score</div>
                    <div className={`px-4 py-2 rounded-2xl border ${getScoreColor(selectedCandidate.matchScore)} font-bold text-xl`}>
                      {selectedCandidate.matchScore}%
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Contact Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-orange-500" />
                        {selectedCandidate.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-500" />
                        {selectedCandidate.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Professional Information</h3>
                  <div>
                    <p className="text-xs text-slate-500">Current Company</p>
                    <p className="font-medium text-slate-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-500" />
                      {selectedCandidate.currentCompany}
                    </p>
                  </div>
                </div>

                {/* Personal & Education */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Personal & Education</h3>
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="font-medium text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      {selectedCandidate.location}
                    </p>
                  </div>
                </div>

                {/* Application Details */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Application Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Current Stage:</p>
                      <p className="font-semibold text-orange-600">{formatStageForDisplay(selectedCandidate.stage)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Experience:</p>
                      <p className="font-semibold text-slate-900">{selectedCandidate.experience}</p>
                    </div>
                  </div>
                </div>

                {/* Interviewer Feedback Stack */}
                {selectedCandidate.stage ? (
                  <div className="space-y-3">
                    {getFeedbackStack(selectedCandidate, selectedCandidate.stage).map((item) => (
                      <div key={item.key} className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-slate-700">{item.label}</h3>
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

                    {getFeedbackStack(selectedCandidate, selectedCandidate.stage).length === 0 && (
                      <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <p className="text-sm text-slate-600">No interviewer feedback has been submitted yet.</p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* View CV Button */}
                <Button
                  onClick={() => openCvPreview(selectedCandidate)}
                  disabled={cvLoading}
                  className="w-full rounded-lg border-2 border-orange-300 text-slate-700 bg-white hover:bg-orange-100 hover:border-orange-400 font-semibold py-5 text-base transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {cvLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading CV...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      View CV
                    </>
                  )}
                </Button>
                </div>
              </div>

              {/* Sticky Actions (always visible) */}
              <div className="border-t border-orange-100 pt-4 mt-2 bg-white">
                {activeTab === "all" && selectedCandidate.status === "pending" ? (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void archiveApplication(selectedCandidate)}
                      className="flex-1 rounded-lg border-orange-300 text-slate-700 hover:bg-orange-50 font-semibold py-4"
                      disabled={!!applicationBusyById[selectedCandidate.id]}
                    >
                      Archive
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void movePendingToContact(selectedCandidate)}
                      className="flex-1 bg-orange-600 text-white hover:bg-orange-700 font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                      disabled={!!applicationBusyById[selectedCandidate.id]}
                    >
                      {applicationBusyById[selectedCandidate.id] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Moving...
                        </>
                      ) : (
                        "Move to Contact"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowMoveDialog(true)}
                      variant="outline"
                      className="flex-1 border-2 border-orange-300 bg-white text-orange-700 hover:bg-orange-50 hover:text-orange-800 font-semibold py-4 rounded-lg transition-all"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                    {selectedCandidate?.stage === "to-contact" && (
                      <Button
                        onClick={() => openScheduleInterviewDialog(selectedCandidate)}
                        className="flex-1 bg-orange-600 text-white hover:bg-orange-700 font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    )}
                    {selectedCandidate?.stage === "talent-acquisition" && (
                      <Button
                        onClick={() => void openTechnicalInterviewDialog(selectedCandidate)}
                        className="flex-1 bg-orange-600 text-white hover:bg-orange-700 font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg"
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
                    )}
                    {selectedCandidate?.stage === "technical" && (
                      <div className="flex flex-1 gap-2">
                        <Button
                          type="button"
                          onClick={() => void openLeadershipInterviewDialog(selectedCandidate)}
                          className="flex-1 bg-orange-600 text-white hover:bg-orange-700 font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                          disabled={!!applicationBusyById[selectedCandidate.id]}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Schedule Leadership
                        </Button>
                        <Button
                          type="button"
                          onClick={() => openOfferDialog(selectedCandidate)}
                          className="flex-1 border-2 border-orange-300 bg-white text-orange-700 hover:bg-orange-50 hover:text-orange-800 font-semibold py-4 rounded-lg transition-all"
                          disabled={!!applicationBusyById[selectedCandidate.id]}
                        >
                          <Building className="w-4 h-4 mr-2" />
                          Move to Offer
                        </Button>
                      </div>
                    )}
                    {selectedCandidate?.stage === "leadership" && (
                      <Button
                        type="button"
                        onClick={() => openOfferDialog(selectedCandidate)}
                        className="flex-1 border-2 border-orange-300 bg-white text-orange-700 hover:bg-orange-50 hover:text-orange-800 font-semibold py-4 rounded-lg transition-all"
                        disabled={!!applicationBusyById[selectedCandidate.id]}
                      >
                        <Building className="w-4 h-4 mr-2" />
                        Move to Offer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
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
            <button
              onClick={() => handleMoveCandidate("in-progress")}
              className="w-full p-4 bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left flex items-center gap-4 font-medium"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Hiring Pipeline</h4>
                <p className="text-sm text-slate-600">Move to active pipeline</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
            </button>

            <button
              onClick={() => handleMoveCandidate("maybe")}
              className="w-full p-4 bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left flex items-center gap-4 font-medium"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Maybe</h4>
                <p className="text-sm text-slate-600">Keep for consideration</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
            </button>

            <button
              onClick={() => handleMoveCandidate("rejected")}
              className="w-full p-4 bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left flex items-center gap-4 font-medium"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                <UserX className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Rejected</h4>
                <p className="text-sm text-slate-600">Candidate refused or was rejected</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
            </button>

            <button
              onClick={() => handleMoveCandidate("archived")}
              className="w-full p-4 bg-white rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left flex items-center gap-4 font-medium"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                <Archive className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Archive</h4>
                <p className="text-sm text-slate-500">Remove from active view</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
            </button>
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
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-orange-600">Interview Type:</span> Talent Acquisition
              </p>
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Scheduled Date & Time</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border-2 border-orange-200 bg-white p-2">
                  <Calendar mode="single" selected={scheduledDay} onSelect={setScheduledDay} initialFocus />
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
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
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
                <div className="rounded-xl border-2 border-orange-200 bg-white p-2">
                  <Calendar mode="single" selected={technicalDay} onSelect={setTechnicalDay} initialFocus />
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
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Technical Interview
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
                <div className="rounded-xl border-2 border-orange-200 bg-white p-2">
                  <Calendar mode="single" selected={leadershipDay} onSelect={setLeadershipDay} initialFocus />
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
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Leadership Interview
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
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-xl border-2 border-orange-200 bg-white p-2">
                      <Calendar mode="single" selected={offerStartDay} onSelect={setOfferStartDay} initialFocus />
                    </div>
                    <Input
                      readOnly
                      value={offerStartDay ? format(offerStartDay, "EEEE, MMMM d, yyyy") : ""}
                      placeholder="Select a start date"
                      className="rounded-lg border-2 border-orange-200 h-11 font-medium bg-orange-50/40 text-slate-700"
                    />
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

              <div className="flex gap-3 pt-4 border-t border-orange-100">
                <Button
                  onClick={() => setShowOfferDialog(false)}
                  variant="outline"
                  className="flex-1 rounded-lg border-orange-300 text-slate-700 hover:bg-orange-50"
                  disabled={offerSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOffer}
                  className="flex-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                  disabled={offerSaving || !candidateForOffer}
                >
                  {offerSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 mr-2" />
                      Create Offer
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </RecruiterLayout>
  );
}
