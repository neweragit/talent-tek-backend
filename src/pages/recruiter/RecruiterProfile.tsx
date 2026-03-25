import { useEffect, useState } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import bcrypt from "bcryptjs";

type TabType = "profile" | "security";

type ProfileData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  supervisorName: string;
  supervisorEmail: string;
};

const EMPTY_PROFILE: ProfileData = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  supervisorName: "",
  supervisorEmail: "",
};

const RecruiterProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setProfile(EMPTY_PROFILE);
        setLoading(false);
        return;
      }

      setLoading(true);

      const [userResult, teamMemberResult] = await Promise.all([
        supabase
          .from("users")
          .select("email, is_active, email_verified")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("employer_team_members")
          .select("first_name, last_name, phone, invited_by")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const invitedBy = teamMemberResult.data?.invited_by;

      let supervisorName = "";
      let supervisorEmail = "";

      if (invitedBy) {
        const [supervisorEmployerResult, supervisorUserResult] = await Promise.all([
          supabase
            .from("employers")
            .select("rep_first_name, rep_last_name")
            .eq("user_id", invitedBy)
            .maybeSingle(),
          supabase
            .from("users")
            .select("email")
            .eq("id", invitedBy)
            .maybeSingle(),
        ]);

        supervisorName = [
          supervisorEmployerResult.data?.rep_first_name,
          supervisorEmployerResult.data?.rep_last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        supervisorEmail = supervisorUserResult.data?.email || "";
      }

      setProfile({
        firstName: teamMemberResult.data?.first_name || "",
        lastName: teamMemberResult.data?.last_name || "",
        phone: teamMemberResult.data?.phone || "",
        email: userResult.data?.email || user.email || "",
        supervisorName,
        supervisorEmail,
      });

      setLoading(false);
    };

    void load();
  }, [user?.id, user?.email]);

  const handleChangePassword = async () => {
    if (!user?.id) {
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Fill current password, new password, and confirmation.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "New password and confirmation must be the same.",
        variant: "destructive",
      });
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
        toast({
          title: "Unable to verify current password",
          description: fetchError?.message || "User password record not found.",
          variant: "destructive",
        });
        return;
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRow.password_hash);

      if (!isCurrentPasswordValid) {
        toast({
          title: "Current password is incorrect",
          description: "Please enter your current password correctly.",
          variant: "destructive",
        });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await supabase
        .from("users")
        .update({ password_hash: newHash })
        .eq("id", user.id);

      if (updateError) {
        toast({
          title: "Password update failed",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs = [
    { key: "profile" as TabType, label: "Profile", icon: User },
    { key: "security" as TabType, label: "Security", icon: Shield },
  ];

  return (
    <RecruiterLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Recruiter Profile
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">My Profile</h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
            Manage your personal details and account security from this page.
          </p>
        </section>

        <div className="mb-8 flex items-center overflow-x-auto rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="grid h-12 min-w-[320px] w-full grid-cols-2 gap-2">
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
          {loading ? (
            <p className="text-sm font-semibold text-slate-500">Loading profile...</p>
          ) : activeTab === "profile" ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">First Name</Label>
                <Input value={profile.firstName} disabled className="h-11 rounded-xl border-orange-200 bg-orange-50/30" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Last Name</Label>
                <Input value={profile.lastName} disabled className="h-11 rounded-xl border-orange-200 bg-orange-50/30" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Phone</Label>
                <Input value={profile.phone} disabled className="h-11 rounded-xl border-orange-200 bg-orange-50/30" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Email</Label>
                <Input value={profile.email} disabled className="h-11 rounded-xl border-orange-200 bg-orange-50/30" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Supervisor Name</Label>
                <Input value={profile.supervisorName} disabled className="h-11 rounded-xl border-orange-200 bg-orange-50/30" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Supervisor Email</Label>
                <Input value={profile.supervisorEmail} disabled className="h-11 rounded-xl border-orange-200 bg-orange-50/30" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30"
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white"
              >
                {changingPassword ? "Updating..." : "Change Password"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default RecruiterProfile;
