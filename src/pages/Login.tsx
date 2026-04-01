import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

type DbUserRole =
  | "superadmin"
  | "admin"
  | "owner"
  | "talent"
  | "employer"
  | "recruiter"
  | "interviewer"
  | "technical"
  | "leadership";
type AppUserRole =
  | "superadmin"
  | "talent"
  | "recruiter"
  | "technical-interviewer"
  | "leadership-interviewer"
  | "owner";

type InterviewType = "technical" | "leadership" | "talent-acquisition";

interface DbUserRow {
  id: string | null;
  email: string | null;
  user_role: DbUserRole | null;
  auth_status: "success" | "locked" | "invalid_credentials";
  remaining_attempts: number;
  locked_until: string | null;
}

const mockLoginRoleByEmail: Record<string, AppUserRole> = {
  "superadmin@talenteck.tech": "superadmin",
  "talent@talenteck.tech": "talent",
  "employer@talenteck.tech": "recruiter",
  "recruiter@talentek.tech": "recruiter",
  "technicalinterviewer@talenteck.tech": "technical-interviewer",
  "leadershipinterviewer@talenteck.tech": "leadership-interviewer",
  "owner@talenteck.tech": "owner",
};

const getDefaultRedirectByRole = (role: AppUserRole) => {
  switch (role) {
    case "superadmin":
      return "/recruiter-admin/overview";
    case "talent":
      return "/talent/overview";
    case "recruiter":
      return "/recruiter/overview";
    case "technical-interviewer":
      return "/technical-interviewer/overview";
    case "leadership-interviewer":
      return "/leadership-interviewer/overview";
    case "owner":
      return "/owner/dashboard";
    default:
      return "/";
  }
};

const isAllowedGenericLoginRole = (role: AppUserRole) => role === "superadmin" || role === "talent";

const mapDbRoleToAppRole = async (user: DbUserRow): Promise<AppUserRole> => {
  if (user.user_role === "technical") {
    return "technical-interviewer";
  }

  if (user.user_role === "leadership") {
    return "leadership-interviewer";
  }

  if (user.user_role === "interviewer") {
    const { data: interviewer, error } = await supabase
      .from("interviewers")
      .select("interview_type")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to resolve interviewer type:", error.message);
      return "technical-interviewer";
    }

    const interviewType = interviewer?.interview_type as InterviewType | undefined;
    return interviewType === "leadership" ? "leadership-interviewer" : "technical-interviewer";
  }

  if (user.user_role === "superadmin" || user.user_role === "admin") {
    return "superadmin";
  }

  if (user.user_role === "owner") {
    return "owner";
  }

  if (user.user_role === "employer" || user.user_role === "recruiter") {
    const { data: teamMember, error } = await supabase
      .from("employer_team_members")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to resolve employer team role:", error.message);
      return "recruiter";
    }

    return "recruiter";
  }

  return "talent";
};

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase().replace(/\s+/g, "");
      const trimmedPassword = password.trim();

      const canCallRpc = typeof (supabase as { rpc?: unknown }).rpc === "function";

      if (!canCallRpc) {
        const mockRole = mockLoginRoleByEmail[normalizedEmail];

        if (!mockRole || trimmedPassword !== "password123") {
          toast({
            title: "Login failed",
            description: "This login is only for superadmin and talent accounts.",
          });
          return;
        }

        if (!isAllowedGenericLoginRole(mockRole)) {
          toast({
            title: "Login not allowed here",
            description: "Only superadmin and talent roles can sign in from /login.",
          });
          return;
        }

        const redirectFromState = (location.state as { redirectTo?: string } | null)?.redirectTo;
        const redirect = redirectFromState ?? getDefaultRedirectByRole(mockRole);
        login({
          id: `mock-${normalizedEmail}`,
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          role: mockRole,
        });
        toast({ title: "Logged in successfully", description: "Welcome back!" });
        navigate(redirect);
        return;
      }

      // Debug only: print hash comparison details in browser console.
      // NOTE: This is for troubleshooting and should be removed in production.
      try {
        const { data: debugUser } = await supabase
          .from("users")
          .select("password_hash")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (debugUser?.password_hash) {
          const recomputedHash = await bcrypt.hash(trimmedPassword, debugUser.password_hash);
          const compareResult = await bcrypt.compare(trimmedPassword, debugUser.password_hash);

          console.log("[LOGIN DEBUG] Stored hash:", debugUser.password_hash);
          console.log("[LOGIN DEBUG] Recomputed hash (same salt):", recomputedHash);
          console.log("[LOGIN DEBUG] Hash strings equal:", recomputedHash === debugUser.password_hash);
          console.log("[LOGIN DEBUG] bcrypt.compare result:", compareResult);
        } else {
          console.log("[LOGIN DEBUG] No user/hash found for:", normalizedEmail);
        }
      } catch (debugError) {
        console.log("[LOGIN DEBUG] Could not run debug hash check:", debugError);
      }

      let { data: user, error } = await supabase
        .rpc("verify_user_login", {
          p_email: normalizedEmail,
          p_password: trimmedPassword,
          p_ip_address: null,
        })
        .maybeSingle();

      if (error && /function\s+public\.verify_user_login\(p_email\s*=>\s*text,\s*p_password\s*=>\s*text,\s*p_ip_address\s*=>\s*unknown\)\s+does not exist/i.test(error.message)) {
        const fallback = await supabase
          .rpc("verify_user_login", {
            p_email: normalizedEmail,
            p_password: trimmedPassword,
          })
          .maybeSingle();

        user = fallback.data;
        error = fallback.error;
      }

      if (error) {
        toast({ title: "Login failed", description: error.message || "Unable to reach authentication service" });
        return;
      }

      const dbUser = user as DbUserRow | null;

      if (!dbUser || dbUser.auth_status === "invalid_credentials") {
        const attempts = dbUser?.remaining_attempts ?? 0;
        console.error('❌ Login failed - Invalid credentials for email:', normalizedEmail);
        console.error('Attempts remaining:', attempts);
        toast({
          title: "Login failed",
          description: `Invalid credentials. ${attempts} attempt${attempts === 1 ? "" : "s"} remaining. Make sure you used the same password as signup.`,
        });
        return;
      }

      if (dbUser.auth_status === "locked") {
        const lockedUntilText = dbUser.locked_until
          ? new Date(dbUser.locked_until).toLocaleString()
          : "later";
        toast({
          title: "Account temporarily locked",
          description: `Too many attempts. Try again after ${lockedUntilText}.`,
        });
        return;
      }

      if (!dbUser.id || !dbUser.email || !dbUser.user_role) {
        toast({ title: "Login failed", description: "Authentication response is incomplete" });
        return;
      }

      const role = await mapDbRoleToAppRole(dbUser);

      if (!isAllowedGenericLoginRole(role)) {
        toast({
          title: "Login not allowed here",
          description: "Only superadmin and talent roles can sign in from /login.",
        });
        return;
      }

      const redirectFromState = (location.state as { redirectTo?: string } | null)?.redirectTo;
      const redirect = redirectFromState ?? getDefaultRedirectByRole(role);

      login({ id: dbUser.id, email: dbUser.email, name: dbUser.email.split("@")[0], role });
      toast({ title: "Logged in successfully", description: "Welcome back!" });
      navigate(redirect);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected login error";
      toast({ title: "Login failed", description: message });
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
                <CardTitle className="text-4xl sm:text-5xl font-bold tracking-tighter leading-tight text-slate-900 mb-2">Welcome Back</CardTitle>
                <CardDescription className="text-sm sm:text-base leading-relaxed text-gray-700">Sign in to your TalenTek account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-12 text-sm sm:text-base border-0 focus:ring-2 focus:ring-orange-500 bg-orange-50 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-medium text-gray-700">Password</Label>
                    <PasswordInput 
                      id="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-12 text-sm sm:text-base border-0 focus:ring-2 focus:ring-orange-500 bg-orange-50 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                      <input type="checkbox" className="rounded border-orange-200 focus:ring-orange-500" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="text-orange-600 hover:underline font-medium">
                      Forgot password?
                    </a>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 text-base disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-orange-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-600">Or continue with</span>
                  </div>
                </div>

                <Button className="w-full rounded-full border-2 border-orange-500 text-orange-600 px-8 py-4 font-bold hover:bg-orange-50 transition-all duration-300 text-base flex items-center justify-center opacity-100 !bg-white !from-white !to-white">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>

                <div className="mt-4 text-xs sm:text-sm">
                  <p className="font-medium mb-2">Test Credentials (password: <span className="font-mono">password123</span>)</p>
                  <ul className="space-y-1">
                    <li><span className="font-mono">superadmin@talenteck.tech</span> → /owner/dashboard</li>
                    <li><span className="font-mono">talent@talenteck.tech</span> → /talent/overview</li>
                    <li><span className="font-mono">recruiter@talentek.tech</span> → use recruiter login (separate page)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
