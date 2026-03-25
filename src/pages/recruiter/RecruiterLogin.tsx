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
import bcrypt from "bcryptjs";

const RecruiterLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const normalizedEmail = email.trim().toLowerCase();

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id,email,password_hash,user_role")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (userError || !user) {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      const passwordMatches = await bcrypt.compare(password, user.password_hash || "");
      if (!passwordMatches) {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      if (user.user_role !== "recruiter") {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      login({
        id: user.id,
        email: user.email,
        name: user.email.split("@")[0],
        role: user.user_role as any,
      });

      toast({
        title: "Welcome back",
        description: "Recruiter login successful.",
      });

      navigate("/recruiter/overview");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recruiter@talentek.tech"
                  required
                  disabled={isLoading}
                  className="h-12 border-0 bg-orange-50 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recruiter-password">Password</Label>
                <PasswordInput
                  id="recruiter-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  required
                  disabled={isLoading}
                  className="h-12 border-0 bg-orange-50 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 py-4 font-bold text-white hover:from-orange-500 hover:to-orange-400 disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
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

