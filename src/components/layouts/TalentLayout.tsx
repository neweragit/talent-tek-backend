import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, User, MessageSquare, Gift, Video, Briefcase, Menu, X, LogOut, ChevronDown, Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logo from "@/logo/logo.jfif";

interface TalentLayoutProps {
  children: React.ReactNode;
}

const TalentLayout = ({ children }: TalentLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [interviewsOpen, setInterviewsOpen] = useState(location.pathname.startsWith("/talent/interviews"));

  const navLinks = [
    { name: "Overview", path: "/talent/overview", icon: Home },
    {
      name: "Interviews",
      path: null,
      icon: Video,
      subItems: [
        { name: "TA Interviews", path: "/talent/interviews/ta" },
        { name: "Technical Interviews", path: "/talent/interviews/it" },
        { name: "Leadership Interviews", path: "/talent/interviews/leadership" },
      ],
    },
    { name: "Applications", path: "/talent/applications", icon: FileText },
    { name: "Offers", path: "/talent/offers", icon: Gift },
    { name: "Profile", path: "/talent/profile", icon: User },
    { name: "Support Tickets", path: "/talent/support-tickets", icon: MessageSquare },
    { name: "My Services", path: "/talent/services", icon: Briefcase },
  ];

  const isActive = (path: string | null) => path && location.pathname === path;
  const isInterviewActive =
    navLinks.find((l) => l.name === "Interviews")?.subItems?.some((sub) => location.pathname === sub.path);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-100 via-white to-orange-50 flex">

      {/* ── Left Sidebar (desktop) ── */}
      <aside className="hidden xl:flex xl:flex-col xl:fixed xl:inset-y-0 xl:left-0 xl:w-72 bg-white/95 backdrop-blur-md border-r border-orange-100 shadow-[0_0_0_1px_rgba(251,146,60,0.08)] z-50">
        {/* Logo */}
        <div className="border-b border-orange-100 px-5 py-5">
          <Link to="/talent/overview" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <img src={logo} alt="TalenTek Logo" className="h-8 w-8 rounded" />
            <span>TalenTek</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1 rounded-2xl border border-orange-100 bg-orange-50/50 p-2">
          {navLinks.map((link) =>
            link.subItems ? (
              <div key={link.name}>
                <button
                  onClick={() => setInterviewsOpen(!interviewsOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isInterviewActive
                      ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                      : "text-slate-600 hover:bg-white hover:text-orange-600"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${interviewsOpen ? "rotate-180" : ""}`} />
                </button>
                {interviewsOpen && (
                  <div className="ml-8 mt-2 space-y-1 border-l-2 border-orange-200 pl-3">
                    {link.subItems.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={`block text-sm px-2 py-1.5 rounded-lg font-medium transition-all ${
                          location.pathname === sub.path
                            ? "bg-white text-orange-700 shadow-sm"
                            : "text-slate-600 hover:text-orange-600 hover:bg-white"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.path}
                to={link.path!}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-slate-600 hover:bg-white hover:text-orange-600"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            )
          )}
          </div>
        </nav>

        {/* User footer */}
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
            className="w-full justify-start gap-2 rounded-xl border border-orange-200 bg-orange-50/60 !text-orange-600 hover:bg-orange-100 hover:!text-orange-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 text-orange-600" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 flex items-center justify-between px-4 h-14 shadow-sm">
        <Link to="/talent/overview" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <img src={logo} alt="TalenTek Logo" className="h-7 w-7 rounded" />
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
          <div className="w-72 bg-white/95 backdrop-blur-md h-full border-r border-orange-100 flex flex-col pt-14">
            <nav className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-1 rounded-2xl border border-orange-100 bg-orange-50/50 p-2">
              {navLinks.map((link) =>
                link.subItems ? (
                  <div key={link.name}>
                    <button
                      onClick={() => setInterviewsOpen(!interviewsOpen)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isInterviewActive ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-orange-600"
                      }`}
                    >
                      <span className="flex items-center gap-3"><link.icon className="w-5 h-5" />{link.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${interviewsOpen ? "rotate-180" : ""}`} />
                    </button>
                    {interviewsOpen && (
                      <div className="ml-8 mt-2 space-y-1 border-l-2 border-orange-200 pl-3">
                        {link.subItems.map((sub) => (
                          <Link key={sub.path} to={sub.path} onClick={() => setMobileMenuOpen(false)}
                            className={`block text-sm px-2 py-1.5 rounded-lg font-medium ${location.pathname === sub.path ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-orange-600 hover:bg-white"}`}>
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={link.path} to={link.path!} onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive(link.path) ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-orange-600"
                    }`}>
                    <link.icon className="w-5 h-5" />{link.name}
                  </Link>
                )
              )}
              </div>
            </nav>
            <div className="px-4 py-4 border-t border-orange-100">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-xl border border-orange-200 bg-orange-50/60 !text-orange-600 hover:bg-orange-100 hover:!text-orange-700"
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
                <LogOut className="w-4 h-4 text-orange-600" />Log Out
              </Button>
            </div>
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 xl:ml-72 flex flex-col min-h-screen">
        <main className="flex-1 pt-14 xl:pt-0 xl:px-6 2xl:px-8">
          {children}
        </main>
      </div>

    </div>
  );
};

export default TalentLayout;
