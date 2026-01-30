"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    accentSecondary: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check localStorage on mount
    const savedTheme = localStorage.getItem('mv-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('mv-theme', newTheme);
  };

  const colors = theme === 'light' 
    ? {
        background: '#ffffff',
        backgroundSecondary: '#f8f8f8',
        text: '#1a1a1a',
        textSecondary: '#666666',
        border: '#e5e5e5',
        accent: '#667eea',
        accentSecondary: '#764ba2',
      }
    : {
        background: '#050509',
        backgroundSecondary: '#0a0a0f',
        text: '#ffffff',
        textSecondary: '#888888',
        border: 'rgba(255, 255, 255, 0.1)',
        accent: '#667eea',
        accentSecondary: '#764ba2',
      };

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
