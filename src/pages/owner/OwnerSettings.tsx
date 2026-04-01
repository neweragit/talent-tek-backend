import { useEffect, useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import bcrypt from "bcryptjs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";

type DbUserRole =
  | "superadmin"
  | "admin"
  | "owner"
  | "talent"
  | "employer"
  | "recruiter"
  | "interviewer"
  | "technical"
  | "leadership";

type DbUserRow = {
  id: string | null;
  email: string | null;
  user_role: DbUserRole | null;
  auth_status: "success" | "locked" | "invalid_credentials";
  remaining_attempts: number;
  locked_until: string | null;
};

const EMPTY_OWNER_PROFILE = {
  fullName: "",
  email: "",
  phoneNumber: "",
  city: "",
  country: "",
  bio: "",
  profilePhotoUrl: "",
};

export default function OwnerSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [form, setForm] = useState(() => EMPTY_OWNER_PROFILE);
  const [initialForm, setInitialForm] = useState(() => EMPTY_OWNER_PROFILE);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profileInitials = useMemo(
    () =>
      form.fullName
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [form.fullName]
  );

  useEffect(() => {
    let isMounted = true;

    const loadOwnerProfile = async () => {
      if (!user?.id) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: ownerRow, error } = await supabase
          .from("owners")
          .select("full_name,phone_number,city,country,bio,profile_photo_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        const next = {
          ...EMPTY_OWNER_PROFILE,
          email: user.email || "",
          fullName: ownerRow?.full_name || user.name || "",
          phoneNumber: ownerRow?.phone_number || "",
          city: ownerRow?.city || "",
          country: ownerRow?.country || "",
          bio: ownerRow?.bio || "",
          profilePhotoUrl: ownerRow?.profile_photo_url || "",
        };

        if (isMounted) {
          setForm(next);
          setInitialForm(next);
          setProfileImage(next.profilePhotoUrl || "");
          setIsEditing(false);
        }
      } catch (err: any) {
        console.error("Failed to load owner settings:", err);
        toast({
          title: "Failed to load settings",
          description: err?.message || "Unable to load owner profile from the database.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadOwnerProfile();

    return () => {
      isMounted = false;
    };
  }, [toast, user?.email, user?.id, user?.name]);

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!user?.id) {
      toast({ title: "Upload failed", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    if (!isEditing) {
      toast({ title: "Edit mode required", description: "Click Edit Profile first.", variant: "destructive" });
      event.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);
      const objectPath = `owners/${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage.from("users_images").upload(objectPath, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("users_images").getPublicUrl(objectPath);
      const url = publicData?.publicUrl;
      if (!url) throw new Error("Could not get a public URL for this photo.");

      setForm((prev) => ({ ...prev, profilePhotoUrl: url }));
      setProfileImage(url);
      toast({ title: "Photo uploaded", description: "Click Save Changes to persist your update." });
    } catch (err: any) {
      console.error("Owner profile photo upload failed:", err);
      toast({
        title: "Upload failed",
        description: err?.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  function handleFormChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id) {
      toast({ title: "Save failed", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    if (!isEditing) return;
    if (savingProfile) return;

    try {
      setSavingProfile(true);
      const payload = {
        user_id: user.id,
        full_name: form.fullName.trim(),
        phone_number: form.phoneNumber.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        bio: form.bio.trim(),
        profile_photo_url: form.profilePhotoUrl.trim() || null,
      };

      const { error } = await supabase.from("owners").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;

      setInitialForm(form);
      setIsEditing(false);
      setSaveDialogOpen(true);
    } catch (err: any) {
      console.error("Owner settings save failed:", err);
      toast({
        title: "Save failed",
        description: err?.message || "Unable to save owner settings.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!user?.id) {
      toast({ title: "Update failed", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    if (savingPassword) return;

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword) {
      toast({ title: "Missing fields", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Confirm password must match.", variant: "destructive" });
      return;
    }

    try {
      setSavingPassword(true);
      const normalizedEmail = (user.email || "").trim().toLowerCase().replace(/\s+/g, "");
      const canCallRpc = typeof (supabase as { rpc?: unknown }).rpc === "function";
      if (!canCallRpc) throw new Error("Authentication service is not available.");

      let { data: authData, error: authError } = await supabase
        .rpc("verify_user_login", {
          p_email: normalizedEmail,
          p_password: currentPassword,
          p_ip_address: null,
        })
        .maybeSingle();

      if (
        authError &&
        /function\s+public\.verify_user_login\(p_email\s*=>\s*text,\s*p_password\s*=>\s*text,\s*p_ip_address\s*=>\s*unknown\)\s+does not exist/i.test(
          authError.message
        )
      ) {
        const fallback = await supabase
          .rpc("verify_user_login", {
            p_email: normalizedEmail,
            p_password: currentPassword,
          })
          .maybeSingle();
        authData = fallback.data;
        authError = fallback.error;
      }

      if (authError) throw authError;

      const authRow = (authData as DbUserRow | null) ?? null;
      if (!authRow || authRow.auth_status === "invalid_credentials") {
        const attempts = authRow?.remaining_attempts ?? 0;
        toast({
          title: "Wrong password",
          description: attempts
            ? `Invalid credentials. ${attempts} attempt${attempts === 1 ? "" : "s"} remaining.`
            : "Invalid credentials.",
          variant: "destructive",
        });
        return;
      }

      if (authRow.auth_status === "locked") {
        const lockedUntilText = authRow.locked_until ? new Date(authRow.locked_until).toLocaleString() : "later";
        toast({
          title: "Account temporarily locked",
          description: `Too many attempts. Try again after ${lockedUntilText}.`,
          variant: "destructive",
        });
        return;
      }

      const nextHash = await bcrypt.hash(newPassword, 10);
      const { error: updateError } = await supabase.from("users").update({ password_hash: nextHash }).eq("id", user.id);
      if (updateError) throw updateError;

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordDialogOpen(true);
    } catch (err: any) {
      console.error("Owner password update failed:", err);
      toast({
        title: "Password update failed",
        description: err?.message || "Unable to update your password.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <OwnerLayout>
        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
          <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl sm:p-8">
            <div className="animate-pulse">
              <div className="h-7 w-40 rounded-full bg-orange-100" />
              <div className="mt-6 h-12 w-64 rounded-2xl bg-orange-100" />
              <div className="mt-4 h-5 w-80 rounded-xl bg-orange-50" />
              <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="h-56 rounded-3xl border border-orange-100 bg-orange-50/30" />
                <div className="h-56 rounded-3xl border border-orange-100 bg-orange-50/30" />
              </div>
            </div>
          </section>

          <div className="rounded-[2rem] border border-orange-100 bg-white p-10 shadow-lg">
            <div className="flex items-center justify-center text-sm font-semibold text-slate-600">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading settings…
            </div>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Owner Portal
              </div>
              <h1 className="text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Settings
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage your profile and account settings.
              </p>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 rounded-3xl">
                  <AvatarImage src={profileImage} className="object-cover object-[center_14%] scale-110" />
                  <AvatarFallback className="rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-2xl font-bold text-white">
                    {profileInitials || "PO"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Owner Portal</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{form.fullName || "—"}</p>
                  <p className="mt-1 text-sm font-semibold text-orange-600">TalenTek</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    View your profile details. Click Edit to update.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {!isEditing ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-orange-200 px-4 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-50"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-orange-200 px-4 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-50"
                    onClick={() => {
                      setForm(initialForm);
                      setProfileImage(initialForm.profilePhotoUrl || "");
                      setIsEditing(false);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex flex-col gap-5 rounded-3xl border border-orange-100 bg-orange-50/30 p-5 sm:flex-row sm:items-center">
                <Avatar className="h-24 w-24 rounded-3xl border border-orange-200">
                  <AvatarImage src={profileImage} className="object-cover object-[center_14%] scale-110" />
                  <AvatarFallback className="rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 text-3xl font-bold text-white">
                    {profileInitials || "PO"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  {isEditing ? (
                    <>
                      <Label
                        htmlFor="profile-photo"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-colors hover:bg-orange-50"
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingPhoto ? "Uploading…" : profileImage ? "Replace Photo" : "Upload Photo"}
                      </Label>
                      <Input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <p className="mt-3 text-sm text-slate-500">Uploads to `users_images` bucket (public read).</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">
                      {profileImage ? "Photo set. Click Edit Profile to replace it." : "No profile photo yet. Click Edit Profile to upload one."}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleFormChange}
                      disabled={!isEditing || savingProfile}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      disabled
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleFormChange}
                      disabled={!isEditing || savingProfile}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="city"
                      value={form.city}
                      onChange={handleFormChange}
                      disabled={!isEditing || savingProfile}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Country</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="country"
                      value={form.country}
                      onChange={handleFormChange}
                      disabled={!isEditing || savingProfile}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Bio</Label>
                  <Textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleFormChange}
                    disabled={!isEditing || savingProfile}
                    rows={5}
                    className="resize-none rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                {isEditing ? (
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? "Saving…" : "Save Changes"}
                  </Button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Security</h2>
                <p className="mt-1 text-sm text-slate-600">Update your password to keep your account secure</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                  <Input
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    disabled={savingPassword}
                    className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      disabled={savingPassword}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      disabled={savingPassword}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600 disabled:opacity-60"
                >
                  <Settings className="h-4 w-4" />
                  {savingPassword ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </form>
          </section>
        </div>

        <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <AlertDialogTitle className="text-xl">Profile Updated</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Your owner profile information has been successfully updated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setSaveDialogOpen(false)} className="rounded-full bg-green-600 text-white hover:bg-green-700">
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <AlertDialogTitle className="text-xl">Password Updated</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Your password has been updated successfully.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setPasswordDialogOpen(false)} className="rounded-full bg-green-600 text-white hover:bg-green-700">
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </OwnerLayout>
  );
}
