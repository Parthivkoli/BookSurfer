"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { UserAuthProvider } from "@/components/user-auth-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/react-query";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider>
          <UserAuthProvider>
            {children}
            <Toaster />
          </UserAuthProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
} 