import { useEffect, useMemo, useRef, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import CvViewer from "@/components/CvViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import bcrypt from "bcryptjs";
import {
  User,
  Briefcase,
  Settings,
  FileText,
  Shield,
  Edit3,
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Globe,
  Linkedin,
  Github,
  Plus,
  X,
  Upload,
  Download,
  Eye,
  Trash2,
  Save,
  GraduationCap,
  Building,
  Award,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

type TabType = "personal" | "professional" | "preferences" | "documents" | "security";

type TalentProfileData = {
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

const EMPTY_TALENT_PROFILE: TalentProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  bio: "",
  title: "",
  linkedin: "",
  github: "",
  website: "",
  experience: "",
  education: "",
  skills: [],
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
  // Public URL is expected to contain `/resumes/<folder>/<file>`.
  const match = url.match(/\/resumes\/(.+)$/);
  if (!match) return null;
  return `resumes/${match[1]}`;
};

const TalentProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [hasEntrepreneurCard, setHasEntrepreneurCard] = useState(false);
  const [profile, setProfile] = useState<TalentProfileData>(EMPTY_TALENT_PROFILE);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [talentId, setTalentId] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resumeUrls, setResumeUrls] = useState<[string, string, string]>(["", "", ""]);
  const [selectedCvSlot, setSelectedCvSlot] = useState(0);
  const [cvAction, setCvAction] = useState<{ mode: "upload" | "replace"; slot: number } | null>(null);
  const [cvPreviewUrl, setCvPreviewUrl] = useState("");
  const [cvPreviewOpen, setCvPreviewOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [emailVerificationMessage, setEmailVerificationMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [cvMessage, setCvMessage] = useState("");
  const [uploadingCv, setUploadingCv] = useState(false);
  const cvFileInputRef = useRef<HTMLInputElement | null>(null);

  const tabs = [
    { key: "personal" as TabType, label: "Personal Info", icon: User },
    { key: "professional" as TabType, label: "Professional", icon: Briefcase },
    { key: "documents" as TabType, label: "Documents", icon: FileText },
    { key: "security" as TabType, label: "Security", icon: Shield },
  ];

  useEffect(() => {
    const loadTalentProfile = async () => {
      setLoadingProfile(true);

      if (!user) {
        setProfile(EMPTY_TALENT_PROFILE);
        setLoadingProfile(false);
        return;
      }

      try {
        const { data: talent, error } = await supabase
          .from("talents")
          .select(
            "id, full_name, phone_number, city, current_position, years_of_experience, education_level, short_bio, linkedin_url, github_url, portfolio_url, skills, has_carte_entrepreneur, resume_url"
          )
          .eq("user_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (talent) {
          const [firstName = "", ...rest] = (talent.full_name || "").split(" ");
          const lastName = rest.join(" ");
          const fixedResumeUrls = toFixed3ResumeUrls(talent.resume_url);

          setProfile({
            firstName: firstName || "",
            lastName: lastName || "",
            email: user.email || "",
            phone: talent.phone_number || "",
            city: talent.city || "",
            bio: talent.short_bio || "",
            title: talent.current_position || "",
            linkedin: talent.linkedin_url || "",
            github: talent.github_url || "",
            website: talent.portfolio_url || "",
            experience: talent.years_of_experience || "",
            education: talent.education_level || "",
            skills: (talent.skills as string[]) || [],
            resumeUrls: fixedResumeUrls,
          });
          setResumeUrls(fixedResumeUrls);
          setSelectedCvSlot(() => {
            const idx = fixedResumeUrls.findIndex((u) => String(u).trim());
            return idx >= 0 ? idx : 0;
          });
          setHasEntrepreneurCard(Boolean(talent.has_carte_entrepreneur));

          setTalentId(talent.id);
        } else {
          setProfile(EMPTY_TALENT_PROFILE);
        }
      } catch (error) {
        console.error("Failed to load talent profile", error);
          setProfile(EMPTY_TALENT_PROFILE);
      } finally {
        setLoadingProfile(false);
      }
    };

    const loadEmailVerification = async () => {
      if (!user) {
        setEmailVerified(false);
        return;
      }

      try {
        const { data: userRecord, error } = await supabase
          .from("users")
          .select("email_verified")
          .eq("id", user.id)
          .single();

        if (!error && userRecord) {
          setEmailVerified(Boolean(userRecord.email_verified));
        }
      } catch (error) {
        console.error("Failed to load email verification", error);
      }
    };

    loadTalentProfile();
    loadEmailVerification();
  }, [user]);

  const profileInitials = `${profile.firstName?.[0] ?? "T"}${profile.lastName?.[0] ?? "T"}`.toUpperCase();

  const profileCompletion = useMemo(() => {
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
      profile.skills.length > 0 ? "skills" : "",
    ];

    const completed = checkpoints.filter((value) => String(value).trim().length > 0).length;
    return Math.round((completed / checkpoints.length) * 100);
  }, [profile]);

  const handleToggleEdit = async () => {
    if (isEditing) {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();

      const profilePayload: Partial<any> = {
        full_name: fullName,
        phone_number: profile.phone,
        city: profile.city,
        current_position: profile.title,
        years_of_experience: profile.experience,
        education_level: profile.education,
        short_bio: profile.bio,
        linkedin_url: profile.linkedin,
        github_url: profile.github,
        portfolio_url: profile.website,
        skills: profile.skills,
        has_carte_entrepreneur: hasEntrepreneurCard,
      };

      if (talentId) {
        try {
          const { error } = await supabase
            .from("talents")
            .update(profilePayload)
            .eq("id", talentId);

          if (error) {
            throw error;
          }
        } catch (error) {
          console.error("Failed to save talent profile", error);
        }
      }

      if (user?.email) {
        try {
          const { error } = await supabase
            .from("users")
            .update({ email: profile.email })
            .eq("id", user.id);

          if (error) {
            throw error;
          }
        } catch (error) {
          console.error("Failed to update user email", error);
        }
      }
    }

    setIsEditing(!isEditing);
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-3xl font-bold text-white shadow-lg">
                {profileInitials}
              </div>
              <button className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-md transition-colors hover:bg-orange-50">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h3>
              <p className="mt-1 text-sm font-semibold text-orange-600">{profile.title}</p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">
                <MapPin className="h-3.5 w-3.5" />
                {profile.city || "Unknown location"}
              </p>
            </div>
          </div>

          <Badge className="border border-orange-200 bg-orange-50 text-orange-700">
            {isEditing ? "Editing Enabled" : "Read Only"}
          </Badge>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <User className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Basic Information</h4>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">First Name</Label>
            <Input
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              disabled={!isEditing}
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Last Name</Label>
            <Input
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              disabled={!isEditing}
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">City</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Award className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Entrepreneur Card</h4>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <span className="text-sm font-medium text-slate-700">I have an Entrepreneur Card (Carte Entrepreneur)</span>
          <Switch
            checked={hasEntrepreneurCard}
            disabled={!isEditing}
            onCheckedChange={(checked) => {
              if (!isEditing) return;
              setHasEntrepreneurCard(checked);
            }}
            className="data-[state=checked]:bg-orange-500"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <FileText className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Bio</h4>
        </div>
        <Textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          disabled={!isEditing}
          rows={5}
          className="resize-none rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
        />
      </section>
    </div>
  );

  const renderProfessional = () => (
    <div className="space-y-6">
      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Briefcase className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Professional Information</h4>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Job Title</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Years of Experience</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Education</Label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Skills</h4>
          </div>

          {isEditing && (
            <Button size="sm" className="gap-1 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white">
              <Plus className="w-4 h-4" /> Add Skill
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill, idx) => (
            <Badge key={idx} className="gap-1 border border-orange-200 bg-orange-50 text-orange-700">
              {skill}
              {isEditing && <X className="h-3 w-3 cursor-pointer" />}
            </Badge>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Globe className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Social Links</h4>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">LinkedIn</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">GitHub</Label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.github}
                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-semibold text-slate-700">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const updatePassword = async () => {
    if (!user?.id) {
      setPasswordMessage("You must be logged in to change your password.");
      return;
    }

    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Current password, new password, and confirmation are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New password and confirmation must match.");
      return;
    }

    setChangingPassword(true);
    try {
      const { data: userRow, error: fetchError } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError || !userRow?.password_hash) {
        setPasswordMessage("Unable to verify current password.");
        console.error(fetchError);
        return;
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRow.password_hash);

      if (!isCurrentPasswordValid) {
        setPasswordMessage("Current password is incorrect.");
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await supabase
        .from("users")
        .update({ password_hash: newHash })
        .eq("id", user.id);

      if (updateError) {
        setPasswordMessage(`Password update failed: ${updateError.message}`);
        return;
      } else {
        setPasswordMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setPasswordMessage("Password update failed.");
      console.error("Password update error", error);
    } finally {
      setChangingPassword(false);
    }
  };

  const emailToCvFolder = (email: string) => {
    // Match the logic used during signup so we can reliably upload/delete inside the same folder.
    return email
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const uploadCvToStorage = async (file: File, slotIndex: number) => {
    if (!user?.id) {
      setCvMessage("You must be logged in to upload a CV.");
      return;
    }
    if (!talentId) {
      setCvMessage("Talent profile not ready yet. Please try again.");
      return;
    }

    setUploadingCv(true);
    setCvMessage("");

    try {
      const fileExt = file.name.split(".").pop();
      const safeExt = fileExt ? String(fileExt).toLowerCase() : "pdf";
      const fileName = `${user.id}_cv_${Date.now()}.${safeExt}`;

      const emailFolder = emailToCvFolder(profile.email || user.email || "");
      const folder = emailFolder || "user";
      const objectPath = `resumes/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("cvs").upload(objectPath, file);
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("cvs").getPublicUrl(objectPath);
      const url = publicData?.publicUrl;
      if (!url) throw new Error("Could not get public URL for the uploaded CV.");

      const next = [...resumeUrls] as [string, string, string];
      const oldUrl = next[slotIndex] || "";
      next[slotIndex] = url;

      const { error: talentUpdateError } = await supabase
        .from("talents")
        .update({ resume_url: next })
        .eq("id", talentId);

      if (talentUpdateError) throw talentUpdateError;

      if (oldUrl) {
        const oldPath = getStoragePathFromPublicUrl(oldUrl);
        if (oldPath) {
          const { error: removeOldError } = await supabase.storage.from("cvs").remove([oldPath]);
          if (removeOldError) {
            console.warn("Failed to remove old CV from storage:", removeOldError.message);
          }
        }
      }

      setResumeUrls(next);
      setSelectedCvSlot(slotIndex);
      setCvMessage("CV updated successfully.");
    } catch (err) {
      console.error("CV upload failed:", err);
      setCvMessage(err instanceof Error ? err.message : "CV upload failed.");
    } finally {
      setUploadingCv(false);
      setCvAction(null);
      if (cvFileInputRef.current) cvFileInputRef.current.value = "";
    }
  };

  const removeCvFromStorage = async (slotIndex: number) => {
    setCvMessage("");
    if (!user?.id) {
      setCvMessage("You must be logged in to remove your CV.");
      return;
    }
    if (!talentId) {
      setCvMessage("Talent profile not ready yet. Please try again.");
      return;
    }
    const url = resumeUrls[slotIndex] || "";
    if (!url) {
      setCvMessage("No CV found to remove.");
      return;
    }

    const objectPath = getStoragePathFromPublicUrl(url);
    if (!objectPath) {
      setCvMessage("Unable to determine CV file path for deletion.");
      return;
    }

    try {
      const { error: removeError } = await supabase.storage.from("cvs").remove([objectPath]);
      if (removeError) throw removeError;

      const next = [...resumeUrls] as [string, string, string];
      next[slotIndex] = "";

      const { error: talentUpdateError } = await supabase
        .from("talents")
        .update({ resume_url: next })
        .eq("id", talentId);
      if (talentUpdateError) throw talentUpdateError;

      setResumeUrls(next);
      setSelectedCvSlot((current) => {
        if (current !== slotIndex) return current;
        const nextSlot = next.findIndex((u) => String(u).trim());
        return nextSlot >= 0 ? nextSlot : 0;
      });
      if (cvPreviewUrl === url) {
        setCvPreviewOpen(false);
        setCvPreviewUrl("");
      }
      setCvMessage("CV removed successfully.");
    } catch (err) {
      console.error("CV remove failed:", err);
      setCvMessage(err instanceof Error ? err.message : "Failed to remove CV.");
    }
  };

  const renderEmailVerification = () => (
    <div className="space-y-6">
      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Settings className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Job Preferences</h4>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <div>
              <p className="font-semibold text-slate-900">Open to Work</p>
              <p className="text-sm text-gray-500">Let employers know you are available</p>
            </div>
            <Switch className="data-[state=checked]:bg-orange-500" defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <div>
              <p className="font-semibold text-slate-900">Remote Only</p>
              <p className="text-sm text-gray-500">Only show remote opportunities</p>
            </div>
            <Switch className="data-[state=checked]:bg-orange-500" />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <div>
              <p className="font-semibold text-slate-900">Immediate Start</p>
              <p className="text-sm text-gray-500">Available to start immediately</p>
            </div>
            <Switch className="data-[state=checked]:bg-orange-500" defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <div>
              <p className="font-semibold text-slate-900">Relocation</p>
              <p className="text-sm text-gray-500">Willing to relocate for the right opportunity</p>
            </div>
            <Switch className="data-[state=checked]:bg-orange-500" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Mail className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Notification Preferences</h4>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <div>
              <p className="font-semibold text-slate-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive job alerts via email</p>
            </div>
            <Switch className="data-[state=checked]:bg-orange-500" defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <div>
              <p className="font-semibold text-slate-900">Interview Reminders</p>
              <p className="text-sm text-gray-500">Get reminders before interviews</p>
            </div>
            <Switch className="data-[state=checked]:bg-orange-500" defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
            <div>
              <p className="font-semibold text-slate-900">Application Updates</p>
              <p className="text-sm text-gray-500">Notify when application status changes</p>
            </div>
            <Switch className="data-[state=checked]:bg-orange-500" defaultChecked />
          </div>
        </div>
      </section>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <Dialog open={cvPreviewOpen} onOpenChange={setCvPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>CV Preview</DialogTitle>
          </DialogHeader>
          {cvPreviewUrl ? <CvViewer fileUrl={cvPreviewUrl} /> : null}
        </DialogContent>
      </Dialog>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <FileText className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Resume / CV</h4>
        </div>

        <p className="mt-1 text-sm font-semibold text-slate-600">Choose an existing CV from your profile documents or upload a new version.</p>

        <input
          ref={cvFileInputRef}
          className="hidden"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            setCvMessage("");
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (!cvAction) {
              setCvMessage("Click Upload or Edit first.");
              return;
            }
            void uploadCvToStorage(file, cvAction.slot);
          }}
        />

        {(() => {
          const selectedUrl = String(resumeUrls[selectedCvSlot] ?? "").trim();
          const hasSelected = Boolean(selectedUrl);
          const firstEmptySlot = resumeUrls.findIndex((u) => !String(u).trim());
          const hasFreeSlot = firstEmptySlot >= 0;
          const existingSlots = resumeUrls
            .map((u, i) => ({ slot: i, has: Boolean(String(u).trim()) }))
            .filter((x) => x.has);

          return (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-orange-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <input type="radio" checked readOnly className="mt-1 h-4 w-4 accent-orange-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">Select CV from profile</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">Pick one of your saved CV slots. Filenames are hidden.</p>
                  </div>
                </div>

                <div className="mt-4">
                  <Select value={String(selectedCvSlot)} onValueChange={(v) => setSelectedCvSlot(Number(v))}>
                    <SelectTrigger className="h-11 rounded-2xl border-orange-200">
                      <SelectValue placeholder={existingSlots.length ? "Choose a CV" : "No CVs yet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {existingSlots.map(({ slot }) => (
                        <SelectItem key={`cv-option-${slot}`} value={String(slot)}>
                          CV {slot + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasSelected ? (
                  <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                    <p className="text-sm font-semibold text-slate-900">CV {selectedCvSlot + 1}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">Use View to preview in-app, or Edit/Delete to update this slot.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCvPreviewUrl(selectedUrl);
                          setCvPreviewOpen(true);
                        }}
                        className="h-9 rounded-full border-orange-200 px-4 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingCv}
                        onClick={() => {
                          setCvAction({ mode: "replace", slot: selectedCvSlot });
                          cvFileInputRef.current?.click();
                        }}
                        className="h-9 rounded-full border-orange-200 px-4 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingCv}
                        onClick={() => void removeCvFromStorage(selectedCvSlot)}
                        className="h-9 rounded-full border-orange-200 px-4 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-center text-sm text-slate-700">
                    No CV selected yet.
                  </div>
                )}
              </div>

              <div className="rounded-[1.75rem] border border-orange-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <input type="radio" disabled className="mt-1 h-4 w-4 accent-orange-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">Upload a new CV</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">Adds to the next available empty slot (max 3).</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border-2 border-dashed border-orange-300 bg-orange-50/40 p-6 text-center">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!hasFreeSlot) return;
                      setCvAction({ mode: "upload", slot: firstEmptySlot });
                      cvFileInputRef.current?.click();
                    }}
                    disabled={!hasFreeSlot || uploadingCv}
                    className="h-12 w-full rounded-full bg-orange-600 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    {hasFreeSlot ? "Upload your CV" : "3 CVs saved"}
                  </Button>
                  <p className="mt-3 text-xs font-semibold text-slate-600">PDF, DOC, or DOCX up to 5 MB</p>
                </div>
              </div>
            </div>
          );
        })()}

        {cvMessage && <p className="mt-3 text-sm font-semibold text-orange-700">{cvMessage}</p>}
      </section>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Mail className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Email Verification</h4>
        </div>

        {emailVerified ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-slate-900">Verified</p>
              <p className="text-sm text-slate-600">Your email is verified.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="font-semibold text-slate-900">Not verified</p>
              <p className="text-sm text-slate-600">Verify your email to access all account features.</p>
            </div>

            <Button
              onClick={async () => {
                setEmailVerificationMessage("");
                try {
                  const { error } = await supabase.auth.api.sendVerificationEmail(profile.email);
                  if (error) throw error;
                  setEmailVerificationMessage("Verification email sent. Check your inbox.");
                  // We keep the message "static" here; email_verified will update after the user verifies.
                } catch (err) {
                  console.error(err);
                  setEmailVerificationMessage("Unable to send verification email at the moment.");
                }
              }}
              disabled={!profile.email}
              className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
            >
              <Mail className="h-4 w-4" />
              Send verification email
            </Button>

            {emailVerificationMessage && (
              <p className="text-sm font-semibold text-orange-700">{emailVerificationMessage}</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Change Password</h4>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          {passwordMessage && <p className="text-sm text-red-600">{passwordMessage}</p>}
          <Button
            onClick={updatePassword}
            disabled={changingPassword}
            className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
          >
            <Shield className="w-4 h-4" />
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </section>

     
     
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalInfo();
      case "professional":
        return renderProfessional();
      case "documents":
        return renderDocuments();
      case "security":
        return renderSecurity();
      default:
        return renderPersonalInfo();
    }
  };

  if (loadingProfile) {
    return (
      <TalentLayout>
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl sm:p-8">
            <p className="text-sm font-semibold text-slate-600">Loading your profile...</p>
          </div>
        </div>
      </TalentLayout>
    );
  }

  if (!user) {
    return (
      <TalentLayout>
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl sm:p-8">
            <p className="text-sm font-semibold text-slate-600">Please log in to view your profile.</p>
          </div>
        </div>
      </TalentLayout>
    );
  }

  return (
    <TalentLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Talent Profile
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-slate-900 mb-4">
                My Profile
              </h1>
              <p className="max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage your professional profile, documents, and account settings in one unified workspace.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                  Profile completion: {profileCompletion}%
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${emailVerified ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-orange-100 text-orange-700 border border-orange-200"}`}>
                  <span>{emailVerified ? "Verified email" : "Email not verified"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-md">
                  {profileInitials}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{profile.firstName} {profile.lastName}</p>
                  <p className="text-sm font-semibold text-orange-600">{profile.title}</p>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">Completion</span>
                  <span className="font-bold text-orange-700">{profileCompletion}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-orange-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Keep your profile updated for stronger matching
                </div>
              </div>

              <Button
                onClick={handleToggleEdit}
                className="w-full gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        <div className="mb-8 flex items-center overflow-x-auto rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="grid h-12 min-w-[640px] w-full gap-2 grid-cols-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl sm:p-8">
          {renderContent()}
        </div>
      </div>
    </TalentLayout>
  );
};

export default TalentProfile;
