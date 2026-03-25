import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDisplayName = async () => {
      if (!user?.id) {
        if (isMounted) setDisplayName("");
        if (isMounted) setAvatarUrl(null);
        return;
      }

      const fallbackName = user.name || user.email;

      try {
        if (user.role === "talent") {
          const { data } = await supabase
            .from("talents")
            .select("full_name, profile_photo_url")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          if (isMounted) {
            setDisplayName(data?.full_name || fallbackName);
            setAvatarUrl(data?.profile_photo_url || null);
          }
          return;
        }

        if (user.role === "recruiter") {
          const teamMemberResult = await supabase
            .from("employer_team_members")
            .select("employer_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          const employerId = teamMemberResult.data?.employer_id;

          const employerResult = employerId
            ? await supabase
                .from("employers")
                .select("company_name, logo_url")
                .eq("id", employerId)
                .limit(1)
                .maybeSingle()
            : await supabase
                .from("employers")
                .select("company_name, logo_url")
                .eq("user_id", user.id)
                .limit(1)
                .maybeSingle();

          if (isMounted) {
            setDisplayName(employerResult.data?.company_name || fallbackName);
            setAvatarUrl(employerResult.data?.logo_url || null);
          }
          return;
        }

        if (user.role === "owner" || user.role === "superadmin") {
          const { data } = await supabase
            .from("owners")
            .select("full_name, profile_photo_url")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          if (isMounted) {
            setDisplayName(data?.full_name || fallbackName);
            setAvatarUrl(data?.profile_photo_url || null);
          }
          return;
        }

        if (user.role === "technical-interviewer" || user.role === "leadership-interviewer") {
          const { data } = await supabase
            .from("interviewers")
            .select("full_name")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          if (isMounted) {
            setDisplayName(data?.full_name || fallbackName);
            setAvatarUrl(null);
          }
          return;
        }

        if (isMounted) {
          setDisplayName(fallbackName);
          setAvatarUrl(null);
        }
      } catch {
        if (isMounted) {
          setDisplayName(fallbackName);
          setAvatarUrl(null);
        }
      }
    };

    loadDisplayName();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role, user?.name, user?.email]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleSpace = (role: string) => {
    switch (role) {
      case "talent":
        return { path: "/talent/overview", label: "Talent Space" };
      case "recruiter":
        return { path: "/recruiter/overview", label: "Recruiter Space" };
      case "superadmin":
        return { path: "/recruiter-admin/overview", label: "Company Admin Space" };
      case "owner":
        return { path: "/owner/dashboard", label: "Owner Space" };
      case "technical-interviewer":
        return { path: "/technical-interviewer/overview", label: "Technical Interviewer Space" };
      case "leadership-interviewer":
        return { path: "/leadership-interviewer/overview", label: "Leadership Interviewer Space" };
      default:
        return null;
    }
  };

  const userRoleSpace = user ? getRoleSpace(user.role) : null;

  const getSpaceNavigation = () => {
    if (!user) return { talentPath: "/login", companyPath: "/login" };
    
    switch (user.role) {
      case "talent":
        return { talentPath: "/talent/overview", companyPath: "/login" };
      case "recruiter":
        return { talentPath: "/login", companyPath: "/recruiter/overview" };
      case "owner":
        return { talentPath: "/talent/overview", companyPath: "/recruiter/overview" };
      default:
        return { talentPath: "/login", companyPath: "/login" };
    }
  };

  const { talentPath, companyPath } = getSpaceNavigation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Jobs", path: "/jobs" },
    { name: "Services", path: "/services" },
    { name: "For Company", path: "/for-company" },
    { name: "For Talents", path: "/for-talents" },
    { name: "Pricing", path: "/pricing" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-200">
      <div className="accent-bg">
        <span className="accent-circle w-[140px] h-[140px] top-0 left-8 animate-float" />
      </div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <img src="/images/logo.jfif" alt="TalenTek Logo" className="h-8 w-8" />
            <span>TalenTek</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${isActive(link.path) ? "text-orange-600" : "text-slate-700"} hover:text-orange-600`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-orange-50 border border-orange-200">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-semibold overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      (displayName || user.name || user.email || "U")[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{displayName || user.name || user.email}</span>
                    <span className="text-xs text-orange-600 capitalize">{user.role.replace("-", " ")}</span>
                  </div>
                </div>
                {userRoleSpace && (
                  <Button
                    size="sm"
                    asChild
                    className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:scale-105 shadow-md"
                  >
                    <Link to={userRoleSpace.path}>{userRoleSpace.label}</Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleLogout}
                  className="rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="rounded-full">
                  <Link to={talentPath}>Talent Space</Link>
                </Button>
                <Button asChild className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:scale-105 shadow-md">
                  <Link to={companyPath}>Company Space</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-200">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors ${isActive(link.path) ? "text-orange-600" : "text-slate-700"} hover:bg-orange-50 rounded-md px-2 py-1`}
                >
                  {link.name}
                </Link>
              ))}
              {user && (
                <div className="border-t border-orange-200 pt-4 mt-4">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-semibold overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        (displayName || user.name || user.email || "U")[0]?.toUpperCase() || "U"
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{displayName || user.name || user.email}</span>
                      <span className="text-xs text-orange-600 capitalize">{user.role.replace("-", " ")}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 pt-4">
                {user ? (
                  <>
                    {userRoleSpace && (
                      <Button
                        size="sm"
                        asChild
                        className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                      >
                        <Link to={userRoleSpace.path} onClick={() => setMobileMenuOpen(false)}>
                          {userRoleSpace.label}
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="rounded-full bg-red-600 text-white hover:bg-red-700"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="rounded-full">
                      <Link to={talentPath} onClick={() => setMobileMenuOpen(false)}>
                        Talent Space
                      </Link>
                    </Button>
                    <Button asChild className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white">
                      <Link to={companyPath} onClick={() => setMobileMenuOpen(false)}>
                        Company Space
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
