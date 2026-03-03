import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login({ email: form.email, password: form.password });
      
      if (success) {
        toast({
          title: "Logged in successfully",
          description: "Welcome to Owner Portal",
        });
        navigate("/owner/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-orange-200">
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
        </CardContent>
      </Card>
    </div>
  );
}
