import { useMemo, useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import LeadershipInterviewLayout from "@/components/layouts/leadershipInterview/LeadershipInterviewLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  Edit3,
  Camera,
  Mail,
  Save,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type TabType = "profile" | "security";

type LeadershipInterviewerProfileState = {
  fullName: string;
  email: string;
  role: string;
};

const DEFAULT_LEADERSHIP_INTERVIEWER_PROFILE: LeadershipInterviewerProfileState = {
  fullName: "",
  email: "",
  role: "",
};

const LeadershipInterviewProfile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<LeadershipInterviewerProfileState>(DEFAULT_LEADERSHIP_INTERVIEWER_PROFILE);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  // Load profile from Supabase on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("interviewers")
        .select("id, full_name, email, role, interview_type")
        .eq("user_id", user.id)
        .eq("interview_type", "leadership")
        .maybeSingle();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (data) {
        setProfile({
          fullName: data.full_name || "",
          email: data.email || "",
          role: data.role || "",
        });
        setProfileId(data.id);
      }
      setLoading(false);
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const tabs = [
    { key: "profile" as TabType, label: "Profile", icon: User },
    { key: "security" as TabType, label: "Security", icon: Shield },
  ];

  const profileInitials = `${profile.fullName?.[0] ?? "L"}${profile.fullName?.[profile.fullName.lastIndexOf(" ") + 1] ?? "I"}`.toUpperCase();

  const profileCompletion = useMemo(() => {
    const checkpoints = [
      profile.fullName,
      profile.email,
      profile.role,
    ];

    const completed = checkpoints.filter((value) => String(value).trim().length > 0).length;
    return Math.round((completed / checkpoints.length) * 100);
  }, [profile]);

  const handleToggleEdit = async () => {
    if (isEditing) {
      // Save to Supabase
      if (!user?.id || !profileId) {
        toast({ title: "Error", description: "User not found.", variant: "destructive" });
        setIsEditing(false);
        return;
      }
      setLoading(true);
      const { error } = await supabase
        .from("interviewers")
        .update({
          full_name: profile.fullName.trim(),
          role: profile.role,
          email: profile.email,
        })
        .eq("id", profileId);
      setLoading(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your leadership interviewer profile has been saved.",
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const updatePassword = async () => {
    if (!user?.id) return;

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      toast({ title: "Validation", description: "All password fields are required.", variant: "destructive" });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast({ title: "Validation", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwordForm.next.length < 6) {
      toast({ title: "Validation", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    try {
      setSavingPassword(true);
      const { data, error } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data?.password_hash) {
        toast({ title: "Error", description: "User account not found.", variant: "destructive" });
        return;
      }

      const ok = await bcrypt.compare(passwordForm.current, data.password_hash);
      if (!ok) {
        toast({ title: "Error", description: "Current password is incorrect.", variant: "destructive" });
        return;
      }

      const nextHash = await bcrypt.hash(passwordForm.next, 10);
      const { error: updateError } = await supabase
        .from("users")
        .update({ password_hash: nextHash })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setPasswordForm({ current: "", next: "", confirm: "" });
      toast({ title: "Updated", description: "Password changed successfully." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const renderProfile = () => (
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
              <h3 className="text-2xl font-bold text-slate-900">{profile.fullName}</h3>
              <p className="mt-1 text-sm font-semibold text-orange-600">{profile.role}</p>
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
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-semibold text-slate-700">Full Name</Label>
            <Input
              value={profile.fullName}
              onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              disabled={!isEditing}
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Role</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
              <Input
                value={profile.role}
                onChange={(event) => setProfile({ ...profile, role: event.target.value })}
                disabled={!isEditing}
                className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
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

        <div className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Current Password</Label>
            <Input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, current: e.target.value }))}
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">New Password</Label>
            <Input
              type="password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Confirm New Password</Label>
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
              className="h-11 rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
          <Button
            onClick={() => void updatePassword()}
            disabled={savingPassword}
            className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
          >
            {savingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Update Password
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfile();
      case "security":
        return renderSecurity();
      default:
        return renderProfile();
    }
  };

  return (
    <LeadershipInterviewLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Leadership Interviewer Profile
              </div>
              <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
                My Profile
              </h1>
              <p className="max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage your interviewer profile and account settings in one unified workspace.
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
                  <p className="text-lg font-bold text-slate-900">{profile.fullName}</p>
                  <p className="text-sm font-semibold text-orange-600">{profile.role}</p>
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
                  Keep your profile updated for better interview assignment matching
                </div>
              </div>

              <Button
                onClick={handleToggleEdit}
                className="w-full gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        <div className="mb-8 flex items-center overflow-x-auto rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="grid h-12 min-w-[420px] w-full grid-cols-2 gap-2">
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
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl sm:p-8">
          {renderContent()}
        </div>
      </div>
    </LeadershipInterviewLayout>
  );
};

export default LeadershipInterviewProfile;
