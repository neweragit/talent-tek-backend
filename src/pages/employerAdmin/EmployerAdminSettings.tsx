import { useState, useEffect } from "react";
import EmployerAdminLayout from "@/components/layouts/EmployerAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Lock, Mail, User, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export default function EmployerAdminSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('rep_first_name, rep_last_name')
        .eq('user_id', user.id)
        .single();

      if (employerError) throw employerError;

      setFormData(prev => ({
        ...prev,
        firstName: employerData.rep_first_name || "",
        lastName: employerData.rep_last_name || "",
        email: userData.email || "",
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update employer data
      const { error: employerError } = await supabase
        .from('employers')
        .update({
          rep_first_name: formData.firstName,
          rep_last_name: formData.lastName,
        })
        .eq('user_id', user.id);

      if (employerError) throw employerError;

      // Update user email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase
          .from('users')
          .update({ email: formData.email })
          .eq('id', user.id);

        if (emailError) throw emailError;
      }

      await loadUserData();
      
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verify current password
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const passwordMatch = await bcrypt.compare(formData.currentPassword, userData.password_hash);
      if (!passwordMatch) {
        toast({
          title: "Error",
          description: "Current password is incorrect.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(formData.newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Password changed successfully.",
      });

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Error",
        description: "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployerAdminLayout>
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and security settings</p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="w-6 h-6 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-900">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-900">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="border-gray-300"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-gradient-primary text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* Change Password */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="w-6 h-6 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-900">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleChange("currentPassword", e.target.value)}
                  placeholder="Enter your current password"
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-900">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleChange("newPassword", e.target.value)}
                    placeholder="Enter new password"
                    className="border-gray-300 pr-10"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="Confirm new password"
                  className="border-gray-300"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  ℹ️ Password must be at least 6 characters long and contain a mix of uppercase, lowercase, and numbers.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="bg-gradient-primary text-white gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </EmployerAdminLayout>
  );
}
