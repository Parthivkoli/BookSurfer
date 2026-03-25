"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, SlidersHorizontal, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BookCard } from "@/components/book-card";
import { BookCardSkeleton } from "@/components/ui/skeletons";
import { NoResultsState } from "@/components/ui/empty-states";
import { searchArxiv } from "@/lib/api/arxiv";
import { searchSemanticScholar } from "@/lib/api/semanticscholar";
import { searchLNMTL } from "@/lib/api/lnmtl";
import { searchRoyalRoad } from "@/lib/api/royalroad";
import { scrapeWebnovel } from "@/lib/api/webnovel";
import { Book } from "@/types/book";
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
import { Badge } from "@/components/ui/badge";

// ===========================================================================
// Types
// ===========================================================================

type ContentType = "books" | "papers" | "novels";

type BookSource  = "openlibrary" | "gutenberg" | "google" | "internetarchive" | "librivox" | "feedbooks";
type PaperSource = "arxiv" | "semanticscholar";
type NovelSource = "lnmtl" | "royalroad" | "webnovel";
type AnySource   = BookSource | PaperSource | NovelSource;

interface ExtendedBook extends Book {
  abstract?: string;
}

// ===========================================================================
// Static config
// ===========================================================================

const BOOKS_PER_PAGE = 12;
const DEBOUNCE_MS    = 400;
const DEFAULT_BOOK_SOURCES: AnySource[] = ["openlibrary", "gutenberg", "google"];

const SOURCE_LABELS: Record<AnySource, string> = {
  openlibrary:     "Open Library",
  gutenberg:       "Project Gutenberg",
  google:          "Google Books",
  internetarchive: "Internet Archive",
  librivox:        "LibriVox",
  feedbooks:       "Feedbooks",
  arxiv:           "arXiv",
  semanticscholar: "Semantic Scholar",
  lnmtl:           "LNMTL",
  royalroad:       "Royal Road",
  webnovel:        "Webnovel",
};

const SOURCES_BY_TYPE: Record<ContentType, AnySource[]> = {
  books:  ["openlibrary", "gutenberg", "google", "internetarchive", "librivox", "feedbooks"],
  papers: ["arxiv", "semanticscholar"],
  novels: ["lnmtl", "royalroad", "webnovel"],
};

const BOOK_TABS = [
  { value: "all",        label: "All"         },
  { value: "fiction",    label: "Fiction"     },
  { value: "nonfiction", label: "Non-Fiction" },
  { value: "science",    label: "Science"     },
  { value: "history",    label: "History"     },
];

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French"  },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German"  },
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  books:  "Books",
  papers: "Research Papers",
  novels: "Light Novels",
};

// ===========================================================================
// Pure helpers
// ===========================================================================

function normalizeNovel(novel: any): ExtendedBook {
  return {
    ...novel,
    id:          novel.id ?? `novel-${novel.title}-${Math.random()}`,
    authors:     novel.authors ?? ["Unknown Author"],
    description: novel.genre   ? `Genre: ${novel.genre}` : undefined,
    categories:  novel.genre   ? [novel.genre] : undefined,
    pageCount:   novel.chapters,
    downloadUrl: novel.url,
    abstract:    undefined,
  } as ExtendedBook;
}

function applySort(items: ExtendedBook[], sortBy: string): ExtendedBook[] {
  if (sortBy === "relevance") return items;
  return [...items].sort((a, b) => {
    if (sortBy === "title")  return a.title.localeCompare(b.title);
    if (sortBy === "date")   return (b.publishedDate ?? "").localeCompare(a.publishedDate ?? "");
    if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
    return 0;
  });
}

function itemKey(item: ExtendedBook, index: number): string {
  return item.id ? String(item.id) : `item-${index}-${item.title}`;
}

function pageWindow(current: number, total: number, count = 5): number[] {
  if (total <= count) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(count / 2));
  const end  = Math.min(total, start + count - 1);
  start = Math.max(1, end - count + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ===========================================================================
// Component
// ===========================================================================

export default function DiscoverPage() {
  // Two-tier search: inputValue (instant, controlled) vs searchQuery (debounced, triggers fetch)
  const [inputValue,    setInputValue]    = useState("");
  const [searchQuery,   setSearchQuery]   = useState("");

  const [contentType,   setContentType]   = useState<ContentType>("books");
  const [activeTab,     setActiveTab]     = useState("all");
  const [activeSources, setActiveSources] = useState<AnySource[]>(DEFAULT_BOOK_SOURCES);
  const [languages,     setLanguages]     = useState<string[]>([]);
  const [sortBy,        setSortBy]        = useState("relevance");

  const [results,       setResults]       = useState<ExtendedBook[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortRef      = useRef<AbortController | null>(null);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleContentTypeChange = useCallback((next: ContentType) => {
    setContentType(next);
    setActiveSources(next === "books" ? DEFAULT_BOOK_SOURCES : SOURCES_BY_TYPE[next]);
    setActiveTab("all");
    setCurrentPage(1);
    setError(null);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(value.trim());
      setCurrentPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const handleSourceToggle = useCallback((source: AnySource, checked: boolean) => {
    setActiveSources(prev =>
      checked ? [...prev, source] : prev.filter(s => s !== source)
    );
    setCurrentPage(1);
  }, []);

  const handleLanguageToggle = useCallback((lang: string, checked: boolean) => {
    setLanguages(prev => checked ? [...prev, lang] : prev.filter(l => l !== lang));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setActiveSources(contentType === "books" ? DEFAULT_BOOK_SOURCES : SOURCES_BY_TYPE[contentType]);
    setLanguages([]);
    setSortBy("relevance");
    setCurrentPage(1);
  }, [contentType]);

  const clearSearch = useCallback(() => {
    setInputValue("");
    setSearchQuery("");
    setCurrentPage(1);
    resetFilters();
  }, [resetFilters]);

  // -------------------------------------------------------------------------
  // Main fetch effect
  // -------------------------------------------------------------------------

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const SEARCH_TIMEOUT_MS = 20000;

    const timeoutId = setTimeout(() => {
      // Ensure the UI never gets stuck if the backend call hangs.
      controller.abort();
      setError("Search timed out. Please try again.");
      setResults([]);
      setTotalPages(1);
      setLoading(false);
    }, SEARCH_TIMEOUT_MS);

    // Only use sources valid for the current content type
    const validSources = activeSources.filter(s =>
      (SOURCES_BY_TYPE[contentType] as string[]).includes(s)
    );

    if (validSources.length === 0) {
      setLoading(false);
      setError("Please select at least one book source.");
      setResults([]);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    setError(null);

    async function run() {
      try {
        let items: ExtendedBook[] = [];
        let total = 0;

        if (contentType === "books") {
          const params = new URLSearchParams({
            query:   searchQuery,
            page:    String(currentPage),
            limit:   String(BOOKS_PER_PAGE),
            sources: validSources.join(","),
          });
          if (activeTab !== "all") params.set("subject",   activeTab);
          if (languages.length)    params.set("languages", languages.join(","));

          const res = await fetch(`/api/books/search?${params}`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Books API returned ${res.status}`);
          const data = await res.json();
          items = data.books      ?? [];
          total = data.totalItems ?? items.length;

          // Resilience: if multi-source returns nothing, fall back to OpenLibrary only.
          if (items.length === 0) {
            const fallbackParams = new URLSearchParams({
              query: searchQuery,
              page: String(currentPage),
              limit: String(BOOKS_PER_PAGE),
              sources: "openlibrary",
            });
            if (activeTab !== "all") fallbackParams.set("subject", activeTab);

            const fallbackRes = await fetch(`/api/books/search?${fallbackParams}`, {
              signal: controller.signal,
            });
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              items = fallbackData.books ?? [];
              total = fallbackData.totalItems ?? items.length;
            }
          }

        } else if (contentType === "papers") {
          const settled = await Promise.allSettled(
            (validSources as PaperSource[]).map(src =>
              src === "arxiv"
                ? searchArxiv(searchQuery)
                : searchSemanticScholar(searchQuery)
            )
          );
          items = settled
            .filter((r): r is PromiseFulfilledResult<ExtendedBook[]> => r.status === "fulfilled")
            .flatMap(r => r.value);
          total = items.length;

        } else {
          const settled = await Promise.allSettled(
            (validSources as NovelSource[]).map(src => {
              if (src === "lnmtl")     return searchLNMTL(searchQuery);
              if (src === "royalroad") return searchRoyalRoad(searchQuery);
              return scrapeWebnovel(searchQuery);
            })
          );
          items = settled
            .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
            .flatMap(r => r.value.map(normalizeNovel));
          total = items.length;
        }

        if (controller.signal.aborted) return;

        setResults(applySort(items, sortBy));
        setTotalPages(Math.max(1, Math.ceil(total / BOOKS_PER_PAGE)));
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("[discover] fetch error:", err);
        setError("Something went wrong. Please try again.");
        setResults([]);
        setTotalPages(1);
      } finally {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    run();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery, currentPage, activeTab, contentType, activeSources, languages, sortBy]);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const disabledSources = (SOURCES_BY_TYPE[contentType] as AnySource[]).filter(
    s => !activeSources.includes(s)
  );
  const activeFilterCount = disabledSources.length + languages.length;
  const pages = pageWindow(currentPage, totalPages);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />

      <main className="flex-1 max-w-7xl mx-auto w-full py-8 px-4 md:px-6 space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Search open libraries, research archives, and novel platforms
            </p>
          </div>

          <Select
            value={contentType}
            onValueChange={v => handleContentTypeChange(v as ContentType)}
          >
            <SelectTrigger className="w-48 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map(ct => (
                <SelectItem key={ct} value={ct}>
                  {CONTENT_TYPE_LABELS[ct]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            setSearchQuery(inputValue.trim());
            setCurrentPage(1);
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <Input
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            placeholder={`Search ${contentType} by title, author, or keyword...`}
            className="pl-10 pr-20 h-12 text-base"
            aria-label="Search"
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={sortBy} onValueChange={v => { setSortBy(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="date">Newest First</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine results for {contentType}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Sources
                  </h3>
                  <div className="space-y-3">
                    {(SOURCES_BY_TYPE[contentType] as AnySource[]).map(source => (
                      <div key={source} className="flex items-center gap-2">
                        <Checkbox
                          id={`src-${source}`}
                          checked={activeSources.includes(source)}
                          onCheckedChange={checked =>
                            handleSourceToggle(source, checked as boolean)
                          }
                        />
                        <Label htmlFor={`src-${source}`} className="cursor-pointer font-normal">
                          {SOURCE_LABELS[source]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </section>

                {contentType === "books" && (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Language
                      </h3>
                      <div className="space-y-3">
                        {LANGUAGE_OPTIONS.map(({ code, label }) => (
                          <div key={code} className="flex items-center gap-2">
                            <Checkbox
                              id={`lang-${code}`}
                              checked={languages.includes(code)}
                              onCheckedChange={checked =>
                                handleLanguageToggle(code, checked as boolean)
                              }
                            />
                            <Label htmlFor={`lang-${code}`} className="cursor-pointer font-normal">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="ghost" onClick={resetFilters}>
                  Reset all
                </Button>
                <SheetTrigger asChild>
                  <Button>Apply</Button>
                </SheetTrigger>
              </div>
            </SheetContent>
          </Sheet>

          {!loading && !error && results.length > 0 && (
            <span className="text-sm text-muted-foreground ml-auto">
              {results.length.toLocaleString()} result{results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Active filter chips */}
        <AnimatePresence initial={false}>
          {(disabledSources.length > 0 || languages.length > 0) && (
            <motion.div
              key="chips"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-wrap gap-2 overflow-hidden"
            >
              {disabledSources.map(source => (
                <motion.button
                  key={`off-${source}`}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={() => handleSourceToggle(source, true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  title={`Re-enable ${SOURCE_LABELS[source]}`}
                >
                  <span className="line-through">{SOURCE_LABELS[source]}</span>
                  <span aria-hidden="true">+</span>
                </motion.button>
              ))}

              {languages.map(lang => (
                <motion.button
                  key={`lang-${lang}`}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={() => handleLanguageToggle(lang, false)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  {LANGUAGE_OPTIONS.find(l => l.code === lang)?.label ?? lang}
                  <X className="h-3 w-3" aria-hidden="true" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs (books only) */}
        {contentType === "books" && (
          <Tabs
            value={activeTab}
            onValueChange={v => { setActiveTab(v); setCurrentPage(1); }}
          >
            <TabsList>
              {BOOK_TABS.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>

        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive/60" />
            <p className="text-muted-foreground max-w-sm text-sm">{error}</p>
            <Button variant="outline" onClick={() => setCurrentPage(p => p)}>
              Try again
            </Button>
          </div>

        ) : results.length === 0 ? (
          <NoResultsState
            title="No results found"
            description={
              searchQuery
                ? `No ${contentType} matched "${searchQuery}". Try different keywords or adjust your filters.`
                : `No ${contentType} found for the current filters.`
            }
            action={{ label: "Clear search & filters", onClick: clearSearch }}
          />

        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.045 } },
            }}
          >
            {results.map((item, i) => (
              <motion.div
                key={itemKey(item, i)}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
                }}
              >
                <BookCard book={item} index={i % 5} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <nav className="flex justify-center items-center gap-1 pt-4" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Prev
            </Button>

            {pages[0] > 1 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)}>
                  1
                </Button>
                {pages[0] > 2 && (
                  <span className="px-1 text-sm text-muted-foreground select-none">...</span>
                )}
              </>
            )}

            {pages.map(n => (
              <Button
                key={n}
                variant={n === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(n)}
                aria-current={n === currentPage ? "page" : undefined}
              >
                {n}
              </Button>
            ))}

            {pages[pages.length - 1] < totalPages && (
              <>
                {pages[pages.length - 1] < totalPages - 1 && (
                  <span className="px-1 text-sm text-muted-foreground select-none">...</span>
                )}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </nav>
        )}
      </main>
    </div>
  );
}