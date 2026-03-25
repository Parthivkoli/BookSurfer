"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { BookCard } from "@/components/book-card";
import { BookCardSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { BookOpen, BookText, Headphones, Search, Sparkles, X, Loader2 } from "lucide-react";
import ChatBotToggle from "@/components/ChatBotToggle";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  coverImage?: string;
  source: string;
}

export default function Home() {
  const router = useRouter();
  const [featuredBooks, setFeaturedBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookCount, setBookCount] = useState<number | null>(null);
  
  // Live search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLFormElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showResults]);

  useEffect(() => {
    let cancelled = false;

    // Fetch live book count from Open Library
    fetch("https://openlibrary.org/search.json?q=*&limit=1")
      .then((r) => r.json())
      .then((data) => setBookCount(data.numFound))
      .catch((err) => {
        console.error(err);
        setBookCount(36495812);
      });

    // Fetch featured books via our API route
    const trendingAbortController = new AbortController();
    const FEATURED_TIMEOUT_MS = 9000;

    // Force the UI to stop showing skeletons even if parsing hangs.
    const trendingTimeoutId = setTimeout(() => {
      trendingAbortController.abort();
      if (cancelled) return;
      console.warn("Featured books timeout; rendering empty state.");
      setFeaturedBooks([]);
      setIsLoading(false);
    }, FEATURED_TIMEOUT_MS);

    (async () => {
      try {
        const r = await fetch("/api/books/trending?limit=8&category=classic", {
          signal: trendingAbortController.signal,
        });
        const data = await r.json();
        if (cancelled) return;
        setFeaturedBooks(data.books || []);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to fetch featured books:", error);
        setFeaturedBooks([]);
      } finally {
        if (cancelled) return;
        clearTimeout(trendingTimeoutId);
        setIsLoading(false);
      }
    })();

    // Cleanup timeout and abort controller on unmount
    return () => {
      cancelled = true;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      trendingAbortController.abort();
      clearTimeout(trendingTimeoutId);
    };
  }, []);

  // Live search handler with debounce
  const handleSearchInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/books/search?query=${encodeURIComponent(value)}&limit=8&sources=openlibrary,gutenberg,google`,
          { signal: abortControllerRef.current?.signal }
        );
        
        if (!res.ok) {
          console.error(`Search API error: ${res.status}`);
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        const data = await res.json();
        const books = data.books || [];
        
        // Map books to SearchResult with proper field handling
        const results = books.map((book: any) => ({
          id: book.id || '',
          title: book.title || 'Unknown Title',
          authors: Array.isArray(book.authors) ? book.authors : (book.author ? [book.author] : ['Unknown Author']),
          coverImage: book.coverImage,
          source: book.source || 'unknown'
        }));
        
        setSearchResults(results.slice(0, 8));
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Search error:", error);
        }
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the book or to discover with the book title
    router.push(`/discover?q=${encodeURIComponent(result.title)}`);
    setShowResults(false);
    setSearchQuery("");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <MainNav />

      <main className="flex-1 flex flex-col">
        {/* ── Immersive Hero Section ──────────────────────────────────────── */}
        <section className="relative w-full h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-black/70 to-black z-0" />
          
          <div className="relative z-10 w-full max-w-4xl px-4 md:px-6 flex flex-col items-center text-center -mt-12">
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 border border-primary/30 bg-primary/10 rounded-full mb-8 text-primary/90 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium tracking-wide">
                Join our open-source reading platform
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-[1.1] animate-fade-up-d1">
              Dive into the endless <br/>
              <span className="text-primary italic">ocean of literature.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-sans animate-fade-up-d2">
              BookSurfer is your AI-powered gateway to{" "}
              <b className="text-white tracking-wide">
                {bookCount ? new Intl.NumberFormat().format(bookCount) : "millions of"}
              </b>{" "}
              free books, intelligent summaries, and immersive text-to-speech.
            </p>

            {/* Search Bar with Live Results Dropdown */}
            <form ref={searchContainerRef} onSubmit={handleSearch} className="w-full max-w-2xl relative animate-fade-up-d3 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search className="h-6 w-6" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                placeholder="Search by title, author, or topic..."
                className="w-full h-16 pl-14 pr-32 rounded-full border-2 border-white/10 bg-white/5 backdrop-blur-md text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-sans text-lg shadow-2xl"
              />
              <div className="absolute inset-y-2 right-2 flex items-center gap-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button type="submit" className="h-full rounded-full px-8 text-base font-semibold shadow-lg hover:scale-105 transition-transform">
                  Search
                </Button>
              </div>

              {/* Live Search Results Dropdown */}
              <AnimatePresence>
                {showResults && (searchResults.length > 0 || isSearching) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-3 left-0 right-0 bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm"
                  >
                    {isSearching ? (
                      <div className="flex items-center justify-center gap-3 py-8 px-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        {searchResults.map((result, idx) => (
                          <motion.button
                            key={result.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleResultClick(result)}
                            className="w-full px-4 py-3 flex items-center gap-4 hover:bg-primary/10 transition-colors border-b border-border/30 last:border-b-0 group text-left"
                          >
                            {result.coverImage && (
                              <img
                                src={result.coverImage}
                                alt={result.title}
                                className="h-12 w-9 rounded object-cover group-hover:shadow-lg transition-shadow flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground text-sm line-clamp-1">
                                {result.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {Array.isArray(result.authors) && result.authors.length > 0 
                                  ? result.authors.join(", ") 
                                  : "Unknown Author"}
                              </p>
                            </div>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                              {result.source}
                            </span>
                          </motion.button>
                        ))}
                        <button
                          type="button"
                          onClick={handleSearch}
                          className="w-full px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors bg-primary/5"
                        >
                          View all results for "{searchQuery}"
                        </button>
                      </div>
                    ) : (
                      <div className="py-8 px-4 text-center">
                        <p className="text-muted-foreground text-sm">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Animated Wave SVG */}
          <div className="absolute bottom-0 w-[200%] h-32 md:h-48 z-0 pointer-events-none opacity-20 text-primary">
            <svg 
              className="absolute bottom-0 w-full h-full animate-wave" 
              viewBox="0 0 1440 320" 
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0,160L48,170.7C96,181,192,203,288,208C384,213,480,203,576,176C672,149,768,107,864,117.3C960,128,1056,192,1152,202.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
              <path d="M0,160L48,170.7C96,181,192,203,288,208C384,213,480,203,576,176C672,149,768,107,864,117.3C960,128,1056,192,1152,202.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" transform="translate(1440 0)" />
            </svg>
          </div>
          {/* Layer 2 darker wave */}
          <div className="absolute bottom-0 w-[200%] h-24 md:h-36 z-0 pointer-events-none text-background">
             <svg 
              className="absolute bottom-0 w-full h-full animate-wave" 
              viewBox="0 0 1440 320" 
              preserveAspectRatio="none"
              fill="currentColor"
              style={{ animationDirection: 'reverse', animationDuration: '15s' }}
            >
              <path d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,234.7C840,245,960,235,1080,208C1200,181,1320,139,1380,117.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
              <path d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,234.7C840,245,960,235,1080,208C1200,181,1320,139,1380,117.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" transform="translate(1440 0)" />
            </svg>
          </div>
        </section>

        {/* ── Featured Books ────────────────────────────────────────── */}
        <section className="py-24 px-4 md:px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl font-serif font-bold mb-3 text-foreground">Featured Books</h2>
                <p className="text-lg text-muted-foreground font-sans max-w-2xl">
                  Hand-picked classics and popular titles to start your reading journey.
                </p>
              </div>
              <Button variant="ghost" asChild className="hidden md:flex text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors mt-4 md:mt-0">
                <Link href="/discover">Explore Collection &rarr;</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {isLoading
                ? [...Array(5)].map((_, i) => <BookCardSkeleton key={i} />)
                : featuredBooks.length > 0 ? (
                    featuredBooks.slice(0, 5).map((book, i) => (
                      <BookCard key={book.id || i} book={book} index={i} priority={i < 3} />
                    ))
                  ) : (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                      No featured books right now. Please try again in a moment.
                    </div>
                  )}
            </div>
            
            <div className="mt-8 text-center md:hidden">
              <Button variant="outline" asChild className="w-full">
                <Link href="/discover">Explore Collection</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────── */}
        <section className="py-24 px-4 md:px-6 bg-muted/40 border-y border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
                Powerful Features for Readers
              </h2>
              <p className="text-lg text-muted-foreground font-sans max-w-2xl mx-auto">
                Everything you need to read smarter, faster, and more enjoyably
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: BookText,
                  title: "AI Summaries",
                  desc: "Get intelligent summaries of chapters or entire books. Understand key themes efficiently.",
                },
                {
                  icon: Headphones,
                  title: "Audio Narration",
                  desc: "Experience books with high-quality text-to-speech. Read while commuting, exercising, or relaxing.",
                },
                {
                  icon: Sparkles,
                  title: "Immersive Reader",
                  desc: "Distraction-free environment with beautiful typography, personalized themes, and offline support.",
                },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className={`bg-card rounded-2xl p-8 hover-lift border border-border/60 shadow-sm card-${i + 1}`}
                >
                  <div className="mb-6 w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-3 text-foreground">{title}</h3>
                  <p className="text-muted-foreground font-sans leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────── */}
        <section className="py-24 px-4 md:px-6 bg-black relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          </div>
          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-white">Ready to start reading?</h2>
            <p className="text-xl mb-10 text-white/70 font-sans max-w-2xl mx-auto">
              Join thousands of readers who are experiencing books in an entirely new way.
            </p>
            <Button
              size="lg"
              asChild
              className="font-semibold transition-all shadow-xl px-10 h-14 text-lg rounded-full"
            >
              <Link href="/discover">Start Exploring</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
             <div>
                <div className="flex items-center gap-2 mb-4 text-primary">
                  <BookOpen className="h-6 w-6" />
                  <span className="font-serif font-bold text-lg text-foreground">BookSurfer</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pr-4">
                  An open-source AI-powered book reading platform. Read, listen, and explore literature freely.
                </p>
              </div>
              <div>
                <h3 className="font-sans font-semibold mb-4 text-foreground">Platform</h3>
                {[["Discover", "/discover"], ["My Library", "/library"], ["Features", "/#features"]].map(([label, href]) => (
                  <p key={label} className="mb-2">
                    <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {label}
                    </Link>
                  </p>
                ))}
              </div>
              <div>
                <h3 className="font-sans font-semibold mb-4 text-foreground">Community</h3>
                {[["GitHub", "https://github.com/Parthivkoli/BookSurfer"], ["Issues", "https://github.com/Parthivkoli/BookSurfer/issues"], ["Contribute", "/contribute"], ["Team", "/team"]].map(([label, href]) => (
                  <p key={label} className="mb-2">
                    <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {label}
                    </Link>
                  </p>
                ))}
              </div>
              <div>
                <h3 className="font-sans font-semibold mb-4 text-foreground">Legal</h3>
                {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]].map(([label, href]) => (
                  <p key={label} className="mb-2">
                    <Link href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {label}
                    </Link>
                  </p>
                ))}
              </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} BookSurfer. Licensed under MIT.</p>
            <p className="mt-4 md:mt-0">Built with 🌊</p>
          </div>
        </div>
      </footer>

      <ChatBotToggle />
    </div>
  );
}