"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Eau de Nil (Fortnum & Mason)
const ACCENT = '#84C3AA';
const ACCENT_HOVER = '#6DAD94';
const ACCENT_MUTED = 'rgba(132, 195, 170, 0.2)';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage on mount
    const savedTheme = localStorage.getItem('apollova-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('apollova-theme', newTheme);
  };

  const colors = theme === 'light' 
    ? {
        background: '#ffffff',
        backgroundSecondary: '#f8f8f8',
        backgroundTertiary: '#f0f0f0',
        text: '#1a1a1a',
        textSecondary: '#666666',
        border: '#e5e5e5',
        accent: ACCENT,
        accentHover: ACCENT_HOVER,
        accentMuted: ACCENT_MUTED,
      }
    : {
        background: '#050509',
        backgroundSecondary: '#0a0a0f',
        backgroundTertiary: '#111118',
        text: '#ffffff',
        textSecondary: '#888888',
        border: 'rgba(255, 255, 255, 0.1)',
        accent: ACCENT,
        accentHover: ACCENT_HOVER,
        accentMuted: ACCENT_MUTED,
      };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
