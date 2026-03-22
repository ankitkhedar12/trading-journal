import { createContext, useContext } from 'react';

export type ThemeMode = 'light' | 'dark';
export type GlassMode = 'tinted' | 'clear';

export interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    glassMode: GlassMode;
    setGlassMode: (mode: GlassMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
};
