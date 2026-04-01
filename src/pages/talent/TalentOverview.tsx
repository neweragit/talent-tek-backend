import { useEffect, useMemo, useRef, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import CvViewer from "@/components/CvViewer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bookmark,
  Briefcase,
  CalendarDays,
  Building2,
  ArrowLeft,
  Clock,
  Eye,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  MousePointerClick,
  RefreshCw,
  Route,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Send,
  Trash2,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

type JobType = "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
type WorkMode = "Remote" | "Hybrid" | "On-site";
type ExperienceLevel = "Entry" | "Mid" | "Senior" | "Lead";
type CompanySize = "Startup" | "SME" | "Enterprise";

type Job = {
  id: number;
  initials: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  jobType: JobType;
  workMode: WorkMode;
  experience: ExperienceLevel;
  companySize: CompanySize;
  postedDays: number;
  salaryMin: number;
  salaryMax: number;
  distanceKm: number;
  visaSupport: boolean;
  skills: string[];
  summary: string;
};

type TalentProfileSnapshot = {
  firstName: string;
  title: string;
  city: string;
  country: string;
  experience: string;
  skills: string[];
};

const stats = [
  { label: "Applications", value: 12, desc: "Active applications", icon: Briefcase },
  { label: "Interviews", value: 3, desc: "Upcoming interviews", icon: MousePointerClick },
  { label: "Profile Views", value: 45, desc: "This month", icon: Eye },
  { label: "Response Rate", value: "68%", desc: "From employers", icon: TrendingUp },
];

const jobs: Job[] = [
  {
    id: 1,
    initials: "MP",
    title: "Product Designer",
    company: "Moniepoint",
    location: "Lagos, Nigeria",
    industry: "Fintech",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "Mid",
    companySize: "Enterprise",
    postedDays: 2,
    salaryMin: 30000,
    salaryMax: 38000,
    distanceKm: 12,
    visaSupport: false,
    skills: ["Figma", "Design Systems", "UX Research", "Prototyping"],
    summary: "Design end-to-end user journeys for payments, dashboards, and merchant onboarding across high-traffic financial products.",
  },
  {
    id: 2,
    initials: "AN",
    title: "Frontend Engineer",
    company: "Andela",
    location: "Kigali, Rwanda",
    industry: "Technology",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "Mid",
    companySize: "Enterprise",
    postedDays: 5,
    salaryMin: 55000,
    salaryMax: 62000,
    distanceKm: 0,
    visaSupport: true,
    skills: ["React", "TypeScript", "Tailwind", "Testing"],
    summary: "Build responsive web experiences for distributed engineering teams, with strong ownership over component quality and performance.",
  },
  {
    id: 3,
    initials: "FW",
    title: "Growth Marketing Associate",
    company: "Flutterwave",
    location: "Lagos, Nigeria",
    industry: "Fintech",
    jobType: "Full-time",
    workMode: "On-site",
    experience: "Entry",
    companySize: "Enterprise",
    postedDays: 1,
    salaryMin: 18000,
    salaryMax: 24000,
    distanceKm: 8,
    visaSupport: false,
    skills: ["Campaigns", "Content", "Analytics", "CRM"],
    summary: "Support acquisition campaigns, measure funnel performance, and help expand product adoption across regional growth initiatives.",
  },
  {
    id: 4,
    initials: "PS",
    title: "Customer Success Specialist",
    company: "Paystack",
    location: "Accra, Ghana",
    industry: "SaaS",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "Entry",
    companySize: "Enterprise",
    postedDays: 7,
    salaryMin: 22000,
    salaryMax: 29000,
    distanceKm: 0,
    visaSupport: true,
    skills: ["Customer Success", "Communication", "CRM", "Onboarding"],
    summary: "Own merchant onboarding and retention workflows while delivering fast, precise support across strategic accounts.",
  },
  {
    id: 5,
    initials: "KL",
    title: "Backend Engineer",
    company: "Kuda",
    location: "Nairobi, Kenya",
    industry: "Banking",
    jobType: "Contract",
    workMode: "Hybrid",
    experience: "Senior",
    companySize: "SME",
    postedDays: 4,
    salaryMin: 65000,
    salaryMax: 82000,
    distanceKm: 18,
    visaSupport: false,
    skills: ["Node.js", "PostgreSQL", "APIs", "AWS"],
    summary: "Develop resilient backend services for transaction-heavy banking experiences with strong attention to reliability and security.",
  },
  {
    id: 6,
    initials: "TK",
    title: "Talent Operations Analyst",
    company: "Talentek",
    location: "Remote, Africa",
    industry: "HR Tech",
    jobType: "Part-time",
    workMode: "Remote",
    experience: "Entry",
    companySize: "Startup",
    postedDays: 3,
    salaryMin: 12000,
    salaryMax: 18000,
    distanceKm: 0,
    visaSupport: false,
    skills: ["Operations", "Excel", "Recruiting", "Documentation"],
    summary: "Support interviewer coordination, candidate operations, and hiring workflow reporting across the platform.",
  },
  {
    id: 7,
    initials: "MT",
    title: "Data Analyst",
    company: "Mest Africa",
    location: "Cape Town, South Africa",
    industry: "Education",
    jobType: "Internship",
    workMode: "Hybrid",
    experience: "Entry",
    companySize: "SME",
    postedDays: 10,
    salaryMin: 10000,
    salaryMax: 14000,
    distanceKm: 20,
    visaSupport: false,
    skills: ["SQL", "Dashboards", "Excel", "Insights"],
    summary: "Translate learning and startup program data into clear insights that help teams improve outcomes and reporting quality.",
  },
  {
    id: 8,
    initials: "IN",
    title: "Engineering Manager",
    company: "Interswitch",
    location: "Abuja, Nigeria",
    industry: "Payments",
    jobType: "Full-time",
    workMode: "On-site",
    experience: "Lead",
    companySize: "Enterprise",
    postedDays: 14,
    salaryMin: 90000,
    salaryMax: 110000,
    distanceKm: 35,
    visaSupport: false,
    skills: ["Leadership", "System Design", "Mentoring", "Delivery"],
    summary: "Lead multi-squad engineering delivery, drive architecture decisions, and coach senior engineers across product teams.",
  },
];

const featuredSkills = [
  "React",
  "TypeScript",
  "Node.js",
  "Figma",
  "SQL",
  "Customer Success",
  "Content",
  "Analytics",
  "Tailwind",
  "AWS",
  "UX Research",
  "Leadership",
];

const manualSkillLibrary = [
  "React",
  "TypeScript",
  "JavaScript",
  "Next.js",
  "Vue.js",
  "Angular",
  "Svelte",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Bootstrap",
  "Material UI",
  "Node.js",
  "Express.js",
  "NestJS",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "Java",
  "Spring Boot",
  "C#",
  ".NET",
  "PHP",
  "Laravel",
  "Ruby",
  "Ruby on Rails",
  "Go",
  "Rust",
  "Kotlin",
  "Swift",
  "React Native",
  "Flutter",
  "Android",
  "iOS",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Firebase",
  "Supabase",
  "GraphQL",
  "REST APIs",
  "Microservices",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "CI/CD",
  "GitHub Actions",
  "Jenkins",
  "Terraform",
  "Linux",
  "Bash",
  "Testing",
  "Jest",
  "Cypress",
  "Playwright",
  "Selenium",
  "QA Automation",
  "Manual Testing",
  "Figma",
  "UI Design",
  "UX Research",
  "Design Systems",
  "Prototyping",
  "Adobe XD",
  "Photoshop",
  "Illustrator",
  "Product Design",
  "Product Management",
  "Agile",
  "Scrum",
  "Project Management",
  "Business Analysis",
  "Data Analysis",
  "Excel",
  "Power BI",
  "Tableau",
  "Looker",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "Computer Vision",
  "Prompt Engineering",
  "Data Engineering",
  "ETL",
  "Apache Spark",
  "Hadoop",
  "Cybersecurity",
  "Network Security",
  "Penetration Testing",
  "DevOps",
  "Site Reliability Engineering",
  "System Design",
  "Leadership",
  "Mentoring",
  "Communication",
  "Customer Success",
  "CRM",
  "Sales",
  "Digital Marketing",
  "SEO",
  "SEM",
  "Content Writing",
  "Copywriting",
  "Social Media",
  "Email Marketing",
  "Analytics",
  "Recruiting",
  "Talent Acquisition",
  "Human Resources",
  "Payroll",
  "Operations",
  "Documentation",
  "Accounting",
  "Financial Modeling",
  "Supply Chain",
  "Logistics",
  "Procurement",
  "Healthcare Operations",
  "Legal Research",
  "Translation",
  "Arabic",
  "French",
  "English",
  "Public Speaking",
  "Negotiation",
  "Problem Solving",
  "Time Management",
  "Stakeholder Management",
  "Onboarding",
  "Technical Support",
  "Help Desk",
  "Cloud Security",
  "Data Visualization",
  "API Integration",
  "No-Code",
  "Bubble",
  "Webflow",
];

const fallbackTalentProfile: TalentProfileSnapshot = {
  firstName: "Sarah",
  title: "Senior React Developer",
  city: "New York",
  country: "United States",
  experience: "5+ years",
  skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker"],
};

const getTalentProfileSnapshot = (): TalentProfileSnapshot => {
  const storedProfile = localStorage.getItem("talentProfile");
  if (!storedProfile) {
    return fallbackTalentProfile;
  }

  try {
    const parsedProfile = JSON.parse(storedProfile) as Partial<TalentProfileSnapshot>;
    return {
      ...fallbackTalentProfile,
      ...parsedProfile,
      skills: Array.isArray(parsedProfile.skills) ? parsedProfile.skills : fallbackTalentProfile.skills,
    };
  } catch {
    return fallbackTalentProfile;
  }
};

const inferExperienceFromProfile = (experienceText: string): "all" | ExperienceLevel => {
  const normalizedExperience = experienceText.toLowerCase();

  if (normalizedExperience.includes("lead") || normalizedExperience.includes("10")) {
    return "Lead";
  }

  if (
    normalizedExperience.includes("senior") ||
    normalizedExperience.includes("5") ||
    normalizedExperience.includes("6") ||
    normalizedExperience.includes("7") ||
    normalizedExperience.includes("8") ||
    normalizedExperience.includes("9")
  ) {
    return "Senior";
  }

  if (normalizedExperience.includes("mid") || normalizedExperience.includes("3") || normalizedExperience.includes("4")) {
    return "Mid";
  }

  if (
    normalizedExperience.includes("entry") ||
    normalizedExperience.includes("junior") ||
    normalizedExperience.includes("1") ||
    normalizedExperience.includes("2")
  ) {
    return "Entry";
  }

  return "all";
};

const matchesSalaryBand = (job: Job, salaryBand: string) => {
  if (salaryBand === "all") {
    return true;
  }

  if (salaryBand === "under-20k") {
    return job.salaryMax <= 20000;
  }

  if (salaryBand === "20k-40k") {
    return job.salaryMin < 40000 && job.salaryMax >= 20000;
  }

  if (salaryBand === "40k-60k") {
    return job.salaryMin < 60000 && job.salaryMax >= 40000;
  }

  if (salaryBand === "60k-80k") {
    return job.salaryMin < 80000 && job.salaryMax >= 60000;
  }

  return job.salaryMax >= 80000;
};

const matchesDistance = (job: Job, distanceFilter: string) => {
  if (distanceFilter === "all") {
    return true;
  }

  if (distanceFilter === "remote-only") {
    return job.workMode === "Remote";
  }

  if (distanceFilter === "under-10") {
    return job.distanceKm <= 10;
  }

  if (distanceFilter === "under-25") {
    return job.distanceKm <= 25;
  }

  return job.distanceKm <= 50;
};

function TalentOverviewLegacy() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [postedFilter, setPostedFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("all");
  const [companySizeFilter, setCompanySizeFilter] = useState("all");
  const [visaFilter, setVisaFilter] = useState("all");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [manualSkillFilterValue, setManualSkillFilterValue] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isAiMatching, setIsAiMatching] = useState(false);
  const profile = useMemo(() => getTalentProfileSnapshot(), []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.company.toLowerCase().includes(normalizedSearch) ||
        job.skills.some((skill) => skill.toLowerCase().includes(normalizedSearch));

      const matchesLocation = locationFilter === "all" || job.location === locationFilter;
      const matchesJobType = jobTypeFilter === "all" || job.jobType === jobTypeFilter;
      const matchesWorkMode = workModeFilter === "all" || job.workMode === workModeFilter;
      const matchesExperience = experienceFilter === "all" || job.experience === experienceFilter;
      const matchesCompanySize = companySizeFilter === "all" || job.companySize === companySizeFilter;
      const matchesVisa =
        visaFilter === "all" ||
        (visaFilter === "yes" && job.visaSupport) ||
        (visaFilter === "no" && !job.visaSupport);
      const matchesPosted = postedFilter === "all" || job.postedDays <= Number(postedFilter);
      const matchesSkills = selectedSkills.every((skill) => job.skills.includes(skill));

      return (
        matchesSearch &&
        matchesLocation &&
        matchesJobType &&
        matchesWorkMode &&
        matchesExperience &&
        matchesCompanySize &&
        matchesVisa &&
        matchesPosted &&
        matchesSkills &&
        matchesDistance(job, distanceFilter)
      );
    });
  }, [
    companySizeFilter,
    distanceFilter,
    experienceFilter,
    jobTypeFilter,
    locationFilter,
    postedFilter,
    searchQuery,
    selectedSkills,
    visaFilter,
    workModeFilter,
  ]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((currentSkills) =>
      currentSkills.includes(skill)
        ? currentSkills.filter((currentSkill) => currentSkill !== skill)
        : [...currentSkills, skill],
    );
  };

  const addManualSkill = (skill: string) => {
    setManualSkillFilterValue("");
    setSelectedSkills((currentSkills) =>
      currentSkills.includes(skill) ? currentSkills : [...currentSkills, skill],
    );
  };

  const visibleSkillOptions = useMemo(() => {
    const extraSelectedSkills = selectedSkills.filter((skill) => !featuredSkills.includes(skill));
    return [...featuredSkills, ...extraSelectedSkills];
  }, [selectedSkills]);

  const resetFilters = () => {
    setSearchQuery("");
    setLocationFilter("all");
    setJobTypeFilter("all");
    setWorkModeFilter("all");
    setExperienceFilter("all");
    setPostedFilter("all");
    setDistanceFilter("all");
    setCompanySizeFilter("all");
    setVisaFilter("all");
    setSelectedSkills([]);
    setManualSkillFilterValue("");
  };

  const runAiMatch = () => {
    const normalizedProfileSkills = profile.skills.map((skill) => skill.toLowerCase());
    const matchedFeaturedSkills = featuredSkills.filter((skill) =>
      normalizedProfileSkills.some(
        (profileSkill) => profileSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(profileSkill),
      ),
    );

    setSearchQuery(profile.title);
    setExperienceFilter(inferExperienceFromProfile(profile.experience));
    setSelectedSkills(matchedFeaturedSkills.slice(0, 5));
    setPostedFilter("14");

    const profileLocation = `${profile.city}, ${profile.country}`;
    const locationExistsInJobs = jobs.some((job) => job.location === profileLocation);
    setLocationFilter(locationExistsInJobs ? profileLocation : "all");
  };

  const handleAiMatch = () => {
    setIsAiMatching(true);
    window.setTimeout(() => {
      runAiMatch();
      setIsAiMatching(false);
    }, 1900);
  };

  const jobsResultsLabel =
    filteredJobs.length === jobs.length
      ? `Showing all ${jobs.length} open roles`
      : `Showing ${filteredJobs.length} of ${jobs.length} open roles`;

  return (
    <TalentLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Talent Overview
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Hello, {profile.firstName}ðŸ‘‹
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Track your job search progress, discover fresh platform roles, and use the same clean application-style surfaces across your dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                  {jobsResultsLabel}
                </div>
                <Button
                  onClick={handleAiMatch}
                  className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-5 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
                >
                  <Sparkles className="h-4 w-4" />
                  Get Matched with AI
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</div>
                  <p className="mt-1 text-sm text-slate-600">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All wilayas</SelectItem>
              <SelectItem value="Adrar">Adrar</SelectItem>
              <SelectItem value="Algiers">Algiers</SelectItem>
              <SelectItem value="Annaba">Annaba</SelectItem>
              <SelectItem value="Batna">Batna</SelectItem>
              <SelectItem value="Bejaia">Bejaia</SelectItem>
              <SelectItem value="Blida">Blida</SelectItem>
              <SelectItem value="Constantine">Constantine</SelectItem>
              <SelectItem value="Djelfa">Djelfa</SelectItem>
              <SelectItem value="Oran">Oran</SelectItem>
              <SelectItem value="Ouargla">Ouargla</SelectItem>
              <SelectItem value="Setif">Setif</SelectItem>
              <SelectItem value="Sidi Bel Abbes">Sidi Bel Abbes</SelectItem>
              <SelectItem value="Tizi Ouzou">Tizi Ouzou</SelectItem>
              <SelectItem value="Tlemcen">Tlemcen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="Job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All job types</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Select value={workModeFilter} onValueChange={setWorkModeFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="Work mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any work mode</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="On-site">On-site</SelectItem>
            </SelectContent>
          </Select>

          <Select value={experienceFilter} onValueChange={setExperienceFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="Experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="Entry">Entry</SelectItem>
              <SelectItem value="Mid">Mid</SelectItem>
              <SelectItem value="Senior">Senior</SelectItem>
              <SelectItem value="Lead">Lead</SelectItem>
            </SelectContent>
          </Select>

          <Select value={postedFilter} onValueChange={setPostedFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="Date posted" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="3">Last 3 days</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-lg md:flex-1 md:min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search role, company, or skill..."
              className="h-12 rounded-2xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="flex flex-nowrap gap-3 md:ml-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="whitespace-nowrap rounded-full border-orange-600 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset Filters
              </span>
            </Button>
            <Button
              type="button"
              onClick={() => setShowAdvancedFilters((currentState) => !currentState)}
              className="whitespace-nowrap rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {showAdvancedFilters ? "Hide Advanced" : "Show Advanced"}
              </span>
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="mb-8 space-y-4 rounded-3xl border border-orange-100 bg-white p-5 shadow-lg">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
                  <SelectValue placeholder="Distance from home" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any distance</SelectItem>
                  <SelectItem value="remote-only">Remote only</SelectItem>
                  <SelectItem value="under-10">Under 10 km</SelectItem>
                  <SelectItem value="under-25">Under 25 km</SelectItem>
                  <SelectItem value="under-50">Under 50 km</SelectItem>
                </SelectContent>
              </Select>

              <Select value={companySizeFilter} onValueChange={setCompanySizeFilter}>
                <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
                  <SelectValue placeholder="Company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All company sizes</SelectItem>
                  <SelectItem value="Startup">Startup</SelectItem>
                  <SelectItem value="SME">SME</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>

              <Select value={visaFilter} onValueChange={setVisaFilter}>
                <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
                  <SelectValue placeholder="Visa support" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Visa support: any</SelectItem>
                  <SelectItem value="yes">Offers visa support</SelectItem>
                  <SelectItem value="no">No visa support</SelectItem>
                </SelectContent>
              </Select>

              <Select value={manualSkillFilterValue} onValueChange={addManualSkill}>
                <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
                  <SelectValue placeholder="Manual skill" />
                </SelectTrigger>
                <SelectContent>
	                  {manualSkillLibrary.map((skill, index) => (
	                    <SelectItem key={`${skill}-${index}`} value={skill}>
	                      {skill}
	                    </SelectItem>
	                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-3xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Route className="h-4 w-4 text-orange-600" />
                Skill match
              </div>
              <div className="flex flex-wrap gap-2">
	                {visibleSkillOptions.map((skill, index) => {
	                  const isSelected = selectedSkills.includes(skill);
	                  return (
	                    <button
	                      key={`${skill}-${index}`}
	                      type="button"
	                      onClick={() => toggleSkill(skill)}
	                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-orange-500 bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                          : "border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {filteredJobs.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                      {job.initials}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold leading-tight text-slate-900">{job.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-orange-600">{job.company}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Posted {job.postedDays === 1 ? "1 day" : `${job.postedDays} days`} ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-full p-2 text-orange-600 hover:bg-orange-50" aria-label="Share job">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-full p-2 text-orange-600 hover:bg-orange-50" aria-label="Save job">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mb-5 text-sm leading-6 text-gray-600">{job.summary}</p>

                <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-600" />{job.location}</div>
                  <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-orange-600" />{job.jobType} · {job.workMode}</div>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-orange-600" />{job.companySize}</div>
                  <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-orange-600" />{job.experience}</div>
                  <div className="flex items-center gap-2"><Route className="h-4 w-4 text-orange-600" />{job.workMode === "Remote" ? "No commute required" : `${job.distanceKm} km from home`}</div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{job.visaSupport ? "Visa Support" : "No Visa Support"}</Badge>
	                  {job.skills.map((skill, index) => (
	                    <Badge key={`${skill}-${index}`} variant="outline" className="border-orange-200 bg-white text-orange-700">
	                      {skill}
	                    </Badge>
	                  ))}
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-orange-100 pt-5">
                  <div className="text-xs leading-6 text-gray-500">
                    Strong fit for candidates looking for {job.workMode.toLowerCase()} {job.jobType.toLowerCase()} roles.
                  </div>
                  <Button
                    onClick={() => navigate(`/talent/job/${job.id}`, { state: { job, from: "/talent/overview" } })}
                    className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Job
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Building2 className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">No jobs match these filters</h3>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Try widening the location, salary, distance, or skill filters. Right now your search is very specific and the platform is only showing exact matches.
            </p>
            <Button
              onClick={resetFilters}
              className="mt-6 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
            >
              <RefreshCw className="h-4 w-4" />
              Clear All Filters
            </Button>
          </div>
        )}

        {isAiMatching && (
          <div className="fixed inset-y-0 left-0 right-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4 xl:left-64">
            <div className="w-full max-w-md rounded-3xl border border-orange-200 bg-white/95 shadow-2xl p-8 text-center">
              <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                <Sparkles className="h-3.5 w-3.5" />
                AI Job Match
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">We're matching you with jobs</h3>
              <p className="text-sm text-gray-600">
                Analyzing your profile title, skills, location, and experience to surface the best-fit opportunities from all employers.
              </p>
            </div>
          </div>
        )}
      </div>
    </TalentLayout>
  );
}

type DbJobStatus = "published" | "unpublished" | "archived";

type TalentSnapshot = {
  talentId: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  resumeUrls: [string, string, string];
};

type TalentJob = {
  id: string;
  title: string;
  profession: string;
  description: string;
  location: string;
  workplace: string;
  employmentType: string;
  contractType: string;
  jobLevel: string;
  experienceLevel: string;
  skillsRequired: string[];
  whatYouWillDo: string[];
  requirements: string[];
  positionsAvailable: number;
  createdAt: string;
  status: DbJobStatus;
  companyName: string;
  companyLogoUrl?: string;
  industry: string;
  companySize: string;
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

const getStoragePathFromPublicUrl = (url: string) => {
  const match = url.match(/\/resumes\/(.+)$/);
  if (!match) return null;
  return `resumes/${match[1]}`;
};

const toSafeEmailFolder = (email: string) =>
  email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "user";

const normalizeTextArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    // Handles "a,b,c" and "{a,b,c}" formats.
    const raw = trimmed.startsWith("{") && trimmed.endsWith("}") ? trimmed.slice(1, -1) : trimmed;
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const formatPostedAgo = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays <= 0) return "Posted today";
  if (diffDays === 1) return "Posted 1 day ago";
  return `Posted ${diffDays} days ago`;
};

const isAllowedCvFile = (file: File) => {
  const maxSizeBytes = 5 * 1024 * 1024;
  const name = file.name.toLowerCase();
  const okExt = name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
  return okExt && file.size <= maxSizeBytes;
};

export default function TalentOverview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

	  const [viewMode, setViewMode] = useState<"list" | "details" | "apply">("list");
	  const [loading, setLoading] = useState(true);
	  const [loadingApply, setLoadingApply] = useState(false);
	  const [jobs, setJobs] = useState<TalentJob[]>([]);
	  const [linkedJob, setLinkedJob] = useState<TalentJob | null>(null);
	  const [searchQuery, setSearchQuery] = useState("");
	  const [showFilters, setShowFilters] = useState(false);
	  const [locationFilter, setLocationFilter] = useState("all");
	  const [employmentFilter, setEmploymentFilter] = useState("all");
	  const [workplaceFilter, setWorkplaceFilter] = useState("all");
	  const [experienceFilter, setExperienceFilter] = useState("all");
	  const [postedFilter, setPostedFilter] = useState("all");
	  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	  const [detailsOpen, setDetailsOpen] = useState(false);

  const [talent, setTalent] = useState<TalentSnapshot | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [interviewsCount, setInterviewsCount] = useState(0);

	  const [selectedCvSlot, setSelectedCvSlot] = useState(0);
	  const [cvDialogOpen, setCvDialogOpen] = useState(false);
	  const [cvDialogUrl, setCvDialogUrl] = useState("");
	  const [cvAction, setCvAction] = useState<{ mode: "upload" | "replace"; slot: number } | null>(null);
	  const cvFileInputRef = useRef<HTMLInputElement | null>(null);
	  const deepLinkHandledRef = useRef<string | null>(null);

	  const selectedJob = useMemo(() => {
	    if (linkedJob && linkedJob.id === selectedJobId) return linkedJob;
	    return jobs.find((job) => job.id === selectedJobId) ?? null;
	  }, [jobs, linkedJob, selectedJobId]);
  const selectedCvUrl = useMemo(() => {
    const urls = talent?.resumeUrls ?? ["", "", ""];
    const url = urls[selectedCvSlot] ?? "";
    return String(url).trim();
  }, [talent?.resumeUrls, selectedCvSlot]);

	  const jobFilterOptions = useMemo(() => {
	    const unique = (values: string[]) => Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort();
	    return {
	      locations: unique(jobs.map((j) => j.location || "")),
	      employmentTypes: unique(jobs.map((j) => j.employmentType || "")),
	      workplaces: unique(jobs.map((j) => j.workplace || "")),
	      experienceLevels: unique(jobs.map((j) => j.experienceLevel || "")),
	    };
	  }, [jobs]);

	  const filteredJobs = useMemo(() => {
	    const term = searchQuery.trim().toLowerCase();

	    const getAgeDays = (createdAt: string) => {
	      const date = new Date(createdAt);
	      const diffMs = Date.now() - date.getTime();
	      if (Number.isNaN(diffMs)) return Number.POSITIVE_INFINITY;
	      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
	    };

	    return jobs.filter((job) => {
	      const matchesSearch =
	        !term ||
	        job.title.toLowerCase().includes(term) ||
	        job.companyName.toLowerCase().includes(term) ||
	        job.skillsRequired.some((s) => String(s).toLowerCase().includes(term));

	      const matchesLocation = locationFilter === "all" || String(job.location || "") === locationFilter;
	      const matchesEmployment = employmentFilter === "all" || String(job.employmentType || "") === employmentFilter;
	      const matchesWorkplace = workplaceFilter === "all" || String(job.workplace || "") === workplaceFilter;
	      const matchesExperience = experienceFilter === "all" || String(job.experienceLevel || "") === experienceFilter;
	      const matchesPosted = postedFilter === "all" || getAgeDays(job.createdAt) <= Number(postedFilter);

	      return matchesSearch && matchesLocation && matchesEmployment && matchesWorkplace && matchesExperience && matchesPosted;
	    });
	  }, [employmentFilter, experienceFilter, jobs, locationFilter, postedFilter, searchQuery, workplaceFilter]);

  const updateTalentResumeUrls = async (next: [string, string, string]) => {
    if (!talent?.talentId) return;
    const { error } = await supabase.from("talents").update({ resume_url: next }).eq("id", talent.talentId);
    if (error) throw error;
    setTalent((current) => (current ? { ...current, resumeUrls: next } : current));
    setSelectedCvSlot((currentSlot) => {
      const currentUrl = String(next[currentSlot] ?? "").trim();
      if (currentUrl) return currentSlot;
      const nextSlot = next.findIndex((u) => String(u).trim());
      return nextSlot >= 0 ? nextSlot : 0;
    });
  };

  const loadData = async () => {
    if (!user?.id || !user.email) {
      setTalent(null);
      setJobs([]);
      setAppliedJobIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: talentRow, error: talentError } = await supabase
        .from("talents")
        .select("id, full_name, phone_number, city, linkedin_url, portfolio_url, resume_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (talentError) throw talentError;
      if (!talentRow?.id) {
        setTalent(null);
        setJobs([]);
        setAppliedJobIds(new Set());
        setApplicationsCount(0);
        setInterviewsCount(0);
        return;
      }

      const snapshot: TalentSnapshot = {
        talentId: talentRow.id,
        fullName: talentRow.full_name || "",
        email: user.email || "",
        phone: talentRow.phone_number || "",
        location: talentRow.city || "",
        linkedin: talentRow.linkedin_url || "",
        portfolio: talentRow.portfolio_url || "",
        resumeUrls: toFixed3ResumeUrls(talentRow.resume_url),
      };

      setTalent(snapshot);
      setSelectedCvSlot(() => {
        const idx = snapshot.resumeUrls.findIndex((u) => String(u).trim());
        return idx >= 0 ? idx : 0;
      });

	      const { data: jobRows, error: jobsError } = await supabase
	        .from("jobs")
	        .select(
	          "id,title,profession,description,location,workplace,employment_type,contract_type,job_level,experience_level,skills_required,positions_available,what_you_will_do,requirements,created_at,status,employers(company_name,industry,company_size,logo_url)"
	        )
	        .eq("status", "published")
	        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

	      const mappedJobs: TalentJob[] = (jobRows || []).map((row: any) => ({
	        id: row.id,
	        title: row.title || "Untitled Position",
	        profession: row.profession || "",
	        description: row.description || "",
	        location: row.location || "",
	        workplace: row.workplace || "",
	        employmentType: row.employment_type || "",
	        contractType: row.contract_type || "",
	        jobLevel: row.job_level || "",
	        experienceLevel: row.experience_level || "",
	        skillsRequired: normalizeTextArray(row.skills_required),
	        positionsAvailable: Number(row.positions_available) || 0,
	        whatYouWillDo: normalizeTextArray(row.what_you_will_do),
	        requirements: normalizeTextArray(row.requirements),
	        createdAt: row.created_at || new Date().toISOString(),
	        status: row.status as DbJobStatus,
	        companyName: row.employers?.company_name || "Company",
	        companyLogoUrl: row.employers?.logo_url || "",
	        industry: row.employers?.industry || "",
	        companySize: row.employers?.company_size || "",
	      }));

      setJobs(mappedJobs);
      setSelectedJobId((prev) => prev ?? mappedJobs[0]?.id ?? null);

      const { data: applicationRows, error: appsError } = await supabase
        .from("applications")
        .select("id,job_id")
        .eq("talent_id", snapshot.talentId);

      if (appsError) throw appsError;

      const jobIds = new Set<string>((applicationRows || []).map((r: any) => String(r.job_id)));
      setAppliedJobIds(jobIds);
      setApplicationsCount(jobIds.size);

      const applicationIds = (applicationRows || []).map((r: any) => String(r.id));
      if (applicationIds.length > 0) {
        const { count } = await supabase
          .from("interviews")
          .select("id", { count: "exact", head: true })
          .in("application_id", applicationIds);
        setInterviewsCount(count ?? 0);
      } else {
        setInterviewsCount(0);
      }

    } catch (error: any) {
      console.error("Talent overview load failed:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load overview.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

	  useEffect(() => {
	    const jobIdFromUrl = searchParams.get("jobId");
	    if (!jobIdFromUrl) return;
	    const wantsApply = searchParams.get("apply") === "1";
	    let cancelled = false;

	    const deepLinkKey = `job:${jobIdFromUrl}:apply:${wantsApply ? "1" : "0"}`;
	    if (deepLinkHandledRef.current === deepLinkKey) return;
	    deepLinkHandledRef.current = deepLinkKey;

		    const cleanupParams = () => {
		      const next = new URLSearchParams(searchParams);
		      next.delete("jobId");
		      next.delete("apply");
		      setSearchParams(next, { replace: true });
		    };

		    const cleanupParamsSoon = () => {
		      // Delay cleanup so it doesn't interfere with opening the details/apply view.
		      setTimeout(() => cleanupParams(), 0);
		    };

		    const mapRowToTalentJob = (row: any): TalentJob => ({
		      id: String(row.id),
		      title: row.title || "Untitled Position",
		      profession: row.profession || "",
		      description: row.description || "",
		      location: row.location || "",
		      workplace: row.workplace || "",
		      employmentType: row.employment_type || "",
		      contractType: row.contract_type || "",
		      jobLevel: row.job_level || "",
		      experienceLevel: row.experience_level || "",
		      skillsRequired: normalizeTextArray(row.skills_required),
		      positionsAvailable: Number(row.positions_available) || 0,
		      whatYouWillDo: normalizeTextArray(row.what_you_will_do),
		      requirements: normalizeTextArray(row.requirements),
		      createdAt: row.created_at || new Date().toISOString(),
		      status: (row.status || "draft") as DbJobStatus,
		      companyName: row.employers?.company_name || "Company",
		      companyLogoUrl: row.employers?.logo_url || "",
		      industry: row.employers?.industry || "",
		      companySize: row.employers?.company_size || "",
		    });

	    const handle = async () => {
	      // If it already exists in the loaded list, just open it.
	      const inList = jobs.find((j) => j.id === jobIdFromUrl);
		      if (inList) {
		        if (!cancelled) {
		          setLinkedJob(null);
		          setSelectedJobId(jobIdFromUrl);
		          setViewMode(wantsApply ? "apply" : "details");
		          cleanupParamsSoon();
		        }
		        return;
		      }

	      // Otherwise fetch the single job by id (even if unpublished) so shared links can open apply.
		      const { data: jobRow, error } = await supabase
		        .from("jobs")
		        .select(
		          "id,title,profession,description,location,workplace,employment_type,contract_type,job_level,experience_level,skills_required,positions_available,what_you_will_do,requirements,created_at,status,employers(company_name,industry,company_size,logo_url)"
		        )
		        .eq("id", jobIdFromUrl)
		        .maybeSingle();

	      if (cancelled) return;

		      if (error || !jobRow?.id) {
		        toast({
		          title: "Job not available",
		          description: "This job link is invalid or the job was removed.",
		          variant: "destructive",
		        });
		        cleanupParamsSoon();
		        return;
		      }

		      const mapped = mapRowToTalentJob(jobRow);
		      setLinkedJob(mapped);
		      setSelectedJobId(mapped.id);
		      setViewMode(wantsApply ? "apply" : "details");
		      cleanupParamsSoon();
		    };

	    void handle();

	    return () => {
	      cancelled = true;
	    };
	  }, [jobs, searchParams, setSearchParams, toast]);

  const handleViewCv = (url: string) => {
    setCvDialogUrl(url);
    setCvDialogOpen(true);
  };

  const handleRemoveCvSlot = async (slotIndex: number) => {
    if (!talent?.email || !user?.id) return;

    const current = talent.resumeUrls ?? ["", "", ""];
    const url = String(current[slotIndex] ?? "").trim();
    if (!url) {
      toast({ title: "No CV", description: "This slot is empty.", variant: "destructive" });
      return;
    }

    const objectPath = getStoragePathFromPublicUrl(url);
    if (!objectPath) {
      toast({ title: "Remove failed", description: "Could not determine CV file path.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.storage.from("cvs").remove([objectPath]);
      if (error) throw error;

      const next = [...current] as [string, string, string];
      next[slotIndex] = "";
      await updateTalentResumeUrls(next);

      toast({ title: "CV removed" });
    } catch (error: any) {
      toast({ title: "Remove failed", description: error?.message || "Could not remove this CV.", variant: "destructive" });
    }
  };

  const uploadCvToSlot = async (file: File, slotIndex: number, mode: "upload" | "replace") => {
    if (!talent?.email || !user?.id) return;

    if (!isAllowedCvFile(file)) {
      toast({ title: "Invalid file", description: "PDF, DOC, or DOCX up to 5 MB.", variant: "destructive" });
      return;
    }

    const current = talent.resumeUrls ?? ["", "", ""];
    const oldUrl = String(current[slotIndex] ?? "").trim();

    if (mode === "upload" && oldUrl) {
      toast({ title: "Slot filled", description: "This CV slot already has a file. Use Replace instead.", variant: "destructive" });
      return;
    }

    try {
      const fileExt = file.name.split(".").pop() || "pdf";
      const safeExt = String(fileExt).toLowerCase();
      const fileName = `${user.id}_cv_${Date.now()}.${safeExt}`;
      const folder = toSafeEmailFolder(talent.email);
      const path = `resumes/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("cvs").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("cvs").getPublicUrl(path);
      const url = publicData?.publicUrl ?? "";
      if (!url) throw new Error("Could not get public URL for the uploaded CV.");

      const next = [...current] as [string, string, string];
      next[slotIndex] = url;
      await updateTalentResumeUrls(next);
      setSelectedCvSlot(slotIndex);

      if (mode === "replace" && oldUrl) {
        const oldPath = getStoragePathFromPublicUrl(oldUrl);
        if (oldPath) {
          const { error: removeError } = await supabase.storage.from("cvs").remove([oldPath]);
          if (removeError) console.warn("Failed to remove old CV:", removeError.message);
        }
      }

      toast({ title: mode === "replace" ? "CV replaced" : "CV uploaded" });
    } catch (error: any) {
      toast({
        title: mode === "replace" ? "Replace failed" : "Upload failed",
        description: error?.message || "Could not upload this CV.",
        variant: "destructive",
      });
    }
  };

  const handleApply = async () => {
    if (!talent?.talentId || !selectedJob?.id || !user?.id) return;

    if (!selectedCvUrl) {
      toast({ title: "CV required", description: "Select a CV slot that has a file, or upload one first.", variant: "destructive" });
      return;
    }

    try {
      setLoadingApply(true);

      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("talent_id", talent.talentId)
        .eq("job_id", selectedJob.id)
        .maybeSingle();

      if (existing?.id) {
        toast({ title: "Already applied" });
        return;
      }

      const { data: createdApp, error: insertError } = await supabase
        .from("applications")
        .insert([
          {
            job_id: selectedJob.id,
            talent_id: talent.talentId,
            status: "pending",
            stage: "to-contact",
            resume_url: selectedCvUrl,
          },
        ])
        .select("id")
        .maybeSingle();

      if (insertError) throw insertError;

      if (createdApp?.id) {
        await supabase.from("activity_logs").insert([
          {
            user_id: user.id,
            action: "application_submitted",
            entity_type: "application",
            entity_id: createdApp.id,
            changes: {
              cv_path: getStoragePathFromPublicUrl(selectedCvUrl) ?? "",
              cv_url: selectedCvUrl,
              cv_slot: selectedCvSlot,
            },
          },
        ]);
      }

      toast({ title: "Application submitted" });
      setViewMode("details");
      await loadData();
    } catch (error: any) {
      toast({ title: "Apply failed", description: error?.message || "Could not submit your application.", variant: "destructive" });
    } finally {
      setLoadingApply(false);
    }
  };

  return (
    <TalentLayout>
	      <Dialog open={cvDialogOpen} onOpenChange={setCvDialogOpen}>
	        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>CV Preview</DialogTitle>
          </DialogHeader>
          {cvDialogUrl ? <CvViewer fileUrl={cvDialogUrl} /> : null}
        </DialogContent>
	      </Dialog>

	      <div
	        className={`relative z-10 mx-auto max-w-7xl px-3 sm:px-4 ${
	          viewMode === "list" ? "py-12 sm:py-20" : "py-6 sm:py-10"
	        }`}
	      >
	        {viewMode !== "list" && selectedJob ? (
	          <div className="mb-7">
	            <button
	              type="button"
	              onClick={() => setViewMode("list")}
	              className="inline-flex h-12 items-center rounded-full border border-orange-200 bg-white px-8 text-base font-semibold text-orange-700 shadow-sm transition-colors hover:bg-orange-50"
	            >
	              <ArrowLeft className="mr-3 h-5 w-5 text-orange-700" />
	              Back to Jobs
	            </button>
	          </div>
	        ) : null}

		        <section
		          className={
		            viewMode === "list" || !selectedJob
		              ? "mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8"
		              : "mb-8"
		          }
		        >
		          {viewMode === "list" || !selectedJob ? (
	            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
	              <div>
	                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
	                  <Building2 className="h-3.5 w-3.5" />
	                  Talent Overview
	                </div>
	                <h1 className="text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">Jobs & Applications</h1>
	                <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">Browse jobs and apply using your profile information and CV.</p>
	              </div>

	              <div className="grid w-full max-w-xl grid-cols-2 gap-3">
	                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
	                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
	                    <Briefcase className="h-5 w-5" />
	                  </div>
	                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Applications</p>
	                  <p className="mt-2 text-3xl font-bold text-slate-900">{applicationsCount}</p>
	                </div>
	                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
	                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
	                    <CalendarDays className="h-5 w-5" />
	                  </div>
	                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Interviews</p>
	                  <p className="mt-2 text-3xl font-bold text-slate-900">{interviewsCount}</p>
	                </div>
	              </div>
	            </div>
		          ) : (
		            <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-[#fff7ed] shadow-xl">
		              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
		                <div className="flex items-start gap-4">
		                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-orange-100">
		                    {selectedJob.companyLogoUrl ? (
		                      <img
		                        src={selectedJob.companyLogoUrl}
		                        alt={`${selectedJob.companyName} logo`}
		                        className="h-full w-full object-cover"
		                        loading="lazy"
		                      />
		                    ) : (
		                      <Building2 className="h-7 w-7 text-orange-600" />
		                    )}
		                  </div>
		                  <div className="min-w-0">
		                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
		                      <Sparkles className="h-3.5 w-3.5" />
		                      Career Opportunity
		                    </div>
		                    <h1 className="mt-3 text-4xl font-bold tracking-tight leading-[1.05] text-slate-900 sm:text-5xl">{selectedJob.title}</h1>
		                    <p className="mt-2 text-base font-semibold text-orange-600 sm:text-lg">{selectedJob.companyName}</p>

		                    <div className="mt-4 flex flex-wrap gap-2">
		                      {selectedJob.industry ? (
		                        <Badge className="rounded-full border border-orange-200 bg-orange-50 text-orange-700">{selectedJob.industry}</Badge>
		                      ) : null}
		                      {selectedJob.employmentType ? (
		                        <Badge variant="outline" className="rounded-full border-orange-200 bg-white text-slate-700">
		                          {selectedJob.employmentType}
		                        </Badge>
		                      ) : null}
		                      {selectedJob.workplace ? (
		                        <Badge variant="outline" className="rounded-full border-orange-200 bg-white text-slate-700">
		                          {selectedJob.workplace}
		                        </Badge>
		                      ) : null}
		                      {selectedJob.experienceLevel ? (
		                        <Badge variant="outline" className="rounded-full border-orange-200 bg-white text-slate-700">
		                          {selectedJob.experienceLevel}
		                        </Badge>
		                      ) : null}
		                      {selectedJob.companySize ? (
		                        <Badge variant="outline" className="rounded-full border-orange-200 bg-white text-slate-700">
		                          {selectedJob.companySize}
		                        </Badge>
		                      ) : null}
		                    </div>
		                  </div>
		                </div>

		                <div className="flex items-center justify-end gap-2 sm:self-start">
		                  <button
		                    type="button"
		                    className="rounded-full p-2 text-orange-600 hover:bg-orange-50"
		                    aria-label="Share job"
		                    onClick={async () => {
		                      const url = `${window.location.origin}/jobs/${selectedJob.id}`;
		                      await navigator.clipboard.writeText(url);
		                      toast({ title: "Link copied to clipboard" });
		                    }}
		                  >
		                    <Share2 className="h-4 w-4" />
		                  </button>
		                  <button type="button" className="rounded-full p-2 text-orange-600 hover:bg-orange-50" aria-label="Save job">
		                    <Bookmark className="h-4 w-4" />
		                  </button>
		                </div>
		              </div>

		              <div className="border-t border-orange-100 bg-white p-5 sm:p-6">
		                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		                  <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 shadow-sm">
		                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
		                      <MapPin className="h-4 w-4 text-orange-600" />
		                      Location
		                    </div>
		                    <p className="mt-2 text-base font-bold text-slate-900">{selectedJob.location || "Not specified"}</p>
		                  </div>
		                  <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 shadow-sm">
		                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
		                      <Briefcase className="h-4 w-4 text-orange-600" />
		                      Contract Type
		                    </div>
		                    <p className="mt-2 text-base font-bold text-slate-900">{selectedJob.contractType || "Not specified"}</p>
		                  </div>
		                  <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 shadow-sm">
		                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
		                      <Clock className="h-4 w-4 text-orange-600" />
		                      Posted
		                    </div>
		                    <p className="mt-2 text-base font-bold text-slate-900">{formatPostedAgo(selectedJob.createdAt) || "—"}</p>
		                  </div>
		                  <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 shadow-sm">
		                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
		                      <GraduationCap className="h-4 w-4 text-orange-600" />
		                      Experience
		                    </div>
		                    <p className="mt-2 text-base font-bold text-slate-900">
		                      {selectedJob.experienceLevel || "Not specified"}
		                    </p>
		                  </div>
		                </div>
		              </div>
		            </div>
		          )}
		        </section>

	        {viewMode === "list" ? (
	          <section>
	            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	              <div className="relative w-full max-w-xl">
	                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
	                <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search jobs..." className="h-12 rounded-2xl border-orange-200 pl-11 focus:border-orange-400 focus:ring-orange-400" />
	              </div>
	              <div className="flex flex-wrap items-center gap-2">
	                <button
	                  type="button"
	                  onClick={() => setShowFilters((v) => !v)}
	                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600 hover:bg-orange-50"
	                >
	                  <SlidersHorizontal className="h-3.5 w-3.5" />
	                  Filters
	                </button>
	                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
	                  <Users className="h-3.5 w-3.5" />
	                  {filteredJobs.length} jobs
	                </div>
	              </div>
	            </div>

	            {showFilters ? (
	              <div className="mb-7 grid gap-3 rounded-3xl border border-orange-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:grid-cols-5">
	                <Select value={locationFilter} onValueChange={setLocationFilter}>
	                  <SelectTrigger className="h-11 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
	                    <SelectValue placeholder="Location" />
	                  </SelectTrigger>
	                  <SelectContent>
	                    <SelectItem value="all">All locations</SelectItem>
	                    {jobFilterOptions.locations.map((loc, index) => (
	                      <SelectItem key={`${loc}-${index}`} value={loc}>
	                        {loc}
	                      </SelectItem>
	                    ))}
	                  </SelectContent>
	                </Select>

	                <Select value={employmentFilter} onValueChange={setEmploymentFilter}>
	                  <SelectTrigger className="h-11 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
	                    <SelectValue placeholder="Employment" />
	                  </SelectTrigger>
	                  <SelectContent>
	                    <SelectItem value="all">All types</SelectItem>
	                    {jobFilterOptions.employmentTypes.map((value, index) => (
	                      <SelectItem key={`${value}-${index}`} value={value}>
	                        {value}
	                      </SelectItem>
	                    ))}
	                  </SelectContent>
	                </Select>

	                <Select value={workplaceFilter} onValueChange={setWorkplaceFilter}>
	                  <SelectTrigger className="h-11 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
	                    <SelectValue placeholder="Workplace" />
	                  </SelectTrigger>
	                  <SelectContent>
	                    <SelectItem value="all">Any workplace</SelectItem>
	                    {jobFilterOptions.workplaces.map((value, index) => (
	                      <SelectItem key={`${value}-${index}`} value={value}>
	                        {value}
	                      </SelectItem>
	                    ))}
	                  </SelectContent>
	                </Select>

	                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
	                  <SelectTrigger className="h-11 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
	                    <SelectValue placeholder="Experience" />
	                  </SelectTrigger>
	                  <SelectContent>
	                    <SelectItem value="all">All levels</SelectItem>
	                    {jobFilterOptions.experienceLevels.map((value, index) => (
	                      <SelectItem key={`${value}-${index}`} value={value}>
	                        {value}
	                      </SelectItem>
	                    ))}
	                  </SelectContent>
	                </Select>

	                <Select value={postedFilter} onValueChange={setPostedFilter}>
	                  <SelectTrigger className="h-11 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
	                    <SelectValue placeholder="Posted" />
	                  </SelectTrigger>
	                  <SelectContent>
	                    <SelectItem value="all">Any time</SelectItem>
	                    <SelectItem value="1">Last 24 hours</SelectItem>
	                    <SelectItem value="3">Last 3 days</SelectItem>
	                    <SelectItem value="7">Last 7 days</SelectItem>
	                    <SelectItem value="14">Last 14 days</SelectItem>
	                    <SelectItem value="30">Last 30 days</SelectItem>
	                  </SelectContent>
	                </Select>

	                <div className="md:col-span-5 flex flex-wrap gap-2 pt-1">
	                  <button
	                    type="button"
	                    onClick={() => {
	                      setLocationFilter("all");
	                      setEmploymentFilter("all");
	                      setWorkplaceFilter("all");
	                      setExperienceFilter("all");
	                      setPostedFilter("all");
	                    }}
	                    className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"
	                  >
	                    Clear filters
	                  </button>
	                </div>
	              </div>
	            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-6 py-10 text-orange-700">
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading jobs...
                </div>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {filteredJobs.map((job) => {
                  const applied = appliedJobIds.has(job.id);
                  const initials = job.companyName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("");

	                  return (
	                    <article key={job.id} className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
	                      <div className="mb-5 flex items-start justify-between gap-4">
	                        <div className="flex items-start gap-4">
	                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
	                            {initials || "JT"}
	                          </div>
	                          <div>
	                            <div className="flex flex-wrap items-center gap-2">
	                              <h3 className="text-xl font-bold leading-tight text-slate-900">{job.title}</h3>
	                              {applied ? <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Applied</Badge> : null}
	                            </div>
	                            <p className="mt-1 text-sm font-semibold text-orange-600">{job.companyName}</p>
	                            <p className="mt-1 text-xs text-gray-500">{formatPostedAgo(job.createdAt)}</p>
	                          </div>
	                        </div>
	                        <div className="flex items-center gap-2">
	                          <button
	                            type="button"
	                            className="rounded-full p-2 text-orange-600 hover:bg-orange-50"
	                            aria-label="Share job"
	                            onClick={async () => {
	                              const url = `${window.location.origin}/jobs/${job.id}`;
	                              await navigator.clipboard.writeText(url);
	                              toast({ title: "Link copied to clipboard" });
	                            }}
	                          >
	                            <Share2 className="h-4 w-4" />
	                          </button>
	                          <button type="button" className="rounded-full p-2 text-orange-600 hover:bg-orange-50" aria-label="Save job">
	                            <Bookmark className="h-4 w-4" />
	                          </button>
	                        </div>
	                      </div>

	                      <p className="mb-5 text-sm leading-6 text-gray-600">
	                        {String(job.description || "")
	                          .trim()
	                          .slice(0, 220)}
	                        {String(job.description || "").trim().length > 220 ? "…" : ""}
	                      </p>

	                      <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
	                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-600" />{job.location || "—"}</div>
	                        <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-orange-600" />{job.employmentType || "—"}{job.workplace ? ` · ${job.workplace}` : ""}</div>
	                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-orange-600" />{job.companySize || "—"}</div>
	                        <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-orange-600" />{job.experienceLevel || job.jobLevel || "—"}</div>
	                        <div className="flex items-center gap-2"><Route className="h-4 w-4 text-orange-600" />{String(job.workplace).toLowerCase() === "remote" ? "No commute required" : "Commute required"}</div>
	                      </div>

	                      {job.industry || job.skillsRequired.length > 0 ? (
	                        <div className="mb-5 flex flex-wrap gap-2">
	                          {job.industry ? (
	                            <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{job.industry}</Badge>
	                          ) : null}
	                          {job.skillsRequired.slice(0, 8).map((skill, index) => (
	                            <Badge key={`${skill}-${index}`} variant="outline" className="border-orange-200 bg-white text-orange-700">
	                              {skill}
	                            </Badge>
	                          ))}
	                        </div>
	                      ) : null}

                      <div className="flex items-center justify-between gap-4 border-t border-orange-100 pt-5">
                        <div className="text-xs leading-6 text-gray-500">
                          Strong fit for candidates looking for {String(job.workplace || "flexible").toLowerCase()} {String(job.employmentType || "work").toLowerCase()} roles.
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setViewMode("details");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Job
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

	        {viewMode === "details" && selectedJob ? (
	          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
	            <div className="space-y-6">
	              <div className="rounded-[2rem] border border-orange-100 bg-white p-7 shadow-lg">
	                <h2 className="text-3xl font-bold text-slate-900">Role Overview</h2>
	                <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-600">{selectedJob.description || "—"}</p>
	              </div>

              <div className="rounded-[2rem] border border-orange-100 bg-white p-7 shadow-lg">
                <h3 className="text-3xl font-bold text-slate-900">What You Will Do</h3>
                {selectedJob.whatYouWillDo.length > 0 ? (
                  <ul className="mt-5 space-y-3">
                    {selectedJob.whatYouWillDo.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-3 text-base leading-7 text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-base leading-7 text-slate-600">Details will be shared during the process.</p>
                )}
              </div>

              <div className="rounded-[2rem] border border-orange-100 bg-white p-7 shadow-lg">
                <h3 className="text-3xl font-bold text-slate-900">Requirements</h3>
                {selectedJob.requirements.length > 0 ? (
                  <ul className="mt-5 space-y-3">
                    {selectedJob.requirements.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-3 text-base leading-7 text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-base leading-7 text-slate-600">No requirements provided yet.</p>
                )}
              </div>
            </div>

            <aside className="h-fit rounded-[2rem] border border-orange-100 bg-white p-7 shadow-lg">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-xl font-bold text-white shadow-md">
                {selectedJob.companyName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("") || "JT"}
              </div>
              <h3 className="mt-6 text-3xl font-bold text-slate-900">{selectedJob.companyName}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">Hiring for this role now across active teams.</p>

              <div className="mt-6 space-y-3 text-sm font-semibold text-slate-700">
                {selectedJob.industry ? (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span>{selectedJob.industry}</span>
                  </div>
                ) : null}
                {selectedJob.employmentType || selectedJob.workplace ? (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-orange-500" />
                    <span>{[selectedJob.employmentType, selectedJob.workplace].filter(Boolean).join(" · ")}</span>
                  </div>
                ) : null}
                {selectedJob.jobLevel ? (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-orange-500" />
                    <span>{selectedJob.jobLevel}</span>
                  </div>
                ) : null}
              </div>

              <Button
                type="button"
                onClick={() => {
                  setViewMode("apply");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={appliedJobIds.has(selectedJob.id)}
                className="mt-7 h-14 w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-base font-semibold text-white shadow-md hover:from-orange-700 hover:to-orange-600 disabled:opacity-60"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                {appliedJobIds.has(selectedJob.id) ? "Already applied" : "Apply for this position"}
              </Button>
            </aside>
          </div>
        ) : null}

	        {viewMode === "apply" && selectedJob && talent ? (
	          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
	            <div>
	              <div className="rounded-[2rem] border border-orange-100 bg-white p-7 shadow-lg">
	                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
	                  <Clock className="h-3.5 w-3.5" />
	                  Submit Candidacy
	                </div>
                <h2 className="text-4xl font-bold tracking-tight text-slate-900">Apply for {selectedJob.title}</h2>
                <p className="mt-3 text-base font-medium leading-7 text-slate-600">Complete this form to send your candidacy directly for review.</p>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <Input value={talent.fullName} disabled className="mt-2 h-12 rounded-2xl border-orange-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <Input value={talent.email} disabled placeholder="name@example.com" className="mt-2 h-12 rounded-2xl border-orange-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                    <Input value={talent.phone} disabled className="mt-2 h-12 rounded-2xl border-orange-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Current Location</label>
                    <Input value={talent.location} disabled className="mt-2 h-12 rounded-2xl border-orange-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">LinkedIn Profile</label>
                    <Input value={talent.linkedin} disabled className="mt-2 h-12 rounded-2xl border-orange-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Portfolio Link</label>
                    <Input value={talent.portfolio} disabled className="mt-2 h-12 rounded-2xl border-orange-200" />
                  </div>
                </div>

	                <div className="mt-10 rounded-[2rem] border border-orange-100 bg-orange-50/40 p-6">
	                  <h3 className="text-lg font-bold text-slate-900">CV for this application</h3>
	                  <p className="mt-2 text-sm font-semibold text-slate-600">Choose an existing CV from your profile documents or upload a new version for this role.</p>

	                  <input
	                    ref={cvFileInputRef}
	                    type="file"
	                    accept=".pdf,.doc,.docx"
	                    className="hidden"
	                    onChange={(event) => {
	                      const file = event.target.files?.[0];
	                      event.target.value = "";
	                      if (!file) return;
	                      if (!cvAction) {
	                        toast({ title: "Select an action", description: "Click Upload or Edit first.", variant: "destructive" });
	                        return;
	                      }
	                      void uploadCvToSlot(file, cvAction.slot, cvAction.mode);
	                      setCvAction(null);
	                    }}
	                  />

		                  {(() => {
		                    const resumeUrls = talent.resumeUrls ?? ["", "", ""];
		                    const selectedUrl = String(resumeUrls[selectedCvSlot] ?? "").trim();
		                    const hasSelected = Boolean(selectedUrl);
			                    const firstEmptySlot = resumeUrls.findIndex((u) => !String(u).trim());
			                    const hasFreeSlot = firstEmptySlot >= 0;
			                    const existingSlots = resumeUrls
			                      .map((u, i) => ({ slot: i, has: Boolean(String(u).trim()) }))
			                      .filter((x) => x.has);
			                    const canUpload = hasSelected || hasFreeSlot;
			                    const uploadText = hasSelected ? "Replace CV" : "Upload your CV";

			                    return (
			                      <div className="mt-6 grid gap-4 md:grid-cols-2">
			                        <div className="rounded-[1.75rem] border border-orange-200 bg-white p-5">
			                          <div className="flex items-start gap-3">
			                            <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-orange-500">
			                              <span className="h-2 w-2 rounded-full bg-orange-500" />
			                            </span>
			                            <FileText className="mt-0.5 h-5 w-5 text-orange-600" />
			                            <div className="min-w-0">
			                              <p className="text-sm font-bold text-slate-900">Select CV from profile</p>
			                              <p className="mt-1 text-xs font-semibold text-slate-600">Use a CV you already have saved under your profile documents.</p>
			                            </div>
			                          </div>

		                          <div className="mt-4">
		                            <Select value={String(selectedCvSlot)} onValueChange={(v) => setSelectedCvSlot(Number(v))}>
		                              <SelectTrigger className="h-11 rounded-2xl border-orange-200">
		                                <SelectValue placeholder={existingSlots.length ? "Choose a CV" : "Add new CV"} />
		                              </SelectTrigger>
		                              <SelectContent>
		                                {existingSlots.map(({ slot }) => (
		                                  <SelectItem key={`cv-option-${slot}`} value={String(slot)}>
		                                    CV {slot + 1}
		                                  </SelectItem>
		                                ))}
		                                {hasFreeSlot ? (
		                                  <SelectItem key={`cv-option-add-${firstEmptySlot}`} value={String(firstEmptySlot)}>
		                                    Add new CV
		                                  </SelectItem>
		                                ) : null}
		                              </SelectContent>
		                            </Select>
		                          </div>

			                          {hasSelected ? (
			                            <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
			                              <p className="text-sm font-semibold text-slate-900">CV {selectedCvSlot + 1}</p>
			                              <p className="mt-1 text-xs font-semibold text-slate-600">Preview the CV you’ll submit with this application.</p>
			                              <button
			                                type="button"
			                                onClick={() => handleViewCv(selectedUrl)}
			                                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-50"
			                              >
			                                <Eye className="h-4 w-4" />
			                                Preview CV
			                              </button>
			                            </div>
		                          ) : (
		                            <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-center text-sm text-slate-700">
		                              {hasFreeSlot ? "Select “Add new CV” then upload on the right." : "No CV selected."}
		                            </div>
		                          )}
		                        </div>

			                        <div className="rounded-[1.75rem] border border-orange-200 bg-white p-5">
			                          <div className="flex items-start gap-3">
			                            <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-300" />
			                            <div className="min-w-0">
			                              <div className="flex items-center gap-2">
			                                <Upload className="h-5 w-5 text-orange-600" />
			                                <p className="text-sm font-bold text-slate-900">Upload a new CV</p>
			                              </div>
			                              <p className="mt-1 text-xs font-semibold text-slate-600">Attach a tailored CV for this specific job application.</p>
			                            </div>
			                          </div>

			                          <button
			                            type="button"
			                            onClick={() => {
			                              if (!canUpload) return;
			                              setCvAction({ mode: hasSelected ? "replace" : "upload", slot: selectedCvSlot });
			                              cvFileInputRef.current?.click();
			                            }}
			                            disabled={!canUpload}
			                            className="mt-5 w-full rounded-[1.5rem] border-2 border-dashed border-orange-300 bg-orange-50/40 p-6 text-center transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
			                          >
			                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
			                              <Upload className="h-7 w-7" />
			                            </div>
			                            <p className="mt-4 text-base font-bold text-slate-900">{canUpload ? uploadText : "3 CVs saved"}</p>
			                            <p className="mt-2 text-xs font-semibold text-slate-600">PDF, DOC, or DOCX up to 5 MB</p>
			                          </button>
			                        </div>
			                      </div>
			                    );
			                  })()}
	                </div>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Button type="button" onClick={() => void handleApply()} disabled={loadingApply || appliedJobIds.has(selectedJob.id)} className="h-14 flex-1 rounded-full bg-orange-600 text-base font-semibold text-white shadow-md hover:bg-orange-700 disabled:opacity-60">
                    <Send className="mr-2 h-5 w-5" />
                    {loadingApply ? "Submitting..." : "Submit Candidacy"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setViewMode("details")} className="h-14 flex-1 rounded-full border-orange-200 text-base font-semibold text-orange-700 hover:bg-orange-50">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>

            <aside className="h-fit space-y-5">
              <div className="rounded-[2rem] border border-orange-100 bg-white p-7 shadow-lg">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-600 text-xl font-bold text-white shadow-md">
                  {selectedJob.companyName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("") || "JT"}
                </div>
                <h3 className="mt-6 text-2xl font-bold text-slate-900">{selectedJob.title}</h3>
                <p className="mt-1 text-base font-semibold text-orange-600">{selectedJob.companyName}</p>

                <div className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
                  {selectedJob.location ? (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span>{selectedJob.location}</span>
                    </div>
                  ) : null}
                  {selectedJob.employmentType || selectedJob.workplace ? (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-orange-500" />
                      <span>{[selectedJob.employmentType, selectedJob.workplace].filter(Boolean).join(" · ")}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>{formatPostedAgo(selectedJob.createdAt)}</span>
                  </div>
                </div>

                {selectedJob.skillsRequired.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedJob.skillsRequired.slice(0, 6).map((skill, index) => (
                      <span key={`${skill}-${index}`} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[2rem] border border-orange-100 bg-white p-7 shadow-lg">
                <h4 className="text-sm font-bold text-slate-900">Before you submit</h4>
                <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
                  <li>Use the same email you monitor for recruiter follow-up.</li>
                  <li>Choose a CV from your profile or upload a fresh version tailored to this role.</li>
                </ul>
              </div>
            </aside>
          </div>
        ) : null}

      </div>
    </TalentLayout>
  );
}


