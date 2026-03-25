import { useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
} from "lucide-react";

const DEFAULT_OWNER_PROFILE = {
  fullName: "Platform Owner",
  email: "owner@talentshub.com",
  phone: "+213 555 123 456",
  location: "Algiers",
  company: "TalenTek",
  bio: "Platform owner and administrator of TalenTek - Empowering the future workforce.",
};

const DEFAULT_OWNER_PROFILE_IMAGE = "/assets/WhatsApp%20Image%202026-02-11%20at%2011.08.26%20PM.jpeg";

export default function OwnerSettings() {
  const [profileImage, setProfileImage] = useState<string>(() => {
    return localStorage.getItem("ownerProfileImage") || DEFAULT_OWNER_PROFILE_IMAGE;
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [form, setForm] = useState(() => {
    const storedProfile = localStorage.getItem("ownerProfile");
    if (!storedProfile) {
      return DEFAULT_OWNER_PROFILE;
    }

    try {
      return {
        ...DEFAULT_OWNER_PROFILE,
        ...JSON.parse(storedProfile),
      };
    } catch {
      return DEFAULT_OWNER_PROFILE;
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profileInitials = useMemo(
    () =>
      form.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [form.fullName]
  );

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const image = reader.result as string;
      setProfileImage(image);
      localStorage.setItem("ownerProfileImage", image);
    };
    reader.readAsDataURL(file);
  }

  function handleFormChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    localStorage.setItem("ownerProfile", JSON.stringify(form));
    setSaveDialogOpen(true);
  }

  function handleSavePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordDialogOpen(true);
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
                  <p className="mt-1 text-2xl font-bold text-slate-900">{form.fullName}</p>
                  <p className="mt-1 text-sm font-semibold text-orange-600">{form.company}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
                <p className="mt-1 text-sm text-slate-600">Update your personal information and profile photo</p>
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
                  <Label htmlFor="profile-photo" className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-orange-700 shadow-sm transition-colors hover:bg-orange-50">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Label>
                  <Input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <p className="mt-3 text-sm text-slate-500">JPG, PNG or GIF (max. 2MB)</p>
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
                      onChange={handleFormChange}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="location"
                      value={form.location}
                      onChange={handleFormChange}
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Company</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                    <Input
                      name="company"
                      value={form.company}
                      onChange={handleFormChange}
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
                    rows={5}
                    className="resize-none rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
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
                      className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600">
                  <Settings className="h-4 w-4" />
                  Update Password
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
