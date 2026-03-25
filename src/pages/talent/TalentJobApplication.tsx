import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTalentProfileCvDocuments } from "@/data/talentProfileDocuments";
import {
  formatSalary,
  getTalentJobById,
  JobDetailsRouteState,
  legacyDefaultJob,
} from "@/data/talentJobs";
import { saveSubmittedTalentApplication } from "@/lib/talentApplications";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  MapPin,
  Send,
  Upload,
} from "lucide-react";

type TalentProfileDraft = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  linkedin?: string;
  website?: string;
  availability?: string;
  salaryExpectation?: string;
};

const getStoredTalentProfile = (): TalentProfileDraft | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedProfile = window.localStorage.getItem("talentProfile");
  if (!storedProfile) {
    return null;
  }

  try {
    return JSON.parse(storedProfile) as TalentProfileDraft;
  } catch {
    return null;
  }
};

const getApplicationDefaults = () => {
  const profile = getStoredTalentProfile();

  return {
    fullName: [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    location: [profile?.city, profile?.country].filter(Boolean).join(", "),
    linkedinUrl: profile?.linkedin ?? "",
    portfolioUrl: profile?.website ?? "",
    availability: profile?.availability ?? "",
    salaryExpectation: profile?.salaryExpectation ?? "",
    coverLetter: "",
  };
};

export default function TalentJobApplication() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { id } = useParams();
  const routeState = (location.state as JobDetailsRouteState | null) ?? null;
  const profileCvDocuments = useMemo(() => getTalentProfileCvDocuments(), []);
  const [formValues, setFormValues] = useState(getApplicationDefaults);
  const [cvSource, setCvSource] = useState<"profile" | "upload">(
    profileCvDocuments.length > 0 ? "profile" : "upload",
  );
  const [selectedProfileCvId, setSelectedProfileCvId] = useState(profileCvDocuments[0]?.id ?? "");
  const [uploadedCvFile, setUploadedCvFile] = useState<File | null>(null);

  const selectedJob = useMemo(() => {
    if (routeState?.job) {
      return routeState.job;
    }

    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return null;
    }

    return getTalentJobById(numericId) ?? legacyDefaultJob;
  }, [id, routeState]);

  const backPath = routeState?.from ?? (selectedJob ? `/talent/job/${selectedJob.id}` : "/talent/jobs");
  const selectedProfileCv = profileCvDocuments.find((document) => document.id === selectedProfileCvId) ?? null;

  if (!selectedJob) {
    return (
      <TalentLayout>
        <div className="relative z-10 mx-auto max-w-4xl px-3 py-12 sm:px-4 sm:py-16">
          <div className="rounded-3xl border border-orange-200 bg-white p-10 text-center shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-slate-900">Job application unavailable</h1>
            <p className="mb-6 text-gray-600">This role could not be loaded for application.</p>
            <Button
              onClick={() => navigate("/talent/jobs")}
              className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white hover:from-orange-700 hover:to-orange-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </TalentLayout>
    );
  }

  const handleChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (cvSource === "profile" && !selectedProfileCv) {
      toast({
        title: "Select a CV",
        description: "Choose a CV from your profile before submitting your candidacy.",
      });
      return;
    }

    if (cvSource === "upload" && !uploadedCvFile) {
      toast({
        title: "Upload your CV",
        description: "Upload a new CV file before submitting your candidacy.",
      });
      return;
    }

    const submittedApplication = {
      id: Date.now(),
      company: selectedJob.company,
      contact: `careers@${selectedJob.company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
      jobTitle: selectedJob.title,
      status: "in-progress" as const,
      appliedDate: "Just now",
      jobId: selectedJob.id,
      applicantName: formValues.fullName,
      email: formValues.email,
      phone: formValues.phone,
      linkedinUrl: formValues.linkedinUrl,
      portfolioUrl: formValues.portfolioUrl,
      availability: formValues.availability,
      salaryExpectation: formValues.salaryExpectation,
      coverLetter: formValues.coverLetter,
      cvSource,
      cvName: cvSource === "profile" ? selectedProfileCv?.name : uploadedCvFile?.name,
    };

    saveSubmittedTalentApplication(submittedApplication);

    toast({
      title: "Application submitted",
      description: `Your candidacy for ${selectedJob.title} at ${selectedJob.company} has been sent.`,
    });

    navigate("/talent/applications", {
      state: {
        submittedApplicationId: submittedApplication.id,
      },
    });
  };

  return (
    <TalentLayout>
      <div className="relative z-10 mx-auto max-w-6xl px-3 py-12 sm:px-4 sm:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm transition-colors hover:bg-orange-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job Details
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-8">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Submit Candidacy
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Apply for {selectedJob.title}</h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-gray-600">
                Complete this form to send your candidacy directly for review. Your submission will appear in My Applications after you send it.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="fullName">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    required
                    value={formValues.fullName}
                    onChange={(event) => handleChange("fullName", event.target.value)}
                    className="h-12 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="email">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formValues.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    className="h-12 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="phone">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    required
                    value={formValues.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    className="h-12 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                    placeholder="+234 800 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="location">
                    Current Location
                  </Label>
                  <Input
                    id="location"
                    required
                    value={formValues.location}
                    onChange={(event) => handleChange("location", event.target.value)}
                    className="h-12 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                    placeholder="City, Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="linkedinUrl">
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedinUrl"
                    value={formValues.linkedinUrl}
                    onChange={(event) => handleChange("linkedinUrl", event.target.value)}
                    className="h-12 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                    placeholder="https://linkedin.com/in/your-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="portfolioUrl">
                    Portfolio Link
                  </Label>
                  <Input
                    id="portfolioUrl"
                    value={formValues.portfolioUrl}
                    onChange={(event) => handleChange("portfolioUrl", event.target.value)}
                    className="h-12 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                    placeholder="https://your-portfolio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="availability">
                    Availability
                  </Label>
                  <Input
                    id="availability"
                    required
                    value={formValues.availability}
                    onChange={(event) => handleChange("availability", event.target.value)}
                    className="h-12 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                    placeholder="Immediate, 2 weeks, 1 month"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700" htmlFor="salaryExpectation">
                    Salary Expectation
                  </Label>
                  <Input
                    id="salaryExpectation"
                    value={formValues.salaryExpectation}
                    onChange={(event) => handleChange("salaryExpectation", event.target.value)}
                    className="h-12 rounded-xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                    placeholder="$50,000 - $60,000"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-orange-100 bg-orange-50/70 p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">CV for this application</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Choose an existing CV from your profile documents or upload a new version for this role.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    className={`block cursor-pointer rounded-2xl border p-4 transition-colors ${
                      cvSource === "profile"
                        ? "border-orange-400 bg-white shadow-sm"
                        : "border-orange-200 bg-white/80 hover:border-orange-300"
                    } ${profileCvDocuments.length === 0 ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="cvSource"
                        className="mt-1 h-4 w-4 border-orange-300 text-orange-600 focus:ring-orange-500"
                        checked={cvSource === "profile"}
                        onChange={() => profileCvDocuments.length > 0 && setCvSource("profile")}
                        disabled={profileCvDocuments.length === 0}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <FileText className="h-4 w-4 text-orange-500" />
                          Select CV from profile
                        </div>
                        <p className="text-sm text-slate-600">
                          Use a CV you already have saved under your profile documents.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {profileCvDocuments.length > 0 ? (
                        <>
                          <Select
                            value={selectedProfileCvId}
                            onValueChange={(value) => {
                              setCvSource("profile");
                              setSelectedProfileCvId(value);
                            }}
                          >
                            <SelectTrigger className="h-12 rounded-xl border-orange-200 bg-white text-left focus:ring-orange-400">
                              <SelectValue placeholder="Select CV from profile" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileCvDocuments.map((document) => (
                                <SelectItem key={document.id} value={document.id}>
                                  {document.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedProfileCv ? (
                            <div className="rounded-xl border border-orange-100 bg-white px-4 py-3">
                              <p className="font-semibold text-slate-900">{selectedProfileCv.name}</p>
                              <p className="text-sm text-slate-500">
                                {selectedProfileCv.size} • Uploaded {selectedProfileCv.date}
                              </p>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed border-orange-200 bg-white px-4 py-3 text-sm text-slate-500">
                          No CV found in profile documents yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 transition-colors ${
                      cvSource === "upload"
                        ? "border-orange-400 bg-white shadow-sm"
                        : "border-orange-200 bg-white/80 hover:border-orange-300"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="cvSource"
                        className="mt-1 h-4 w-4 border-orange-300 text-orange-600 focus:ring-orange-500"
                        checked={cvSource === "upload"}
                        onChange={() => setCvSource("upload")}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <Upload className="h-4 w-4 text-orange-500" />
                          Upload a new CV
                        </div>
                        <p className="text-sm text-slate-600">
                          Attach a tailored CV for this specific job application.
                        </p>
                      </div>
                    </label>

                    <label
                      htmlFor="cv-upload"
                      className="mt-4 block cursor-pointer rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/60 p-5 text-center transition-colors hover:border-orange-400 hover:bg-orange-50"
                    >
                      {uploadedCvFile ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{uploadedCvFile.name}</p>
                          <p className="text-sm text-slate-500">{(uploadedCvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <span className="inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700">
                            Click to replace file
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-orange-500" />
                          <p className="font-semibold text-slate-900">Upload your CV</p>
                          <p className="text-sm text-slate-500">PDF, DOC, or DOCX up to 5 MB</p>
                        </div>
                      )}
                    </label>
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setCvSource("upload");
                        setUploadedCvFile(file);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700" htmlFor="coverLetter">
                  Why are you a strong fit?
                </Label>
                <Textarea
                  id="coverLetter"
                  required
                  rows={7}
                  value={formValues.coverLetter}
                  onChange={(event) => handleChange("coverLetter", event.target.value)}
                  className="rounded-2xl border-orange-200 bg-white focus:border-orange-400 focus:ring-orange-400"
                  placeholder="Summarize your relevant experience, impact, and interest in this role."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white hover:from-orange-700 hover:to-orange-600"
                >
                  <Send className="h-4 w-4" />
                  Submit Candidacy
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(backPath)}
                  className="rounded-full border border-orange-200 bg-white px-6 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-xl font-bold text-white shadow-md">
                {selectedJob.initials}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{selectedJob.title}</h2>
              <p className="mt-1 font-semibold text-orange-600">{selectedJob.company}</p>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  {selectedJob.location}
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-orange-500" />
                  {selectedJob.jobType} · {selectedJob.workMode}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  {selectedJob.postedDays === 1 ? "1 day ago" : `${selectedJob.postedDays} days ago`}
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-500" />
                  {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax)}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {selectedJob.skills.map((skill) => (
                  <Badge key={skill} className="border border-orange-200 bg-orange-50 text-orange-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-6">
              <h3 className="mb-2 font-bold text-slate-900">Before you submit</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>Use the same email you monitor for recruiter follow-up.</li>
                <li>Choose a CV from your profile or upload a fresh version tailored to this role.</li>
                <li>Make your cover note specific to the role instead of sending a generic summary.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </TalentLayout>
  );
}