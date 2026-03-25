export type JobDetailsData = {
  id: number;
  initials: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  jobType: string;
  workMode: string;
  experience: string;
  companySize: string;
  postedDays: number;
  salaryMin: number;
  salaryMax: number;
  visaSupport: boolean;
  skills: string[];
  summary: string;
  distanceKm: number;
};

export type JobDetailsRouteState = {
  job?: JobDetailsData;
  from?: string;
};

export const talentOverviewJobs: JobDetailsData[] = [
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
    summary:
      "Design end-to-end user journeys for payments, dashboards, and merchant onboarding across high-traffic financial products.",
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
    summary:
      "Build responsive web experiences for distributed engineering teams, with strong ownership over component quality and performance.",
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
    summary:
      "Support acquisition campaigns, measure funnel performance, and help expand product adoption across regional growth initiatives.",
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
    summary:
      "Own merchant onboarding and retention workflows while delivering fast, precise support across strategic accounts.",
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
    summary:
      "Develop resilient backend services for transaction-heavy banking experiences with strong attention to reliability and security.",
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
    summary:
      "Support interviewer coordination, candidate operations, and hiring workflow reporting across the platform.",
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
    summary:
      "Translate learning and startup program data into clear insights that help teams improve outcomes and reporting quality.",
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
    summary:
      "Lead multi-squad engineering delivery, drive architecture decisions, and coach senior engineers across product teams.",
  },
];

export const legacyDefaultJob: JobDetailsData = {
  id: 0,
  initials: "HT",
  title: "Content & Social Media Manager",
  company: "TalenTek",
  location: "Algiers, Algeria",
  industry: "Technology",
  jobType: "Full-time",
  workMode: "Remote",
  experience: "Mid",
  companySize: "Startup",
  postedDays: 2,
  salaryMin: 12000,
  salaryMax: 18000,
  distanceKm: 0,
  visaSupport: false,
  skills: [
    "Digital Marketing",
    "Graphic Design",
    "Social Media Management",
    "Content Writing",
    "Canva",
    "Adobe Suite",
  ],
  summary:
    "TalenTek is seeking a creative and organized individual to manage content across social media and website channels.",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatSalary = (salaryMin: number, salaryMax: number) =>
  `${currencyFormatter.format(salaryMin)} - ${currencyFormatter.format(salaryMax)} / year`;

export const getResponsibilities = (job: JobDetailsData) => [
  `Lead and execute ${job.title.toLowerCase()} workstreams across ${job.company}.`,
  `Collaborate with cross-functional teams to ship high-quality outcomes in ${job.industry}.`,
  `Convert business goals into practical delivery plans with measurable impact.`,
  `Contribute to process improvement, communication, and documentation across the team.`,
];

export const getRequirements = (job: JobDetailsData) => [
  `${job.experience} level professional experience in related roles.`,
  `Strong execution with ${job.skills.slice(0, 3).join(", ")}.`,
  `High ownership, collaboration, and communication standards.`,
  `Ability to succeed in ${job.workMode.toLowerCase()} work environments.`,
];

export const getTalentJobById = (id: number) => talentOverviewJobs.find((job) => job.id === id) ?? null;