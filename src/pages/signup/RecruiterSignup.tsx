import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";
import bcrypt from "bcryptjs";

const steps = [
  { title: "Account Setup", description: "Step 1 of 4 (Essential)" },
  { title: "Company Basics", description: "Step 2 of 4 (Essential)" },
  { title: "Company Profile", description: "Step 3 of 4 (Optional)" },
  { title: "Review & Submit", description: "Step 4 of 4" },
];

const EmployerSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const [form, setForm] = useState({
    repFirstName: "",
    repLastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    industry: "",
    city: "",
    country: "",
    companyTagline: "",
    companyDescription: "",
    website: "",
    companySize: "",
    yearFounded: "",
    address: "",
    zipCode: "",
    linkedinUrl: "",
    facebookUrl: "",
    logoUrl: "",
    logoFile: null as File | null,
  });

  const handleChange = (field: string, value: string | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  };

  const validateStep = async (nextStep: number) => {
    setIsValidating(true);
    try {
      if (nextStep === 2) {
        if (!form.repFirstName.trim() || !form.repLastName.trim() || !form.email.trim()) {
          toast({ title: "Missing required fields", description: "Representative first name, last name, and email are required." });
          return false;
        }

        if (form.password.length < 8) {
          toast({ title: "Weak password", description: "Password must be at least 8 characters." });
          return false;
        }

        if (form.password !== form.confirmPassword) {
          toast({ title: "Password mismatch", description: "Password and confirm password do not match." });
          return false;
        }

        // Check if email already exists
        const normalizedEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
        const { data: existingUsers, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("email", normalizedEmail)
          .limit(1);

        if (checkError) {
          toast({ title: "Error", description: "Failed to verify email. Please try again." });
          return false;
        }

        if (existingUsers && existingUsers.length > 0) {
          toast({ title: "Email already registered", description: "This email is already in use. Please use a different email." });
          return false;
        }
      }

      if (nextStep === 3 && !form.companyName.trim()) {
        toast({ title: "Missing company name", description: "Company name is required." });
        return false;
      }

      return true;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.companyName.trim()) {
      toast({ title: "Missing company name", description: "Company name is required." });
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");

      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingUserError) {
        toast({ title: "Signup failed", description: existingUserError.message });
        return;
      }

      if (existingUser?.id) {
        toast({ title: "Email already exists", description: "Please use another email or sign in." });
        return;
      }

      const passwordHash = await bcrypt.hash(form.password, 10);

      const { data: createdUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: normalizedEmail,
          password_hash: passwordHash,
          user_role: "superadmin",
          is_active: true,
          email_verified: false,
          profile_completed: false,
        })
        .select("id")
        .single();

      if (userError || !createdUser?.id) {
        toast({ title: "Signup failed", description: userError?.message || "Could not create user." });
        return;
      }

      // Upload logo if file is provided
      let logoUrl = "";
      if (form.logoFile) {
        try {
          const fileExtension = form.logoFile.name.split('.').pop();
          const timestamp = Date.now();
          const filePath = `company_logo_${timestamp}.${fileExtension}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('companys_logo')
            .upload(filePath, form.logoFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            toast({ title: "Logo upload failed", description: uploadError.message });
            return;
          }

          const { data: publicUrlData } = supabase.storage
            .from('companys_logo')
            .getPublicUrl(filePath);

          logoUrl = publicUrlData.publicUrl;
        } catch (logoError) {
          toast({ title: "Logo upload error", description: logoError instanceof Error ? logoError.message : "Failed to upload logo" });
          return;
        }
      }

      const { error: employerError } = await supabase
        .from("employers")
        .insert({
          user_id: createdUser.id,
          company_name: form.companyName.trim(),
          tagline: toNullable(form.companyTagline),
          description: toNullable(form.companyDescription),
          industry: toNullable(form.industry),
          website: toNullable(form.website),
          company_size: toNullable(form.companySize),
          year_founded: toNullable(form.yearFounded),
          address: toNullable(form.address),
          city: toNullable(form.city),
          country: toNullable(form.country),
          zip_code: toNullable(form.zipCode),
          linkedin_url: toNullable(form.linkedinUrl),
          facebook_url: toNullable(form.facebookUrl),
          logo_url: toNullable(logoUrl),
          rep_first_name: toNullable(form.repFirstName),
          rep_last_name: toNullable(form.repLastName),
        });

      if (employerError) {
        toast({ title: "Signup failed", description: employerError.message });
        return;
      }

      toast({ title: "Account created", description: "Employer account created successfully. Please sign in." });
      navigate("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected signup error";
      toast({ title: "Signup failed", description: message });
    } finally {
      setIsSubmitting(false);
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
                <div className="flex justify-center mb-6">
                  {steps.map((entry, idx) => (
                    <div
                      key={entry.title}
                      className={`w-6 h-6 rounded-full flex items-center justify-center mx-1 text-xs font-bold border-2 ${
                        step === idx + 1 ? "bg-orange-500 text-white border-orange-500" : "bg-white text-orange-500 border-orange-200"
                      }`}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>

                {step === 1 && (
                  <form className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="repFirstName">Representative First Name</Label>
                        <Input id="repFirstName" disabled={isValidating || isSubmitting} value={form.repFirstName} onChange={(e) => handleChange("repFirstName", e.target.value)} required className="bg-orange-50" />
                      </div>
                      <div>
                        <Label htmlFor="repLastName">Representative Last Name</Label>
                        <Input id="repLastName" disabled={isValidating || isSubmitting} value={form.repLastName} onChange={(e) => handleChange("repLastName", e.target.value)} required className="bg-orange-50" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Company Email</Label>
                      <Input id="email" type="email" disabled={isValidating || isSubmitting} value={form.email} onChange={(e) => handleChange("email", e.target.value)} autoComplete="email" required className="bg-orange-50" />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <PasswordInput id="password" disabled={isValidating || isSubmitting} value={form.password} onChange={(e) => handleChange("password", e.target.value)} required className="bg-orange-50" />
                      <p className="text-xs text-gray-500 mt-1">Use at least 8 characters.</p>
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <PasswordInput id="confirmPassword" disabled={isValidating || isSubmitting} value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} required className="bg-orange-50" />
                    </div>
                    <Button 
                      type="button" 
                      className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 mt-2"
                      disabled={isValidating}
                      onClick={async () => {
                        if (await validateStep(2)) {
                          setStep(2);
                        }
                      }}
                    >
                      {isValidating ? "Checking Email..." : "Continue"}
                    </Button>
                  </form>
                )}

                {step === 2 && (
                  <form className="space-y-5">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" disabled={isValidating || isSubmitting} value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)} required className="bg-orange-50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input id="industry" disabled={isValidating || isSubmitting} value={form.industry} onChange={(e) => handleChange("industry", e.target.value)} placeholder="Technology, Finance..." className="bg-orange-50" />
                      </div>
                      <div>
                        <Label htmlFor="companySize">Company Size</Label>
                        <Input id="companySize" type="number" disabled={isValidating || isSubmitting} value={form.companySize} onChange={(e) => handleChange("companySize", e.target.value)} placeholder="e.g., 50" min="1" className="bg-orange-50" />
                      </div>
                    </div>
                    <div>
                      <Label className="block mb-2">Company Logo (Optional)</Label>
                      <div className="flex items-center gap-4 p-4 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50">
                        {form.logoFile && (
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(form.logoFile)}
                              alt="Logo preview"
                              className="h-20 w-20 object-cover rounded border border-orange-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleChange("logoFile", null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        {!form.logoFile && (
                          <div className="h-20 w-20 bg-orange-100 rounded flex items-center justify-center border border-orange-300">
                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {form.logoFile ? '✓ Logo selected' : 'Select your company logo'}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            JPEG, PNG, WebP or SVG • Max 5MB
                          </p>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
                                if (!allowedTypes.includes(file.type)) {
                                  toast({ title: "Invalid file type", description: "Please upload JPEG, PNG, WebP, or SVG." });
                                  return;
                                }
                                const maxSize = 5 * 1024 * 1024;
                                if (file.size > maxSize) {
                                  toast({ title: "File too large", description: "Maximum size is 5MB." });
                                  return;
                                }
                                handleChange("logoFile", file);
                              }
                            }}
                            className="hidden"
                            id="logoInput"
                            disabled={isValidating || isSubmitting}
                          />
                          <Button
                            type="button"
                            onClick={() => document.getElementById('logoInput')?.click()}
                            disabled={isValidating || isSubmitting}
                            variant="outline"
                            size="sm"
                            className="bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700"
                          >
                            {form.logoFile ? 'Change Logo' : 'Choose File'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" disabled={isValidating || isSubmitting} value={form.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Street address" className="bg-orange-50" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" disabled={isValidating || isSubmitting} value={form.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="City" className="bg-orange-50" />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" disabled={isValidating || isSubmitting} value={form.country} onChange={(e) => handleChange("country", e.target.value)} placeholder="Country" className="bg-orange-50" />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input id="zipCode" disabled={isValidating || isSubmitting} value={form.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} placeholder="ZIP" className="bg-orange-50" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button 
                        type="button" 
                        className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4"
                        disabled={isValidating}
                        onClick={async () => {
                          if (await validateStep(3)) {
                            setStep(3);
                          }
                        }}
                      >
                        {isValidating ? "Validating..." : "Next"}
                      </Button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form className="space-y-5">
                    <div>
                      <Label htmlFor="companyTagline">Company Tagline</Label>
                      <Input id="companyTagline" disabled={isSubmitting} value={form.companyTagline} onChange={(e) => handleChange("companyTagline", e.target.value)} placeholder="e.g., Scaling startups with world-class talent" className="bg-orange-50" />
                    </div>
                    <div>
                      <Label htmlFor="companyDescription">Company Description</Label>
                      <Textarea id="companyDescription" disabled={isSubmitting} value={form.companyDescription} onChange={(e) => handleChange("companyDescription", e.target.value)} maxLength={1000} rows={4} className="bg-orange-50" placeholder="Tell us about your company, mission, and what you do..." />
                      <div className="text-xs text-gray-400 text-right">{form.companyDescription.length}/1000</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" disabled={isSubmitting} value={form.website} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://example.com" className="bg-orange-50" />
                      </div>
                      <div>
                        <Label htmlFor="yearFounded">Year Founded</Label>
                        <Input id="yearFounded" disabled={isSubmitting} value={form.yearFounded} onChange={(e) => handleChange("yearFounded", e.target.value)} placeholder="2020" className="bg-orange-50" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                      <Input id="linkedinUrl" disabled={isSubmitting} value={form.linkedinUrl} onChange={(e) => handleChange("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/company/yourcompany" className="bg-orange-50" />
                    </div>
                    <div>
                      <Label htmlFor="facebookUrl">Facebook URL</Label>
                      <Input id="facebookUrl" disabled={isSubmitting} value={form.facebookUrl} onChange={(e) => handleChange("facebookUrl", e.target.value)} placeholder="https://facebook.com/yourcompany" className="bg-orange-50" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="w-full" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button type="button" className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4" onClick={() => setStep(4)}>
                        Next
                      </Button>
                    </div>
                  </form>
                )}

                {step === 4 && (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-900">Required data is complete. Optional company profile fields can be updated later.</p>
                    </div>
                    <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 space-y-2 text-sm">
                      <p><span className="font-semibold">Representative:</span> {form.repFirstName || "-"} {form.repLastName || ""}</p>
                      <p><span className="font-semibold">Email:</span> {form.email || "-"}</p>
                      <p><span className="font-semibold">Company:</span> {form.companyName || "-"}</p>
                      <p><span className="font-semibold">Industry:</span> {form.industry || "-"}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" className="w-full" onClick={() => setStep(3)}>
                        Back
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4">
                        {isSubmitting ? "Creating account..." : "Create Employer Account"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
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

export default EmployerSignup;
