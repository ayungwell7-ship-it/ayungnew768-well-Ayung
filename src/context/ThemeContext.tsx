import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NeonAccent } from '../types';

interface ThemeClasses {
  text: string;
  glowText: string;
  border: string;
  bg: string;
  badge: string;
  gradient: string;
  boxShadow: string;
}

interface ThemeContextType {
  accent: NeonAccent;
  setAccent: (accent: NeonAccent) => void;
  theme: ThemeClasses;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MAP: Record<NeonAccent, ThemeClasses> = {
  cyan: {
    text: 'text-cyan-400',
    glowText: 'neon-glow-cyan text-cyan-400',
    border: 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
    bg: 'bg-cyan-500',
    badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
    gradient: 'from-cyan-500 to-blue-600',
    boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
  },
  purple: {
    text: 'text-purple-400',
    glowText: 'neon-glow-purple text-purple-400',
    border: 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]',
    bg: 'bg-purple-500',
    badge: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
    gradient: 'from-purple-500 to-indigo-600',
    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
  },
  blue: {
    text: 'text-blue-400',
    glowText: 'neon-glow-blue text-blue-400',
    border: 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.25)]',
    bg: 'bg-blue-500',
    badge: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
    gradient: 'from-blue-500 to-cyan-600',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
  },
  emerald: {
    text: 'text-emerald-400',
    glowText: 'text-emerald-400',
    border: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    bg: 'bg-emerald-500',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
    gradient: 'from-emerald-500 to-teal-600',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
  },
  rose: {
    text: 'text-rose-400',
    glowText: 'text-rose-400',
    border: 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.25)]',
    bg: 'bg-rose-500',
    badge: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
    gradient: 'from-rose-500 to-red-600',
    boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)',
  },
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accent, setAccentState] = useState<NeonAccent>('cyan');

  useEffect(() => {
    const saved = localStorage.getItem('sg_theme_accent');
    if (saved && (saved in THEME_MAP)) {
      setAccentState(saved as NeonAccent);
    }
  }, []);

  const setAccent = (newAccent: NeonAccent) => {
    setAccentState(newAccent);
    localStorage.setItem('sg_theme_accent', newAccent);
  };

  return (
    <ThemeContext.Provider value={{ accent, setAccent, theme: THEME_MAP[accent] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
