import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

export default function OwnerLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, logout, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === "owner" || user.role === "superadmin") {
      navigate("/owner/dashboard", { replace: true });
    }
  }, [navigate, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      const normalizedEmail = form.email.trim().toLowerCase().replace(/\s+/g, "");
      const trimmedPassword = form.password.trim();

      const canCallRpc = typeof (supabase as { rpc?: unknown }).rpc === "function";
      let dbUser: DbUserRow | null = null;

      if (canCallRpc) {
        // Only track login attempts for existing users.
        const { data: existingUser, error: existingUserError } = await supabase
          .from("users")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existingUserError || !existingUser?.id) {
          toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
          return;
        }

        // Best-effort cleanup: remove stale attempt rows (older than 7 days) for this email.
        try {
          const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          await supabase
            .from("login_attempts")
            .delete()
            .eq("email", normalizedEmail)
            .lt("last_attempt_at", cutoff);
        } catch {
          // ignore (RLS/policies may block deletes)
        }

        let { data, error } = await supabase
          .rpc("verify_user_login", {
            p_email: normalizedEmail,
            p_password: trimmedPassword,
            p_ip_address: null,
          })
          .maybeSingle();

        if (
          error &&
          /function\s+public\.verify_user_login\(p_email\s*=>\s*text,\s*p_password\s*=>\s*text,\s*p_ip_address\s*=>\s*unknown\)\s+does not exist/i.test(
            error.message
          )
        ) {
          const fallback = await supabase
            .rpc("verify_user_login", {
              p_email: normalizedEmail,
              p_password: trimmedPassword,
            })
            .maybeSingle();

          data = fallback.data;
          error = fallback.error;
        }

        if (error) {
          toast({
            title: "Login failed",
            description: error.message || "Unable to reach authentication service",
            variant: "destructive",
          });
          return;
        }

        dbUser = (data as DbUserRow | null) ?? null;
      } else {
        const { data: fallbackUser, error: userError } = await supabase
          .from("users")
          .select("id,email,password_hash,user_role")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (userError || !fallbackUser) {
          toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
          return;
        }

        const passwordMatches = await bcrypt.compare(trimmedPassword, fallbackUser.password_hash || "");
        if (!passwordMatches) {
          toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
          return;
        }

        dbUser = {
          id: fallbackUser.id ?? null,
          email: fallbackUser.email ?? null,
          user_role: (fallbackUser.user_role as DbUserRole | null) ?? null,
          auth_status: "success",
          remaining_attempts: 0,
          locked_until: null,
        };
      }

      if (!dbUser || dbUser.auth_status === "invalid_credentials") {
        const attempts = dbUser?.remaining_attempts ?? 0;
        toast({
          title: "Login failed",
          description: attempts
            ? `Invalid credentials. ${attempts} attempt${attempts === 1 ? "" : "s"} remaining.`
            : "Invalid credentials.",
          variant: "destructive",
        });
        return;
      }

      if (dbUser.auth_status === "locked") {
        const lockedUntilText = dbUser.locked_until ? new Date(dbUser.locked_until).toLocaleString() : "later";
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

      if (dbUser.user_role !== "owner") {
        toast({
          title: "Login not allowed here",
          description: "Only owner accounts can sign in from /owner/login.",
          variant: "destructive",
        });
        return;
      }

      login({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.email.split("@")[0],
        role: "owner",
      });

      // Best-effort: clear attempt state after a successful login.
      try {
        await supabase.from("login_attempts").delete().eq("email", normalizedEmail);
      } catch {
        // ignore (RLS/policies may block deletes)
      }

      toast({ title: "Welcome back", description: "Owner login successful." });

      const redirectFromState = (location.state as { redirectTo?: string } | null)?.redirectTo;
      navigate(redirectFromState ?? "/owner/dashboard");
    } catch (error) {
      console.error("Owner login error:", error);
      toast({
        title: "Login error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Navbar />

      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 pt-32 pb-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-md mx-auto">
            <Card className="w-full shadow-2xl border-orange-200">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Owner Portal</CardTitle>
                  <CardDescription className="text-gray-600">
                    Secure access for TalenTek platform owner
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {user && user.role !== "owner" && user.role !== "superadmin" ? (
                  <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">You’re currently signed in.</div>
                    <div className="mt-1">
                      Log out to sign in to the Owner Portal.
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3 w-full rounded-full border-orange-300 text-orange-700 hover:bg-orange-100"
                      onClick={() => {
                        logout();
                        navigate("/owner/login", { replace: true });
                      }}
                    >
                      Logout and continue
                    </Button>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                          <Mail className="w-4 h-4 text-orange-500" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="owner@talentek.com"
                          className="mt-2"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                          <Lock className="w-4 h-4 text-orange-500" />
                          Password
                        </Label>
                        <PasswordInput
                          id="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Enter your password"
                          className="mt-2"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-primary hover:opacity-90 text-white py-6 text-lg font-semibold shadow-glow"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                    <div className="mt-6 text-center text-xs text-gray-500">
                      <p className="flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" />
                        Protected by enterprise-level security
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
