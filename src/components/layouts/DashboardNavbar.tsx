import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

interface DashboardNavbarProps {
  title: string;
}

const DashboardNavbar = ({ title }: DashboardNavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string | undefined) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = () => {
    if (!user?.profile) return user?.email || 'User';
    
    if ('full_name' in user.profile) {
      return user.profile.full_name;
    } else if ('company_name' in user.profile) {
      return user.profile.company_name;
    }
    return user.email;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    const role = user?.user_role;
    
    switch (role) {
      case 'talent':
        navigate('/talent/profile');
        break;
      case 'employer':
        navigate('/employer/settings');
        break;
      case 'admin':
        navigate('/employer-admin/settings');
        break;
      case 'owner':
        navigate('/owner/settings');
        break;
      case 'interviewer':
        navigate('/technical-interviewer/settings');
        break;
      default:
        navigate('/settings');
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-6 justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarFallback className="bg-gradient-primary text-white">
                  {getInitials(getUserName())}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{getUserName()}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
