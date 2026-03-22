import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextType';
import { getBaseUrl } from '../utils/config';
import {
  storeAuthSession,
  getAuthSession,
  clearAuthSession,
  getSecureHeaders,
  sanitizeEmail,
  isRateLimited,
} from '../utils/security';



export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getAuthSession();
  });

  const [user, setUser] = useState<{ email: string; token: string } | null>(() => {
    const session = getAuthSession();
    return session ? { email: session.email, token: session.token } : null;
  });

  // Periodically check token expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const session = getAuthSession();
      if (!session && isAuthenticated) {
        setIsAuthenticated(false);
        setUser(null);
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = useCallback(async (email: string, pass: string) => {
    // Rate limit login attempts
    if (isRateLimited('login', 2000)) {
      return { success: false, message: 'Too many attempts. Please try again later.' };
    }

    const cleanEmail = sanitizeEmail(email);

    try {
      const response = await fetch(`${getBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: getSecureHeaders(),
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = Array.isArray(data.message) ? data.message[0] : data.message;
        return { success: false, message: errorMsg || 'Invalid email or password' };
      }

      const userPayload = { email: data.user?.email, token: data.access_token };
      setIsAuthenticated(true);
      setUser(userPayload);

      // Store in sessionStorage (secure)
      if (data.user?.email && data.access_token) {
        storeAuthSession(data.user.email, data.access_token);
      }

      return { success: true };
    } catch {
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, []);

  const signup = useCallback(async (email: string, pass: string) => {
    // Rate limit signup attempts
    if (isRateLimited('signup', 2000)) {
      return { success: false, message: 'Too many requests. Please try again later.' };
    }

    const cleanEmail = sanitizeEmail(email);

    try {
      const response = await fetch(`${getBaseUrl()}/api/auth/signup`, {
        method: 'POST',
        headers: getSecureHeaders(),
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Signup failed' };
      }

      return { success: true, requiresVerification: true };
    } catch {
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, []);

  const verifySignup = useCallback(async (email: string, code: string) => {
    // Rate limit verification attempts
    if (isRateLimited('verify-signup', 2000)) {
      return { success: false, message: 'Too many requests. Please try again later.' };
    }

    const cleanEmail = sanitizeEmail(email);

    try {
      const response = await fetch(`${getBaseUrl()}/api/auth/verify-signup`, {
        method: 'POST',
        headers: getSecureHeaders(),
        body: JSON.stringify({ email: cleanEmail, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Verification failed' };
      }

      const userPayload = { email: data.user.email, token: data.access_token };
      setIsAuthenticated(true);
      setUser(userPayload);

      // Store in sessionStorage (secure)
      storeAuthSession(data.user.email, data.access_token);

      return { success: true };
    } catch {
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    clearAuthSession();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, verifySignup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
