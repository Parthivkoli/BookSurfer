"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion"; // For animations and shockwave

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false); // Track animation state

  // When mounted, set dark mode as default if not set
  React.useEffect(() => {
    setMounted(true);
    if (!theme) {
      setTheme("dark"); // Default to dark mode
    }
  }, [setTheme, theme]);

  // Prevent hydration mismatch by only rendering when mounted
  if (!mounted) return null;

  // Toggle between light and dark modes
  const toggleTheme = () => {
    setIsAnimating(true); // Start shockwave animation
    setTheme(theme === "light" ? "dark" : "light");
    setTimeout(() => setIsAnimating(false), 500); // Match animation duration
  };

  // Animation variants for the theme icons (simplified for clean switching)
  const iconVariants = {
    initial: { scale: 1, opacity: 1 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
    hidden: { scale: 0, opacity: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.1, transition: { duration: 0.2 } },
  };

  // Shockwave animation variants
  const shockwaveVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1.5,
      opacity: 0.5,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.5,
      },
    },
    exit: { scale: 2, opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative h-8 w-8 p-0"
        aria-label="Toggle theme"
        onClick={toggleTheme}
      >
        {/* Only show one icon at a time using AnimatePresence */}
        <AnimatePresence mode="wait"> {/* 'wait' ensures one animation completes before the next starts */}
          {theme === "light" ? (
            <motion.span
              key="sun"
              initial="initial"
              animate="visible"
              exit="hidden"
              whileHover="hover"
              className="absolute"
              variants={iconVariants}
            >
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial="initial"
              animate="visible"
              exit="hidden"
              whileHover="hover"
              className="absolute"
              variants={iconVariants}
            >
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
      {/* Shockwave Animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={shockwaveVariants}
            style={{
              background: "rgba(255, 255, 255, 0.1)", // Subtle white for dark mode
              borderRadius: "50%",
              zIndex: 20, // Ensure it appears above icons
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}