import React, { createContext, useContext, useState, useMemo } from 'react';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors, darkColors, radii } from './theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  colors: typeof colors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const currentColors = useMemo(() => (mode === 'light' ? colors : darkColors), [mode]);

  const value = useMemo(() => ({
    mode,
    toggleTheme,
    colors: currentColors,
  }), [mode, currentColors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

export const getPaperTheme = (mode: ThemeMode) => {
  const baseTheme = mode === 'light' ? MD3LightTheme : MD3DarkTheme;
  const currentColors = mode === 'light' ? colors : darkColors;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: currentColors.primary[900],
      primaryContainer: currentColors.primary[50],
      secondary: currentColors.primary[800],
      secondaryContainer: currentColors.primary[100],
      tertiary: currentColors.accent.amber,
      surface: currentColors.surface,
      background: currentColors.background,
      error: currentColors.danger[900],
      errorContainer: currentColors.danger[50],
      outline: currentColors.neutral[300],
      surfaceVariant: currentColors.neutral[100],
    },
    roundness: radii.md,
  };
};
