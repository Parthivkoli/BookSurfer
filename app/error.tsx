"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { motion } from "framer-motion";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20 shadow-inner">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">
              An error occurred
            </h1>
            <p className="text-muted-foreground">
              We encountered an unexpected problem while loading this page. Our team has been notified.
            </p>
          </div>

          <div className="p-4 bg-muted/30 border border-border/50 rounded-xl text-left overflow-hidden shadow-sm">
            <p className="text-xs font-mono text-muted-foreground break-all line-clamp-3 leading-relaxed">
              {error.message || "Unknown rendering error occurred"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <Button onClick={() => reset()} className="flex-1 sm:max-w-[200px]" size="lg">
              <RefreshCcw className="mr-2 h-5 w-5" /> Try Again
            </Button>
            <Button asChild variant="outline" className="flex-1 sm:max-w-[200px]" size="lg">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" /> Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
