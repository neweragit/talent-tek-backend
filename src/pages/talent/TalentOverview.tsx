import { useMemo, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Building2,
  Eye,
  ExternalLink,
  GraduationCap,
  MapPin,
  MousePointerClick,
  RefreshCw,
  Route,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function TalentOverview() {
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
                Hello, {profile.firstName}👋
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
                  {manualSkillLibrary.map((skill) => (
                    <SelectItem key={skill} value={skill}>
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
                {visibleSkillOptions.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
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
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="border-orange-200 bg-white text-orange-700">
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
