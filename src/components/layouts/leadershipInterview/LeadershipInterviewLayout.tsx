import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, ClipboardList, User, LogOut, Users } from "lucide-react";

const LeadershipInterviewLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // TODO: Replace with actual interviewer name from auth context
  const interviewerName = "Sarah Johnson";

  const handleLogout = () => {
    navigate("/leadership-interviewer/login");
  };

  const menuItems = [
    { path: "/leadership-interviewer/overview", icon: Home, label: "Overview" },
    { path: "/leadership-interviewer/interviews", icon: ClipboardList, label: "Leadership Interviews" },
    { path: "/leadership-interviewer/profile", icon: User, label: "Profile" },
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
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-accent hover:text-gray-900"
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
            <h1 className="text-lg font-semibold">Leadership Interviewer Portal</h1>
            <p className="text-xs text-muted-foreground">Leadership & Management Assessment</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-50 text-orange-800 hover:bg-orange-50 border-orange-300 gap-2 px-3 py-1">
              <Users className="w-4 h-4" />
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold">{interviewerName}</span>
                <span className="text-[10px] opacity-75">Leadership Interviewer</span>
              </div>
            </Badge>
            <span className="text-sm text-muted-foreground">TalenTek</span>
          </div>
        </div>
        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LeadershipInterviewLayout;
