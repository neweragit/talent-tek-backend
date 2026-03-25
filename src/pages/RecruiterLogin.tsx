import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

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

interface DbUserRow {
  id: string | null;
  email: string | null;
  user_role: DbUserRole | null;
  auth_status: "success" | "locked" | "invalid_credentials";
  remaining_attempts: number;
  locked_until: string | null;
}

const mockRecruiterEmails = new Set(["employer@talenteck.tech", "recruiter@talentek.tech"]);

const RecruiterLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

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
        if (!mockRecruiterEmails.has(normalizedEmail) || trimmedPassword !== "password123") {
          toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
          return;
        }

        login({
          id: `mock-${normalizedEmail}`,
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          role: "recruiter",
        });
        toast({ title: "Welcome back", description: "Recruiter login successful." });
        navigate("/recruiter/overview");
        return;
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
        toast({ title: "Login failed", description: error.message || "Unable to reach authentication service", variant: "destructive" });
        return;
      }

      const dbUser = user as DbUserRow | null;

      if (!dbUser || dbUser.auth_status === "invalid_credentials") {
        toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
        return;
      }

      if (dbUser.auth_status === "locked") {
        const lockedUntilText = dbUser.locked_until
          ? new Date(dbUser.locked_until).toLocaleString()
          : "later";
        toast({
          title: "Account temporarily locked",
          description: `Too many attempts. Try again after ${lockedUntilText}.`,
          variant: "destructive",
        });
        return;
      }

      if (!dbUser.id || !dbUser.email || !dbUser.user_role) {
        toast({ title: "Login failed", description: "Authentication response is incomplete", variant: "destructive" });
        return;
      }

      if (dbUser.user_role !== "recruiter" && dbUser.user_role !== "employer") {
        toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
        return;
      }

      login({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.email.split("@")[0],
        role: "recruiter",
      });

      toast({ title: "Welcome back", description: "Recruiter login successful." });
      navigate("/recruiter/overview");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected login error";
      toast({ title: "Login failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-3 py-24 sm:px-4">
        <Card className="w-full max-w-md rounded-[28px] border-2 border-orange-500 bg-white shadow-2xl">
          <CardHeader className="text-center p-8 pb-2">
            <CardTitle className="text-4xl font-bold tracking-tighter text-slate-900">Recruiter Login</CardTitle>
            <CardDescription className="text-sm text-gray-700">
              Sign in to your recruiter account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recruiter-email">Email Address</Label>
                <Input
                  id="recruiter-email"
                  type="email"
                  placeholder="recruiter@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-[12px] border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recruiter-password">Password</Label>
                <PasswordInput
                  id="recruiter-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-[12px] border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-[12px] bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 h-11 disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default RecruiterLogin;
