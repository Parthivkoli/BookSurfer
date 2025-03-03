"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

// Extended props to include custom options
interface CustomThemeProviderProps extends ThemeProviderProps {
  defaultTheme?: "light" | "dark" | "system";
  storageKey?: string;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ children, defaultTheme = "dark", storageKey = "theme", disableTransitionOnChange = false, ...props }: CustomThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  // When mounted, check and set the theme from localStorage or default
  React.useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem(storageKey);
    if (!storedTheme) {
      localStorage.setItem(storageKey, defaultTheme);
    }
  }, [defaultTheme, storageKey]);

  // Prevent hydration mismatch by rendering nothing until mounted
  if (!mounted) return null;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={true}
      disableTransitionOnChange={disableTransitionOnChange}
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

// Custom hook to access theme state with additional utilities
export function useTheme() {
  const context = useNextTheme();

  // Additional utility to toggle theme manually
  const toggleTheme = React.useCallback(() => {
    const currentTheme = context.theme;
    if (currentTheme === "light") {
      context.setTheme("dark");
    } else if (currentTheme === "dark") {
      context.setTheme("system");
    } else {
      context.setTheme("light");
    }
  }, [context.theme, context.setTheme]);

  return {
    ...context,
    toggleTheme, // Add toggle functionality for convenience
  };
}