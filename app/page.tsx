"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Filter, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MainNav } from "@/components/main-nav";
import { Book } from "@/types/book";

type SourceType = "openlibrary" | "gutenberg" | "google" | "internetarchive" | "librivox" | "feedbooks";
type ContentType = "books" | "papers" | "novels";

type ExtendedBook = Book & { abstract?: string };

const ALL_BOOK_SOURCES: SourceType[] = ["openlibrary", "gutenberg", "google", "internetarchive", "librivox", "feedbooks"];

const getSourceLabel = (source: string) => {
  switch (source) {
    case "openlibrary": return "Open Library";
    case "gutenberg": return "Project Gutenberg";
    case "google": return "Google Books";
    case "internetarchive": return "Internet Archive";
    case "librivox": return "LibriVox";
    case "feedbooks": return "Feedbooks";
    default: return source;
  }
};

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ExtendedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("relevance");
  const [activeTab, setActiveTab] = useState("all");
  const [contentType, setContentType] = useState<ContentType>("books");
  const [sources, setSources] = useState<SourceType[]>(ALL_BOOK_SOURCES);
  const [languages, setLanguages] = useState<string[]>([]);
  const booksPerPage = 20;

  const activeSourcesParam = useMemo(() => sources.join(","), [sources]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          page: String(page),
          limit: String(booksPerPage),
          sources: activeSourcesParam,
        });

        if (activeTab !== "all") params.set("subject", activeTab);
        languages.forEach((language) => params.append("language", language));

        const response = await fetch(`/api/books/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          setResults([]);
          return;
        }

        const payload = await response.json();
        const items = Array.isArray(payload.books) ? payload.books : [];
        const sorted = [...items].sort((a, b) => {
          if (sortBy === "title") return a.title.localeCompare(b.title);
          if (sortBy === "date") return (b.publishedDate ?? "").localeCompare(a.publishedDate ?? "");
          if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
          return 0;
        });

        setResults(sorted);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Discovery fetch failed:", error);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    return () => controller.abort();
  }, [searchQuery, page, activeTab, languages, sortBy, activeSourcesParam]);

  const paginatedResults = results.slice((page - 1) * booksPerPage, page * booksPerPage);

  const handleSourceChange = (source: SourceType, checked: boolean) => {
    setSources((prev) => (checked ? [...prev, source] : prev.filter((item) => item !== source)));
    setPage(1);
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    setLanguages((prev) => (checked ? [...prev, language] : prev.filter((item) => item !== language)));
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <MainNav />
      <div className="flex-1 max-w-7xl mx-auto py-8 px-4 md:px-6 w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Discover</p>
            <h1 className="text-3xl md:text-4xl font-bold">Find your next favorite read</h1>
          </div>
          <Select value={contentType} onValueChange={(value) => setContentType(value as ContentType)}>
            <SelectTrigger className="w-full md:w-[180px] bg-slate-900 border-slate-700 text-slate-50">
              <SelectValue placeholder="Content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="books">Books</SelectItem>
              <SelectItem value="papers">Research Papers</SelectItem>
              <SelectItem value="novels">Light Novels</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-6">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px] bg-slate-900 border-slate-700 text-slate-50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="date">Publication Date</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-50 hover:bg-slate-800">
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-slate-950 text-slate-50 border-slate-800">
              <SheetHeader>
                <SheetTitle>Filter books</SheetTitle>
                <SheetDescription className="text-slate-400">Refine your discovery results.</SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-5">
                <div>
                  <h3 className="font-medium mb-2">Sources</h3>
                  <div className="space-y-2">
                    {ALL_BOOK_SOURCES.map((source) => (
                      <div key={source} className="flex items-center space-x-2">
                        <Checkbox
                          id={source}
                          checked={sources.includes(source)}
                          onCheckedChange={(checked) => handleSourceChange(source, checked as boolean)}
                          className="border-slate-600 data-[state=checked]:bg-cyan-500"
                        />
                        <Label htmlFor={source} className="text-slate-200">{getSourceLabel(source)}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                <div>
                  <h3 className="font-medium mb-2">Languages</h3>
                  <div className="space-y-2">
                    {['en', 'fr', 'es', 'de'].map((lang) => (
                      <div key={lang} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${lang}`}
                          checked={languages.includes(lang)}
                          onCheckedChange={(checked) => handleLanguageChange(lang, checked as boolean)}
                          className="border-slate-600 data-[state=checked]:bg-cyan-500"
                        />
                        <Label htmlFor={`lang-${lang}`} className="text-slate-200">
                          {lang === "en" ? "English" : lang === "fr" ? "French" : lang === "es" ? "Spanish" : "German"}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setSources(ALL_BOOK_SOURCES);
                  setLanguages([]);
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </SheetContent>
          </Sheet>
        </div>

        {contentType === "books" && (
          <div className="mb-8 flex flex-wrap gap-2">
            {['all', 'fiction', 'nonfiction', 'science', 'history'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={activeTab === tab ? "bg-cyan-500 hover:bg-cyan-400" : "border-slate-700 text-slate-200 hover:bg-slate-800"}
              >
                {tab === "all" ? "All" : tab === "fiction" ? "Fiction" : tab === "nonfiction" ? "Non-fiction" : tab === "science" ? "Science" : "History"}
              </Button>
            ))}
          </div>
        )}

        <form className="relative mb-8" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${contentType} by title, author, or keyword...`}
            className="pl-10 h-12 bg-slate-900 border-slate-700 text-slate-50 placeholder:text-slate-400"
          />
        </form>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : paginatedResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
            {paginatedResults.map((item) => (
              <BookCard key={item.id} book={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <p>No {contentType} found. Try a broader search or different filters.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="flex justify-center mt-8 gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))} className="border-slate-700 text-slate-200">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-200">
              {page}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((prev) => prev + 1)} className="border-slate-700 text-slate-200">
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookCard({ book }: { book: ExtendedBook }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg shadow-slate-950/30 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50">
      <div className="aspect-[2/3] relative overflow-hidden bg-slate-800">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
            <BookOpen className="h-12 w-12 text-slate-400" />
          </div>
        )}
        <div className="absolute right-2 top-2 rounded-full bg-cyan-500/90 px-2 py-1 text-[10px] font-medium text-slate-950">
          {getSourceLabel(book.source)}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 min-h-[3rem] text-base font-semibold text-slate-50">{book.title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-slate-400">
            {book.authors && book.authors.length > 0 ? book.authors.join(", ") : book.author || "Unknown Author"}
          </p>
        </div>

        <p className="line-clamp-3 text-sm text-slate-300">
          {book.description || book.abstract || "Explore this title to discover a rich reading experience."}
        </p>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-amber-300">{book.rating && book.rating > 0 ? `${book.rating.toFixed(1)} ★` : "New"}</span>
          <Button asChild size="sm" variant="secondary" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            <Link href={`/reader/${book.id}`}>Read</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
