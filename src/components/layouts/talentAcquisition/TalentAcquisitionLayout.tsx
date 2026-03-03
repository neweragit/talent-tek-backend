import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Home, ClipboardList, User, LogOut, Users } from "lucide-react";

const TalentAcquisitionLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interviewerData, setInterviewerData] = useState<{
    full_name: string;
    company_name: string;
  } | null>(null);
  
  // Load interviewer data from database
  useEffect(() => {
    const loadInterviewerData = async () => {
      if (user?.id) {
        try {
          const { data: interviewer, error } = await supabase
            .from('interviewers')
            .select(`
              full_name,
              employers!inner (
                company_name
              )
            `)
            .eq('user_id', user.id)
            .single();

          if (!error && interviewer) {
            setInterviewerData({
              full_name: interviewer.full_name || "Sarah Johnson",
              company_name: (interviewer.employers as any)?.company_name || "TalenTek"
            });
          }
        } catch (error) {
          console.error('Error loading interviewer data:', error);
        }
      }
    };

    loadInterviewerData();
  }, [user]);

  const interviewerName = interviewerData?.full_name || "Sarah Johnson";
  const companyName = interviewerData?.company_name || "TalenTek";

  const handleLogout = () => {
    navigate("/talent-acquisition/login");
  };

  const menuItems = [
    { path: "/talent-acquisition/overview", icon: Home, label: "Overview" },
    { path: "/talent-acquisition/interviews", icon: ClipboardList, label: "TA Interviews" },
    { path: "/talent-acquisition/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-6 border-b flex justify-center items-center h-20">
          <div className="flex items-center gap-2">
            <img src="/assets/talentek-logo.png" alt="TalenTek Logo" className="h-60 w-80" />
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t mt-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="w-full gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-card px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Talent Acquisition Portal</h1>
            <p className="text-xs text-muted-foreground">Candidate Screening & Assessment</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-2 px-3 py-1">
              <Users className="w-4 h-4" />
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold">{interviewerName}</span>
                <span className="text-[10px] opacity-75">TA Interviewer</span>
              </div>
            </Badge>
            <span className="text-sm text-muted-foreground">{companyName}</span>
          </div>
        </div>
        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TalentAcquisitionLayout;