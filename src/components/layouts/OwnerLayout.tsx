import { Link, useLocation } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";
import { LayoutDashboard, Users, Building2, Briefcase, UserCog, Settings, BarChart3, CreditCard, Ticket } from "lucide-react";

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const OwnerLayout = ({ children }: OwnerLayoutProps) => {
  const location = useLocation();
  
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/owner/dashboard" },
    { label: "All Users", icon: Users, path: "/owner/users" },
    { label: "Company Admins", icon: Building2, path: "/owner/users", highlight: true },
    { label: "Support Tickets", icon: Ticket, path: "/owner/tickets" },
    { label: "Subscriptions", icon: CreditCard, path: "/owner/subscriptions" },
    { label: "Statistics", icon: BarChart3, path: "/owner/statistics" },
    { label: "Settings", icon: Settings, path: "/owner/settings" },
  ];

  return (
    <div className="min-h-screen flex w-full">
      <aside className="w-64 border-r bg-gradient-to-b from-orange-50 to-white">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">O</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Owner Portal</h2>
              <p className="text-xs text-gray-500">TalenTek</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={`${item.path}-${index}`}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "hover:bg-orange-50 text-gray-700 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <DashboardNavbar title="Owner Portal" />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
