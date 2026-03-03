import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Jobs", path: "/jobs" },
    { name: "Services", path: "/services" },
    { name: "For Employers", path: "/for-employers" },
    { name: "For Talents", path: "/for-talents" },
    { name: "Pricing", path: "/pricing" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-orange-custom">
            TalenTek
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">
                        {user.profile?.full_name || user.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {user.user_role}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    const dashboardRoutes: Record<string, string> = {
                      talent: '/talent/dashboard',
                      employer: '/employer/dashboard',
                      interviewer: '/technical-interview/profile',
                      owner: '/owner/dashboard',
                      superadmin: '/admin/dashboard',
                      admin: '/admin/dashboard'
                    };
                    navigate(dashboardRoutes[user.user_role] || '/');
                  }}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    logout();
                    navigate('/');
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="bg-gradient-primary hover:opacity-90">
                  <Link to="/get-started">Get Started</Link>
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
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.path) ? "text-primary" : "text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div className="w-10 h-10 bg-gradient-primary text-white rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">
                          {user.profile?.full_name || user.email.split('@')[0]}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {user.user_role}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => {
                      const dashboardRoutes: Record<string, string> = {
                        talent: '/talent/dashboard',
                        employer: '/employer/dashboard',
                        interviewer: '/technical-interview/profile',
                        owner: '/owner/dashboard',
                        superadmin: '/admin/dashboard',
                        admin: '/admin/dashboard'
                      };
                      navigate(dashboardRoutes[user.user_role] || '/');
                      setMobileMenuOpen(false);
                    }}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button variant="outline" onClick={() => {
                      logout();
                      navigate('/');
                      setMobileMenuOpen(false);
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button asChild className="bg-gradient-primary">
                      <Link to="/get-started" onClick={() => setMobileMenuOpen(false)}>
                        Get Started
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
