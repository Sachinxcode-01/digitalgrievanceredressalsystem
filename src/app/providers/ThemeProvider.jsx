import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'ocean',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app-theme') || 'ocean';
    } catch {
      return 'ocean';
    }
  });

  useEffect(() => {
    // Only toggle the relevant theme class without clobbering unrelated body classes
    if (theme === 'midnight') {
      document.body.classList.add('theme-midnight');
    } else {
      document.body.classList.remove('theme-midnight');
    }

    try {
      localStorage.setItem('app-theme', theme);
    } catch (e) {
      console.warn('Failed to persist app-theme to localStorage', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'ocean' ? 'midnight' : 'ocean'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;
