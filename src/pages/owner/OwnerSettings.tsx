import { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, Mail, Phone, MapPin, Building, Upload, Save, Lock, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export default function OwnerSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    company: "TalenTek",
    bio: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        // Fetch owner profile data
        const { data: ownerData, error: ownerError } = await supabase
          .from('owners')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (ownerError && ownerError.code !== 'PGRST116') {
          console.error('Error fetching owner data:', ownerError);
        }

        // Set form data
        setForm({
          fullName: ownerData?.full_name || "Platform Owner",
          email: userData.email,
          phone: ownerData?.phone_number || "",
          location: ownerData?.city || "",
          company: "TalenTek",
          bio: ownerData?.bio || "Platform owner and administrator of TalenTek - Empowering the future workforce.",
        });

        // Load profile image if exists with cache-busting
        if (ownerData?.profile_photo_url) {
          const urlWithTimestamp = `${ownerData.profile_photo_url}?t=${Date.now()}`;
          setProfileImage(urlWithTimestamp);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        setProfileImage(reader.result as string);
        await uploadProfileImage(file);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadProfileImage(file: File) {
    if (!user) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('users_images')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '0' // Disable caching
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('users_images')
        .getPublicUrl(fileName);

      // Add timestamp to bust browser cache
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Update owner profile with new image URL
      const { error: updateError } = await supabase
        .from('owners')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state to show new image immediately with cache-busting timestamp
      setForm(prev => ({ ...prev, profile_photo_url: urlWithTimestamp }));
      setProfileImage(urlWithTimestamp);

      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Update user email
      const { error: userError } = await supabase
        .from('users')
        .update({ email: form.email })
        .eq('id', user.id);

      if (userError) throw userError;

      // Check if owner record exists
      const { data: existingOwner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingOwner) {
        // Update existing owner profile
        const { error: ownerError } = await supabase
          .from('owners')
          .update({
            full_name: form.fullName,
            phone_number: form.phone,
            city: form.location,
            bio: form.bio,
          })
          .eq('user_id', user.id);

        if (ownerError) throw ownerError;
      } else {
        // Create new owner profile
        const { error: insertError } = await supabase
          .from('owners')
          .insert({
            user_id: user.id,
            full_name: form.fullName,
            phone_number: form.phone,
            city: form.location,
            bio: form.bio,
          });

        if (insertError) throw insertError;
      }

      setSaveDialogOpen(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get current user data to verify current password
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Verify current password
      const isValid = await bcrypt.compare(passwordForm.currentPassword, userData.password_hash);
      if (!isValid) {
        toast({
          title: "Invalid password",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        return;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(passwordForm.newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed",
      });

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OwnerLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and account settings</p>
        </div>

        {/* Profile Settings */}
        <Card className="border-orange-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Profile Information</CardTitle>
            <CardDescription>Update your personal information and profile photo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="bg-gradient-primary text-white text-2xl font-bold">
                    {form.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="profile-photo" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg border-2 border-orange-200 hover:bg-orange-100 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="font-medium">{isUploading ? "Uploading..." : "Upload Photo"}</span>
                    </div>
                  </Label>
                  <Input
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF (max. 2MB)</p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <User className="w-4 h-4 text-orange-500" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleFormChange}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Mail className="w-4 h-4 text-orange-500" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Phone className="w-4 h-4 text-orange-500" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="+213 555 000 000"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="City, Country"
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="company" className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Building className="w-4 h-4 text-orange-500" />
                    Company
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    value={form.company}
                    onChange={handleFormChange}
                    placeholder="Company name"
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="bio" className="flex items-center gap-2 text-sm font-semibold mb-2">
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={form.bio}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Tell us about yourself..."
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-gradient-primary text-white flex items-center gap-2" disabled={isLoading}>
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-orange-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Security</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePassword} className="space-y-6">
              <div>
                <Label htmlFor="currentPassword" className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Lock className="w-4 h-4 text-orange-500" />
                  Current Password
                </Label>
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="newPassword" className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Lock className="w-4 h-4 text-orange-500" />
                    New Password
                  </Label>
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Lock className="w-4 h-4 text-orange-500" />
                    Confirm Password
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-gradient-primary text-white flex items-center gap-2" disabled={isLoading}>
                  <Lock className="w-4 h-4" />
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Save Success Dialog */}
        <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <AlertDialogTitle className="text-xl">Profile Updated!</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Your profile information has been successfully updated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => setSaveDialogOpen(false)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </OwnerLayout>
  );
}
