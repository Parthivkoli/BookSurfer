import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { BookOpen, BookText, Headphones, Search } from "lucide-react";
import Link from "next/link";
import { getFeaturedBooks } from "@/lib/api/books";

export default async function Home() {
  // Fetch featured books for the homepage
  const featuredBooks = await getFeaturedBooks(4);
  
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 md:px-6 bg-gradient-to-b from-background to-muted">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Discover a New Way to Experience Books
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
              BookSurfer combines AI technology with your reading experience to provide summaries, insights, and audio narration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/discover">
                  Explore Books
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                  <BookText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Summaries</h3>
                <p className="text-muted-foreground">
                  Get intelligent summaries of chapters or entire books to enhance your understanding.
                </p>
              </div>
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Audio Narration</h3>
                <p className="text-muted-foreground">
                  Listen to your books with high-quality text-to-speech technology.
                </p>
              </div>
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
                <p className="text-muted-foreground">
                  Find books and content quickly with our advanced search capabilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Books Section */}
        <section className="py-20 px-4 md:px-6 bg-muted/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Books</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {featuredBooks.map((book, index) => (
                <div key={book.id || index} className="bg-card rounded-lg overflow-hidden shadow-sm">
                  <div className="aspect-[2/3] bg-muted relative">
                    {book.coverImage ? (
                      <img 
                        src={book.coverImage} 
                        alt={`Cover of ${book.title}`} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <BookOpen className="h-12 w-12 text-muted-foreground opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {book.authors.length > 0 ? book.authors[0] : 'Unknown Author'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{book.rating.toFixed(1)} ★</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/reader/${book.id}`}>
                          <BookOpen className="h-4 w-4 mr-1" />
                          Read
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button variant="outline" asChild>
                <Link href="/discover">
                  View All Books
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 md:px-6 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Reading Experience?</h2>
            <p className="text-xl max-w-2xl mx-auto mb-10 text-primary-foreground/80">
              Join thousands of readers who are enhancing their reading with AI-powered features.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login">
                Get Started for Free
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {/* Company Section */}
      <div>
        <h3 className="font-semibold mb-3">BookSurfer</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/about" className="text-muted-foreground hover:text-foreground">
              About Us
            </Link>
          </li>
          <li>
            <Link href="/team" className="text-muted-foreground hover:text-foreground">
              Our Team
            </Link>
          </li>
          <li>
            <Link href="/careers" className="text-muted-foreground hover:text-foreground">
              contribute
            </Link>
          </li>
        </ul>
      </div>

      {/* Resources Section */}
      <div>
        <h3 className="font-semibold mb-3">Resources</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/blog" className="text-muted-foreground hover:text-foreground">
              Blog
            </Link>
          </li>
          <li>
            <Link href="/guides" className="text-muted-foreground hover:text-foreground">
              Reading Guides
            </Link>
          </li>
          <li>
            <Link href="/faq" className="text-muted-foreground hover:text-foreground">
              FAQ
            </Link>
          </li>
        </ul>
      </div>

      {/* Legal Section */}
      <div>
        <h3 className="font-semibold mb-3">Legal</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/cookies" className="text-muted-foreground hover:text-foreground">
              Cookie Policy
            </Link>
          </li>
        </ul>
      </div>

      {/* Connect Section */}
      <div>
        <h3 className="font-semibold mb-3">Connect</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground">
              Contact Us
            </Link>
          </li>
          <li>
            <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground">
              Twitter
            </Link>
          </li>
          <li>
            <Link href="https://github.com" className="text-muted-foreground hover:text-foreground">
              GitHub
            </Link>
          </li>
        </ul>
      </div>
    </div>

    {/* Copyright */}
    <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} BookSurfer. All rights reserved.</p>
    </div>
    </div>
    </footer>
    </div>
  );
}