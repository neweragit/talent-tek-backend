import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  skills: string[];
  status: ApplicantStatus;
  matchScore: number;
};

const recruiterJobs: RecruiterJob[] = [
  {
    id: "job-1",
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "Algiers, Algeria",
    applicantsCount: 4,
  },
  {
    id: "job-2",
    title: "Product Manager",
    department: "Product",
    location: "Remote",
    applicantsCount: 3,
  },
  {
    id: "job-3",
    title: "UX Designer",
    department: "Design",
    location: "Dubai, UAE",
    applicantsCount: 2,
  },
];

const initialApplicants: Applicant[] = [
  {
    id: "a-1",
    jobId: "job-1",
    name: "Sara Bensalem",
    email: "sara.bensalem@email.com",
    phone: "0666112233",
    location: "Algiers",
    appliedDate: "2026-03-10",
    experience: "5 years",
    currentCompany: "Tech Solutions",
    coverLetter:
      "I have led React and TypeScript projects across enterprise products and can help accelerate your frontend roadmap.",
    cvName: "sara_bensalem_cv.pdf",
    skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
    status: "new",
    matchScore: 78,
  },
  {
    id: "a-2",
    jobId: "job-1",
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+1 (555) 234-5678",
    location: "New York",
    appliedDate: "2026-03-11",
    experience: "4 years",
    currentCompany: "Digital Agency",
    coverLetter:
      "I focus on scalable UI architecture and design systems, with strong collaboration across product and engineering teams.",
    cvName: "michael_chen_resume.pdf",
    skills: ["React", "JavaScript", "CSS", "Design Systems"],
    status: "in-review",
    matchScore: 88,
  },
  {
    id: "a-3",
    jobId: "job-1",
    name: "Emily Rodriguez",
    email: "emily.r@email.com",
    phone: "+1 (555) 345-6789",
    location: "Austin",
    appliedDate: "2026-03-12",
    experience: "6 years",
    currentCompany: "StartupXYZ",
    coverLetter:
      "I build performant, accessible web applications and mentor junior developers while owning end-to-end feature delivery.",
    cvName: "emily_rodriguez_cv.pdf",
    skills: ["React", "Vue", "TypeScript", "Performance"],
    status: "new",
    matchScore: 92,
  },
  {
    id: "a-4",
    jobId: "job-1",
    name: "David Kim",
    email: "david.kim@email.com",
    phone: "+1 (555) 456-7890",
    location: "Seattle",
    appliedDate: "2026-03-13",
    experience: "7 years",
    currentCompany: "CloudTech Inc",
    coverLetter:
      "I enjoy leading frontend initiatives, partnering with backend teams, and shipping high-impact product experiences.",
    cvName: "david_kim_resume.pdf",
    skills: ["React", "Python", "AWS", "Leadership"],
    status: "new",
    matchScore: 85,
  },
  {
    id: "a-5",
    jobId: "job-2",
    name: "Amanda Foster",
    email: "a.foster@email.com",
    phone: "+1 (555) 567-8901",
    location: "Chicago",
    appliedDate: "2026-03-10",
    experience: "5 years",
    currentCompany: "InnovateCo",
    coverLetter:
      "I have managed product roadmaps in SaaS and can align engineering velocity with measurable customer outcomes.",
    cvName: "amanda_foster_cv.pdf",
    skills: ["Roadmapping", "Stakeholder Management", "Analytics"],
    status: "new",
    matchScore: 81,
  },
  {
    id: "a-6",
    jobId: "job-2",
    name: "James Wilson",
    email: "j.wilson@email.com",
    phone: "+1 (555) 678-9012",
    location: "Denver",
    appliedDate: "2026-03-09",
    experience: "3 years",
    currentCompany: "WebDev Studio",
    coverLetter:
      "I bring strong product discovery practice and experimentation habits to improve user outcomes and growth metrics.",
    cvName: "james_wilson_cv.pdf",
    skills: ["Product Discovery", "Experimentation", "User Research"],
    status: "new",
    matchScore: 72,
  },
  {
    id: "a-7",
    jobId: "job-2",
    name: "Lisa Thompson",
    email: "lisa.t@email.com",
    phone: "+1 (555) 789-0123",
    location: "Boston",
    appliedDate: "2026-03-08",
    experience: "4 years",
    currentCompany: "Freelance",
    coverLetter:
      "I can bridge strategy and execution with strong communication, prioritization, and cross-functional product planning.",
    cvName: "lisa_thompson_cv.pdf",
    skills: ["Prioritization", "Communication", "Delivery"],
    status: "new",
    matchScore: 64,
  },
  {
    id: "a-8",
    jobId: "job-3",
    name: "Robert Martinez",
    email: "r.martinez@email.com",
    phone: "+1 (555) 890-1234",
    location: "Miami",
    appliedDate: "2026-03-07",
    experience: "8 years",
    currentCompany: "Enterprise Corp",
    coverLetter:
      "I design products with strong visual systems and UX rationale, from discovery to polished high-fidelity interfaces.",
    cvName: "robert_martinez_portfolio.pdf",
    skills: ["Figma", "Interaction Design", "Design Systems"],
    status: "new",
    matchScore: 91,
  },
  {
    id: "a-9",
    jobId: "job-3",
    name: "Nina Haddad",
    email: "nina.haddad@email.com",
    phone: "+971 55 123 4567",
    location: "Abu Dhabi",
    appliedDate: "2026-03-06",
    experience: "5 years",
    currentCompany: "UX Orbit",
    coverLetter:
      "My focus is user-centered design and product usability testing with measurable improvement in conversion and retention.",
    cvName: "nina_haddad_resume.pdf",
    skills: ["UX Research", "Prototyping", "Usability Testing"],
    status: "new",
    matchScore: 87,
  },
];

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

export default function EmployerApplicants() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);

  const selectedJob = useMemo(
    () => recruiterJobs.find((job) => job.id === selectedJobId) ?? null,
    [selectedJobId]
  );

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

  const handleMoveToPipeline = () => {
    if (!selectedApplicant) {
      return;
    }

    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === selectedApplicant.id ? { ...applicant, status: "pipeline" } : applicant
      )
    );

    toast({
      title: "Moved to pipeline",
      description: `${selectedApplicant.name} is now ready in your pipeline board.`,
    });

    navigate("/recruiter/pipeline");
  };

  const handleReject = () => {
    if (!selectedApplicant) {
      return;
    }

    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === selectedApplicant.id ? { ...applicant, status: "rejected" } : applicant
      )
    );

    toast({
      title: "Application rejected",
      description: `${selectedApplicant.name} has been marked as rejected.`,
    });
  };

  return (
    <RecruiterLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
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
              <p className="mt-1 text-sm text-slate-600">Across {recruiterJobs.length} open jobs</p>
            </div>
          </div>
        </section>

        {!selectedJobId ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {recruiterJobs.map((job) => {
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
                {selectedApplicant.skills.map((skill) => (
                  <Badge key={skill} className="border border-orange-200 bg-orange-50 text-orange-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Resume</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-orange-600" />
                {selectedApplicant.cvName}
              </p>
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
                      {applicant.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} className="border border-orange-200 bg-orange-50 text-orange-700">
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

