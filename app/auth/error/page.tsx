"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-destructive">Authentication Error</h1>
          <p className="mt-2 text-muted-foreground">
            {error === "Configuration"
              ? "There is a problem with the server configuration."
              : error === "AccessDenied"
              ? "You do not have permission to sign in."
              : error === "Verification"
              ? "The verification token is invalid or has expired."
              : "An error occurred during authentication."}
          </p>
        </div>

        <div className="text-center">
          <Button asChild>
            <Link href="/auth/signin">Try Again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 