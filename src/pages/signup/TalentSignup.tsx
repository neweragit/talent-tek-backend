import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, MapPin, Briefcase, FileText, Upload, File as FileIcon, MessageSquare, CheckCircle2, X, CreditCard, LogOut, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TalentSignup = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [hasCarteEntrepreneur, setHasCarteEntrepreneur] = useState(false);
  const [showJobTypeError, setShowJobTypeError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    city: "",
    currentPosition: "",
    yearsOfExperience: "",
    educationLevel: "",
    jobTypes: [] as string[],
    workLocation: [] as string[],
    shortBio: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    acceptTerms: false,
    consentSharing: false,
    consentEmail: false,
  });

  const totalSteps = 6;
  const progressPercentage = (step / totalSteps) * 100;

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const arr = prev[field as keyof typeof prev] as string[];
      if (checked) {
        return { ...prev, [field]: [...arr, value] };
      } else {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      }
    });
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async () => {
    if (!formData.acceptTerms || !formData.consentSharing) {
      toast({
        title: "Please accept required terms",
        description: "You must accept all required terms to complete registration.",
        variant: "destructive",
      });
      return;
    }

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
      const user = await authApi.signup({
        email: formData.email,
        password: formData.password,
        user_role: 'talent',
        profile_data: {
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone_number: formData.phoneNumber,
          city: formData.city,
          current_position: formData.currentPosition,
          years_of_experience: formData.yearsOfExperience,
          education_level: formData.educationLevel,
          job_types: formData.jobTypes,
          work_location: formData.workLocation,
          short_bio: formData.shortBio,
          linkedin_url: formData.linkedinUrl,
          github_url: formData.githubUrl,
          portfolio_url: formData.portfolioUrl,
          has_carte_entrepreneur: hasCarteEntrepreneur,
          skills: skills,
        },
      });

      if (!user) {
        toast({
          title: "Signup failed",
          description: "Unable to create account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Login after signup
      await login({ email: formData.email, password: formData.password });
      
      toast({
        title: "Account created successfully!",
        description: "Welcome to TalenTek",
      });
      
      // Small delay for better UX
      setTimeout(() => {
        navigate('/talent/overview');
      }, 1000);
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "An error occurred during signup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">
              Step {step} of {totalSteps}
            </p>
            <p className="text-sm font-semibold text-primary">{Math.round(progressPercentage)}% Complete</p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 && "Create Your Account"}
                {step === 2 && "Upload Your CV"}
                {step === 3 && "Personal Information"}
                {step === 4 && "Professional Profile"}
                {step === 5 && "Professional Links (Optional)"}
                {step === 6 && "Terms & Consent"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Let's start with the basics"}
                {step === 2 && "Your CV helps us match you with the right opportunities"}
                {step === 3 && "Tell us about yourself"}
                {step === 4 && "Your skills and preferences"}
                {step === 5 && "Connect your professional profiles"}
                {step === 6 && "Review and accept our terms"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Account Setup */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <PasswordInput
                        id="password"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <PasswordInput
                        id="confirmPassword"
                        className="pl-10"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => setStep(2)} 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={!formData.email || !formData.password || !formData.confirmPassword}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 2: CV Upload */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setCvFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="cv-upload"
                    />
                    <label htmlFor="cv-upload" className="cursor-pointer block">
                      {cvFile ? (
                        <div className="space-y-2">
                          <FileIcon className="w-16 h-16 mx-auto text-primary" />
                          <p className="font-medium text-slate-900">{cvFile.name}</p>
                          <p className="text-sm text-slate-600">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <Button type="button" variant="outline" size="sm">Change File</Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-16 h-16 mx-auto text-slate-400" />
                          <p className="font-medium text-slate-900">Click to upload your CV</p>
                          <p className="text-sm text-slate-600">PDF, DOC, or DOCX (Max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="w-full" disabled={isSubmitting}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => setStep(3)} 
                      className="w-full bg-gradient-primary hover:opacity-90"
                      disabled={!cvFile || isSubmitting}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Personal Information */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        id="city"
                        className="pl-10"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="New York"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPosition">Current Position</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        id="currentPosition"
                        className="pl-10"
                        value={formData.currentPosition}
                        onChange={(e) => handleChange('currentPosition', e.target.value)}
                        placeholder="Software Developer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">Experience *</Label>
                      <Select onValueChange={(value) => handleChange('yearsOfExperience', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-1">0-1 years</SelectItem>
                          <SelectItem value="1-3">1-3 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5-10">5-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="educationLevel">Education *</Label>
                      <Select onValueChange={(value) => handleChange('educationLevel', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high-school">High School</SelectItem>
                          <SelectItem value="associate">Associate Degree</SelectItem>
                          <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                          <SelectItem value="master">Master's Degree</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep(4)}
                      className="w-full bg-gradient-primary hover:opacity-90"
                      disabled={!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.city || !formData.yearsOfExperience || !formData.educationLevel}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Professional Profile */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Skills *</Label>
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Type a skill and press Enter (e.g., React, Python)"
                    />
                    <p className="text-xs text-muted-foreground">Press Enter to add each skill</p>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <div
                            key={skill}
                            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {skill}
                            <X
                              className="w-4 h-4 cursor-pointer hover:text-primary/70"
                              onClick={() => handleRemoveSkill(skill)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Preferred Job Types *</Label>
                    <p className="text-xs text-muted-foreground mb-1">You can select multiple job types.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {['Full-time', 'Part-time', 'Contract', 'Freelance'].map((type) => (
                        <label
                          key={type}
                          className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors ${showJobTypeError && formData.jobTypes.length === 0 ? 'border-red-500' : ''}`}
                        >
                          <Checkbox
                            checked={formData.jobTypes.includes(type)}
                            onCheckedChange={(checked) => handleCheckboxChange('jobTypes', type, checked as boolean)}
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                    {showJobTypeError && formData.jobTypes.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Please select at least one job type.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Work Location Preferences *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Remote', 'Hybrid', 'On-site'].map((location) => (
                        <label
                          key={location}
                          className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                        >
                          <Checkbox
                            checked={formData.workLocation.includes(location)}
                            onCheckedChange={(checked) => handleCheckboxChange('workLocation', location, checked as boolean)}
                          />
                          <span className="text-sm">{location}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortBio">Short Bio (Optional)</Label>
                    <Textarea
                      id="shortBio"
                      value={formData.shortBio}
                      onChange={(e) => handleChange('shortBio', e.target.value)}
                      placeholder="Tell us about yourself, your experience, and what you're looking for..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">{formData.shortBio.length}/500</p>
                  </div>

                  <div className="border-2 border-primary bg-primary/5 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={hasCarteEntrepreneur}
                        onCheckedChange={(checked) => setHasCarteEntrepreneur(checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <span className="font-semibold text-primary">Entrepreneur Card Holder</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          I have a valid Carte Entrepreneur (Entrepreneur Card)
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(3)} className="w-full">
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (formData.jobTypes.length === 0) {
                          setShowJobTypeError(true);
                          return;
                        }
                        setShowJobTypeError(false);
                        setStep(5);
                      }}
                      className="w-full bg-gradient-primary hover:opacity-90"
                      disabled={skills.length === 0 || formData.workLocation.length === 0}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Professional Links */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">GitHub URL</Label>
                    <Input
                      id="githubUrl"
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => handleChange('githubUrl', e.target.value)}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                    <Input
                      id="portfolioUrl"
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💡 Adding professional links helps employers learn more about your work
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="w-full" disabled={isSubmitting}>
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)} className="w-full bg-gradient-primary hover:opacity-90" disabled={isSubmitting}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 6: Terms & Consent */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      ℹ️ Please review and accept our terms before continuing.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm border">
                    <h3 className="font-semibold text-slate-900 mb-2">Short Terms & Consent</h3>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
                      <li>Your data is used for job matching and recruitment only.</li>
                      <li>Your profile and CV are shared only with verified employers and partners.</li>
                      <li>You can update or delete your data at any time.</li>
                      <li>You may withdraw consent by updating your profile or contacting support.</li>
                      <li>Your data is protected and never sold to third parties.</li>
                    </ul>
                  </div>
                  <div className={`space-y-3`}>
                    <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:border-primary transition-colors">
                      <Checkbox
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => handleChange('acceptTerms', checked as boolean)}
                        className="mt-0.5"
                      />
                      <span className="text-sm">
                        <strong>I accept the Terms & Conditions *</strong>
                        <br />
                        <span className="text-muted-foreground">Required to create an account</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:border-primary transition-colors">
                      <Checkbox
                        checked={formData.consentSharing}
                        onCheckedChange={(checked) => handleChange('consentSharing', checked as boolean)}
                        className="mt-0.5"
                      />
                      <span className="text-sm">
                        <strong>I consent to profile sharing *</strong>
                        <br />
                        <span className="text-muted-foreground">Allow TalenTek partners to view your profile for job matching</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:border-primary transition-colors">
                      <Checkbox
                        checked={formData.consentEmail}
                        onCheckedChange={(checked) => handleChange('consentEmail', checked as boolean)}
                        className="mt-0.5"
                      />
                      <span className="text-sm">
                        <strong>Email notifications</strong>
                        <br />
                        <span className="text-muted-foreground">Receive job opportunities and updates (optional)</span>
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(5)} className="w-full" disabled={isSubmitting}>
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      className="w-full bg-gradient-primary hover:opacity-90"
                      disabled={!formData.acceptTerms || !formData.consentSharing || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TalentSignup;
