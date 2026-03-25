import { useMemo, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { defaultTalentProfileDocuments } from "@/data/talentProfileDocuments";
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

const DEFAULT_TALENT_PROFILE = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  city: "New York",
  country: "United States",
  bio: "Passionate software developer with 5+ years of experience in building web applications.",
  title: "Senior React Developer",
  linkedin: "linkedin.com/in/johndoe",
  github: "github.com/johndoe",
  website: "johndoe.dev",
  experience: "5+ years",
  education: "B.S. Computer Science",
  availability: "Immediate",
  salaryExpectation: "$120,000 - $150,000",
  skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker"],
};

const TalentProfile = () => {
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [hasEntrepreneurCard, setHasEntrepreneurCard] = useState(false);

  const [profile, setProfile] = useState(() => {
    const storedProfile = localStorage.getItem("talentProfile");
    if (!storedProfile) {
      return DEFAULT_TALENT_PROFILE;
    }

    try {
      return {
        ...DEFAULT_TALENT_PROFILE,
        ...JSON.parse(storedProfile),
      };
    } catch {
      return DEFAULT_TALENT_PROFILE;
    }
  });

  const tabs = [
    { key: "personal" as TabType, label: "Personal Info", icon: User },
    { key: "professional" as TabType, label: "Professional", icon: Briefcase },
    { key: "preferences" as TabType, label: "Preferences", icon: Settings },
    { key: "documents" as TabType, label: "Documents", icon: FileText },
    { key: "security" as TabType, label: "Security", icon: Shield },
  ];

  const profileInitials = `${profile.firstName?.[0] ?? "T"}${profile.lastName?.[0] ?? "T"}`.toUpperCase();

  const profileCompletion = useMemo(() => {
    const checkpoints = [
      profile.firstName,
      profile.lastName,
      profile.email,
      profile.phone,
      profile.city,
      profile.country,
      profile.title,
      profile.experience,
      profile.education,
      profile.bio,
      profile.linkedin,
      profile.github,
      profile.website,
      profile.availability,
      profile.salaryExpectation,
      profile.skills.length > 0 ? "skills" : "",
    ];

    const completed = checkpoints.filter((value) => String(value).trim().length > 0).length;
    return Math.round((completed / checkpoints.length) * 100);
  }, [profile]);

  const handleToggleEdit = () => {
    if (isEditing) {
      localStorage.setItem("talentProfile", JSON.stringify(profile));
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
                {profile.city}, {profile.country}
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
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Country</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
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
            onCheckedChange={setHasEntrepreneurCard}
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
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Salary Expectation</Label>
            <Input
              value={profile.salaryExpectation}
              onChange={(e) => setProfile({ ...profile, salaryExpectation: e.target.value })}
              disabled={!isEditing}
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
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

  const renderPreferences = () => (
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
      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Upload className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Upload Documents</h4>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/60 p-8 text-center">
          <Upload className="mx-auto mb-4 h-12 w-12 text-orange-400" />
          <p className="mb-2 text-lg font-semibold text-slate-900">Drop files here or browse</p>
          <p className="mb-4 text-sm text-gray-500">PDF, DOC, and DOCX files are supported</p>
          <Button className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600">
            <Upload className="h-4 w-4" />
            Browse Files
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <FileText className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Your Documents</h4>
        </div>

        <div className="space-y-3">
          {defaultTalentProfileDocuments.map((doc) => (
            <article
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-orange-50/50 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{doc.name}</p>
                  <p className="text-sm text-gray-500">{doc.size} • Uploaded {doc.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" className="rounded-full p-2 text-orange-600 hover:bg-orange-50" aria-label="View document">
                  <Eye className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-full p-2 text-orange-600 hover:bg-orange-50" aria-label="Download document">
                  <Download className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-full p-2 text-orange-600 hover:bg-orange-50" aria-label="Delete document">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
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
              placeholder="Enter current password"
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">New Password</Label>
            <Input
              type="password"
              placeholder="Enter new password"
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Confirm New Password</Label>
            <Input
              type="password"
              placeholder="Confirm new password"
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <Button className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600">
            <Shield className="w-4 h-4" />
            Update Password
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h4>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <div>
            <p className="font-semibold text-slate-900">Enable 2FA</p>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <Switch className="data-[state=checked]:bg-orange-500" />
        </div>
      </section>

      <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
            <Globe className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Active Sessions</h4>
        </div>

        <div className="mb-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Chrome on Windows</p>
                <p className="text-sm text-gray-500">New York, US • Current session</p>
              </div>
            </div>
            <Badge className="border border-orange-200 bg-orange-50 text-orange-700">Active</Badge>
          </div>
        </div>

        <Button className="w-full gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg hover:from-orange-600 hover:to-orange-500">
          Sign Out All Other Sessions
        </Button>
      </section>

      <section className="rounded-3xl border border-orange-200 bg-orange-50/60 p-6 shadow-sm">
        <h4 className="text-lg font-bold text-slate-900">Account Actions</h4>
        <p className="mt-2 text-sm text-slate-600">
          If you need to leave the platform, you can permanently remove your account.
        </p>
        <Button className="mt-4 gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg hover:from-orange-600 hover:to-orange-500">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </Button>
      </section>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalInfo();
      case "professional":
        return renderProfessional();
      case "preferences":
        return renderPreferences();
      case "documents":
        return renderDocuments();
      case "security":
        return renderSecurity();
      default:
        return renderPersonalInfo();
    }
  };

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
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                Profile completion: {profileCompletion}%
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
          <div className="grid h-12 min-w-[760px] w-full grid-cols-5 gap-2">
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
