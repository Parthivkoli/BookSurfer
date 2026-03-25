"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl shadow-xl border border-border"
          >
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">Something went wrong</h1>
              <p className="text-muted-foreground text-sm">
                We encountered an unexpected error. Please try again or return home.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-left overflow-hidden">
              <p className="text-xs font-mono text-muted-foreground break-all line-clamp-3">
                {error.message || "Unknown error occurred"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={() => reset()} className="flex-1" variant="default">
                <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" /> Home
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
