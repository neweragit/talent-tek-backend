import { Link, useLocation } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";
import { BarChart3, Briefcase, Users, Calendar, Ticket, Settings as SettingsIcon, MessageSquare } from "lucide-react";

interface EmployerLayoutProps {
  children: React.ReactNode;
}

const EmployerLayout = ({ children }: EmployerLayoutProps) => {
  const location = useLocation();
  
  const menuItems = [
    { label: "Overview", icon: BarChart3, path: "/employer/overview" },
    { label: "Jobs", icon: Briefcase, path: "/employer/jobs" },
    { label: "Interviewers", icon: Users, path: "/employer/interviewers" },
    { label: "Pipeline", icon: Calendar, path: "/employer/pipeline" },
    { label: "My Interviews", icon: MessageSquare, path: "/employer/talent-acquisition-interviews" },
    { label: "Tickets", icon: Ticket, path: "/employer/tickets" },
    { label: "Settings", icon: SettingsIcon, path: "/employer/settings" },
  ];

  return (
    <div className="min-h-screen flex w-full">
      <aside className="w-64 border-r bg-card">
        <div className="p-6 border-b flex justify-center items-center h-16">
          <img src="/assets/talentek-logo.png" alt="TalenTek Logo" className="h-60 w-80" />
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <DashboardNavbar title="TalenTek Employer" />
        <main className="flex-1 p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmployerLayout;
