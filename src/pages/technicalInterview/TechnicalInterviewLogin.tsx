import Navbar from "@/components/Navbar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Video, Users, Calendar, FileText, Eye, EyeOff, UserCheck, Search, MessageSquare, Target } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TechnicalInterviewLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    
    setError("");
    setIsLoading(true);
    
    try {
      const success = await login({ email, password });
      
      if (success) {
        // Check if user is actually a technical interviewer
        const userRole = localStorage.getItem('userRole');
        const interviewerType = localStorage.getItem('interviewerType');
        
        if (userRole === 'interviewer' && interviewerType === 'technical') {
          toast({
            title: "Welcome back!",
            description: "Successfully logged into Technical Interview portal",
          });
          navigate("/technical-interviewer/overview");
        } else {
          setError("Access denied. This portal is for Technical interviewers only.");
          // Optionally redirect to appropriate portal
          if (userRole === 'interviewer') {
            switch (interviewerType) {
              case 'talent-acquisition':
                navigate('/talent-acquisition/overview');
                break;
              case 'leadership':
                navigate('/leadership-interviewer/overview');
                break;
              default:
                navigate('/technical-interviewer/overview');
            }
          } else {
            navigate('/login');
          }
        }
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (error: any) {
      if (error?.message === 'ACCOUNT_INACTIVE') {
        setError("Your account has been deactivated. Please contact admin@talentek.com for assistance.");
      } else {
        setError("An error occurred during login. Please try again.");
      }
    } finally {
      setIsLoading(false);
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
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop" 
                  alt="Technical interview coding session"
                  className="w-full h-64 object-cover rounded-2xl shadow-lg mb-8"
                />
              </div>
              <CardTitle className="text-3xl font-bold mb-8" style={{ color: '#f93712' }}>
                What You Can Do
              </CardTitle>
              <ul className="space-y-8 text-lg text-black dark:text-slate-300">
                <li className="flex items-start gap-4">
                  <UserCheck className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#f93712' }} />
                  <div>
                    <h4 className="font-semibold text-xl mb-2">Conduct Technical Interviews</h4>
                    <p className="text-base dark:text-slate-400">
                      Lead technical interviews to assess candidates' programming skills, algorithmic thinking, and software development expertise.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Search className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#f93712' }} />
                  <div>
                    <h4 className="font-semibold text-xl mb-2">Code Review & Analysis</h4>
                    <p className="text-base dark:text-slate-400">
                      Evaluate candidates' coding solutions, analyze their approach to problem-solving, and assess code quality.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <MessageSquare className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#f93712' }} />
                  <div>
                    <h4 className="font-semibold text-xl mb-2">Technical Feedback</h4>
                    <p className="text-base dark:text-slate-400">
                      Provide detailed technical evaluations covering algorithms, system design, and coding proficiency.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Target className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#f93712' }} />
                  <div>
                    <h4 className="font-semibold text-xl mb-2">Skills Assessment</h4>
                    <p className="text-base dark:text-slate-400">
                      Evaluate technical competencies, data structures knowledge, and ability to solve complex programming challenges.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Calendar className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#f93712' }} />
                  <div>
                    <h4 className="font-semibold text-xl mb-2">Schedule Management</h4>
                    <p className="text-base dark:text-slate-400">
                      Manage your interview calendar, track upcoming sessions, and coordinate with the hiring team.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <FileText className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: '#f93712' }} />
                  <div>
                    <h4 className="font-semibold text-xl mb-2">Technical Reports</h4>
                    <p className="text-base dark:text-slate-400">
                      Generate comprehensive technical evaluation reports with detailed coding assessment and recommendations.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Login Form - Right Side */}
            <div className="flex flex-col justify-center p-12">
              <div className="text-center mb-8">
                <CardTitle className="text-4xl font-bold mb-4" style={{ color: '#f93712' }}>
                  Technical Interview Login
                </CardTitle>
                <p className="text-lg text-gray-600 dark:text-slate-400 font-medium">
                  Access your technical interview dashboard
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-[#f93712] rounded-xl"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔒
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 text-base border-2 border-gray-200 focus:border-[#f93712] rounded-xl"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {error && (
                  <p className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {error}
                  </p>
                )}
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: '#f93712',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {isLoading ? "Signing in..." : "Login to Dashboard"}
                </Button>
              </form>
              
              <div className="text-center mt-8">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Need help accessing your account?{' '}
                  <a href="/contact" className="font-semibold hover:underline" style={{ color: '#f93712' }}>
                    Contact Support
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TechnicalInterviewLogin;