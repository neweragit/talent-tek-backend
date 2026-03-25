'use client';

import { useEffect, useMemo, useState } from 'react';
import RecruiterAdminLayout from '@/components/layouts/RecruiterAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Building,
  Users,
  Shield,
  Edit3,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Globe,
  Linkedin,
  Save,
  Trash2,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Loader,
  AlertCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type TabType = 'company' | 'contact' | 'security';

interface CompanyData {
  id: string;
  user_id: string;
  company_name: string;
  tagline: string;
  description: string;
  industry: string;
  website: string;
  company_size: string;
  year_founded: string;
  address: string;
  city: string;
  country: string;
  zip_code: string;
  linkedin_url: string;
  facebook_url: string;
  logo_url: string;
  rep_first_name: string;
  rep_last_name: string;
  created_at: string;
  updated_at: string;
}

export default function CompanyProfile() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState<CompanyData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        if (!user?.id) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('employers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error loading company data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load company profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyData();
  }, [user, toast]);

  const tabs = [
    { key: 'company' as TabType, label: 'Company Info', icon: Building },
    { key: 'contact' as TabType, label: 'Representative Info', icon: Users },
    { key: 'security' as TabType, label: 'Security', icon: Shield },
  ];

  const companyInitials = (profile?.company_name || 'CP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'CP';

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    const checkpoints = [
      profile.company_name,
      profile.industry,
      profile.company_size,
      profile.year_founded,
      profile.address,
      profile.city,
      profile.country,
      profile.description,
      profile.website,
      profile.linkedin_url,
      profile.rep_first_name,
      profile.rep_last_name,
    ];

    const completed = checkpoints.filter((value) => String(value || '').trim().length > 0).length;
    return Math.round((completed / checkpoints.length) * 100);
  }, [profile]);

  const handleToggleEdit = async () => {
    if (!profile) return;

    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('employers')
        .update({
          company_name: profile.company_name,
          tagline: profile.tagline,
          description: profile.description,
          industry: profile.industry,
          website: profile.website,
          company_size: profile.company_size,
          year_founded: profile.year_founded,
          address: profile.address,
          city: profile.city,
          country: profile.country,
          zip_code: profile.zip_code,
          linkedin_url: profile.linkedin_url,
          facebook_url: profile.facebook_url,
          logo_url: profile.logo_url,
          rep_first_name: profile.rep_first_name,
          rep_last_name: profile.rep_last_name,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Company profile updated successfully',
      });
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLogoConfirm = async () => {
    if (!profile || !selectedLogoFile) {
      toast({
        title: 'Error',
        description: 'Please select a logo file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingLogo(true);

      const fileName = `${profile.id}_${Date.now()}_${selectedLogoFile.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('companys_logo')
        .upload(fileName, selectedLogoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('companys_logo')
        .getPublicUrl(fileName);

      const logoUrl = publicUrlData.publicUrl;

      setProfile({ ...profile, logo_url: logoUrl });
      setIsEditing(true);
      setShowEditConfirm(false);
      setSelectedLogoFile(null);

      toast({
        title: 'Logo Uploaded',
        description: 'Click Save Changes to persist your update',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteLogoConfirm = async () => {
    if (!profile) return;

    try {
      if (profile.logo_url) {
        const urlParts = profile.logo_url.split('/companys_logo/');
        if (urlParts.length > 1) {
          const fileName = urlParts[1];
          await supabase.storage.from('companys_logo').remove([fileName]);
        }
      }

      setProfile({ ...profile, logo_url: '' });
      setIsEditing(true);
      setShowDeleteConfirm(false);

      toast({
        title: 'Logo Removed',
        description: 'Click Save Changes to persist your update',
      });
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete logo. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderCompanyInfo = () =>
    profile ? (
      <div className="space-y-6">
        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
              <Building className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Company Information</h4>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.company_name ?? ''}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Industry</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.industry ?? ''}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Company Size</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.company_size ?? ''}
                  onChange={(e) => setProfile({ ...profile, company_size: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Founded</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.year_founded ?? ''}
                  onChange={(e) => setProfile({ ...profile, year_founded: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Headquarters</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.city ?? ''}
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
                  value={profile.country ?? ''}
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
              <Briefcase className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Company Description</h4>
          </div>
          <Textarea
            value={profile.description ?? ''}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            disabled={!isEditing}
            rows={5}
            className="resize-none rounded-xl border-orange-200 bg-orange-50/30 focus:border-orange-400 focus:ring-orange-400"
          />
        </section>

        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
              <Globe className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Online Presence</h4>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.website ?? ''}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">LinkedIn</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.linkedin_url ?? ''}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    ) : null;

  const renderContact = () =>
    profile ? (
      <div className="space-y-6">
        <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
              <Users className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Representative Information</h4>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">First Name</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.rep_first_name ?? ''}
                  onChange={(e) => setProfile({ ...profile, rep_first_name: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Last Name</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={profile.rep_last_name ?? ''}
                  onChange={(e) => setProfile({ ...profile, rep_last_name: e.target.value })}
                  disabled={!isEditing}
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                <Input
                  value={user?.email ?? ''}
                  disabled
                  className="h-11 rounded-xl border-orange-200 bg-orange-50/30 pl-10 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
            </div>

           
          </div>
        </section>
      </div>
    ) : null;

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
            <Shield className="h-4 w-4" />
            Update Password
          </Button>
        </div>
      </section>

    
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'company':
        return renderCompanyInfo();
      case 'contact':
        return renderContact();
      case 'security':
        return renderSecurity();
      default:
        return renderCompanyInfo();
    }
  };

  if (isLoading) {
    return (
      <RecruiterAdminLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </RecruiterAdminLayout>
    );
  }

  return (
    <RecruiterAdminLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Company Profile
              </div>
              <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
                Company Profile
              </h1>
              <p className="max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage your company identity, team contact information, and account controls in one unified workspace.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                Profile completion: {profileCompletion}%
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-4">
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setShowEditConfirm(true)}
                    className="relative flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-orange-100 bg-orange-50 text-lg font-bold text-orange-700 shadow-md transition-all hover:shadow-lg hover:ring-2 hover:ring-orange-400"
                  >
                    {profile?.logo_url ? (
                      <img src={profile.logo_url} alt="Company logo" className="h-full w-full object-cover" />
                    ) : (
                      companyInitials
                    )}
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-center text-xs font-bold text-white">Click to<br />reload</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110"
                    title="Delete logo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-slate-900">{profile?.company_name}</p>
                  <p className="truncate text-sm font-semibold text-orange-600">{profile?.industry}</p>
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
                  Keep your company profile updated for stronger matching
                </div>
              </div>

              <Button
                onClick={handleToggleEdit}
                disabled={isSaving || !profile}
                className="w-full gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
              >
                {isSaving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
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
          <div className="grid h-12 min-w-[560px] w-full grid-cols-3 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg'
                    : 'text-orange-700 hover:bg-orange-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl sm:p-8">{renderContent()}</div>
      </div>
      <AlertDialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-slate-900">
              <Edit3 className="h-5 w-5 text-orange-600" />
              Upload Company Logo
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select an image file to upload as your company logo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="pb-4">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedLogoFile(e.target.files?.[0] || null)}
              className="rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
            />
            {selectedLogoFile && (
              <p className="mt-2 text-sm text-slate-600">Selected: {selectedLogoFile.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEditLogoConfirm}
              disabled={isUploadingLogo || !selectedLogoFile}
              className="rounded-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {isUploadingLogo ? 'Uploading...' : 'Upload & Confirm'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-slate-900">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Delete Company Logo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your company logo. You can always upload a new one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="rounded-full">Keep Logo</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLogoConfirm} className="rounded-full bg-red-600 hover:bg-red-700">
              Delete Logo
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </RecruiterAdminLayout>
  );
}
