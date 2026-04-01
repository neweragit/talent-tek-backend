import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

/**
 * ProtectedRoute component to guard routes based on authentication and role
 * @param children - The component to render if authorized
 * @param allowedRoles - Array of roles allowed to access this route
 * @param fallbackPath - Where to redirect if not authorized (default: "/login")
 */
const ProtectedRoute = ({
  children,
  allowedRoles,
  fallbackPath = "/login",
}: ProtectedRouteProps) => {
  const { user } = useAuth();

  // Not logged in
  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Logged in but wrong role
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on their role
    if (user.role === "superadmin") {
      return <Navigate to="/recruiter-admin/overview" replace />;
    } else if (user.role === "talent") {
      return <Navigate to="/talent/overview" replace />;
    } else if (user.role === "recruiter") {
      return <Navigate to="/recruiter/overview" replace />;
    } else if (user.role === "owner") {
      return <Navigate to="/owner/dashboard" replace />;
    } else if (user.role === "technical-interviewer") {
      return <Navigate to="/technical-interviewer/overview" replace />;
    } else if (user.role === "leadership-interviewer") {
      return <Navigate to="/leadership-interviewer/overview" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Authorized - render the component
  return <>{children}</>;
};

export default ProtectedRoute;
