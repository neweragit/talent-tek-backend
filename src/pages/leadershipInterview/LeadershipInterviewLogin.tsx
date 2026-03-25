import Navbar from "@/components/Navbar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle, Video, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LeadershipInterviewLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Please enter a valid password (minimum 6 characters).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, password_hash, user_role, is_active")
        .eq("email", normalizedEmail)
        .eq("user_role", "interviewer")
        .limit(1)
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        setError("No interviewer account found with this email address.");
        return;
      }

      if (!userData.is_active) {
        setError("Your account is inactive. Please contact your recruiter.");
        return;
      }

      const passwordMatch = await bcrypt.compare(password, userData.password_hash);

      if (!passwordMatch) {
        setError("Invalid email or password.");
        return;
      }

      const { data: interviewerData, error: interviewerError } = await supabase
        .from("interviewers")
        .select("id, full_name, interview_type, status")
        .eq("user_id", userData.id)
        .eq("interview_type", "leadership")
        .limit(1)
        .maybeSingle();

      if (interviewerError) throw interviewerError;

      if (!interviewerData) {
        setError("Leadership interviewer profile not found.");
        return;
      }

      if (interviewerData.status !== "active") {
        setError("Your interviewer profile is inactive.");
        return;
      }

      login({
        id: userData.id,
        email: userData.email,
        name: interviewerData.full_name,
        role: "leadership-interviewer",
      });

      toast({
        title: "Success",
        description: `Welcome back, ${interviewerData.full_name}!`,
      });

      navigate("/leadership-interviewer/overview");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
      <Navbar />
      <div className="container mx-auto mt-16 flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-5xl rounded-3xl border-2 bg-white/95 shadow-2xl dark:bg-slate-900/95" style={{ borderColor: "#f93712" }}>
          <div className="grid gap-0 md:grid-cols-2">
            <div className="rounded-l-3xl bg-gradient-to-br from-[#f93712]/10 to-[#f93712]/5 p-8 sm:p-10">
              <div className="mb-8">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop"
                  alt="Leadership interview"
                  className="h-64 w-full rounded-2xl object-cover shadow-lg"
                />
              </div>
              <CardTitle className="mb-6 text-3xl font-bold" style={{ color: "#f93712" }}>
                Leadership Interviews
              </CardTitle>
              <ul className="space-y-4 text-base text-slate-800">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5" style={{ color: "#f93712" }} />
                  <span>Perform leadership interviews.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5" style={{ color: "#f93712" }} />
                  <span>Review each candidate and record feedback.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Video className="mt-0.5 h-5 w-5" style={{ color: "#f93712" }} />
                  <span>Use Google Meet for interview sessions.</span>
                </li>
              </ul>

              <div className="mt-8 rounded-xl bg-[#fff5f2] p-4" style={{ border: "1px solid #ffe6df" }}>
                <div className="flex items-center gap-3 text-black">
                  <Video className="h-6 w-6" style={{ color: "#f93712" }} />
                  <span className="font-medium">Google Meet is used for all interview sessions.</span>
                </div>
              </div>
            </div>

            <CardContent className="p-8 sm:p-10">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f93712] shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="mb-2 text-center text-3xl font-bold" style={{ color: "#f93712" }}>
                Leadership Interviewer Login
              </CardTitle>
              <p className="mb-8 text-center text-base text-muted-foreground">Access your dashboard</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Email Address</label>
                  <Input
                    type="email"
                    placeholder="leadership.interviewer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                    style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-12"
                      style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-600" /> : <Eye className="h-5 w-5 text-gray-600" />}
                    </button>
                  </div>
                </div>

                {error ? <div className="text-base font-medium text-red-500">{error}</div> : null}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl text-lg shadow-lg hover:opacity-90"
                  style={{ background: "#f93712", color: "#fff", fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LeadershipInterviewLogin;

