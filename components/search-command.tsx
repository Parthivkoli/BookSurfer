"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search as SearchIcon, Loader2, FileText, User } from "lucide-react";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  React.useEffect(() => {
    async function searchOpenLibrary() {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(
            debouncedQuery
          )}&limit=5`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data.docs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    searchOpenLibrary();
  }, [debouncedQuery]);

  const handleSelect = (id: string) => {
    setOpen(false);
    // Since we're using Open Library IDs ("OL...W"), format it for our app router
    router.push(`/reader/ol-${id.replace("/works/", "")}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-md border border-border/50 transition-colors w-full max-w-[240px]"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left hidden sm:inline">Search library...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden shadow-2xl rounded-xl max-w-2xl bg-background/95 backdrop-blur-xl border-border supports-[backdrop-filter]:bg-background/80">
          <Command
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-item]]:px-4 [&_[cmdk-item]]:py-3"
            shouldFilter={false} // We are handling filtering server-side
          >
            <div className="flex items-center border-b border-border/50 px-3" cmdk-input-wrapper="">
              <SearchIcon className="mr-2 h-5 w-5 shrink-0 opacity-50" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search by title, author, or keyword..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
              />
              {isLoading && <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />}
            </div>
            
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden pt-2 pb-4">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                {query.length > 0 && query.length < 3 
                  ? "Keep typing to search..." 
                  : isLoading 
                    ? "Searching Open Library..." 
                    : query.length >= 3 
                      ? "No books found." 
                      : "Type at least 3 characters to search."}
              </Command.Empty>

              {results.length > 0 && (
                <Command.Group heading="Books">
                  {results.map((book) => (
                    <Command.Item
                      key={book.key}
                      value={book.key}
                      onSelect={() => handleSelect(book.key)}
                      className="flex items-center gap-3 cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-foreground rounded-md mx-2"
                    >
                      <div className="h-10 w-8 bg-muted rounded overflow-hidden flex items-center justify-center shrink-0">
                        {book.cover_i ? (
                          <img 
                            src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`} 
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex flex-col flex-1 truncate">
                        <span className="font-serif font-medium truncate">{book.title}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {book.author_name ? book.author_name.join(", ") : "Unknown Author"} 
                          {book.first_publish_year ? ` • ${book.first_publish_year}` : ""}
                        </span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              
              {!query && (
                <Command.Group heading="Quick Links">
                  <Command.Item
                    onSelect={() => {setOpen(false); router.push("/discover");}}
                    className="flex items-center gap-2 cursor-pointer font-medium aria-selected:bg-primary/10 rounded-md mx-2 text-foreground"
                  >
                    <SearchIcon className="h-4 w-4 text-primary" /> Discover Books
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {setOpen(false); router.push("/library");}}
                    className="flex items-center gap-2 cursor-pointer font-medium aria-selected:bg-primary/10 rounded-md mx-2 text-foreground"
                  >
                    <FileText className="h-4 w-4 text-primary" /> My Library
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
