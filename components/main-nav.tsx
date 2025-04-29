"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, User, Menu } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

import { cn } from "@/lib/utils"; // Ensure this resolves correctly
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/discover", label: "Discover" },
    { href: "/library", label: "My Library" },
    { href: "/reader", label: "Reader" },
  ];

  return (
    <div className="border-b bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-gray-900 dark:text-white">BookSurfer</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className={cn(
            "hidden md:flex items-center space-x-6 text-sm font-medium flex-1",
            className
          )}
          {...props}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary px-3 py-2 rounded-md",
                pathname === item.href || (item.href === "/reader" && pathname?.startsWith("/reader"))
                  ? "text-primary bg-gray-100 dark:bg-gray-800"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <Link href="/" className="flex items-center space-x-2 mb-6" onClick={() => setIsMobileMenuOpen(false)}>
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">BookSurfer</span>
            </Link>
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-primary px-3 py-2 rounded-md",
                    pathname === item.href || (item.href === "/reader" && pathname?.startsWith("/reader"))
                      ? "text-primary bg-gray-100 dark:bg-gray-800"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={session.user?.image || undefined} 
                      alt={session.user?.name || "Profile"}
                    />
                    <AvatarFallback>
                      {session.user?.name?.split(" ").map(n => n[0]).join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-semibold">
                  {session.user?.name || "My Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/profile" className="flex w-full">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="flex w-full">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-md"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}