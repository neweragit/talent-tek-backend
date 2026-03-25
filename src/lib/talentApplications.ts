export type ApplicationStatus = "interview" | "in-progress" | "rejected";

export interface TalentApplication {
  id: number;
  company: string;
  contact: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedDate: string;
  jobId?: number;
  applicantName?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  availability?: string;
  salaryExpectation?: string;
  coverLetter?: string;
  cvSource?: "profile" | "upload";
  cvName?: string;
}

const STORAGE_KEY = "talentSubmittedApplications";

export const defaultTalentApplications: TalentApplication[] = [
  {
    id: 1,
    company: "Moniepoint",
    contact: "talent@moniepoint.com",
    jobTitle: "Product Designer",
    status: "interview",
    appliedDate: "2 days ago",
    jobId: 1,
  },
  {
    id: 2,
    company: "Andela",
    contact: "careers@andela.com",
    jobTitle: "Frontend Engineer",
    status: "in-progress",
    appliedDate: "5 days ago",
    jobId: 2,
  },
  {
    id: 3,
    company: "Flutterwave",
    contact: "jobs@flutterwavego.com",
    jobTitle: "Growth Marketing Associate",
    status: "rejected",
    appliedDate: "9 days ago",
    jobId: 3,
  },
  {
    id: 4,
    company: "Paystack",
    contact: "people@paystack.com",
    jobTitle: "Customer Success Specialist",
    status: "interview",
    appliedDate: "12 days ago",
    jobId: 4,
  },
];

const canUseStorage = () => typeof window !== "undefined";

export const getSubmittedTalentApplications = (): TalentApplication[] => {
  if (!canUseStorage()) {
    return [];
  }

  const storedApplications = window.localStorage.getItem(STORAGE_KEY);
  if (!storedApplications) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedApplications);
    return Array.isArray(parsed) ? (parsed as TalentApplication[]) : [];
  } catch {
    return [];
  }
};

export const getAllTalentApplications = () => [...getSubmittedTalentApplications(), ...defaultTalentApplications];

export const saveSubmittedTalentApplication = (application: TalentApplication) => {
  if (!canUseStorage()) {
    return;
  }

  const existingApplications = getSubmittedTalentApplications();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([application, ...existingApplications]));
};

export const hasSubmittedApplicationForJob = (jobId: number) =>
  getSubmittedTalentApplications().some((application) => application.jobId === jobId);