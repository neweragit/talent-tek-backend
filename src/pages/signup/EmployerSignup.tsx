import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Briefcase, Globe, User, CheckCircle, Loader2 } from "lucide-react";
import { Plan } from "@/lib/types";

// Helper to upload file to Supabase Storage
async function uploadProfileImage(file: File, employerId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `logos/${employerId}.${fileExt}`;
  const { error } = await supabase.storage.from('companys_logo').upload(filePath, file, {
    upsert: true,
  });
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('companys_logo').getPublicUrl(filePath);
  return publicUrlData?.publicUrl || null;
}

const EmployerSignup = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
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
    plan: "",
    planId: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Load plans on component mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { plansApi } = await import('@/lib/api');
      const data = await plansApi.getAll({ target_user_type: 'employer', is_active: true });
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error loading plans',
        description: 'Could not load subscription plans. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call real signup API
      const { authApi } = await import('@/lib/api');
      
      // Check if email exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();
      
      if (existingUser) {
        toast({ 
          title: 'Signup failed', 
          description: 'Email already exists.',
          variant: 'destructive'
        });
        return;
      }

      const user = await authApi.signup({
        email: formData.email,
        password: formData.password,
        user_role: 'superadmin',
        profile_data: {
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
          rep_first_name: formData.firstName,
          rep_last_name: formData.lastName,
        },
      });

      if (!user) {
        toast({
          title: 'Signup failed',
          description: 'Could not create account. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Upload logo if present
      if (logoFile && user.profile) {
        console.log('Uploading logo for employer ID:', user.profile.id);
        const logo_url = await uploadProfileImage(logoFile, user.profile.id);
        console.log('Logo URL received:', logo_url);
        if (logo_url) {
          // Update employer with logo URL
          const { data, error } = await supabase
            .from('employers')
            .update({ logo_url })
            .eq('id', user.profile.id);
          
          if (error) {
            console.error('Error updating logo URL:', error);
          } else {
            console.log('Logo URL updated successfully:', data);
          }
        } else {
          console.error('Failed to get logo URL from upload');
        }
      } else {
        console.log('No logo file or profile:', { logoFile: !!logoFile, profile: !!user.profile });
      }

      // Create subscription if plan selected
      if (formData.planId && user.profile) {
        const { subscriptionsApi } = await import('@/lib/api');
        const selectedPlan = plans.find(p => p.id === formData.planId);
        
        if (selectedPlan) {
          const expiresAt = new Date();
          if (selectedPlan.billing_cycle === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else if (selectedPlan.billing_cycle === 'annually') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else if (selectedPlan.billing_cycle === 'quarterly') {
            expiresAt.setMonth(expiresAt.getMonth() + 3);
          }

          await subscriptionsApi.create({
            plan_id: formData.planId,
            employer_id: user.profile.id,
            status: 'active',
            auto_renew: true,
            expires_at: expiresAt.toISOString(),
          });
        }
      }

      // Login after completing all setup
      await login({ email: formData.email, password: formData.password });
      
      toast({
        title: "Company account created!",
        description: "Welcome to TalenTek",
      });
      
      navigate('/employer-admin/overview');
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during signup. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr,300px] gap-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 && "Account Setup"}
                {step === 2 && "Company Details"}
                {step === 3 && "Company Contact"}
                {step === 4 && "Plan & Confirmation"}
              </CardTitle>
              <CardDescription>Step {step} of 4</CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Company Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput 
                      id="password" 
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <PasswordInput 
                      id="confirmPassword" 
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full bg-gradient-primary hover:opacity-90">
                    Continue
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-orange-600" />
                      Company Name
                    </Label>
                    <Input 
                      id="companyName" 
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Company Tagline</Label>
                    <Input 
                      id="tagline" 
                      value={formData.tagline}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      placeholder="e.g., Scaling Startups with World-Class Talent"
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Tell us about your company, mission, and what you do..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={5}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">{formData.description.length}/1000</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select onValueChange={(value) => handleChange('industry', value)}>
                      <SelectTrigger>
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
                    <Label htmlFor="planId">Subscription Plan</Label>
                    {loadingPlans ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                      </div>
                    ) : (
                      <Select onValueChange={(value) => handleChange('planId', value)} value={formData.planId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{plan.display_name}</span>
                                <span className="ml-2 text-sm text-gray-500">
                                  ${plan.price}/{plan.billing_cycle === 'monthly' ? 'mo' : plan.billing_cycle === 'annually' ? 'yr' : plan.billing_cycle}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {formData.planId && (
                      <p className="text-sm text-gray-600 mt-2">
                        {plans.find(p => p.id === formData.planId)?.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => setStep(1)} variant="outline" className="w-full">
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="w-full bg-gradient-primary hover:opacity-90">
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-orange-600" />
                      Website
                    </Label>
                    <Input 
                      id="website" 
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size</Label>
                      <Select onValueChange={(value) => handleChange('companySize', value)}>
                        <SelectTrigger>
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
                      <Label htmlFor="yearFounded">Year Founded</Label>
                      <Input 
                        id="yearFounded" 
                        type="number"
                        placeholder="2020"
                        value={formData.yearFounded}
                        onChange={(e) => handleChange('yearFounded', e.target.value)}
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input 
                      id="address" 
                      placeholder="123 Main Street, Suite 100"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        placeholder="New York"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input 
                        id="country" 
                        placeholder="United States"
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input 
                        id="zipCode" 
                        placeholder="10018"
                        value={formData.zipCode}
                        onChange={(e) => handleChange('zipCode', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input 
                      id="linkedinUrl" 
                      type="url"
                      placeholder="https://linkedin.com/company/yourcompany"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook URL</Label>
                    <Input 
                      id="facebookUrl" 
                      type="url"
                      placeholder="https://facebook.com/yourcompany"
                      value={formData.facebookUrl}
                      onChange={(e) => handleChange('facebookUrl', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => setStep(2)} variant="outline" className="w-full">
                      Back
                    </Button>
                    <Button onClick={() => setStep(4)} className="w-full bg-gradient-primary hover:opacity-90">
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  {formData.planId && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Selected Plan: {plans.find(p => p.id === formData.planId)?.display_name}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {plans.find(p => p.id === formData.planId)?.description}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="logo">Upload Company Logo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setLogoFile(e.target.files[0]);
                          } else {
                            setLogoFile(null);
                          }
                        }}
                      />
                      <label htmlFor="logo" className="cursor-pointer block">
                        {logoFile ? (
                          <div className="text-sm">
                            <p className="font-medium text-primary">{logoFile.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <p className="font-medium">Drag and drop or click to upload</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or GIF (max 5MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      ✓ You're almost done! Review your information and create your employer account.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => setStep(3)} variant="outline" className="w-full">
                      Back
                    </Button>
                    <Button onClick={handleSubmit} className="w-full bg-gradient-primary hover:opacity-90">
                      Create Employer Account
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="bg-card rounded-lg p-6 shadow-card">
              <h3 className="font-semibold mb-3">Hiring top talent?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your employer account and access our global talent pool.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Post unlimited job listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>AI-powered candidate matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Manage interviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Access verified profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Analytics dashboard</span>
                </li>
              </ul>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerSignup;
