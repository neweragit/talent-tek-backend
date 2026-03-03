import EmployerLayout from "@/components/layouts/EmployerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { User, Mail, Phone, Building, Save, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const EmployerSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    companyLogo: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setDataLoading(true);
    try {
      // Get user email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      // Get team member data with employer info
      const { data: teamMemberData, error: teamError } = await supabase
        .from('employer_team_members')
        .select(`
          first_name,
          last_name,
          phone,
          employers!fk_team_member_employer (
            company_name,
            logo_url
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (teamError) {
        console.error('Team member data not found:', teamError);
      }

      const employer = teamMemberData?.employers as any;

      setProfileData({
        firstName: teamMemberData?.first_name || "",
        lastName: teamMemberData?.last_name || "",
        email: userData?.email || "",
        phone: teamMemberData?.phone || "",
        company: employer?.company_name || "",
        companyLogo: employer?.logo_url || "",
      });
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Update user email
      const { error: userError } = await supabase
        .from('users')
        .update({ email: profileData.email })
        .eq('id', user?.id);

      if (userError) throw userError;

      // Update employer_team_members (first name, last name, phone)
      const { error: teamMemberError } = await supabase
        .from('employer_team_members')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
        })
        .eq('user_id', user?.id);

      if (teamMemberError) throw teamMemberError;

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
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
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', user?.id)
        .single();

      if (fetchError || !userData) {
        throw new Error('User not found');
      }

      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(
        passwordData.currentPassword,
        userData.password_hash
      );

      if (!isValidPassword) {
        toast({
          title: "Error",
          description: "Current password is incorrect.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);

      // Update password
      const { error } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployerLayout>
      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and security settings</p>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
        <div className="space-y-6">
          {/* Company Logo Display */}
          {profileData.companyLogo && (
            <Card className="shadow-lg border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
                    <img 
                      src={profileData.companyLogo} 
                      alt={profileData.company} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">You're a member of</p>
                    <p className="text-xl font-bold text-gray-900">{profileData.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Settings */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="w-6 h-6 text-orange-500" />
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
                    value={profileData.firstName}
                    onChange={(e) => handleProfileChange("firstName", e.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-900">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileChange("lastName", e.target.value)}
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-500" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-orange-500" />
                  Company
                </Label>
                <Input
                  id="company"
                  value={profileData.company}
                  disabled
                  className="border-gray-300 bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
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
                <Lock className="w-6 h-6 text-orange-500" />
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
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                  placeholder="Enter your current password"
                  className="border-gray-300"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-900">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
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
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    placeholder="Confirm new password"
                    className="border-gray-300"
                  />
                </div>
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
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </EmployerLayout>
  );
};

export default EmployerSettings;
