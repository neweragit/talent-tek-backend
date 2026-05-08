import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, FileText, User, MessageSquare, Gift, Video, Briefcase, Menu, X, LogOut, ChevronDown, Bell, BellOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
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
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [taInterviewsCount, setTaInterviewsCount] = useState(0);
  const [itInterviewsCount, setItInterviewsCount] = useState(0);
  const [leadInterviewsCount, setLeadInterviewsCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  useEffect(() => {
    const loadSidebarCounts = async () => {
      if (!user?.id) {
        setInterviewsCount(0);
        setTaInterviewsCount(0);
        setItInterviewsCount(0);
        setLeadInterviewsCount(0);
        setApplicationsCount(0);
        setOffersCount(0);
        setOpenTicketsCount(0);
        return;
      }

      try {
        const { data: talent } = await supabase
          .from("talents")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!talent?.id) {
          setInterviewsCount(0);
          setTaInterviewsCount(0);
          setItInterviewsCount(0);
          setLeadInterviewsCount(0);
          setApplicationsCount(0);
          setOffersCount(0);
          setOpenTicketsCount(0);
          return;
        }

        const { data: applicationsData, error: applicationsError } = await supabase
          .from("applications")
          .select("id, status")
          .eq("talent_id", talent.id);

        if (applicationsError) throw applicationsError;

        const applicationIds = (applicationsData ?? []).map((app: any) => app.id).filter(Boolean);

        const inProgressCount = (applicationsData ?? []).filter(
          (app: any) => app.status === "in-progress" || app.status === "pending"
        ).length;
        setApplicationsCount(inProgressCount);

        if (applicationIds.length === 0) {
          setInterviewsCount(0);
          setTaInterviewsCount(0);
          setItInterviewsCount(0);
          setLeadInterviewsCount(0);
          setOffersCount(0);
          return;
        }

        const { data: interviewsData } = await supabase
          .from("interviews")
          .select("id, interview_type")
          .eq("status", "scheduled")
          .in("application_id", applicationIds);

        const allInterviews = interviewsData ?? [];
        setInterviewsCount(allInterviews.length);
        setTaInterviewsCount(allInterviews.filter((i: any) => i.interview_type === "talent-acquisition").length);
        setItInterviewsCount(allInterviews.filter((i: any) => i.interview_type === "technical").length);
        setLeadInterviewsCount(allInterviews.filter((i: any) => i.interview_type === "leadership").length);

        const { data: offersData } = await supabase
          .from("offers")
          .select("id")
          .eq("status", "pending")
          .in("application_id", applicationIds);

        setOffersCount((offersData ?? []).length);

        // Fetch open tickets count
        const { count: ticketsCount, error: ticketsError } = await supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "open");

        if (!ticketsError) {
          setOpenTicketsCount(ticketsCount || 0);
        }
      } catch (error) {
        console.error("Failed to load sidebar counts:", error);
        setInterviewsCount(0);
        setTaInterviewsCount(0);
        setItInterviewsCount(0);
        setLeadInterviewsCount(0);
        setApplicationsCount(0);
        setOffersCount(0);
        setOpenTicketsCount(0);
      }
    };

    void loadSidebarCounts();
  }, [user?.id]);

  const navLinks = [
    { name: "Overview", path: "/talent/overview", icon: Home },
    { name: "My Applications", path: "/talent/applications", icon: FileText, count: applicationsCount },
    {
      name: "Interviews",
      path: null,
      icon: Video,
      count: interviewsCount,
      subItems: [
        { name: "TA Interviews", path: "/talent/interviews/ta", count: taInterviewsCount },
        { name: "Technical Interviews", path: "/talent/interviews/it", count: itInterviewsCount },
        { name: "Leadership Interviews", path: "/talent/interviews/leadership", count: leadInterviewsCount },
      ],
    },
    { name: "Offers", path: "/talent/offers", icon: Gift, count: offersCount },
    { name: "Profile", path: "/talent/profile", icon: User },
    { name: "My Services", path: "/talent/services", icon: Briefcase },
    { name: "Settings", path: "/talent/settings", icon: User },
    { name: "Support Tickets", path: "/talent/support-tickets", icon: MessageSquare, count: openTicketsCount },
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isInterviewActive
                      ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                      : "text-slate-600 hover:bg-white hover:text-orange-600"
                  }`}
                >
                  <link.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{link.name}</span>
                  {typeof link.count === "number" ? (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        isInterviewActive ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {link.count}
                    </span>
                  ) : null}
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${interviewsOpen ? "rotate-180" : ""}`} />
                </button>
                {interviewsOpen && (
                  <div className="ml-8 mt-2 space-y-1 border-l-2 border-orange-200 pl-3">
                    {link.subItems.map((sub: any) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={`flex items-center justify-between text-sm px-2 py-1.5 rounded-lg font-medium transition-all ${
                          location.pathname === sub.path
                            ? "bg-white text-orange-700 shadow-sm"
                            : "text-slate-600 hover:text-orange-600 hover:bg-white"
                        }`}
                      >
                        <span>{sub.name}</span>
                        {typeof sub.count === "number" ? (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              location.pathname === sub.path ? "bg-orange-100 text-orange-700" : "bg-orange-100/50 text-orange-600"
                            }`}
                          >
                            {sub.count}
                          </span>
                        ) : null}
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
                <link.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">{link.name}</span>
                {typeof link.count === "number" ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive(link.path) ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {link.count}
                  </span>
                ) : null}
                {/* Spacer to align counts properly with submenu items */}
                <div className="w-4 h-4 shrink-0" />
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
            <Link
              to=""
              aria-label="Notifications"
              className={`relative rounded-full border p-2 transition-colors ${
                location.pathname === ""
                  ? "border-orange-500 bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-sm"
                  : "border-orange-200 bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              {interviewsCount + applicationsCount + offersCount > 0 ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {interviewsCount + applicationsCount + offersCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500"
                />
              ) : null}
            </Link>
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isInterviewActive ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-orange-600"
                      }`}
                    >
                      <link.icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1 text-left">{link.name}</span>
                      {typeof link.count === "number" ? (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                            isInterviewActive ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {link.count}
                        </span>
                      ) : null}
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${interviewsOpen ? "rotate-180" : ""}`} />
                    </button>
                    {interviewsOpen && (
                      <div className="ml-8 mt-2 space-y-1 border-l-2 border-orange-200 pl-3">
                        {link.subItems.map((sub: any) => (
                          <Link key={sub.path} to={sub.path} onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between text-sm px-2 py-1.5 rounded-lg font-medium ${location.pathname === sub.path ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-orange-600 hover:bg-white"}`}>
                            <span>{sub.name}</span>
                            {typeof sub.count === "number" ? (
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  location.pathname === sub.path ? "bg-orange-100 text-orange-700" : "bg-orange-100/50 text-orange-600"
                                }`}
                              >
                                {sub.count}
                              </span>
                            ) : null}
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
                    <link.icon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-left">{link.name}</span>
                    {typeof link.count === "number" ? (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                          isActive(link.path) ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {link.count}
                      </span>
                    ) : null}
                    {/* Spacer to align counts properly with submenu items */}
                    <div className="w-4 h-4 shrink-0" />
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
