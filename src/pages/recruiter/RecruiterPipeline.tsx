import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { useState } from "react";
import {
  Users,
  Search,
  MapPin,
  Calendar,
  Star,
  Sparkles,
  Mail,
  Phone,
  FileText,
  Linkedin,
  Github,
  Globe,
  Building,
  GripVertical,
  ChevronRight,
  UserCheck,
  UserX,
  Archive,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const jobs = [
  { id: "1", title: "Senior Frontend Developer", department: "Engineering" },
  { id: "2", title: "Product Manager", department: "Product" },
  { id: "3", title: "UX Designer", department: "Design" },
  { id: "4", title: "DevOps Engineer", department: "Engineering" },
];

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  appliedDate: string;
  matchScore: number;
  status: string;
  jobId: string;
  avatar: string;
  experience: string;
  skills: string[];
  currentCompany: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  services: string[];
  technicalReview?: string;
  leadershipReview?: string;
}

const initialApplications: Application[] = [
  {
    id: "1",
    name: "Sara Bensalem",
    email: "sara.bensalem@email.com",
    phone: "0666112233",
    location: "Algiers",
    appliedDate: "2024-01-15",
    matchScore: 78,
    status: "pending",
    jobId: "1",
    avatar: "SB",
    experience: "5 years",
    skills: ["React", "TypeScript", "Node.js"],
    currentCompany: "Tech Solutions",
    services: ["Frontend Development", "Code Review"],
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+1 (555) 234-5678",
    location: "New York, NY",
    appliedDate: "2024-01-14",
    matchScore: 88,
    status: "ta-interview",
    jobId: "1",
    avatar: "MC",
    experience: "4 years",
    skills: ["React", "JavaScript", "CSS"],
    currentCompany: "Digital Agency",
    linkedin: "linkedin.com/in/mchen",
    services: ["UI Development"],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@email.com",
    phone: "+1 (555) 345-6789",
    location: "Austin, TX",
    appliedDate: "2024-01-13",
    matchScore: 92,
    status: "technical-interview",
    jobId: "1",
    avatar: "ER",
    experience: "6 years",
    skills: ["React", "Vue", "TypeScript"],
    currentCompany: "StartupXYZ",
    linkedin: "linkedin.com/in/emilyrod",
    github: "github.com/emilyrod",
    services: ["Full Stack Development", "Consulting"],
    technicalReview: "Strong problem-solving skills. Excellent knowledge of React patterns.",
  },
  {
    id: "4",
    name: "David Kim",
    email: "david.kim@email.com",
    phone: "+1 (555) 456-7890",
    location: "Seattle, WA",
    appliedDate: "2024-01-12",
    matchScore: 85,
    status: "leadership-interview",
    jobId: "1",
    avatar: "DK",
    experience: "7 years",
    skills: ["React", "Python", "AWS"],
    currentCompany: "CloudTech Inc",
    linkedin: "linkedin.com/in/davidkim",
    github: "github.com/dkim",
    portfolio: "davidkim.dev",
    services: ["Architecture Design", "Team Lead"],
    technicalReview: "Excellent technical depth. Recommended for leadership round.",
  },
  {
    id: "5",
    name: "Amanda Foster",
    email: "a.foster@email.com",
    phone: "+1 (555) 567-8901",
    location: "Chicago, IL",
    appliedDate: "2024-01-11",
    matchScore: 91,
    status: "offer",
    jobId: "1",
    avatar: "AF",
    experience: "5 years",
    skills: ["React", "GraphQL", "Node.js"],
    currentCompany: "InnovateCo",
    linkedin: "linkedin.com/in/afoster",
    services: ["Backend Development"],
    technicalReview: "Outstanding performance in technical interview.",
    leadershipReview: "Great cultural fit. Strong communication skills.",
  },
  {
    id: "6",
    name: "James Wilson",
    email: "j.wilson@email.com",
    phone: "+1 (555) 678-9012",
    location: "Denver, CO",
    appliedDate: "2024-01-10",
    matchScore: 72,
    status: "maybe",
    jobId: "1",
    avatar: "JW",
    experience: "3 years",
    skills: ["JavaScript", "HTML", "CSS"],
    currentCompany: "WebDev Studio",
    services: ["Frontend Development"],
  },
  {
    id: "7",
    name: "Lisa Thompson",
    email: "lisa.t@email.com",
    phone: "+1 (555) 789-0123",
    location: "Boston, MA",
    appliedDate: "2024-01-09",
    matchScore: 45,
    status: "rejected",
    jobId: "1",
    avatar: "LT",
    experience: "1 year",
    skills: ["HTML", "CSS"],
    currentCompany: "Freelance",
    services: ["Web Design"],
  },
  {
    id: "8",
    name: "Robert Martinez",
    email: "r.martinez@email.com",
    phone: "+1 (555) 890-1234",
    location: "Miami, FL",
    appliedDate: "2024-01-08",
    matchScore: 94,
    status: "hired",
    jobId: "1",
    avatar: "RM",
    experience: "8 years",
    skills: ["React", "TypeScript", "AWS", "Docker"],
    currentCompany: "Enterprise Corp",
    linkedin: "linkedin.com/in/rmartinez",
    github: "github.com/rmartinez",
    portfolio: "robertm.dev",
    services: ["Full Stack Development", "DevOps", "Mentoring"],
    technicalReview: "Exceptional candidate. Top performer.",
    leadershipReview: "Perfect fit for the team. Highly recommended.",
  },
];

const filterTabs = [
  { id: "all", label: "All Applications" },
  { id: "pipeline", label: "Hiring Pipeline" },
  { id: "maybe", label: "Maybe" },
  { id: "rejected", label: "Rejected" },
  { id: "archived", label: "Archived" },
];

const pipelineStages = [
  { id: "to-contact", label: "To Contact" },
  { id: "ta-interview", label: "Talent Acquisition Interview" },
  { id: "technical-interview", label: "Technical Interview" },
  { id: "leadership-interview", label: "Leadership Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected-offer", label: "Rejected Offers" },
  { id: "hired", label: "Hired" },
];

const moveOptions = [
  { id: "to-contact", label: "To Contact", description: "Move to hiring pipeline", icon: UserCheck },
  { id: "maybe", label: "Maybe", description: "Keep for consideration", icon: Clock },
  { id: "rejected", label: "Rejected", description: "Candidate refused or was rejected", icon: UserX },
  { id: "archived", label: "Archive", description: "Remove from active view", icon: Archive },
];

export default function EmployerPipeline() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [selectedJob, setSelectedJob] = useState("1");
  const [activeTab, setActiveTab] = useState("pipeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [draggedCandidate, setDraggedCandidate] = useState<Application | null>(null);

  // When on "pipeline" tab, show kanban view. Otherwise show list view.
  const viewMode = activeTab === "pipeline" ? "pipeline" : "list";

  const getFilteredApplications = () => {
    return applications.filter((app) => {
      if (app.jobId !== selectedJob) return false;
      if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeTab === "all") return true;
      if (activeTab === "pipeline") return ["to-contact", "ta-interview", "technical-interview", "leadership-interview", "offer", "hired"].includes(app.status);
      if (activeTab === "maybe") return app.status === "maybe";
      if (activeTab === "rejected") return app.status === "rejected";
      if (activeTab === "archived") return app.status === "archived";
      return true;
    });
  };

  const filteredApplications = getFilteredApplications();

  const getTabCount = (tabId: string) => {
    return applications.filter((app) => {
      if (app.jobId !== selectedJob) return false;
      if (tabId === "all") return true;
      if (tabId === "pipeline") return ["to-contact", "ta-interview", "technical-interview", "leadership-interview", "offer", "hired"].includes(app.status);
      if (tabId === "maybe") return app.status === "maybe";
      if (tabId === "rejected") return app.status === "rejected";
      if (tabId === "archived") return app.status === "archived";
      return true;
    }).length;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-orange-600 bg-orange-50 border-orange-200";
    if (score >= 60) return "text-orange-500 bg-orange-50/50 border-orange-100";
    return "text-orange-400 bg-orange-50/30 border-orange-100";
  };

  const getStatusLabel = (status: string) => {
    if (status === "pending") return "Pending";
    const stage = pipelineStages.find((s) => s.id === status);
    if (stage) return stage.label;
    if (status === "maybe") return "Maybe";
    if (status === "rejected") return "Rejected";
    if (status === "archived") return "Archived";
    return status;
  };

  const handleMoveCandidate = (newStatus: string) => {
    if (selectedCandidate) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedCandidate.id ? { ...app, status: newStatus } : app
        )
      );
      setShowMoveDialog(false);
      setSelectedCandidate(null);
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

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedCandidate) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === draggedCandidate.id ? { ...app, status: stageId } : app
        )
      );
      setDraggedCandidate(null);
    }
  };

  const getApplicationsByStage = (stageId: string) => {
    return applications.filter((app) => app.jobId === selectedJob && app.status === stageId);
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
              <div className="w-full sm:w-64">
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger className="rounded-full border-orange-200 bg-orange-50/60 focus:ring-orange-400 focus:border-orange-400">
                    <SelectValue placeholder="Select a job" />
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
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full border-orange-200 bg-orange-50/50 focus:ring-orange-400 focus:border-orange-400"
                />
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

        {/* List View */}
        {viewMode === "list" && (
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
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedCandidate(app)}
                  className="bg-white rounded-3xl border border-orange-100 shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-1"
                >
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Candidate Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {app.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-900">{app.name}</h3>
                          <Badge className="bg-orange-100 text-orange-600 border-orange-200">
                            {getStatusLabel(app.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {app.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {app.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Applied {new Date(app.appliedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {app.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className={`px-4 py-2 rounded-2xl border ${getScoreColor(app.matchScore)} flex items-center gap-2`}>
                      <Star className="w-4 h-4" />
                      <span className="font-bold">{app.matchScore}%</span>
                      <span className="text-sm">Match</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pipeline View - Drag and Drop */}
        {viewMode === "pipeline" && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {pipelineStages.map((stage) => {
                const stageApplications = getApplicationsByStage(stage.id);
                return (
                  <div
                    key={stage.id}
                    className="w-80 flex-shrink-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
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
                        stageApplications.map((app) => (
                          <div
                            key={app.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, app)}
                            onClick={() => setSelectedCandidate(app)}
                            className="bg-white rounded-xl border border-orange-100 shadow-sm p-4 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <GripVertical className="w-4 h-4 text-orange-300" />
                              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                {app.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 truncate">{app.name}</h4>
                                <p className="text-xs text-slate-500 truncate">{app.email}</p>
                              </div>
                            </div>

                            {/* Show review if exists */}
                            {stage.id === "technical-interview" && (
                              <div className="mb-3 p-2 bg-orange-50 rounded-lg">
                                <p className="text-xs font-semibold text-orange-600 mb-1">Technical Interviewer Review:</p>
                                <p className="text-xs text-slate-600">
                                  {app.technicalReview || "No review yet"}
                                </p>
                              </div>
                            )}

                            {stage.id === "leadership-interview" && (
                              <div className="mb-3 p-2 bg-orange-50 rounded-lg">
                                <p className="text-xs font-semibold text-orange-600 mb-1">Leadership Review:</p>
                                <p className="text-xs text-slate-600">
                                  {app.leadershipReview || app.technicalReview || "No review yet"}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {app.location}
                              </span>
                              <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(app.matchScore)}`}>
                                {app.matchScore}%
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Candidate Details Dialog */}
      <Dialog open={!!selectedCandidate && !showMoveDialog} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {selectedCandidate.name}'s Application
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Pipeline Status & Move */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <div>
                    <p className="text-sm text-slate-600">Pipeline:</p>
                    <p className="font-bold text-orange-600">{getStatusLabel(selectedCandidate.status)}</p>
                  </div>
                  <Button
                    onClick={() => setShowMoveDialog(true)}
                    className="bg-orange-600 text-white rounded-full hover:bg-orange-700"
                  >
                    Move to...
                  </Button>
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

                {/* Professional Links */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Professional Links</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">LinkedIn</p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Linkedin className="w-4 h-4 text-orange-500" />
                        {selectedCandidate.linkedin || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">GitHub</p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Github className="w-4 h-4 text-orange-500" />
                        {selectedCandidate.github || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Portfolio</p>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-orange-500" />
                        {selectedCandidate.portfolio || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interview History */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Interview History</h3>
                  {selectedCandidate.technicalReview || selectedCandidate.leadershipReview ? (
                    <div className="space-y-2">
                      {selectedCandidate.technicalReview && (
                        <div className="p-3 bg-orange-50 rounded-xl">
                          <p className="text-xs font-semibold text-orange-600">Technical Interview</p>
                          <p className="text-sm text-slate-700">{selectedCandidate.technicalReview}</p>
                        </div>
                      )}
                      {selectedCandidate.leadershipReview && (
                        <div className="p-3 bg-orange-50 rounded-xl">
                          <p className="text-xs font-semibold text-orange-600">Leadership Interview</p>
                          <p className="text-sm text-slate-700">{selectedCandidate.leadershipReview}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No interviews scheduled yet</p>
                  )}
                </div>

                {/* Services Offered */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-600">
                      Services Offered ({selectedCandidate.services.length})
                    </h3>
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                      View All Services
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.services.map((service) => (
                      <span
                        key={service}
                        className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resume */}
                <div className="p-4 bg-white rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3">Resume</h3>
                  <Button variant="outline" className="rounded-full border-orange-200 text-orange-600 hover:bg-orange-50">
                    <FileText className="w-4 h-4 mr-2" />
                    View CV
                  </Button>
                </div>
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
            <p className="text-sm text-slate-600 mt-1">
              Select the new status for this candidate
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {moveOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleMoveCandidate(option.id)}
                  className="w-full p-4 bg-white rounded-2xl border border-orange-100 hover:border-orange-300 hover:bg-orange-50 transition-all text-left flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{option.label}</h4>
                    <p className="text-sm text-slate-500">{option.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </RecruiterLayout>
  );
}

