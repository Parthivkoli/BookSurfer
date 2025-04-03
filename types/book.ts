// types/book.ts
export interface Book {
  id: string;
  title: string;
  authors?: string[];
  author?: string;
  coverImage?: string;
  description?: string;
  abstract?: string; // For research papers
  publishedDate?: string;
  categories?: string[];
  language?: string[];
  pageCount?: number;
  source:
    | "openlibrary"
    | "gutenberg"
    | "google"
    | "internetarchive"
    | "librivox"
    | "feedbooks"
    | "arxiv"
    | "core"
    | "semanticscholar"
    | "lnmtl"
    | "royalroad"
    | "webnovel";
  downloadUrl?: string;
  pdfUrl?: string; // For papers
  chapters?: { title: string; content: string }[]; // For novels
  rating?: number;
}

/**
 * Parameters for searching books across APIs
 */
export interface BookSearchParams {
  query?: string;                // Search query (e.g., book title or keywords)
  page?: number;                 // Page number for pagination (default: 1)
  limit?: number;                // Number of results per page (default: 10)
  subject?: string;              // Subject filter (e.g., "fiction" for Open Library)
  languages?: string[];          // Language filter (e.g., ["en", "fr"])
  sources?: ("openlibrary" | "gutenberg" | "google")[]; // Optional source filter
  sort?: "rating" | "relevance" | "date";  // Sort criteria (default: relevance)
}

/**
 * Response structure for book search results
 */
export interface BookSearchResponse {
  books: Book[];                 // Array of books matching the search criteria
  totalItems: number;            // Total number of available books (across all pages)
  page: number;                  // Current page number
  limit: number;                 // Number of items per page
  totalPages: number;            // Total number of pages based on totalItems and limit
}