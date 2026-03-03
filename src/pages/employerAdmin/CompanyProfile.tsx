import { useState, useEffect } from "react";
import EmployerAdminLayout from "@/components/layouts/EmployerAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Globe, MapPin, Users, Calendar, Linkedin, Facebook, Save, Upload, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function CompanyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    description: "",
    industry: "",
    website: "",
    companySize: "",
    yearFounded: "",
    address: "",
    city: "",
    country: "",
    zipCode: "",
    linkedinUrl: "",
    facebookUrl: "",
    logoUrl: "",
    repFirstName: "",
    repLastName: "",
  });

  useEffect(() => {
    if (user?.id) {
      loadCompanyProfile();
    }
  }, [user]);

  const loadCompanyProfile = async () => {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setFormData({
        companyName: data.company_name || "",
        tagline: data.tagline || "",
        description: data.description || "",
        industry: data.industry || "",
        website: data.website || "",
        companySize: data.company_size || "",
        yearFounded: data.year_founded || "",
        address: data.address || "",
        city: data.city || "",
        country: data.country || "",
        zipCode: data.zip_code || "",
        linkedinUrl: data.linkedin_url || "",
        facebookUrl: data.facebook_url || "",
        logoUrl: data.logo_url || "",
        repFirstName: data.rep_first_name || "",
        repLastName: data.rep_last_name || "",
      });
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (employerId: string): Promise<string | null> => {
    if (!logoFile) return null;
    const fileExt = logoFile.name.split('.').pop();
    const filePath = `logos/${employerId}.${fileExt}`;
    const { error } = await supabase.storage.from('companys_logo').upload(filePath, logoFile, {
      upsert: true,
    });
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data: publicUrlData } = supabase.storage.from('companys_logo').getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Get employer ID first
    const { data: employerData } = await supabase
      .from('employers')
      .select('id')
      .eq('user_id', user?.id)
      .single();
    
    if (!employerData) {
      toast({
        title: "Error",
        description: "Could not find employer profile.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    let logo_url = formData.logoUrl;
    if (logoFile) {
      const uploaded = await uploadLogo(employerData.id);
      if (uploaded) {
        logo_url = uploaded;
      }
    }

    const { error } = await supabase
      .from('employers')
      .update({
        company_name: formData.companyName,
        tagline: formData.tagline,
        description: formData.description,
        industry: formData.industry,
        website: formData.website,
        company_size: formData.companySize,
        year_founded: formData.yearFounded,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        zip_code: formData.zipCode,
        linkedin_url: formData.linkedinUrl,
        facebook_url: formData.facebookUrl,
        logo_url,
        rep_first_name: formData.repFirstName,
        rep_last_name: formData.repLastName,
      })
      .eq('user_id', user?.id);

    setLoading(false);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update company profile.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Company profile updated successfully.",
      });
      loadCompanyProfile();
    }
  };

  return (
    <EmployerAdminLayout>
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Company Profile</h1>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          <p className="text-gray-600">Manage your company information and branding</p>
        </div>

        <div className="space-y-6">
          {/* Company Logo Section */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="w-6 h-6 text-primary" />
                Company Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-start gap-8">
                <div className="flex-shrink-0">
                  <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Company Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label className="text-base font-semibold text-gray-900">Company Logo</Label>
                    <p className="text-sm text-gray-600 mb-3">Upload your company logo for a professional appearance</p>
                    <div className="flex items-center gap-3">
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        className="border-primary text-primary hover:bg-orange-50 hover:text-primary"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                      {logoFile && (
                        <span className="text-sm text-gray-600">
                          {logoFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG or GIF (max 5MB) • Recommended: 400x400px</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Briefcase className="w-6 h-6 text-primary" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="repFirstName" className="text-sm font-semibold text-gray-900">Representative First Name</Label>
                  <Input
                    id="repFirstName"
                    value={formData.repFirstName}
                    onChange={(e) => handleChange('repFirstName', e.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repLastName" className="text-sm font-semibold text-gray-900">Representative Last Name</Label>
                  <Input
                    id="repLastName"
                    value={formData.repLastName}
                    onChange={(e) => handleChange('repLastName', e.target.value)}
                    className="border-gray-300"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-semibold text-gray-900">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Enter your company name"
                  className="border-gray-300 text-lg font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline" className="text-sm font-semibold text-gray-900">Company Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="e.g., Scaling Startups with World-Class Talent"
                  maxLength={120}
                  className="border-gray-300"
                />
                <p className="text-xs text-gray-500">{formData.tagline.length}/120 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-900">Company Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Tell us about your company, mission, and what you do..."
                  rows={6}
                  maxLength={1000}
                  className="border-gray-300 resize-none"
                />
                <p className="text-xs text-gray-500">{formData.description.length}/1000 characters</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Industry
                  </Label>
                  <Select value={formData.industry} onValueChange={(value) => handleChange('industry', value)}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className="border-gray-300"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companySize" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Company Size
                  </Label>
                  <Select value={formData.companySize} onValueChange={(value) => handleChange('companySize', value)}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearFounded" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Year Founded
                  </Label>
                  <Input
                    id="yearFounded"
                    type="number"
                    value={formData.yearFounded}
                    onChange={(e) => handleChange('yearFounded', e.target.value)}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="w-6 h-6 text-primary" />
                Location & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-900">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Main Street, Suite 100"
                  className="border-gray-300"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-900">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="New York"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold text-gray-900">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="United States"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-semibold text-gray-900">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                    placeholder="10018"
                    className="border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Globe className="w-6 h-6 text-primary" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  LinkedIn URL
                </Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebookUrl" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  Facebook URL
                </Label>
                <Input
                  id="facebookUrl"
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => handleChange('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/yourcompany"
                  className="border-gray-300"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button at Bottom */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-gradient-primary text-white px-8 py-6 text-lg"
              size="lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? "Saving Changes..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </div>
    </EmployerAdminLayout>
  );
}