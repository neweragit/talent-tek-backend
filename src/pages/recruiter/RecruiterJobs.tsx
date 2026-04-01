import { useEffect, useMemo, useState } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, Briefcase, CalendarDays, Edit, Loader2, MapPin, Plus, Share2, Sparkles, Upload } from "lucide-react";
import type { JobDetailsData } from "@/data/talentJobs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type JobPublishStatus = "Published" | "Unpublished" | "Archived";

type PostedJob = {
  id: string;
  job: JobDetailsData;
  status: JobPublishStatus;
  postedAt: string;
  profession: string;
  contractType: string;
  jobLevel: string;
  educationRequired: string;
  positionsAvailable: number;
  responsibilities: string[];
  requirements: string[];
};

type JobSection = JobPublishStatus;

type JobFormState = {
  title: string;
  profession: string;
  description: string;
  location: string;
  workplace: string;
  employmentType: string;
  contractType: string;
  experienceLevel: string;
  jobLevel: string;
  educationRequired: string;
  skillsRequired: string;
  positionsAvailable: string;
  whatYouWillDo: string;
  requirements: string;
};

const statusOptions: JobPublishStatus[] = ["Published", "Unpublished", "Archived"];
const employmentTypeOptions = ["Full-time", "Part-time"];
const workplaceOptions = ["On-site", "Hybrid", "Remote"];
const contractTypeOptions = ["Permanent (CDI)", "Fixed-term (CDD)","Freelance"];
const educationRequiredOptions = ["Bachelor (Licence)", "Master", "PhD (Doctorat)"];
const experienceLevelOptions = ["0–1 years", "1–3 years", "3–5 years", "5–8 years", "8+ years"];
const jobLevelOptions = ["Internship", "Junior", "Mid", "Senior", "Lead", "Manager", "Director"];

const emptyForm: JobFormState = {
  title: "",
  profession: "",
  description: "",
  location: "",
  workplace: "",
  employmentType: "",
  contractType: "",
  experienceLevel: "",
  jobLevel: "",
  educationRequired: "",
  skillsRequired: "",
  positionsAvailable: "1",
  whatYouWillDo: "",
  requirements: "",
};

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const toDbStatus = (status: JobPublishStatus) => {
  if (status === "Published") return "published";
  if (status === "Archived") return "archived";
  return "unpublished";
};

const toUiStatus = (status: string): JobPublishStatus => {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Unpublished";
};

const toDbWorkplace = (workMode: string) => {
  if (workMode === "On-site") return "on-site";
  if (workMode === "Hybrid") return "hybrid";
  return "remote";
};

const toUiWorkMode = (workplace: string) => {
  if (workplace === "on-site") return "On-site";
  if (workplace === "hybrid") return "Hybrid";
  return "Remote";
};

const toDbEmploymentType = (jobType: string) => {
  if (jobType === "Full-time") return "full-time";
  if (jobType === "Part-time") return "part-time";
  if (jobType === "Internship") return "internship";
  if (jobType === "Contract") return "contract";
  return "contract";
};

const toDbWorkMode = (workplace: string) => {
  if (workplace === "On-site") return "on-site";
  if (workplace === "Hybrid") return "hybrid";
  return "remote";
};

const toUiJobType = (employmentType: string) => {
  if (employmentType === "full-time") return "Full-time";
  if (employmentType === "part-time") return "Part-time";
  if (employmentType === "internship") return "Internship";
  if (employmentType === "contract") return "Contract";
  return "Contract";
};

const getInitialsFromCompany = (company: string) => {
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CO";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? "C"}${words[1][0] ?? "O"}`.toUpperCase();
};

const getPostedDays = (isoDate: string) => {
  const sourceTime = new Date(isoDate).getTime();
  if (Number.isNaN(sourceTime)) return 0;
  const days = Math.floor((Date.now() - sourceTime) / (1000 * 60 * 60 * 24));
  return days < 0 ? 0 : days;
};

const getPostedAgoLabel = (isoDate: string) => {
  const sourceTime = new Date(isoDate).getTime();
  if (Number.isNaN(sourceTime)) {
    return "Just now";
  }

  const diffMs = Math.max(0, Date.now() - sourceTime);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (hours < 1) {
    return "Less than 1 hour ago";
  }

  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const truncateText = (value: string, maxLength: number) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
};

export default function EmployerJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewingJob, setViewingJob] = useState<PostedJob | null>(null);
  const [activeSection, setActiveSection] = useState<JobSection>("Published");
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [companySize, setCompanySize] = useState<string>("");
  const [industry, setIndustry] = useState<string>("General");
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<JobFormState>(emptyForm);

  const totalSteps = 4;

  const stepTitles = [
    "Role Basics",
    "Job Conditions",
    "Job Description",
    "Responsibilities & Requirements",
  ];

  const handleAiGeneratePlaceholder = () => {
    toast({
      title: "AI Generator Coming Soon",
      description: "AI generation will be added later. You can fill all fields manually for now.",
    });
  };

  const handleShareJob = async (job: PostedJob) => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;

    try {
      await navigator.clipboard.writeText(jobUrl);
      toast({
        title: "Link copied to clipboard",
      });
    } catch (error: any) {
      toast({
        title: "Share failed",
        description: error?.message || "Could not share this job.",
        variant: "destructive",
      });
    }
  };

  const canMoveToNextStep = (step: number) => {
    if (step === 1) {
      return Boolean(
        form.title.trim() &&
          form.profession.trim() &&
          form.location.trim() &&
          form.workplace.trim() &&
          form.employmentType.trim()
      );
    }

    if (step === 2) {
      const positions = Number(form.positionsAvailable);
      return Boolean(
        form.contractType.trim() &&
          form.experienceLevel.trim() &&
          form.jobLevel.trim() &&
          form.educationRequired.trim() &&
          form.skillsRequired.trim() &&
          Number.isInteger(positions) &&
          positions > 0
      );
    }

    if (step === 3) {
      return Boolean(form.description.trim());
    }

    return true;
  };

  const handleNextStep = () => {
    if (!canMoveToNextStep(currentStep)) {
      toast({
        title: "Missing Information",
        description: "Please complete the required fields in this step before continuing.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep((step) => (step < totalSteps ? step + 1 : step));
  };

  const handlePreviousStep = () => {
    setCurrentStep((step) => (step > 1 ? step - 1 : step));
  };

  const loadJobs = async () => {
    try {
      if (!user?.id) {
        setPostedJobs([]);
        setEmployerId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      let resolvedEmployerId: string | null = null;

      const { data: employerByOwner } = await supabase
        .from("employers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employerByOwner?.id) {
        resolvedEmployerId = employerByOwner.id;
      } else {
        const { data: teamMembership } = await supabase
          .from("employer_team_members")
          .select("employer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        resolvedEmployerId = teamMembership?.employer_id ?? null;
      }

      if (!resolvedEmployerId) {
        setEmployerId(null);
        setPostedJobs([]);
        toast({
          title: "No Company Found",
          description: "We could not find the company linked to this recruiter account.",
          variant: "destructive",
        });
        return;
      }

      setEmployerId(resolvedEmployerId);

      const { data: employerProfile } = await supabase
        .from("employers")
        .select("company_name,company_size,industry")
        .eq("id", resolvedEmployerId)
        .maybeSingle();

      const resolvedCompanyName = employerProfile?.company_name || "Company";
      const resolvedCompanySize = employerProfile?.company_size || "Not specified";
      const resolvedIndustry = employerProfile?.industry || "General";

      setCompanyName(resolvedCompanyName);
      setCompanySize(resolvedCompanySize);
      setIndustry(resolvedIndustry);

      const { data: rows, error } = await supabase
        .from("jobs")
        .select(
          "id,title,profession,description,location,workplace,employment_type,contract_type,experience_level,job_level,education_required,skills_required,positions_available,status,published_at,created_at,what_you_will_do,requirements"
        )
        .eq("employer_id", resolvedEmployerId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const mappedJobs: PostedJob[] = (rows || []).map((row: any) => {
        const createdAt = row.created_at || row.published_at || new Date().toISOString();
        const companyInitials = getInitialsFromCompany(resolvedCompanyName);

        return {
          id: row.id,
          status: toUiStatus(row.status || "unpublished"),
          postedAt: createdAt,
          profession: row.profession || "",
          contractType: row.contract_type || "",
          jobLevel: row.job_level || "",
          educationRequired: row.education_required || "",
          positionsAvailable: Number(row.positions_available) > 0 ? Number(row.positions_available) : 1,
          responsibilities: asStringArray(row.what_you_will_do),
          requirements: asStringArray(row.requirements),
          job: {
            id: Number(String(row.id).replace(/-/g, "").slice(0, 12)) || Date.now(),
            initials: companyInitials,
            title: row.title || "Untitled Role",
            company: resolvedCompanyName,
            location: row.location || "Not specified",
            industry: resolvedIndustry,
            jobType: toUiJobType(row.employment_type || "contract"),
            workMode: toUiWorkMode(row.workplace || "remote"),
            experience: row.experience_level || row.job_level || "Not specified",
            companySize: resolvedCompanySize,
            postedDays: getPostedDays(createdAt),
            salaryMin: 0,
            salaryMax: 0,
            visaSupport: false,
            skills: asStringArray(row.skills_required),
            summary: row.description || "",
            distanceKm: 0,
          },
        };
      });

      setPostedJobs(mappedJobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load jobs from database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [user?.id]);

  const postedCounts = useMemo(
    () => ({
      Published: postedJobs.filter((job) => job.status === "Published").length,
      Unpublished: postedJobs.filter((job) => job.status === "Unpublished").length,
      Archived: postedJobs.filter((job) => job.status === "Archived").length,
    }),
    [postedJobs]
  );

  const handlePostJob = async (submitStatus: JobPublishStatus) => {
    const requiredValues = [
      form.title,
      form.profession,
      form.description,
      form.location,
      form.workplace,
      form.employmentType,
      form.contractType,
      form.experienceLevel,
      form.jobLevel,
      form.educationRequired,
      form.skillsRequired,
      form.positionsAvailable,
      form.whatYouWillDo,
      form.requirements,
    ];

    if (requiredValues.some((value) => !value.trim())) {
      return;
    }

    const skills = form.skillsRequired
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const responsibilities = splitLines(form.whatYouWillDo);
    const requirements = splitLines(form.requirements);
    const positionsAvailable = Number(form.positionsAvailable);

    if (skills.length === 0 || responsibilities.length === 0 || requirements.length === 0 || !Number.isInteger(positionsAvailable) || positionsAvailable < 1) {
      toast({
        title: "Invalid Form",
        description: "Please provide valid skills, responsibilities, requirements, and positions available.",
        variant: "destructive",
      });
      return;
    }

    if (!employerId) {
      toast({
        title: "Company Missing",
        description: "No company profile found for this recruiter.",
        variant: "destructive",
      });
      return;
    }

    const rowPayload = {
      employer_id: employerId,
      title: form.title.trim(),
      profession: form.profession.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      workplace: toDbWorkMode(form.workplace),
      employment_type: toDbEmploymentType(form.employmentType),
      contract_type: form.contractType.trim(),
      experience_level: form.experienceLevel.trim(),
      job_level: form.jobLevel.trim(),
      education_required: form.educationRequired.trim(),
      skills_required: skills,
      positions_available: positionsAvailable,
      what_you_will_do: responsibilities,
      requirements,
      status: toDbStatus(submitStatus),
      published_at: submitStatus === "Published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    try {
      setIsSavingJob(true);

      if (editingJobId) {
        const { error } = await supabase.from("jobs").update(rowPayload).eq("id", editingJobId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("jobs").insert([rowPayload]);
        if (error) throw error;
      }

      await loadJobs();
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        title: "Error",
        description: "Failed to save the job.",
        variant: "destructive",
      });
      return;
    } finally {
      setIsSavingJob(false);
    }

    setOpenDialog(false);
    setEditingJobId(null);
    setForm(emptyForm);
  };

  const filteredJobs = useMemo(
    () => postedJobs.filter((job) => job.status === activeSection),
    [activeSection, postedJobs]
  );

  const handleArchiveJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: toDbStatus("Archived"), updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) throw error;
      await loadJobs();
    } catch (error) {
      console.error("Error archiving job:", error);
      toast({
        title: "Error",
        description: "Failed to archive the job.",
        variant: "destructive",
      });
    }
  };

  const handlePublishJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: toDbStatus("Published"), published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) throw error;
      await loadJobs();
    } catch (error) {
      console.error("Error publishing job:", error);
      toast({
        title: "Error",
        description: "Failed to publish the job.",
        variant: "destructive",
      });
    }
  };

  const handleUnpublishJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: toDbStatus("Unpublished"), updated_at: new Date().toISOString() })
        .eq("id", jobId);

      if (error) throw error;
      await loadJobs();
    } catch (error) {
      console.error("Error unpublishing job:", error);
      toast({
        title: "Error",
        description: "Failed to unpublish the job.",
        variant: "destructive",
      });
    }
  };

  const handleOpenEditJob = (jobId: string) => {
    const selectedJob = postedJobs.find((job) => job.id === jobId);
    if (!selectedJob) {
      return;
    }

    setEditingJobId(jobId);
    setForm({
      title: selectedJob.job.title,
      profession: selectedJob.profession,
      description: selectedJob.job.summary,
      location: selectedJob.job.location,
      workplace: selectedJob.job.workMode,
      employmentType: selectedJob.job.jobType,
      contractType: selectedJob.contractType,
      experienceLevel: selectedJob.job.experience,
      jobLevel: selectedJob.jobLevel,
      educationRequired: selectedJob.educationRequired,
      skillsRequired: selectedJob.job.skills.join(", "),
      positionsAvailable: String(selectedJob.positionsAvailable),
      whatYouWillDo: selectedJob.responsibilities.join("\n"),
      requirements: selectedJob.requirements.join("\n"),
    });
    setCurrentStep(1);
    setOpenDialog(true);
  };

  return (
    <RecruiterLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Published Jobs
              </div>
              <h1 className="text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Published Jobs
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Add complete job details and publish openings that align with the talent marketplace job dataset.
              </p>
            </div>

            <Button
              onClick={() => {
                setEditingJobId(null);
                setForm(emptyForm);
                setCurrentStep(1);
                setOpenDialog(true);
              }}
              className="h-12 rounded-full bg-orange-600 px-6 font-semibold text-white shadow-md hover:bg-orange-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Post a Job
            </Button>
          </div>
        </section>

        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-3 shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            {(["Published", "Unpublished", "Archived"] as JobSection[]).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  activeSection === section
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Published", value: postedCounts.Published },
            { label: "Unpublished", value: postedCounts.Unpublished },
            { label: "Archived", value: postedCounts.Archived },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">{activeSection}</h2>
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-5 py-8 text-orange-700">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading jobs...
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredJobs.map((postedJob) => (
                <article key={postedJob.id} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-6 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                        {postedJob.job.initials}
                      </div>
                      <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">Career Opportunity</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => void handleShareJob(postedJob)}
                        className="h-10 w-10 rounded-full border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                        aria-label={`Share ${postedJob.job.title}`}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenEditJob(postedJob.id)}
                        className="h-10 w-10 rounded-full border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                        aria-label={`Edit ${postedJob.job.title}`}
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{postedJob.status}</Badge>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900">{postedJob.job.title}</h3>
                  <p className="mt-1 text-base font-semibold text-slate-700">{postedJob.job.company}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{postedJob.job.industry}</Badge>
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{postedJob.job.jobType}</Badge>
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{postedJob.job.workMode}</Badge>
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{postedJob.job.experience}</Badge>
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{postedJob.job.companySize}</Badge>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="font-semibold text-slate-700">Location</p>
                      <p className="mt-1 flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        {postedJob.job.location}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
                      <p className="font-semibold text-slate-700">Posted</p>
                      <p className="mt-1 flex items-center gap-2 text-slate-600">
                        <CalendarDays className="h-4 w-4 text-orange-500" />
                        {getPostedAgoLabel(postedJob.postedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-orange-100 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900">Announcement</h4>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewingJob(postedJob)}
                        className="h-10 rounded-full border-orange-200 px-5 text-orange-700 hover:bg-orange-50"
                      >
                        View details
                      </Button>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{truncateText(postedJob.job.summary, 180)}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-orange-100 pt-4">
                    <p className="text-sm font-medium text-slate-600">
                      {postedJob.job.initials} {postedJob.job.company} hiring for this role now across active teams.
                    </p>
                    <div className="flex gap-2">
                      {postedJob.status === "Published" ? (
                        <>
                          <Button
                            type="button"
                            onClick={() => handleUnpublishJob(postedJob.id)}
                            className="rounded-full bg-orange-500 px-5 text-white hover:bg-orange-600"
                          >
                            Unpublish
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleArchiveJob(postedJob.id)}
                            className="rounded-full bg-orange-500 px-5 text-white hover:bg-orange-600"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handlePublishJob(postedJob.id)}
                          className="rounded-full bg-orange-500 px-5 text-white hover:bg-orange-600"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Publish
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {filteredJobs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-8 text-center">
                  <p className="font-semibold text-orange-700">No jobs in {activeSection.toLowerCase()} yet.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <Dialog open={!!viewingJob} onOpenChange={(open) => !open && setViewingJob(null)}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">Job Details</DialogTitle>
            </DialogHeader>

            {viewingJob ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{viewingJob.job.title}</h3>
                  <p className="mt-1 text-base font-semibold text-slate-700">{viewingJob.job.company}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{viewingJob.job.industry}</Badge>
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{viewingJob.job.jobType}</Badge>
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{viewingJob.job.workMode}</Badge>
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{viewingJob.job.experience}</Badge>
                    <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{viewingJob.job.companySize}</Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900">Announcement</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-line">{viewingJob.job.summary}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-orange-100 bg-white p-4">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900">What You Will Do</h4>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {viewingJob.responsibilities.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="mt-1 text-orange-500">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-white p-4">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900">Requirements</h4>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {viewingJob.requirements.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="mt-1 text-orange-500">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-white p-4">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900">Required Skills</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {viewingJob.job.skills.map((skill) => (
                      <Badge key={skill} className="rounded-full border border-orange-200 bg-orange-50 text-orange-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog
          open={openDialog}
          onOpenChange={(value) => {
            setOpenDialog(value);
            if (!value) {
              setCurrentStep(1);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">{editingJobId ? "Edit Job" : "Post a Job"}</DialogTitle>
            </DialogHeader>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-orange-700">Step {currentStep} of {totalSteps}</p>
                <p className="text-sm font-semibold text-slate-700">{stepTitles[currentStep - 1]}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {stepTitles.map((title, index) => {
                  const step = index + 1;
                  const isActive = step === currentStep;
                  const isComplete = step < currentStep;

                  return (
                    <div key={title} className="space-y-2">
                      <div
                        className={`h-2 rounded-full ${
                          isComplete ? "bg-orange-600" : isActive ? "bg-orange-400" : "bg-orange-100"
                        }`}
                      />
                      <p className={`text-xs font-semibold ${isActive ? "text-orange-700" : "text-slate-500"}`}>{step}. {title}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePostJob("Published");
              }}
              className="mt-4 space-y-5"
            >
              {currentStep === 1 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Title</Label>
                    <Input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50" required />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Profession</Label>
                    <Input value={form.profession} onChange={(e) => setForm((c) => ({ ...c, profession: e.target.value }))} className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50" required />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Location</Label>
                    <Input value={form.location} onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))} className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50" required />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Workplace</Label>
                    <Select value={form.workplace} onValueChange={(value) => setForm((c) => ({ ...c, workplace: value }))}>
                      <SelectTrigger className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50">
                        <SelectValue placeholder="Select workplace" />
                      </SelectTrigger>
                      <SelectContent>
                        {workplaceOptions.map((workplaceOption) => (
                          <SelectItem key={workplaceOption} value={workplaceOption}>
                            {workplaceOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700">Employment Type</Label>
                    <Select value={form.employmentType} onValueChange={(value) => setForm((c) => ({ ...c, employmentType: value }))}>
                      <SelectTrigger className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50">
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([form.employmentType, ...employmentTypeOptions].filter(Boolean))).map((employmentTypeOption) => (
                          <SelectItem key={employmentTypeOption} value={employmentTypeOption}>
                            {employmentTypeOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Contract Type</Label>
                    <Select value={form.contractType} onValueChange={(value) => setForm((c) => ({ ...c, contractType: value }))}>
                      <SelectTrigger className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50">
                        <SelectValue placeholder="Select contract type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([form.contractType, ...contractTypeOptions].filter(Boolean))).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Experience Level</Label>
                    <Select value={form.experienceLevel} onValueChange={(value) => setForm((c) => ({ ...c, experienceLevel: value }))}>
                      <SelectTrigger className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50">
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([form.experienceLevel, ...experienceLevelOptions].filter(Boolean))).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Job Level</Label>
                    <Select
                      value={form.jobLevel}
                      onValueChange={(value) =>
                        setForm((current) => {
                          const next = { ...current, jobLevel: value };

                          if (value === "Internship") {
                            next.employmentType = "Internship";
                            if (!next.experienceLevel) {
                              next.experienceLevel = "0–1 years";
                            }
                          }

                          return next;
                        })
                      }
                    >
                      <SelectTrigger className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50">
                        <SelectValue placeholder="Select job level" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([form.jobLevel, ...jobLevelOptions].filter(Boolean))).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Education Required</Label>
                    <Select value={form.educationRequired} onValueChange={(value) => setForm((c) => ({ ...c, educationRequired: value }))}>
                      <SelectTrigger className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([form.educationRequired, ...educationRequiredOptions].filter(Boolean))).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Positions Available</Label>
                    <Input type="number" min={1} value={form.positionsAvailable} onChange={(e) => setForm((c) => ({ ...c, positionsAvailable: e.target.value }))} className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50" required />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Skills Required (comma separated)</Label>
                    <Input value={form.skillsRequired} onChange={(e) => setForm((c) => ({ ...c, skillsRequired: e.target.value }))} className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50" placeholder="React, TypeScript, Tailwind" required />
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-sm font-semibold text-slate-700">Description</Label>
                    <Button type="button" variant="outline" onClick={handleAiGeneratePlaceholder} className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} className="min-h-40 rounded-xl border-orange-200 bg-orange-50" required />
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm font-semibold text-slate-700">What You Will Do (one item per line)</Label>
                      <Button type="button" variant="outline" onClick={handleAiGeneratePlaceholder} className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                      </Button>
                    </div>
                    <Textarea value={form.whatYouWillDo} onChange={(e) => setForm((c) => ({ ...c, whatYouWillDo: e.target.value }))} className="min-h-40 rounded-xl border-orange-200 bg-orange-50" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm font-semibold text-slate-700">Requirements (one item per line)</Label>
                      <Button type="button" variant="outline" onClick={handleAiGeneratePlaceholder} className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                      </Button>
                    </div>
                    <Textarea value={form.requirements} onChange={(e) => setForm((c) => ({ ...c, requirements: e.target.value }))} className="min-h-40 rounded-xl border-orange-200 bg-orange-50" required />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" onClick={() => setOpenDialog(false)} className="h-12 rounded-full bg-orange-600 px-6 font-semibold text-white shadow-lg hover:bg-orange-700">
                  Cancel
                </Button>

                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={handlePreviousStep} className="h-12 rounded-full border-orange-200 px-6 text-orange-700 hover:bg-orange-50">
                    Back
                  </Button>
                ) : null}

                {currentStep < totalSteps ? (
                  <Button type="button" onClick={handleNextStep} className="h-12 rounded-full bg-orange-500 px-6 font-semibold text-white shadow-lg hover:bg-orange-600">
                    Next Step
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() => handlePostJob("Unpublished")}
                      disabled={isSavingJob}
                      className="h-12 rounded-full bg-orange-500 px-6 font-semibold text-white shadow-lg hover:bg-orange-600"
                    >
                      Save Draft
                    </Button>
                    <Button type="submit" disabled={isSavingJob} className="h-12 rounded-full bg-orange-600 px-6 font-semibold text-white shadow-lg hover:bg-orange-700">
                      Publish Job
                    </Button>
                  </>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RecruiterLayout>
  );
}
