import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '../theme';

interface ThemeContextType {
    mode: 'light' | 'dark';
    glassMode: 'tinted' | 'clear';
    toggleTheme: () => void;
    setGlassMode: (mode: 'tinted' | 'clear') => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'light',
    glassMode: 'tinted',
    toggleTheme: () => { },
    setGlassMode: () => { },
});

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setMode] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('themeMode');
        return (saved === 'dark' || saved === 'light') ? saved : 'light';
    });
    const [glassMode, setGlassMode] = useState<'tinted' | 'clear'>(() => {
        const saved = localStorage.getItem('glassMode');
        return (saved === 'tinted' || saved === 'clear') ? saved : 'tinted';
    });

    const toggleTheme = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('glassMode', glassMode);
        document.documentElement.setAttribute('data-glass', glassMode);
    }, [glassMode]);

    const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, glassMode, toggleTheme, setGlassMode }}>
            <MUIThemeProvider theme={theme}>
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
