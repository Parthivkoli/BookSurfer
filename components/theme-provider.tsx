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
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange={disableTransitionOnChange}
      storageKey={storageKey}
      themes={["light", "dark"]}
      forcedTheme={undefined}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}