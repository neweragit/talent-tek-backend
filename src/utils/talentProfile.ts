export type TalentProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  title: string;
  linkedin: string;
  github: string;
  website: string;
  experience: string;
  education: string;
  skills: string[];
  resumeUrls?: string[];
};

export const calculateProfileCompletion = (profile: TalentProfileData): number => {
  const checkpoints = [
    profile.firstName,
    profile.lastName,
    profile.email,
    profile.phone,
    profile.city,
    profile.title,
    profile.experience,
    profile.education,
    profile.bio,
    profile.linkedin,
    profile.github,
    profile.website,
    profile.skills && profile.skills.length > 0 ? "skills" : "",
  ];

  const completed = checkpoints.filter((value) => String(value || "").trim().length > 0).length;
  return Math.round((completed / checkpoints.length) * 100);
};
