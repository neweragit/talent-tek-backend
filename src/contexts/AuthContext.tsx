import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole =
  | 'superadmin'
  | 'talent'
  | 'recruiter'
  | 'technical-interviewer'
  | 'leadership-interviewer'
  | 'owner';

type UserRoleLike = UserRole | 'employer' | 'interviewer' | 'technical' | 'leadership' | 'admin';

const normalizeUserRole = (role: UserRoleLike): UserRole => {
  if (role === 'recruiter' || role === 'employer') {
    return 'recruiter';
  }

  if (role === 'technical' || role === 'interviewer') {
    return 'technical-interviewer';
  }

  if (role === 'leadership') {
    return 'leadership-interviewer';
  }

  if (role === 'admin') {
    return 'superadmin';
  }

  return role;
};

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('mockUser');
    if (!stored) {
      return null;
    }

    const parsedUser = JSON.parse(stored) as Omit<User, 'role'> & { role: UserRoleLike };

    return {
      ...parsedUser,
      role: normalizeUserRole(parsedUser.role),
    };
  });

  const login = (userData: User) => {
    const normalizedUser = {
      ...userData,
      role: normalizeUserRole(userData.role),
    };

    setUser(normalizedUser);
    localStorage.setItem('mockUser', JSON.stringify(normalizedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user 
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
