import React, { createContext, useState, useEffect, useContext } from 'react';

const themes = {
    'theme-carbon-black': {
      bgPrimary: '#111827',
      bgSecondary: '#1F2937',
      textPrimary: '#F9FAFB',
      textSecondary: '#9CA3AF',
      accentPrimary: '#38BDF8',
      borderColor: '#374151',
    },
    'theme-glacier-white': {
      bgPrimary: '#F9FAFB',
      bgSecondary: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      accentPrimary: '#4F46E5',
      borderColor: '#E5E7EB',
    },
    'theme-sapphire-blue': {
      bgPrimary: '#F0F5FF',
      bgSecondary: '#FFFFFF',
      textPrimary: '#0A2A66',
      textSecondary: '#5A73A3',
      accentPrimary: '#1D4ED8',
      borderColor: '#DDE6F6',
    },
    'theme-emerald-lux': {
      bgPrimary: '#F0FAF5',
      bgSecondary: '#FFFFFF',
      textPrimary: '#064E3B',
      textSecondary: '#378770',
      accentPrimary: '#D97706',
      borderColor: '#D1FAE5',
    },
    'theme-sandstone-bronze': {
      bgPrimary: '#FFFBF5',
      bgSecondary: '#FFFFFF',
      textPrimary: '#44403C',
      textSecondary: '#78716C',
      accentPrimary: '#92400E',
      borderColor: '#F5F5F4',
    }
};

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [themeKey, setThemeKey] = useState('theme-carbon-black');

  // UPDATED: This logic is now safer
  useEffect(() => {
    let savedThemeKey = localStorage.getItem('diamondAppTheme');
    
    // If the saved key doesn't exist or is not a valid theme, fallback to default
    if (!savedThemeKey || !themes[savedThemeKey]) {
      savedThemeKey = 'theme-carbon-black';
    }
    
    setThemeKey(savedThemeKey);
  }, []);

  const changeTheme = (key) => {
    localStorage.setItem('diamondAppTheme', key);
    setThemeKey(key);
  };

  const currentTheme = themes[themeKey];

  return (
    <ThemeContext.Provider value={{ themeKey, changeTheme, currentTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};