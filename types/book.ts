// types/book.ts
export type BookSource =
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
  source: BookSource;
  downloadUrl?: string;
  pdfUrl?: string; // For papers
  chapters?: { title: string; content: string }[]; // For novels
  rating?: number;
  // For Gutenberg: all available formats (internal use)
  formats?: Record<string, string>;
}

/**
 * Parameters for searching books across APIs
 */
export interface BookSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  subject?: string;
  languages?: string[];
  sources?: BookSource[];
  sort?: "rating" | "relevance" | "date";
}

/**
 * Response structure for book search results
 */
export interface BookSearchResponse {
  books: Book[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}
