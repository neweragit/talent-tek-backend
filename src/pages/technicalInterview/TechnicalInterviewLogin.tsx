import Navbar from "@/components/Navbar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Video, Users, Calendar, FileText, Eye, EyeOff, Code, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TechnicalInterviewLogin = () => {
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

      // Query users table for interviewer account
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, password_hash, user_role")
        .eq("email", normalizedEmail)
        .eq("user_role", "interviewer")
        .limit(1)
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        setError("No interviewer account found with this email address.");
        setLoading(false);
        return;
      }

      // Verify password hash
      const passwordMatch = await bcrypt.compare(password, userData.password_hash);

      if (!passwordMatch) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Get interviewer details
      const { data: interviewerData, error: interviewerError } = await supabase
        .from("interviewers")
        .select("id, full_name, interview_type")
        .eq("user_id", userData.id)
        .limit(1)
        .maybeSingle();

      if (interviewerError) throw interviewerError;

      if (!interviewerData) {
        setError("Interviewer profile not found.");
        setLoading(false);
        return;
      }

      // Login successful - store user in context
      login({
        id: userData.id,
        email: userData.email,
        name: interviewerData.full_name,
        role: "technical-interviewer",
      });

      toast({
        title: "Success",
        description: `Welcome back, ${interviewerData.full_name}!`,
      });

      navigate("/technical-interviewer/overview");
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
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)] mt-16">
        <Card className="w-full max-w-6xl shadow-2xl rounded-3xl border-2 bg-white/95 dark:bg-slate-900/95" style={{ borderColor: '#f93712' }}>
          <div className="grid md:grid-cols-2 gap-0">
            {/* Features List - Left Side */}
            <div className="flex flex-col justify-center items-start p-12 bg-gradient-to-br from-[#f93712]/10 to-[#f93712]/5 rounded-l-3xl">
              <div className="mb-8">
                <img 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop" 
                  alt="Technical interview"
                  className="w-full h-64 object-cover rounded-2xl shadow-lg mb-8"
                />
              </div>
              <CardTitle className="text-3xl font-bold mb-8" style={{ color: '#f93712' }}>
                What You Can Do
              </CardTitle>
              <ul className="space-y-8 text-lg text-black dark:text-slate-300">
                <li className="flex items-start gap-4">
                  <Code className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#f93712' }} />
                  <div>
                    <p className="font-semibold">Conduct Interviews</p>
                    <p className="text-sm text-gray-700">Technical assessments with candidates in real time</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#f93712' }} />
                  <div>
                    <p className="font-semibold">Review Interviews</p>
                    <p className="text-sm text-gray-700">Evaluate and provide feedback on candidate assessments</p>
                  </div>
                </li>
              </ul>
              <div className="flex items-center gap-3 mt-10 p-4 bg-[#fff5f2] rounded-xl" style={{ border: '1px solid #ffe6df' }}>
                <Video className="w-10 h-10" style={{ color: '#f93712' }} />
                <span className="text-lg text-black font-medium">
                  We use Google Meet for all interviews
                </span>
              </div>
            </div>
            {/* Login Form - Right Side */}
            <div className="flex flex-col justify-center items-center p-12">
              <div className="flex flex-col items-center mb-8 w-full">
                <div className="w-24 h-24 rounded-full bg-[#f93712] flex items-center justify-center mb-6 shadow-lg">
                  <Code className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-center mb-3" style={{ color: '#f93712' }}>
                  Technical Interviewer Login
                </CardTitle>
                <p className="text-lg text-muted-foreground text-center mb-2">
                  Access your technical assessment dashboard
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6 w-full max-w-md">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-black">Email Address</label>
                  <Input
                    type="email"
                    placeholder="technical.interviewer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-lg py-3"
                    style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-black">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="text-lg py-3 pr-12"
                      style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                {error && <div className="text-red-500 text-base font-medium">{error}</div>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full hover:opacity-90 text-xl py-4 shadow-lg rounded-xl flex items-center justify-center gap-2"
                  style={{ background: '#f93712', color: '#fff', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login to Dashboard"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TechnicalInterviewLogin;
