import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { getBaseUrl } from '../utils/config';

interface AuthContextType {
    isAuthenticated: boolean;
    user: { email: string; token: string } | null;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('auth') === 'true';
    });

    const [user, setUser] = useState<{ email: string; token: string } | null>(() => {
        const rawUser = localStorage.getItem('user');
        return rawUser ? JSON.parse(rawUser) : null;
    });

    const login = async (email: string, pass: string) => {
        try {
            const response = await fetch(`${getBaseUrl()}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password: pass }),
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();

            setIsAuthenticated(true);
            const userPayload = { email: data.user.email, token: data.access_token };
            setUser(userPayload);

            localStorage.setItem('auth', 'true');
            localStorage.setItem('user', JSON.stringify(userPayload));
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
