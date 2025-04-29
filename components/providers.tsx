"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { UserAuthProvider } from "@/components/user-auth-provider";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <UserAuthProvider>
          {children}
          <Toaster />
        </UserAuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 