import { Link, useLocation } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";
import { BarChart3, Users, Ticket } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  
  const menuItems = [
    { label: "Overview", icon: BarChart3, path: "/admin/overview" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Tickets", icon: Ticket, path: "/admin/tickets" },
  ];

  return (
    <div className="min-h-screen flex w-full">
      <aside className="w-64 border-r bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">TalenTek Admin</h2>
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
        <DashboardNavbar title="TalenTek Admin" />
        <main className="flex-1 p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
