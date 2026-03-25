import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Home, Users, Building2, CreditCard, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RecruiterAdminLayoutProps {
  children: React.ReactNode;
}

const RecruiterAdminLayout = ({ children }: RecruiterAdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Overview", path: "/recruiter-admin/overview", icon: Home },
    { name: "My Team", path: "/recruiter-admin/users", icon: Users },
    { name: "Subscription & Billing", path: "/recruiter-admin/payment", icon: CreditCard },
    { name: "Company Profile", path: "/recruiter-admin/company-profile", icon: Building2 },
    { name: "Support Tickets", path: "/recruiter-admin/tickets", icon: MessageSquare },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-100 via-white to-orange-50 flex">
      <aside className="hidden xl:flex xl:flex-col xl:fixed xl:inset-y-0 xl:left-0 xl:w-72 bg-white/95 backdrop-blur-md border-r border-orange-100 shadow-[0_0_0_1px_rgba(251,146,60,0.08)] z-50">
        <div className="border-b border-orange-100 px-5 py-5">
          <Link to="/recruiter-admin/overview" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <img src="/src/logo/logo.jfif" alt="TalenTek Logo" className="h-8 w-8 rounded" />
            <span>TalenTek</span>
          </Link>

        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1 rounded-2xl border border-orange-100 bg-orange-50/50 p-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-slate-600 hover:bg-white hover:text-orange-600"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="border-t border-orange-100 px-4 py-4 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 px-3 py-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-bold">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 rounded-xl border border-orange-100 bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </aside>

      <div className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 flex items-center justify-between px-4 h-14 shadow-sm">
        <Link to="/recruiter-admin/overview" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <img src="/src/logo/logo.jfif" alt="TalenTek Logo" className="h-7 w-7 rounded" />
          <span>TalenTek</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen((prevState) => !prevState)}
          aria-label="Toggle menu"
          className="rounded-full p-2 text-orange-600 hover:bg-orange-50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-40 flex">
          <div className="w-72 bg-white/95 backdrop-blur-md h-full border-r border-orange-100 flex flex-col pt-14">
            <nav className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-1 rounded-2xl border border-orange-100 bg-orange-50/50 p-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive(link.path)
                        ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                        : "text-slate-600 hover:bg-white hover:text-orange-600"
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="px-4 py-4 border-t border-orange-100">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-xl border border-orange-100 bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 xl:ml-72 flex flex-col min-h-screen">
        <main className="flex-1 pt-14 xl:pt-0 xl:px-6 2xl:px-8">{children}</main>
      </div>
    </div>
  );
};

export default RecruiterAdminLayout;
