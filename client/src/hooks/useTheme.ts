import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface UseThemeReturn {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Custom hook for managing light/dark theme
 * Persists preference to localStorage
 * Respects system preference when set to 'system'
 * 
 * @returns Theme state and handlers
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setEffectiveTheme('dark');
    }
  }, []);

  // Update effective theme when preference changes
  useEffect(() => {
    let finalTheme: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        finalTheme = 'dark';
      }
    } else {
      finalTheme = theme;
    }

    setEffectiveTheme(finalTheme);

    // Update document class
    const html = document.documentElement;
    if (finalTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Update CSS variables
    const root = document.documentElement;
    if (finalTheme === 'dark') {
      root.style.setProperty('--background', '#0f172a');
      root.style.setProperty('--foreground', '#f1f5f9');
      root.style.setProperty('--card', '#1e293b');
      root.style.setProperty('--card-foreground', '#f1f5f9');
      root.style.setProperty('--primary', '#3b82f6');
      root.style.setProperty('--primary-foreground', '#0f172a');
      root.style.setProperty('--secondary', '#64748b');
      root.style.setProperty('--secondary-foreground', '#f1f5f9');
      root.style.setProperty('--accent', '#f97316');
      root.style.setProperty('--accent-foreground', '#0f172a');
      root.style.setProperty('--destructive', '#ef4444');
      root.style.setProperty('--destructive-foreground', '#f1f5f9');
      root.style.setProperty('--muted', '#475569');
      root.style.setProperty('--muted-foreground', '#cbd5e1');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--input', '#1e293b');
      root.style.setProperty('--ring', '#3b82f6');
    } else {
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#0f172a');
      root.style.setProperty('--card', '#f8fafc');
      root.style.setProperty('--card-foreground', '#0f172a');
      root.style.setProperty('--primary', '#3b82f6');
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--secondary', '#e2e8f0');
      root.style.setProperty('--secondary-foreground', '#0f172a');
      root.style.setProperty('--accent', '#f97316');
      root.style.setProperty('--accent-foreground', '#ffffff');
      root.style.setProperty('--destructive', '#ef4444');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--muted', '#e2e8f0');
      root.style.setProperty('--muted-foreground', '#64748b');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--input', '#f1f5f9');
      root.style.setProperty('--ring', '#3b82f6');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(effectiveTheme === 'light' ? 'dark' : 'light');
  }, [effectiveTheme, setTheme]);

  return {
    theme,
    effectiveTheme,
    toggleTheme,
    setTheme,
  };
}
