import TechnicalInterviewLayout from "@/components/layouts/technicalInterview/TechnicalInterviewLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Briefcase, Edit3, Save, X, Building2, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const TechnicalInterviewProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentInterviewer, setCurrentInterviewer] = useState(null);
  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state - only fields that exist in database
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    expertise: [],
    role: "",
    status: "active",
  });

  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      fetchInterviewerData();
    }
  }, [user]);

  const fetchInterviewerData = async () => {
    try {
      setLoading(true);
      const { data: interviewer, error } = await supabase
        .from('interviewers')
        .select(`
          *,
          employers (
            id,
            company_name,
            logo_url,
            industry,
            website
          )
        `)
        .eq('user_id', user.id)
        .eq('interview_type', 'technical')
        .single();

      if (error) throw error;

      setCurrentInterviewer(interviewer);
      setEmployerData(interviewer.employers);
      setFormData({
        full_name: interviewer.full_name || "",
        email: interviewer.email || "",
        expertise: Array.isArray(interviewer.expertise) ? interviewer.expertise : [],
        role: interviewer.role || "",
        status: interviewer.status || "active",
      });
    } catch (error) {
      console.error('Error fetching interviewer data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExpertiseChange = (expertiseString) => {
    const expertiseArray = expertiseString
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    setFormData(prev => ({
      ...prev,
      expertise: expertiseArray
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData = {
        full_name: formData.full_name,
        expertise: formData.expertise,
        role: formData.role,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('interviewers')
        .update(updateData)
        .eq('id', currentInterviewer.id);

      if (error) throw error;

      // Update local state
      setCurrentInterviewer(prev => ({
        ...prev,
        ...updateData
      }));

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (currentInterviewer) {
      setFormData({
        full_name: currentInterviewer.full_name || "",
        email: currentInterviewer.email || "",
        expertise: Array.isArray(currentInterviewer.expertise) ? currentInterviewer.expertise : [],
        role: currentInterviewer.role || "",
        status: currentInterviewer.status || "active",
      });
    }
    setIsEditing(false);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      "hr_manager": "HR Manager",
      "talent_acquisition_specialist": "Talent Acquisition Specialist",
      "recruiter": "Recruiter",
      "hr_business_partner": "HR Business Partner",
      "talent_sourcer": "Talent Sourcer",
    };
    return roleMap[role] || role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "New password and confirmation do not match",
          variant: "destructive",
        });
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      setChangingPassword(true);

      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });

    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <TechnicalInterviewLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </TechnicalInterviewLayout>
    );
  }

  return (
    <TechnicalInterviewLayout>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your talent acquisition profile and information
            </p>
          </div>
          
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {formData.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'TA'}
                </span>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{formData.full_name || 'Name not set'}</h2>
                  <Badge className={formData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {formData.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  {getRoleDisplayName(formData.role) || 'Role not set'}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {formData.email || 'Email not set'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                {isEditing ? (
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{formData.full_name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <p className="text-sm text-muted-foreground">{formData.email}</p>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                {isEditing ? (
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                      <SelectItem value="talent_acquisition_specialist">Talent Acquisition Specialist</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="hr_business_partner">HR Business Partner</SelectItem>
                      <SelectItem value="talent_sourcer">Talent Sourcer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">{getRoleDisplayName(formData.role) || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                {isEditing ? (
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={formData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {formData.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Areas of Expertise</label>
                {isEditing ? (
                  <Input
                    value={formData.expertise.join(', ')}
                    onChange={(e) => handleExpertiseChange(e.target.value)}
                    placeholder="e.g. Technical Recruiting, Behavioral Interviews, Culture Fit"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {formData.expertise.length > 0 ? (
                      formData.expertise.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Not set</p>
                    )}
                  </div>
                )}
                {isEditing && (
                  <p className="text-xs text-muted-foreground mt-1">Separate multiple areas with commas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employer Information */}
        {employerData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {employerData.logo_url ? (
                  <img 
                    src={employerData.logo_url} 
                    alt={`${employerData.company_name} Logo`}
                    className="w-16 h-16 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {employerData.company_name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{employerData.company_name}</h3>
                  {employerData.industry && (
                    <p className="text-sm text-muted-foreground">{employerData.industry}</p>
                  )}
                  {employerData.website && (
                    <a 
                      href={employerData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {employerData.website}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full"
            >
              {changingPassword ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Changing Password...
                </div>
              ) : (
                'Change Password'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </TechnicalInterviewLayout>
  );
};

export default TechnicalInterviewProfile;