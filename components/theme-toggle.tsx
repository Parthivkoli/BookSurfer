"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="relative h-8 w-8 p-0"
        disabled
        aria-label="Loading theme toggle"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  const handleToggle = () => {
    setTheme(currentTheme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative h-8 w-8 p-0 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
      aria-label="Toggle theme"
      onClick={handleToggle}
      title={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
    >
      {currentTheme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-slate-600" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-slate-400" />
      )}
    </Button>
  );
}