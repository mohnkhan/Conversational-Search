import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { themes, Theme } from '../themes';

const THEME_STORAGE_KEY = 'chat-theme';

// Define the shape of the context value
interface ThemeContextType {
  themeId: string;
  setThemeId: (id: string) => void;
}

// Create the context with a default undefined value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Create the provider component that will wrap the entire app
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>(() => {
    try {
      const savedThemeId = window.localStorage.getItem(THEME_STORAGE_KEY);
      return savedThemeId || 'abyss'; // Default theme
    } catch (error) {
      console.error("Failed to read theme from localStorage:", error);
      return 'abyss';
    }
  });

  // This effect applies the theme to the document root whenever themeId changes
  useEffect(() => {
    const applyTheme = (id: string) => {
      const selectedTheme: Theme | undefined = themes.find(t => t.id === id);
      if (!selectedTheme) {
        console.warn(`Theme with id "${id}" not found. Applying default.`);
        setThemeId('abyss');
        return;
      }
      
      const root = document.documentElement;
      Object.entries(selectedTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, id);
      } catch (error) {
        console.error("Failed to save theme to localStorage:", error);
      }
    };

    applyTheme(themeId);
  }, [themeId]);

  const value = { themeId, setThemeId };

  // FIX: Replaced JSX with React.createElement because this is a .ts file, not .tsx.
  // The TypeScript compiler was misinterpreting the JSX syntax as operators, causing parsing errors.
  return React.createElement(ThemeContext.Provider, { value }, children);
};

// Create the custom hook that components will use to access the shared state
// It returns an array to maintain the useState-like signature ([value, setValue])
export const useTheme = (): [string, (id: string) => void] => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return [context.themeId, context.setThemeId];
};
