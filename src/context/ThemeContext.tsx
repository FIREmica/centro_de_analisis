
"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'system' | 'light' | 'dark' | 'blue';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark' | 'blue'; // Actual theme being applied
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'blue'>('light'); // Default to light

  const applyTheme = useCallback((selectedTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-blue'); // Remove all specific theme classes
    
    let currentAppliedTheme: 'light' | 'dark' | 'blue';

    if (selectedTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('theme-dark');
        currentAppliedTheme = 'dark';
      } else {
        // No class for light theme, it's the default
        currentAppliedTheme = 'light';
      }
    } else {
      root.classList.add(`theme-${selectedTheme}`);
      currentAppliedTheme = selectedTheme as 'light' | 'dark' | 'blue'; // Type assertion
    }
    setResolvedTheme(currentAppliedTheme);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme || 'system';
    setThemeState(initialTheme);
    applyTheme(initialTheme); // Apply initial theme
  }, [applyTheme]);
  
  useEffect(() => {
    // Listener for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyTheme]);


  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme); // Apply theme immediately on change
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
