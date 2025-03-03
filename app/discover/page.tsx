"use client";

import { useState, useEffect } from "react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { searchBooks } from "@/lib/api/books";
import { Book, BookSearchParams } from "@/types/book";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Placeholder API functions (to be implemented elsewhere)
const searchPapers = async (query: string): Promise<Book[]> => {
  return [
    {
      id: "paper1",
      title: "Sample Research Paper",
      authors: ["Author A"],
      source: "arxiv",
      abstract: "This is a sample abstract.",
      rating: 0,
    },
  ];
};

const searchNovels = async (query: string): Promise<Book[]> => {
  return [
    {
      id: "novel1",
      title: "Sample Light Novel",
      authors: ["Author B"],
      source: "royalroad",
      description: "A thrilling adventure.",
      rating: 4.5,
    },
  ];
};

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [contentType, setContentType] = useState<"books" | "papers" | "novels">("books");
  const [sources, setSources] = useState<("openlibrary" | "gutenberg" | "google")[]>([
    "openlibrary",
    "gutenberg",
    "google",
  ]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");

  const booksPerPage = 20;

  // Fetch results based on content type and search parameters
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        if (contentType === "books") {
          const params: BookSearchParams = {
            query: searchQuery,
            page: currentPage,
            limit: booksPerPage,
            sources,
          };
          if (activeTab !== "all") params.subject = activeTab;
          if (languages.length > 0) params.languages = languages;

          const result = await searchBooks(params);
          let sortedBooks = [...result.books];
          if (sortBy === "title") {
            sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
          } else if (sortBy === "date") {
            sortedBooks.sort((a, b) => b.publishedDate!.localeCompare(a.publishedDate!));
          } else if (sortBy === "rating") {
            sortedBooks.sort((a, b) => b.rating - a.rating);
          }
          setResults(sortedBooks);
          setTotalPages(Math.ceil(result.totalItems / booksPerPage) || 1);
        } else if (contentType === "papers") {
          const papers = await searchPapers(searchQuery);
          setResults(papers);
          setTotalPages(Math.ceil(papers.length / booksPerPage) || 1);
        } else if (contentType === "novels") {
          const novels = await searchNovels(searchQuery);
          setResults(novels);
          setTotalPages(Math.ceil(novels.length / booksPerPage) || 1);
        }
      } catch (error) {
        console.error(`Error fetching ${contentType}:`, error);
        setResults([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [searchQuery, currentPage, activeTab, sources, languages, sortBy, contentType]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Handle source filter changes
  const handleSourceChange = (source: "openlibrary" | "gutenberg" | "google", checked: boolean) => {
    setSources((prev) => (checked ? [...prev, source] : prev.filter((s) => s !== source)));
    setCurrentPage(1);
  };

  // Handle language filter changes
  const handleLanguageChange = (language: string, checked: boolean) => {
    setLanguages((prev) => (checked ? [...prev, language] : prev.filter((l) => l !== language)));
    setCurrentPage(1);
  };

  // Paginate results
  const paginatedResults = results.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <div className="flex-1 max-w-7xl mx-auto py-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Discover</h1>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="books">Books</SelectItem>
              <SelectItem value="papers">Research Papers</SelectItem>
              <SelectItem value="novels">Light Novels</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters and Tabs */}
        {contentType === "books" && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
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
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Books</SheetTitle>
                    <SheetDescription>Refine your book search with these filters</SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <h3 className="font-medium mb-2">Sources</h3>
                    <div className="space-y-2">
                      {["openlibrary", "gutenberg", "google"].map((source) => (
                        <div key={source} className="flex items-center space-x-2">
                          <Checkbox
                            id={`source-${source}`}
                            checked={sources.includes(source as "openlibrary" | "gutenberg" | "google")}
                            onCheckedChange={(checked) =>
                              handleSourceChange(source as "openlibrary" | "gutenberg" | "google", checked as boolean)
                            }
                          />
                          <Label htmlFor={`source-${source}`}>
                            {source === "openlibrary" ? "Open Library" : source === "gutenberg" ? "Project Gutenberg" : "Google Books"}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <h3 className="font-medium mb-2">Languages</h3>
                    <div className="space-y-2">
                      {["en", "fr", "es", "de"].map((lang) => (
                        <div key={lang} className="flex items-center space-x-2">
                          <Checkbox
                            id={`lang-${lang}`}
                            checked={languages.includes(lang)}
                            onCheckedChange={(checked) => handleLanguageChange(lang, checked as boolean)}
                          />
                          <Label htmlFor={`lang-${lang}`}>
                            {lang === "en" ? "English" : lang === "fr" ? "French" : lang === "es" ? "Spanish" : "German"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        setSources(["openlibrary", "gutenberg", "google"]);
                        setLanguages([]);
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid grid-cols-5 sm:w-[600px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="fiction">Fiction</TabsTrigger>
                <TabsTrigger value="nonfiction">Non-Fiction</TabsTrigger>
                <TabsTrigger value="science">Science</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${contentType} by title, author, or keyword...`}
            className="pl-10 h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-center">
            {paginatedResults.map((item) => (
              <BookCard key={item.id} book={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No {contentType} found. Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && results.length > 0 && (
          <div className="flex justify-center mt-10">
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (currentPage > 3 && totalPages > 5) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className={pageNum === currentPage ? "bg-primary text-primary-foreground" : ""}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const getSourceBadge = (source: string) => {
    switch (source) {
      case "openlibrary": return "Open Library";
      case "gutenberg": return "Gutenberg";
      case "google": return "Google Books";
      case "arxiv": return "arXiv";
      case "core": return "CORE";
      case "semanticscholar": return "Semantic Scholar";
      case "lnmtl": return "LNMTL";
      case "royalroad": return "Royal Road";
      case "webnovel": return "Webnovel";
      default: return source;
    }
  };

  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-md">
      <div className="aspect-[2/3] bg-muted relative">
        {book.coverImage ? (
          <img src={book.coverImage} alt={`Cover of ${book.title}`} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground opacity-30" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-full">
            {getSourceBadge(book.source)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1 line-clamp-1">{book.title}</h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
          {book.authors.length > 0 ? book.authors.join(", ") : "Unknown Author"}
        </p>
        {book.source === "arxiv" || book.source === "core" || book.source === "semanticscholar" ? (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {book.abstract || "No abstract available"}
          </p>
        ) : book.source === "lnmtl" || book.source === "royalroad" || book.source === "webnovel" ? (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {book.description || "No description available"}
          </p>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-sm">{book.rating > 0 ? `${book.rating.toFixed(1)} ★` : "No rating"}</span>
          </div>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/reader/${book.id}`}>
            <BookOpen className="h-4 w-4 mr-1" />
            Read
          </Link>
        </Button>
      </div>
    </div>
  );
}