import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import sha256 from 'crypto-js/sha256';
import { Briefcase, CheckCircle, ArrowLeft } from "lucide-react";
import OwnerLayout from "@/components/layouts/OwnerLayout";

export default function OwnerAddEmployer() {
  const [step, setStep] = useState(1);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
    subscriptionType: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.' });
      return;
    }

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.companyName) {
      toast({ title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }

    // 1. Hash password
    const password_hash = sha256(formData.password).toString();
    
    // 2. Check if email exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', formData.email)
      .maybeSingle();
      
    if (existingUser) {
      toast({ title: 'Error', description: 'Email already exists.' });
      return;
    }
    
    // 3. Insert into users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email: formData.email,
          password_hash,
          user_role: 'recruiter',
          is_active: true,
          email_verified: false,
          profile_completed: true,
          first_name: formData.firstName,
          last_name: formData.lastName,
        }
      ])
      .select();
      
    if (userError || !userData || !userData[0]) {
      toast({ title: 'Error', description: userError?.message || 'Could not create user.' });
      return;
    }
    
    const user_id = userData[0].id;
    
    // 4. Insert into employers table
    const { error: empError } = await supabase
      .from('employers')
      .insert([
        {
          user_id,
          company_name: formData.companyName,
          tagline: formData.tagline,
          description: formData.description,
          industry: formData.industry,
          subscription_type: formData.subscriptionType || 'Free',
          subscription_start_date: formData.subscriptionStartDate || null,
          subscription_end_date: formData.subscriptionEndDate || null,
          plan: formData.subscriptionType || 'Free',
          rep_first_name: formData.firstName,
          rep_last_name: formData.lastName,
        }
      ]);
      
    if (empError) {
      toast({ title: 'Error', description: empError.message });
      return;
    }
    
    setSuccessDialogOpen(true);
  };

  return (
    <OwnerLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/owner/users')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Add New Employer</h1>
            <p className="text-gray-600 mt-2">Create a new employer account</p>
          </div>
        </div>

        <Card className="border-orange-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && "Account Setup"}
              {step === 2 && "Company Details"}
            </CardTitle>
            <CardDescription>Step {step} of 2</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Company Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <PasswordInput 
                    id="password" 
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
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
                    Company Name *
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
                    placeholder="Tell us about the company, mission, and what they do..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
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
                  <Label htmlFor="subscriptionType">Subscription Type *</Label>
                  <Select onValueChange={(value) => handleChange('subscriptionType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscription" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionStartDate">Subscription Start Date</Label>
                    <Input
                      id="subscriptionStartDate"
                      type="date"
                      value={formData.subscriptionStartDate}
                      onChange={(e) => handleChange('subscriptionStartDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionEndDate">Subscription End Date</Label>
                    <Input
                      id="subscriptionEndDate"
                      type="date"
                      value={formData.subscriptionEndDate}
                      onChange={(e) => handleChange('subscriptionEndDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setStep(1)} variant="outline" className="w-full">
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

        {/* Success Dialog */}
        <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <AlertDialogTitle className="text-xl">Employer Added Successfully!</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                The employer account has been created and is now active on the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => navigate('/owner/users')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Back to Users
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </OwnerLayout>
  );
}
