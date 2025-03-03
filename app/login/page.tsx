import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <MainNav />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-20 px-4 md:px-6 bg-gradient-to-b from-background to-muted">
        <div className="max-w-md w-full bg-card rounded-lg shadow-sm p-8">
          {/* Header */}
          <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-center mb-8">
            Log in to continue your reading journey with BookSurfer.
          </p>

          {/* Login Form */}
          <form className="space-y-6">
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

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full hover-lift">
              Log In
            </Button>
          </form>

          {/* Sign Up Prompt */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign Up
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