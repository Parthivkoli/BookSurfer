"use client";

import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import Link from "next/link";
import { FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const { toast } = useToast();

  const handleSignup = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    // Basic client-side validation
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    // Placeholder for signup logic (e.g., API call)
    // For now, simulate a successful signup
    console.log("Signup attempt with:", { email, password });
    toast({
      title: "Success",
      description: "Account created successfully! Please log in.",
    });

    // Optionally redirect to login page after a delay
    // setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <MainNav />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-20 px-4 md:px-6 bg-gradient-to-b from-background to-muted">
        <div className="max-w-md w-full bg-card rounded-lg shadow-sm p-8">
          {/* Header */}
          <h1 className="text-3xl font-bold text-center mb-2">Join BookSurfer</h1>
          <p className="text-muted-foreground text-center mb-8">
            Create an account to start your reading adventure.
          </p>

          {/* Signup Form */}
          <form className="space-y-6" onSubmit={handleSignup}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                name="confirm-password"
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full hover-lift">
              Sign Up
            </Button>
          </form>

          {/* Login Prompt */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-10 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} BookSurfer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}