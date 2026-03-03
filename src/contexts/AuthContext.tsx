import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import type { AuthUser, UserRole, LoginCredentials } from '@/lib/types';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          const currentUser = await authApi.getCurrentUser(storedUserId);
          if (currentUser) {
            setUser(currentUser);
            // Restore interviewer type if user is an interviewer
            if (currentUser.user_role === 'interviewer' && currentUser.profile?.interview_type) {
              localStorage.setItem('interviewerType', currentUser.profile.interview_type);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('interviewerType');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const userData = await authApi.login(credentials);
      if (userData) {
        setUser(userData);
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('userRole', userData.user_role);
        
        // Store interviewer type for routing purposes
        if (userData.user_role === 'interviewer' && userData.profile?.interview_type) {
          localStorage.setItem('interviewerType', userData.profile.interview_type);
        }
        
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login failed:', error);
      // Re-throw the error so Login.tsx can handle specific error types
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('interviewerType');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
