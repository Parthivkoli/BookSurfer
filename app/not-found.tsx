import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, Search } from "lucide-react";
import { MainNav } from "@/components/main-nav";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse blur-sm delay-75" />
            <div className="absolute inset-4 bg-background rounded-full flex items-center justify-center border border-primary/20 shadow-xl">
              <FileQuestion className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground">
              Page Note Found
            </h1>
            <p className="text-lg text-muted-foreground">
              We wandered off the map. The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 max-w-sm mx-auto">
            <Button asChild className="flex-1" size="lg">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" /> Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 border-primary/20 hover:bg-primary/5" size="lg">
              <Link href="/discover">
                <Search className="mr-2 h-5 w-5" /> Discover Books
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
