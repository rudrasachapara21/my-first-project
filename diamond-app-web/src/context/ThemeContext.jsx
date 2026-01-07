import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { themes as themeConfig, DEFAULT_THEME_KEY } from '../theme/themeConfig';

// Map our central themeConfig shape into the shape older code expects
const themes = Object.keys(themeConfig).reduce((acc, k) => {
  const t = themeConfig[k];
  acc[k] = {
    bgPrimary: t.background,
    bgSecondary: t.surface,
    textPrimary: t.textMain,
    textSecondary: t.textSecondary,
    accentPrimary: t.primary,
    borderColor: t.border,
    glassEffect: t.glass,
    cardShadow: t.shadow,
    success: t.success,
    error: t.error,
    info: t.info,
    surfaceGlass: t.surfaceGlass || t.surface,
    glassBorder: t.glassBorder,
    primaryGlow: t.primaryGlow,
    primaryGradient: t.primaryGradient,
  };
  return acc;
}, {});

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Default to configured default theme
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY || Object.keys(themes)[0]);

  const getStorageKey = (currentUser) => {
    const userId = currentUser?._id || currentUser?.id || 'guest';
    return `diamondAppTheme_${userId}`; 
  };

  useEffect(() => {
    const storageKey = getStorageKey(user);
    const savedThemeKey = localStorage.getItem(storageKey);
    
    if (savedThemeKey && themes[savedThemeKey]) {
      setThemeKey(savedThemeKey);
    }
  }, [user]);

  const changeTheme = (key) => {
    localStorage.setItem(getStorageKey(user), key);
    setThemeKey(key);
  };

  const currentTheme = themes[themeKey];

  return (
    <ThemeContext.Provider value={{ 
      themeKey, 
      changeTheme, 
      currentTheme, 
      themes 
    }}>
      <div
        id="app-theme-wrapper"
        style={{
          backgroundColor: currentTheme.bgPrimary,
          minHeight: '100dvh',
          color: currentTheme.textPrimary,
          transition: 'background-color 0.3s ease, color 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          // Expose CSS variables for inline-style components that still use var(--...)
          // This keeps a migration path while moving everything to theme tokens.
          '--bg-primary': currentTheme.bgPrimary,
          '--bg-secondary': currentTheme.bgSecondary,
          '--text-primary': currentTheme.textPrimary,
          '--text-secondary': currentTheme.textSecondary,
          '--accent-primary': currentTheme.accentPrimary,
          '--border-color': currentTheme.borderColor,
          '--card-shadow': currentTheme.cardShadow,
          '--success': currentTheme.success,
          '--error': currentTheme.error,
          '--info': currentTheme.info
        }}
      >
        <StyledThemeProvider theme={currentTheme}>
          {children}
        </StyledThemeProvider>
      </div>
    </ThemeContext.Provider>
  );
};