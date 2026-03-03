import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, BarChart3, Users, Settings, LogOut, Building2, CreditCard, Ticket } from "lucide-react";
import DashboardNavbar from "./DashboardNavbar";

interface EmployerAdminLayoutProps {
  children: React.ReactNode;
}

const EmployerAdminLayout = ({ children }: EmployerAdminLayoutProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { label: "Overview", icon: BarChart3, path: "/employer-admin/overview" },
    { label: "Recruiters", icon: Users, path: "/employer-admin/users" },
    { label: "Support Tickets", icon: Ticket, path: "/employer-admin/tickets" },
    { label: "Company Profile", icon: Building2, path: "/employer-admin/company-profile" },
    { label: "Payment & Subscription", icon: CreditCard, path: "/employer-admin/payment" },
    { label: "Settings", icon: Settings, path: "/employer-admin/settings" },
  ];

  const NavLinks = () => (
    <nav className="space-y-2 py-4 px-4">
      {menuItems.map((item) => (
        <Link key={item.path} to={item.path}>
          <Button
            variant={isActive(item.path) ? "default" : "ghost"}
            className={`w-full justify-start gap-3 ${
              isActive(item.path)
                ? "bg-primary text-primary-foreground"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
            onClick={() => setIsOpen(false)}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Button>
        </Link>
      ))}
      <div className="pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-center items-center h-16">
          <img src="/assets/talentek-logo.png" alt="TalenTek Logo" className="h-60 w-80" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <img src="/assets/talentek-logo.png" alt="TalenTek Logo" className="h-8" />
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="mb-4 border-b pb-4">
              <img src="/assets/talentek-logo.png" alt="TalenTek Logo" className="h-8" />
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-0">
        <DashboardNavbar title="Company Representative Portal" />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default EmployerAdminLayout;
