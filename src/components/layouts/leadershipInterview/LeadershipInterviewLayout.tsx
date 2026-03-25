import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Home, User, LogOut, Menu, X, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const LeadershipInterviewLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { name: "Overview", path: "/leadership-interviewer/overview", icon: Home },
    { name: "Interviews", path: "/leadership-interviewer/interviews", icon: Video },
    { name: "Profile", path: "/leadership-interviewer/profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-100 via-white to-orange-50 flex">

      {/* â”€â”€ Left Sidebar (desktop) â”€â”€ */}
      <aside className="hidden xl:flex xl:fixed xl:inset-y-0 xl:left-0 xl:z-50 xl:w-72 xl:flex-col border-r border-orange-100 bg-white/95 shadow-[0_0_0_1px_rgba(251,146,60,0.08)] backdrop-blur-md">
        <div className="border-b border-orange-100 px-5 py-5">
          <Link to="/leadership-interviewer/overview" className="flex items-center gap-2 text-xl font-bold text-slate-900">
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-slate-600 hover:bg-white hover:text-orange-600"
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="space-y-3 border-t border-orange-100 px-4 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 px-3 py-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-bold">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
            <Link
              to="/leadership-interviewer/notifications"
              aria-label="Open notifications"
              className={`relative rounded-full border p-2 transition-colors ${
                location.pathname === "/leadership-interviewer/notifications"
                  ? "border-orange-500 bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-sm"
                  : "border-orange-200 bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span
                aria-hidden="true"
                className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${
                  location.pathname === "/leadership-interviewer/notifications" ? "bg-white" : "bg-orange-500"
                }`}
              />
            </Link>
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

      {/* â”€â”€ Mobile top bar â”€â”€ */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-orange-100 bg-white/95 px-4 shadow-sm backdrop-blur-md xl:hidden">
        <Link to="/leadership-interviewer/overview" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <img src="/src/logo/logo.jfif" alt="TalenTek Logo" className="h-7 w-7 rounded" />
          <span>TalenTek</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          className="rounded-full p-2 text-orange-600 hover:bg-orange-50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-40 flex">
          <div className="flex h-full w-72 flex-col border-r border-orange-100 bg-white/95 pt-14 backdrop-blur-md">
            <nav className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-1 rounded-2xl border border-orange-100 bg-orange-50/50 p-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      isActive(link.path)
                        ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                        : "text-slate-600 hover:bg-white hover:text-orange-600"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="border-t border-orange-100 px-4 py-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 rounded-xl border border-orange-100 bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* â”€â”€ Main content area â”€â”€ */}
      <div className="flex min-h-screen flex-1 flex-col xl:ml-72">
        <main className="flex-1 pt-14 xl:px-6 xl:pt-0 2xl:px-8">
          {children}
        </main>
      </div>

    </div>
  );
};

export default LeadershipInterviewLayout;

