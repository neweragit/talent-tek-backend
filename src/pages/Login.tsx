import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login({ email, password });
      
      if (success) {
        toast({
          title: "Logged in successfully",
          description: `Welcome back!`,
        });
        
        // Navigate based on user role
        const userRole = localStorage.getItem('userRole');
        switch (userRole) {
          case 'owner':
            navigate('/owner/dashboard');
            break;
          case 'superadmin':
          case 'admin':
            navigate('/employer-admin/overview');
            break;
          case 'employer':
            navigate('/employer/overview');
            break;
          case 'interviewer':
            // Check interviewer type to route to correct dashboard
            const interviewerType = localStorage.getItem('interviewerType');
            switch (interviewerType) {
              case 'talent-acquisition':
                navigate('/talent-acquisition/overview');
                break;
              case 'leadership':
                navigate('/leadership-interviewer/overview');
                break;
              case 'technical':
              default:
                navigate('/technical-interviewer/overview');
                break;
            }
            break;
          case 'talent':
          default:
            navigate('/talent/overview');
            break;
        }
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Check if account is inactive
      if (error?.message === 'ACCOUNT_INACTIVE') {
        toast({
          title: "Account Inactive",
          description: "Your account has been deactivated. Please contact the administrator at admin@talentek.com for assistance.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An error occurred during login. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Sign in to your TalenTek account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput 
                    id="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Test Accounts</span>
                </div>
              </div>

              <div className="space-y-2 text-sm bg-muted/30 p-4 rounded-lg">
                <p className="font-semibold">Quick Login:</p>
                <p className="text-xs">Email: abderraouf.education@gmail.com</p>
                <p className="text-xs">Password: password123</p>
                <p className="text-xs text-muted-foreground mt-2">
                  More test accounts in database
                </p>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/get-started" className="text-primary hover:underline font-medium">
                  Get Started
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
