import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import CvViewer from "@/components/CvViewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Search,
  Sparkles,
  Star,
  UserRound,
  UserX,
} from "lucide-react";
import { Loader2 } from "lucide-react";


type ApplicantStatus = "new" | "in-review" | "pipeline" | "rejected";

type RecruiterJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  applicantsCount: number;
};

type Applicant = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  experience: string;
  currentCompany: string;
  coverLetter: string;
  cvName: string;
  cvUrl?: string;
  skills: string[];
  status: ApplicantStatus;
  matchScore: number;
};



const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getStatusMeta = (status: ApplicantStatus) => {
  switch (status) {
    case "pipeline":
      return {
        label: "In Pipeline",
        className: "border border-orange-200 bg-orange-100 text-orange-700",
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "border border-orange-300 bg-orange-100 text-orange-800",
      };
    case "in-review":
      return {
        label: "In Review",
        className: "border border-orange-200 bg-orange-50 text-orange-700",
      };
    default:
      return {
        label: "New",
        className: "border border-orange-200 bg-orange-50 text-orange-700",
      };
  }
};

const formatAppliedDate = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "";
  }
};

const mapDbStatusToUi = (dbStatus: string | null | undefined): ApplicantStatus => {
  if (!dbStatus) return "new";
  const status = String(dbStatus).toLowerCase();
  if (status === "rejected" || status === "archived") return "rejected";
  if (status === "pending") return "new";
  if (status === "in-progress" || status === "interview-scheduled") return "in-review";
  if (status === "offered" || status === "hired" || status === "maybe") return "pipeline";
  return "new";
};

const extractCvsObjectPathFromResumeUrl = (resumeUrl: string): string | null => {
  // Expected public URL patterns often include:
  // .../storage/v1/object/public/cvs/resumes/<folder>/<file>
  // We need the path *inside the bucket*, e.g. `resumes/<folder>/<file>`.
  const match = resumeUrl.match(/\/cvs\/(resumes\/.+)$/);
  if (match?.[1]) return match[1];

  // Fallback: look for `/resumes/...` and strip leading slash.
  const match2 = resumeUrl.match(/\/(resumes\/.+)$/);
  if (match2?.[1]) return match2[1];

  return null;
};

export default function EmployerApplicants() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyJobs, setCompanyJobs] = useState<RecruiterJob[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [cvDialogOpen, setCvDialogOpen] = useState(false);
  const [cvDialogUrl, setCvDialogUrl] = useState<string>("");
  const [cvDialogTitle, setCvDialogTitle] = useState<string>("CV Preview");
  const [cvDialogError, setCvDialogError] = useState<string>("");
  const [cvLoading, setCvLoading] = useState<boolean>(false);

  const selectedJob = useMemo(() => {
    return companyJobs.find((job) => job.id === selectedJobId) ?? null;
  }, [companyJobs, selectedJobId]);

  const filteredApplicants = useMemo(() => {
    if (!selectedJobId) {
      return [];
    }

    return applicants.filter((applicant) => {
      if (applicant.jobId !== selectedJobId) {
        return false;
      }

      return (
        applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [applicants, searchQuery, selectedJobId]);

  const selectedApplicant = useMemo(
    () => applicants.find((applicant) => applicant.id === selectedApplicantId) ?? null,
    [applicants, selectedApplicantId]
  );

  const handleViewApplicants = (jobId: string) => {
    setSelectedJobId(jobId);
    setSelectedApplicantId(null);
    setSearchQuery("");
  };

  const handleMoveToPipeline = async () => {
    if (!selectedApplicant) {
      return;
    }

    // Optimistic UI update
    setApplicants((current) => current.map((a) => (a.id === selectedApplicant.id ? { ...a, status: "pipeline" } : a)));

    toast({
      title: "Moved to pipeline",
      description: `${selectedApplicant.name} is now ready in your pipeline board.`,
    });

    try {
      await supabase
        .from("applications")
        .update({ status: "in-progress", updated_at: new Date().toISOString() })
        .eq("id", selectedApplicant.id);
    } catch (err) {
      console.error("Failed to update application status:", err);
    }

    navigate("/recruiter/pipeline");
  };

  const handleReject = async () => {
    if (!selectedApplicant) {
      return;
    }

    // Optimistic UI update
    setApplicants((current) => current.map((a) => (a.id === selectedApplicant.id ? { ...a, status: "rejected" } : a)));

    toast({
      title: "Application rejected",
      description: `${selectedApplicant.name} has been marked as rejected.`,
    });

    try {
      await supabase
        .from("applications")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", selectedApplicant.id);
    } catch (err) {
      console.error("Failed to update application rejection:", err);
    }
  };

  const openCvPreview = async (applicant: Applicant) => {
    setCvDialogError("");
    setCvDialogTitle("CV Preview");
    setCvLoading(true);

    if (!applicant.cvUrl) {
      setCvLoading(false);
      setCvDialogError("No CV available for this applicant.");
      setCvDialogUrl("");
      setCvDialogOpen(true);
      return;
    }

    const objectPath = extractCvsObjectPathFromResumeUrl(applicant.cvUrl);
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

  useEffect(() => {
    const loadCompanyApplicants = async () => {
      if (!user?.id) {
        setCompanyJobs([]);
        setApplicants([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
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
          toast({
            title: "No Company Found",
            description: "We could not find the company linked to this recruiter account.",
            variant: "destructive",
          });
          setCompanyJobs([]);
          setApplicants([]);
          return;
        }

        const { data: employerProfile } = await supabase
          .from("employers")
          .select("company_name")
          .eq("id", resolvedEmployerId)
          .maybeSingle();

        const companyName = employerProfile?.company_name || "Company";

        // Load jobs for this company
        const { data: jobRows, error: jobsError } = await supabase
          .from("jobs")
          .select("id,title,profession,location,employment_type")
          .eq("employer_id", resolvedEmployerId)
          .order("created_at", { ascending: false });

        if (jobsError) throw jobsError;

        const jobs: RecruiterJob[] = (jobRows || []).map((row: any) => ({
          id: row.id,
          title: row.title || "Untitled Position",
          department: row.profession || "",
          location: row.location || "",
          applicantsCount: 0,
        }));

        setCompanyJobs(jobs);

        if (jobs.length === 0) {
          setApplicants([]);
          return;
        }

        const jobIds = jobs.map((j) => j.id);

        // Load applications for these jobs
        const { data: applicationRows, error: appsError } = await supabase
          .from("applications")
          .select("id, job_id, talent_id, status, match_score, applied_at")
          .in("job_id", jobIds);

        if (appsError) throw appsError;

        const apps = applicationRows || [];

        const talentIds = [...new Set(apps.map((a: any) => a.talent_id).filter(Boolean))];

        // Load talent info to build applicant rows
        const { data: talentRows, error: talentsError } = await supabase
          .from("talents")
          .select("id, user_id, full_name, phone_number, city, years_of_experience, short_bio, skills, resume_url")
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

        const mappedApplicants: Applicant[] = apps.map((app: any) => {
          const talent = talentById.get(app.talent_id as string) as any | undefined;
          const email = talent?.user_id ? (emailByUserId.get(talent.user_id as string) as string | undefined) : undefined;
          const resumeUrl = talent?.resume_url as string | undefined;

          const cvName = resumeUrl ? String(resumeUrl).split("/").pop() || "CV" : "";

          return {
            id: app.id,
            jobId: app.job_id,
            name: talent?.full_name || "",
            email: email || "",
            phone: talent?.phone_number || "",
            location: talent?.city || "",
            appliedDate: formatAppliedDate(app.applied_at),
            experience: talent?.years_of_experience || "",
            currentCompany: companyName,
            coverLetter: talent?.short_bio || "",
            cvName,
            cvUrl: resumeUrl,
            skills: (talent?.skills as string[]) || [],
            status: mapDbStatusToUi(app.status),
            matchScore: Number(app.match_score) || 0,
          };
        });

        // Update job counts quickly
        const countsByJobId = mappedApplicants.reduce<Record<string, number>>((acc, a) => {
          acc[a.jobId] = (acc[a.jobId] || 0) + 1;
          return acc;
        }, {});

        setCompanyJobs((prev) =>
          prev.map((j) => ({
            ...j,
            applicantsCount: countsByJobId[j.id] || 0,
          }))
        );

        setApplicants(mappedApplicants);
      } catch (err) {
        console.error("Failed loading recruiter applicants:", err);
        toast({
          title: "Failed to load applicants",
          description: err instanceof Error ? err.message : "Please try again later.",
          variant: "destructive",
        });
        setCompanyJobs([]);
        setApplicants([]);
      } finally {
        setLoading(false);
      }
    };

    void loadCompanyApplicants();
  }, [toast, user?.id]);

  return (
    <RecruiterLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <Dialog
          open={cvDialogOpen}
          onOpenChange={(open) => {
            setCvDialogOpen(open);
            if (!open) {
              // Clean up blob URL when dialog closes
              if (cvDialogUrl && cvDialogUrl.startsWith('blob:')) {
                URL.revokeObjectURL(cvDialogUrl);
              }
              setCvDialogUrl("");
              setCvDialogError("");
              setCvLoading(false);
            }
          }}
        >
          <DialogContent className="max-w-2xl" aria-describedby="cv-dialog-description">
            <DialogHeader>
              <DialogTitle>{cvDialogTitle}</DialogTitle>
            </DialogHeader>
            <p id="cv-dialog-description" className="sr-only">
              Clean PDF preview of applicant CV.
            </p>

            {cvDialogError ? (
              <div className="rounded-lg border border-orange-200 bg-white p-4">
                <p className="text-sm font-semibold text-orange-700">{cvDialogError}</p>
              </div>
            ) : cvLoading ? (
              <div className="rounded-lg border border-orange-100 bg-white p-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600 mb-4" />
                <p className="text-sm font-semibold text-slate-600">Loading CV preview…</p>
              </div>
            ) : cvDialogUrl ? (
              <CvViewer fileUrl={cvDialogUrl} />
            ) : (
              <div className="rounded-lg border border-orange-100 bg-white p-6 text-center">
                <p className="text-sm font-semibold text-slate-600">Preparing CV preview…</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Recruiter Applications
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Applicants
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Review job applicants with the same bold orange identity, open full applications, and quickly decide whether to reject or move each candidate into pipeline.
              </p>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Total Active Applicants</p>
              <div className="mt-2 text-3xl font-bold text-slate-900">{applicants.filter((a) => a.status !== "rejected").length}</div>
              <p className="mt-1 text-sm text-slate-600">Across {companyJobs.length} open jobs</p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-semibold text-orange-700">Loading applicants for your company...</p>
          </div>
        ) : !selectedJobId ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {companyJobs.map((job) => {
              const jobApplicantsCount = applicants.filter((applicant) => applicant.jobId === job.id).length;

              return (
                <article
                  key={job.id}
                  className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
                      <p className="mt-1 text-sm font-semibold text-orange-600">{job.department}</p>
                    </div>
                    <Badge className="border border-orange-200 bg-orange-50 text-orange-700">
                      {jobApplicantsCount} applicants
                    </Badge>
                  </div>

                  <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{job.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Job Type</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">Full-time</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-orange-100 pt-4">
                    <Button
                      type="button"
                      onClick={() => handleViewApplicants(job.id)}
                      className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
                    >
                      View Applicants
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : selectedApplicant ? (
          <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedApplicantId(null)}
                className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Applicants
              </Button>
              <div className="flex items-center gap-2">
                <Badge className={getStatusMeta(selectedApplicant.status).className}>
                  {getStatusMeta(selectedApplicant.status).label}
                </Badge>
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-orange-600 shadow-sm">
                  <Star className="h-4 w-4" />
                  <span className="text-sm font-bold">{selectedApplicant.matchScore}%</span>
                  <span className="text-sm">Match</span>
                </div>
              </div>
            </div>

            <div className="mb-6 flex items-start gap-4 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-md">
                {getInitials(selectedApplicant.name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedApplicant.name}</h2>
                <p className="text-sm font-semibold text-orange-600">{selectedJob?.title}</p>
                <p className="mt-1 text-sm text-slate-600">{selectedApplicant.currentCompany} â€¢ {selectedApplicant.experience}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-orange-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 break-all">
                  <Mail className="h-4 w-4 text-orange-600" />
                  {selectedApplicant.email}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Phone</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{selectedApplicant.phone}</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{selectedApplicant.location}</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Applied Date</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarDays className="h-4 w-4 text-orange-600" />
                  {selectedApplicant.appliedDate}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">AI Candidate Scoring</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-orange-700">
                  <Star className="h-4 w-4" />
                  <span className="text-sm font-bold">{selectedApplicant.matchScore}% Match</span>
                </div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-orange-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
                  style={{ width: `${selectedApplicant.matchScore}%` }}
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cover Letter</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{selectedApplicant.coverLetter}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedApplicant.skills.map((skill, index) => (
                  <Badge key={`skill-${index}`} className="border border-orange-200 bg-orange-50 text-orange-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Resume</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  disabled={!selectedApplicant.cvUrl || cvLoading}
                  onClick={() => void openCvPreview(selectedApplicant)}
                  className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50 px-6 py-3 text-base font-semibold"
                >
                  {cvLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      View CV
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-orange-100 pt-6">
              <Button
                type="button"
                onClick={handleReject}
                variant="outline"
                className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <UserX className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                type="button"
                onClick={handleMoveToPipeline}
                className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Move to Pipeline
              </Button>
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedJobId(null)}
                className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
              </Button>
              <Badge className="border border-orange-200 bg-white text-orange-700">
                {filteredApplicants.length} applicants for {selectedJob?.title}
              </Badge>
            </div>

            <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, or skill..."
                  className="h-12 w-full rounded-xl border border-orange-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            {filteredApplicants.length > 0 ? (
              <div className="grid gap-5 xl:grid-cols-2">
                {filteredApplicants.map((applicant) => (
                  <article
                    key={applicant.id}
                    className="overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-sm font-bold text-white shadow-md">
                          {getInitials(applicant.name)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{applicant.name}</h3>
                          <p className="mt-1 text-sm font-medium text-slate-600">{applicant.currentCompany}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusMeta(applicant.status).className}>{getStatusMeta(applicant.status).label}</Badge>
                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-orange-600">
                          <Star className="h-3.5 w-3.5" />
                          <span className="text-sm font-bold">{applicant.matchScore}%</span>
                          <span className="text-sm">Match</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-orange-600" />
                        <span className="truncate">{applicant.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-orange-600" />
                        <span>{applicant.experience}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <span>{applicant.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-orange-600" />
                        <span>{applicant.appliedDate}</span>
                      </div>
                    </div>

                    <div className="mb-5 flex flex-wrap gap-2">
                      {applicant.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={`${applicant.id}-skill-${index}`} className="border border-orange-200 bg-orange-50 text-orange-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="border-t border-orange-100 pt-4">
                      <Button
                        type="button"
                        onClick={() => setSelectedApplicantId(applicant.id)}
                        className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
                      >
                        <UserRound className="mr-2 h-4 w-4" />
                        View Full Application
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
                  <Search className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">No applicants match this search</h2>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  Try a different name, email, or skill keyword and the applicant list will update instantly.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </RecruiterLayout>
  );
}

