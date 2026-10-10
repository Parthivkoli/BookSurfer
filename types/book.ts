// types/book.ts
export interface Book {
  id: string;
  title: string;
  authors?: string[];
  author?: string;
  coverImage?: string;
  description?: string;
  abstract?: string;
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
  pdfUrl?: string;
  chapters?: { title: string; content: string }[];
  rating?: number;
  formats?: Record<string, string>;
}

export interface BookSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  subject?: string;
  languages?: string[];
  sources?: (
    | "openlibrary"
    | "gutenberg"
    | "google"
    | "internetarchive"
    | "librivox"
    | "feedbooks"
  )[];
  sort?: "rating" | "relevance" | "date";
}

export interface BookSearchResponse {
  books: Book[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}
