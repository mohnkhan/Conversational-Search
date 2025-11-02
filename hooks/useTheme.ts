import { useEffect, useState } from 'react';
import { themes, Theme } from '../themes';

const THEME_STORAGE_KEY = 'chat-theme';

export const useTheme = () => {
  const [themeId, setThemeId] = useState<string>(() => {
    try {
      const savedThemeId = window.localStorage.getItem(THEME_STORAGE_KEY);
      return savedThemeId || 'abyss'; // Default theme
    } catch (error) {
      console.error("Failed to read theme from localStorage:", error);
      return 'abyss';
    }
  });

  useEffect(() => {
    const applyTheme = (id: string) => {
      const selectedTheme: Theme | undefined = themes.find(t => t.id === id);
      if (!selectedTheme) {
        console.warn(`Theme with id "${id}" not found. Applying default.`);
        applyTheme('abyss');
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

  return [themeId, setThemeId] as const;
};
