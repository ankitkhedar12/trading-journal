import { createContext, useContext } from 'react';

/**
 * Split context and hook to avoid Fast Refresh lint errors
 */
export interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; token: string } | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
