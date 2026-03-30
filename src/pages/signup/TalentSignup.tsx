import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { normalizeEmailForAuth } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { IdCard } from "lucide-react";
import bcrypt from "bcryptjs";

const steps = [
  { title: "Account Setup", description: "Create your account." },
  { title: "Upload Your CV", description: "Upload your resume." },
  { title: "Personal Information", description: "Tell us about you." },
  { title: "Professional Profile", description: "Share your experience and profile." },
  { title: "Skills & Preferences", description: "Select your skills and preferences." },
  { title: "Professional Links", description: "Add your professional links." },
  { title: "Terms & Consent", description: "Review and accept the terms." },
];

const positionOptions = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "Product Manager",
  "QA Engineer",
  "Data Analyst",
];

const experienceOptions = [
  "0-1 years",
  "2-4 years",
  "5-7 years",
  "8+ years",
];

const jobTypeOptions = ["Full-Time", "Part-Time", "Contract", "Internship"];
const workLocationOptions = ["Remote", "On-site", "Hybrid"];

const TalentSignup = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phoneNumber: "",
    city: "",
    currentPosition: "",
    yearsOfExperience: "",
    educationLevel: "",
    shortBio: "",
    skills: "",
    jobTypes: "",
    workLocation: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    hasCarteEntrepreneur: false,
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    if (error) setError("");
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = async (currentStep: number): Promise<boolean> => {
    if (currentStep === 1) {
      const normalizedEmail = normalizeEmailForAuth(form.email);
      if (!normalizedEmail || !form.password || !form.confirmPassword) {
        setError("Email, password, and confirm password are required.");
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)+$/;
      if (!emailRegex.test(normalizedEmail)) {
        setError("Please enter a valid email address.");
        return false;
      }

      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return false;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }

      // Check if email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .limit(1);

      if (checkError) {
        setError("Failed to verify email. Please try again.");
        return false;
      }

      if (existingUsers && existingUsers.length > 0) {
        setError("This email is already used. Please sign in or use another email.");
        return false;
      }

      if (normalizedEmail !== form.email) {
        setForm(prev => ({ ...prev, email: normalizedEmail }));
      }
    }

    if (currentStep === 2) {
      if (!cvFile) {
        setError("CV is required. Please upload your CV to continue.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!form.fullName.trim()) {
        setError("Full name is required.");
        return false;
      }
    }

    if (currentStep === 5) {
      const jobTypesSelected = form.jobTypes.split(",").map(v => v.trim()).filter(Boolean);
      const workLocSelected = form.workLocation.split(",").map(v => v.trim()).filter(Boolean);
      if (jobTypesSelected.length === 0) {
        setError("Please select at least one job type.");
        return false;
      }
      if (workLocSelected.length === 0) {
        setError("Please select at least one work location preference.");
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleNextStep = async () => {
    if (!(await validateStep(step))) return;
    setStep(prev => Math.min(prev + 1, steps.length));
  };

  const toggleMultiSelect = (field: "jobTypes" | "workLocation", value: string) => {
    const currentValues = form[field]
      .split(",")
      .map(v => v.trim())
      .filter(Boolean);
    const alreadySelected = currentValues.includes(value);
    const nextValues = alreadySelected
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleChange(field, nextValues.join(", "));
  };

  const uploadCVToStorage = async (
    file: File,
    userId: string,
    email: string
  ): Promise<{ ok: true; url: string } | { ok: false; message: string }> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_cv_${Date.now()}.${fileExt}`;

      // Use a safe folder name derived from email so we can find a user's files later.
      const emailFolder = email
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      const folder = emailFolder || "user";

      const { error } = await supabase.storage
        .from("cvs")
        .upload(`resumes/${folder}/${fileName}`, file);

      if (error) {
        console.error("CV upload error (bucket cvs):", error);
        const msg = error.message || "";
        if (/bucket not found|not found/i.test(msg)) {
          return {
            ok: false as const,
            message:
              'Storage bucket "cvs" was not found. Create a public bucket named exactly cvs in Supabase → Storage, then try again.',
          };
        }
        return { ok: false as const, message: msg || "CV upload failed." };
      }

      const { data: publicData } = supabase.storage
        .from("cvs")
        .getPublicUrl(`resumes/${folder}/${fileName}`);

      const url = publicData?.publicUrl;
      if (!url) return { ok: false as const, message: "Could not get a public URL for your CV." };
      return { ok: true as const, url };
    } catch (err) {
      console.error("CV upload failed:", err);
      return { ok: false as const, message: err instanceof Error ? err.message : "CV upload failed." };
    }
  };

  const handleSignup = async () => {
    try {
      setError("");
      setLoading(true);

      const normalizedEmail = normalizeEmailForAuth(form.email);

      // Validation
      if (!normalizedEmail || !form.password || !form.confirmPassword) {
        setError("Email and password are required");
        setStep(1);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)+$/;
      if (!emailRegex.test(normalizedEmail)) {
        setError("Please enter a valid email address.");
        setStep(1);
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        setStep(1);
        return;
      }

      if (!form.fullName) {
        setError("Full name is required");
        setStep(3);
        return;
      }

      if (!cvFile) {
        setError("CV is required. Please upload your CV.");
        setStep(2);
        return;
      }

      const jobTypesSelected = form.jobTypes.split(",").map(j => j.trim()).filter(Boolean);
      const workLocSelected = form.workLocation.split(",").map(w => w.trim()).filter(Boolean);
      if (jobTypesSelected.length === 0) {
        setError("Please select at least one job type.");
        setStep(5);
        return;
      }
      if (workLocSelected.length === 0) {
        setError("Please select at least one work location preference.");
        setStep(5);
        return;
      }

      // Check if email already exists
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingUserError) {
        setError(`Signup failed: ${existingUserError.message}`);
        return;
      }

      if (existingUser?.id) {
        setError("Email already exists. Please use another email or sign in.");
        return;
      }

      const passwordHash = await bcrypt.hash(form.password, 10);

      const { data: createdUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: normalizedEmail,
          password_hash: passwordHash,
          user_role: "talent",
          is_active: true,
          email_verified: false,
          profile_completed: true,
        })
        .select("id")
        .single();

      if (userError || !createdUser?.id) {
        setError(`Signup failed: ${userError?.message || "Could not create user."}`);
        return;
      }

      // Upload CV (required)
      const uploadResult = await uploadCVToStorage(cvFile, createdUser.id, normalizedEmail);
      if (uploadResult.ok === false) {
        setError(uploadResult.message);
        setStep(2);
        return;
      }
      const resumeUrl = uploadResult.url;

      // Create talent record
      const { error: talentError } = await supabase
        .from('talents')
        .insert({
          user_id: createdUser.id,
          full_name: form.fullName,
          phone_number: form.phoneNumber || null,
          city: form.city || null,
          current_position: form.currentPosition || null,
          years_of_experience: form.yearsOfExperience || null,
          education_level: form.educationLevel || null,
          short_bio: form.shortBio || null,
          skills: form.skills ? form.skills.split(',').map(s => s.trim()) : [],
          job_types: jobTypesSelected,
          work_location: workLocSelected,
          linkedin_url: form.linkedinUrl || null,
          github_url: form.githubUrl || null,
          portfolio_url: form.portfolioUrl || null,
          has_carte_entrepreneur: form.hasCarteEntrepreneur,
          resume_url: resumeUrl,
        });

      if (talentError) {
        setError(talentError.message);
        return;
      }

      // Auto-login
      const newUser = {
        id: createdUser.id,
        email: normalizedEmail,
        name: form.fullName,
        role: "talent" as const,
      };
      login(newUser);

      // Navigate to dashboard
      navigate('/talent/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 pt-32 pb-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-md mx-auto">
            <Card className="rounded-[28px] border-2 border-orange-500 bg-white shadow-2xl transition-all duration-300 overflow-hidden">
              <CardHeader className="text-center p-8 pb-2 bg-white">
                <CardTitle className="text-4xl sm:text-5xl font-bold tracking-tighter leading-tight text-slate-900 mb-2">
                  {steps[step - 1].title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed text-gray-700">
                  {steps[step - 1].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                {/* Error Message */}
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                {/* Stepper indicator intentionally hidden */}

                {/* Step 1: Account Setup */}
                {step === 1 && (
                  <form className="space-y-5">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} autoComplete="email" className="bg-orange-50" />
                    </div>
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <PasswordInput id="password" value={form.password} onChange={e => handleChange('password', e.target.value)} className="bg-orange-50" />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} className="bg-orange-50" />
                    </div>
                    <Button type="button" disabled={loading} className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 mt-2" onClick={handleNextStep}>
                      Continue
                    </Button>
                  </form>
                )}

                {/* Step 2: Upload Your CV */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mb-2 font-semibold text-lg">Your CV helps us match you with the right opportunities</div>
                      <label htmlFor="cv-upload" className="block cursor-pointer border-2 border-dashed border-orange-400 rounded-lg p-8 hover:border-orange-500 transition-colors">
                        {cvFile ? (
                          <div>
                            <div className="font-medium text-orange-700">{cvFile.name}</div>
                            <div className="text-xs text-gray-500">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</div>
                            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setCvFile(null)}>Change File</Button>
                          </div>
                        ) : (
                          <div>
                            <div className="text-orange-500 font-bold text-lg mb-2">Click to upload your CV</div>
                            <div className="text-xs text-gray-500">PDF, DOC, or DOCX (Max 10MB)</div>
                          </div>
                        )}
                        <Input
                          id="cv-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={e => {
                            setError("");
                            if (e.target.files && e.target.files[0]) {
                              const selectedFile = e.target.files[0];
                              const allowedTypes = [
                                "application/pdf",
                                "application/msword",
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                              ];
                              const maxSizeBytes = 10 * 1024 * 1024;

                              if (!allowedTypes.includes(selectedFile.type)) {
                                setError("Invalid CV format. Please upload PDF, DOC, or DOCX.");
                                setCvFile(null);
                                return;
                              }

                              if (selectedFile.size > maxSizeBytes) {
                                setError("CV file is too large. Maximum size is 10MB.");
                                setCvFile(null);
                                return;
                              }

                              setCvFile(selectedFile);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(step - 1)} className="w-full">Back</Button>
                      <Button onClick={handleNextStep} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold">Continue</Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Personal Information */}
                {step === 3 && (
                  <form className="space-y-5">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" value={form.fullName} onChange={e => handleChange('fullName', e.target.value)} className="bg-orange-50" placeholder="John Doe" />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input id="phoneNumber" value={form.phoneNumber} onChange={e => handleChange('phoneNumber', e.target.value)} className="bg-orange-50" placeholder="+1234567890" />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={form.city} onChange={e => handleChange('city', e.target.value)} className="bg-orange-50" placeholder="Algiers" />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" type="button" onClick={() => setStep(step - 1)} className="w-full">Back</Button>
                      <Button type="button" onClick={handleNextStep} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold">Continue</Button>
                    </div>
                  </form>
                )}

                {/* Step 4: Professional Profile */}
                {step === 4 && (
                  <form className="space-y-5">
                    <div>
                      <Label htmlFor="currentPosition">Current Position</Label>
                      <Input
                        id="currentPosition"
                        value={form.currentPosition}
                        list="current-position-options"
                        onChange={e => handleChange("currentPosition", e.target.value)}
                        className="bg-orange-50"
                        placeholder="e.g., Senior Developer"
                      />
                      <datalist id="current-position-options">
                        {positionOptions.map(option => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                      <Input
                        id="yearsOfExperience"
                        value={form.yearsOfExperience}
                        list="experience-options"
                        onChange={e => handleChange("yearsOfExperience", e.target.value)}
                        className="bg-orange-50"
                        placeholder="e.g., 5 years"
                      />
                      <datalist id="experience-options">
                        {experienceOptions.map(option => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <Label htmlFor="educationLevel">Education Level</Label>
                      <Input id="educationLevel" value={form.educationLevel} onChange={e => handleChange('educationLevel', e.target.value)} className="bg-orange-50" placeholder="e.g., Bachelor's Degree" />
                    </div>
                    <div>
                      <Label htmlFor="shortBio">Short Bio</Label>
                      <Input id="shortBio" value={form.shortBio} onChange={e => handleChange('shortBio', e.target.value)} className="bg-orange-50" placeholder="Tell us about yourself..." />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" type="button" onClick={() => setStep(step - 1)} className="w-full">Back</Button>
                      <Button type="button" onClick={handleNextStep} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold">Continue</Button>
                    </div>
                  </form>
                )}

                {/* Step 5: Skills & Preferences */}
                {step === 5 && (
                  <form className="space-y-5">
                    <div>
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Input id="skills" value={form.skills} onChange={e => handleChange('skills', e.target.value)} className="bg-orange-50" placeholder="e.g., React, Node.js, Python" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none text-slate-900">Interested Job Types *</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">Select all that apply.</p>
                      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Interested job types">
                        {jobTypeOptions.map(option => {
                          const selected = form.jobTypes.split(",").map(v => v.trim()).includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleMultiSelect("jobTypes", option)}
                              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${selected ? "border-orange-500 bg-orange-500 text-white shadow-sm" : "border-orange-100 bg-orange-50/80 text-slate-800 hover:border-orange-200"}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none text-slate-900">Preferred Work Location *</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">Select all that apply.</p>
                      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Preferred work location">
                        {workLocationOptions.map(option => {
                          const selected = form.workLocation.split(",").map(v => v.trim()).includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleMultiSelect("workLocation", option)}
                              className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${selected ? "border-orange-500 bg-orange-500 text-white shadow-sm" : "border-orange-100 bg-orange-50/80 text-slate-800 hover:border-orange-200"}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        id="carteEntrepreneur"
                        checked={form.hasCarteEntrepreneur}
                        onChange={e => handleChange("hasCarteEntrepreneur", e.target.checked)}
                        className="sr-only peer"
                      />
                      <label
                        htmlFor="carteEntrepreneur"
                        className="flex gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all bg-gradient-to-br from-orange-50/90 to-white border-orange-100 hover:border-orange-300 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-400 peer-checked:border-orange-500 peer-checked:ring-1 peer-checked:ring-orange-200"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                          <IdCard className="h-6 w-6" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">Auto-entrepreneur (Algérie)</span>
                            {form.hasCarteEntrepreneur && (
                              <span className="text-xs font-medium uppercase tracking-wide text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                            I am registered in Algeria as an <span className="font-medium text-slate-800">auto-entrepreneur</span> (carte d’entrepreneur).
                            This helps employers know I can work as an independent contractor where it applies.
                          </p>
                        </div>
                        <div className="shrink-0 flex items-start pt-1">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${form.hasCarteEntrepreneur ? "border-orange-600 bg-orange-600 text-white" : "border-orange-200 bg-white"}`}
                            aria-hidden
                          >
                            {form.hasCarteEntrepreneur ? (
                              <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : null}
                          </span>
                        </div>
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" type="button" onClick={() => setStep(step - 1)} className="w-full">Back</Button>
                      <Button type="button" onClick={handleNextStep} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold">Continue</Button>
                    </div>
                  </form>
                )}

                {/* Step 6: Professional Links */}
                {step === 6 && (
                  <form className="space-y-5">
                    <div>
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <Input id="linkedin" value={form.linkedinUrl} onChange={e => handleChange('linkedinUrl', e.target.value)} className="bg-orange-50" placeholder="https://linkedin.com/in/yourprofile" />
                    </div>
                    <div>
                      <Label htmlFor="github">GitHub Profile</Label>
                      <Input id="github" value={form.githubUrl} onChange={e => handleChange('githubUrl', e.target.value)} className="bg-orange-50" placeholder="https://github.com/yourprofile" />
                    </div>
                    <div>
                      <Label htmlFor="portfolio">Portfolio Website</Label>
                      <Input id="portfolio" value={form.portfolioUrl} onChange={e => handleChange('portfolioUrl', e.target.value)} className="bg-orange-50" placeholder="https://yourportfolio.com" />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" type="button" onClick={() => setStep(step - 1)} className="w-full">Back</Button>
                      <Button type="button" onClick={handleNextStep} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold">Continue</Button>
                    </div>
                  </form>
                )}

                {/* Step 7: Terms & Consent */}
                {step === 7 && (
                  <form className="space-y-5">
                    <div className="text-sm text-gray-700 mb-4">
                      By signing up, you agree to our{" "}
                      <a href="/terms-of-service" target="_blank" rel="noreferrer" className="text-orange-600 underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-orange-600 underline">
                        Privacy Policy
                      </a>.
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" type="button" onClick={() => setStep(step - 1)} className="w-full" disabled={loading}>Back</Button>
                      <Button type="button" onClick={handleSignup} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold" disabled={loading}>
                        {loading ? "Creating Account..." : "Complete Signup"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TalentSignup;
