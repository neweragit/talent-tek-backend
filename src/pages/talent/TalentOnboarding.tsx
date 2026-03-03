import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { LogOut, CheckCircle2, Upload, X, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TalentOnboarding = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [hasCarteEntrepreneur, setHasCarteEntrepreneur] = useState(false);

  const [formData, setFormData] = useState({
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
  const [termsScrolled, setTermsScrolled] = useState(false);

  const totalSteps = 6;
  const progressPercentage = (step / totalSteps) * 100;
  const timeRemaining = Math.max(1, 7 - step);

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
        title: "Please accept terms",
        description: "You must accept all required terms to complete registration.",
      });
      return;
    }

    toast({
      title: "Profile completed!",
      description: "Welcome to TalenTek! Your profile is now complete.",
    });
    navigate("/talent/overview");
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Complete Your Profile</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Required to access TalenTek features</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white dark:bg-slate-800 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Step {step} of {totalSteps}
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-500">
                  ~{timeRemaining} min remaining
                </span>
              </p>
            </div>
            <p className="text-sm font-semibold text-primary">{Math.round(progressPercentage)}% Complete</p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardContent className="pt-8">
            {/* Step 1: Welcome */}
            {step === 1 && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to TalenTek</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Let's set up your profile to connect you with amazing job opportunities.
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 text-left space-y-3">
                  <p className="font-semibold text-slate-900 dark:text-white">What you'll need:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">Your CV/Resume (PDF, DOC, or DOCX format)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">Basic contact information</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">Your skills and job preferences</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">About 5 minutes of your time</span>
                    </li>
                  </ul>
                </div>
                <Button onClick={() => setStep(2)} className="w-full bg-gradient-primary hover:opacity-90 h-10 text-base">
                  Get Started
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your progress is automatically saved. You can sign out and continue later.
                </p>
              </div>
            )}

            {/* Step 2: CV Upload */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload Your CV</h2>
                  <p className="text-slate-600 dark:text-slate-400">Your CV helps us match you with the right opportunities</p>
                </div>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
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
                        <div className="flex justify-center">
                          <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <p className="font-medium text-slate-900 dark:text-white">{cvFile.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <Upload className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-900 dark:text-white">Drag and drop your CV</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">or click to select</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOC, or DOCX (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="w-full bg-gradient-primary hover:opacity-90" disabled={!cvFile}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Basic Information */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Basic Information</h2>
                  <p className="text-slate-600 dark:text-slate-400">Tell us about yourself</p>
                </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPosition">Current Position</Label>
                    <Input
                      id="currentPosition"
                      value={formData.currentPosition}
                      onChange={(e) => handleChange('currentPosition', e.target.value)}
                      placeholder="Software Developer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                    <Select onValueChange={(value) => handleChange('yearsOfExperience', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
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
                    <Label htmlFor="educationLevel">Education Level</Label>
                    <Select onValueChange={(value) => handleChange('educationLevel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="master">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                    disabled={!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.city}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Professional Profile */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Professional Profile</h2>
                  <p className="text-slate-600 dark:text-slate-400">Help us understand your preferences and skills</p>
                </div>

                <div className="space-y-3">
                  <Label>Skills</Label>
                  <div className="space-y-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Type a skill and press Enter"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Add skills that best represent your expertise</p>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <div key={skill} className="bg-primary/10 text-primary rounded-full px-3 py-1 flex items-center gap-2 text-sm">
                          {skill}
                          <button onClick={() => handleRemoveSkill(skill)} className="hover:text-primary/70">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Preferred Job Types</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Full-time', 'Part-time', 'Contract', 'Freelance'].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.jobTypes.includes(type)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange('jobTypes', type, checked as boolean)
                          }
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Work Location Preferences</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Remote', 'Hybrid', 'On-site'].map((location) => (
                      <label key={location} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={formData.workLocation.includes(location)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange('workLocation', location, checked as boolean)
                          }
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formData.shortBio.length}/500</p>
                </div>

                <Card className="border-2 border-primary bg-primary/5 p-6 mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-primary">
                      <CreditCard className="w-8 h-8 text-primary" />
                      Entrepreneur Card (Carte Entrepreneur)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={hasCarteEntrepreneur}
                        onCheckedChange={(checked) => setHasCarteEntrepreneur(checked as boolean)}
                        className="mt-1 scale-125"
                      />
                      <span className="text-lg text-slate-700 dark:text-slate-300">
                        I have an Entrepreneur Card (Carte Entrepreneur)
                      </span>
                    </label>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="w-full">
                    Back
                  </Button>
                  <Button onClick={() => setStep(5)} className="w-full bg-gradient-primary hover:opacity-90">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Professional Links */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Professional Links</h2>
                  <p className="text-slate-600 dark:text-slate-400">Share your professional profiles (optional)</p>
                </div>

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
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(4)} className="w-full">
                    Back
                  </Button>
                  <Button onClick={() => setStep(6)} className="w-full bg-gradient-primary hover:opacity-90">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Terms & Consent */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Terms & Consent</h2>
                  <p className="text-slate-600 dark:text-slate-400">Please review and accept our terms to continue</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-2">
                  <span className="text-blue-600 dark:text-blue-400 text-sm flex-shrink-0">ℹ️</span>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Please scroll through all terms and conditions before accepting
                  </p>
                </div>

                <div
                  className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto space-y-6 text-sm border border-slate-200 dark:border-slate-600"
                  onScroll={(e) => {
                    const element = e.currentTarget;
                    const isAtBottom =
                      element.scrollHeight - element.scrollTop - element.clientHeight < 10;
                    if (isAtBottom) {
                      setTermsScrolled(true);
                    }
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-base">TalenTek Terms of Service</h3>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">1. Data Sharing & Job Matching</h4>
                    <p className="text-slate-700 dark:text-slate-300">By creating an account, you authorize TalenTek to:</p>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 ml-2">
                      <li>Store and process your CV and profile information</li>
                      <li>Share your profile with verified partner companies</li>
                      <li>Contact you regarding relevant job opportunities</li>
                      <li>Use your data for job matching and recruitment purposes</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">2. Your Data Rights</h4>
                    <p className="text-slate-700 dark:text-slate-300">You have the right to:</p>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 ml-2">
                      <li>Access your data at any time</li>
                      <li>Update or delete your profile</li>
                      <li>Opt-out of job matching (while keeping account)</li>
                      <li>Request data deletion (account closure)</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">3. How We Share Your Data</h4>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 ml-2">
                      <li>Your CV is shared only with verified companies</li>
                      <li>Companies must have a legitimate job opening</li>
                      <li>You can control visibility settings in your profile</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">4. Company Partners</h4>
                    <p className="text-slate-700 dark:text-slate-300">Our partner companies include:</p>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 ml-2">
                      <li>Verified employers on the TalenTek platform</li>
                      <li>Temporary staffing partners</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">5. Consent Withdrawal</h4>
                    <p className="text-slate-700 dark:text-slate-300">You may withdraw consent at any time by:</p>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 ml-2">
                      <li>Updating your profile settings</li>
                      <li>Contacting support@talentek.com</li>
                     
                                         </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">6. Data Protection</h4>
                    <p className="text-slate-700 dark:text-slate-300">
                      We are committed to protecting your personal information. Your data will be processed and stored locally within the country and handled only in accordance with applicable local data protection laws. We will not transfer your personal information internationally and will use it solely for the purposes described in these terms.
                    </p>
                  </div>
                </div>

                {!termsScrolled && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-sm flex-shrink-0">⚠️</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Please scroll to the bottom of the terms to enable the checkboxes
                    </p>
                  </div>
                )}

                <div className={`space-y-3 ${!termsScrolled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleChange('acceptTerms', checked as boolean)}
                      disabled={!termsScrolled}
                      className="mt-1"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      I accept the Terms & Conditions{" "}
                      <a href="#" className="text-primary hover:underline">
                        (View full terms)
                      </a>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={formData.consentSharing}
                      onCheckedChange={(checked) => handleChange('consentSharing', checked as boolean)}
                      disabled={!termsScrolled}
                      className="mt-1"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      I consent to sharing my CV and profile with TalenTek partner companies for job matching
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={formData.consentEmail}
                      onCheckedChange={(checked) => handleChange('consentEmail', checked as boolean)}
                      disabled={!termsScrolled}
                      className="mt-1"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      I agree to receive job opportunities and updates via email
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(5)} className="w-full">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={!formData.acceptTerms || !formData.consentSharing}
                  >
                    Complete Registration
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-4 text-xs text-slate-500 dark:text-slate-400">
          Your progress is automatically saved. You can sign out and continue later.
        </div>
      </div>
    </div>
  );
};

export default TalentOnboarding;
