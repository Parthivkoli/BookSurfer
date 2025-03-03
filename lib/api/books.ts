import { Book, BookSearchParams } from "@/types/book";
import { load } from "cheerio";

// API endpoints
const API_ENDPOINTS = {
  OPEN_LIBRARY: "https://openlibrary.org/search.json",
  GUTENBERG: "https://gutendex.com/books",
  GOOGLE_BOOKS: "https://www.googleapis.com/books/v1/volumes",
} as const;

type SourceType = "openlibrary" | "gutenberg" | "google";

// Cache setup (in-memory for simplicity; consider Redis for production)
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generic fetch utility with caching and error handling
 * @param url - The URL to fetch
 * @param cacheKey - Unique key for caching
 * @returns Fetched data
 */
async function fetchWithCache(url: string, cacheKey: string): Promise<any> {
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: now });
    return data;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

/**
 * Search books from Open Library API
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchOpenLibrary(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10, subject } = params;
  const queryParams = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString(),
    ...(subject && { subject }),
  });

  const url = `${API_ENDPOINTS.OPEN_LIBRARY}?${queryParams.toString()}`;
  const cacheKey = `openlibrary-${query}-${page}-${limit}-${subject || ""}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    return (data.docs || []).map((book: any) => ({
      id: book.key || `openlibrary-${book.cover_i || Math.random().toString(36).slice(2)}`,
      title: book.title || "Unknown Title",
      authors: Array.isArray(book.author_name) ? book.author_name : [],
      coverImage: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
      description: typeof book.description === "string" ? book.description : "",
      publishedDate: book.first_publish_year?.toString() || "",
      categories: Array.isArray(book.subject) ? book.subject : [],
      language: Array.isArray(book.language) ? book.language : [],
      pageCount: book.number_of_pages_median || 0,
      source: "openlibrary" as const,
      downloadUrl: book.key ? `https://openlibrary.org${book.key}` : null,
      rating: book.rating || 0,
    }));
  } catch (error) {
    console.error("Open Library search failed:", error);
    return [];
  }
}

/**
 * Search books from Project Gutenberg API
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchGutenberg(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10, languages } = params;
  const queryParams = new URLSearchParams({
    search: query,
    page: page.toString(),
    ...(languages?.length && { languages: languages.join(",") }),
  });

  const url = `${API_ENDPOINTS.GUTENBERG}?${queryParams.toString()}`;
  const cacheKey = `gutenberg-${query}-${page}-${languages?.join(",") || ""}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    return (data.results || []).map((book: any) => ({
      id: `gutenberg-${book.id}`,
      title: book.title || "Unknown Title",
      authors: Array.isArray(book.authors) ? book.authors.map((a: any) => a.name || "Unknown Author") : [],
      coverImage: book.formats["image/jpeg"] || null,
      description: "",
      publishedDate: "",
      categories: Array.isArray(book.subjects) ? book.subjects : [],
      language: Array.isArray(book.languages) ? book.languages : [],
      pageCount: 0,
      source: "gutenberg" as const,
      downloadUrl:
        book.formats["text/html"] ||
        book.formats["application/epub+zip"] ||
        book.formats["text/plain"] ||
        null,
      rating: 0,
    }));
  } catch (error) {
    console.error("Gutenberg search failed:", error);
    return [];
  }
}

/**
 * Search books from Google Books API (free ebooks only)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchGoogleBooks(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const startIndex = (page - 1) * limit;
  const queryParams = new URLSearchParams({
    q: query,
    startIndex: startIndex.toString(),
    maxResults: limit.toString(),
    filter: "free-ebooks",
  });

  const url = `${API_ENDPOINTS.GOOGLE_BOOKS}?${queryParams.toString()}`;
  const cacheKey = `google-${query}-${startIndex}-${limit}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    return (data.items || []).map((item: any) => {
      const volumeInfo = item.volumeInfo || {};
      const accessInfo = item.accessInfo || {};
      return {
        id: `google-${item.id}`,
        title: volumeInfo.title || "Unknown Title",
        authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [],
        coverImage: volumeInfo.imageLinks?.thumbnail || null,
        description: volumeInfo.description || "",
        publishedDate: volumeInfo.publishedDate || "",
        categories: Array.isArray(volumeInfo.categories) ? volumeInfo.categories : [],
        language: volumeInfo.language ? [volumeInfo.language] : [],
        pageCount: volumeInfo.pageCount || 0,
        source: "google" as const,
        downloadUrl: accessInfo.epub?.downloadLink || accessInfo.pdf?.downloadLink || null,
        rating: volumeInfo.averageRating || 0,
      };
    });
  } catch (error) {
    console.error("Google Books search failed:", error);
    return [];
  }
}

/**
 * Search books across multiple sources
 * @param params - Search parameters with optional source filter
 * @returns Books and total count
 */
export async function searchBooks(params: BookSearchParams & { sources?: SourceType[] }): Promise<{
  books: Book[];
  totalItems: number;
}> {
  const sources = params.sources || (["openlibrary", "gutenberg", "google"] as SourceType[]);
  const searchFunctions: { [key in SourceType]: (p: BookSearchParams) => Promise<Book[]> } = {
    openlibrary: searchOpenLibrary,
    gutenberg: searchGutenberg,
    google: searchGoogleBooks,
  };

  try {
    const promises = sources.map((source) => searchFunctions[source](params));
    const results = await Promise.allSettled(promises);

    let allBooks: Book[] = [];
    let totalItems = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allBooks = [...allBooks, ...result.value];
        if (sources[index] === "google") totalItems += 1000;
        else if (sources[index] === "gutenberg") totalItems += 60000;
        else if (sources[index] === "openlibrary") totalItems += 10000;
      } else {
        console.warn(`Search failed for source ${sources[index]}:`, result.reason);
      }
    });

    allBooks.sort((a, b) => a.title.localeCompare(b.title));

    return {
      books: allBooks,
      totalItems,
    };
  } catch (error) {
    console.error("Multi-source search failed:", error);
    return { books: [], totalItems: 0 };
  }
}

/**
 * Fetch detailed info for a book by its ID
 * @param id - Book ID with source prefix (e.g., "gutenberg-123")
 * @returns Book details or null if not found
 */
export async function getBookById(id: string): Promise<Book | null> {
  const sourceMap: { [key: string]: () => Promise<Book | null> } = {
    "gutenberg-": async () => {
      const gutenbergId = id.replace("gutenberg-", "");
      const url = `${API_ENDPOINTS.GUTENBERG}/${gutenbergId}`;
      const data = await fetchWithCache(url, `gutenberg-book-${gutenbergId}`);
      return {
        id,
        title: data.title || "Unknown Title",
        authors: data.authors?.map((a: any) => a.name || "Unknown Author") || [],
        coverImage: data.formats["image/jpeg"] || null,
        description: "",
        publishedDate: "",
        categories: data.subjects || [],
        language: data.languages || [],
        pageCount: 0,
        source: "gutenberg" as const,
        downloadUrl: data.formats["text/html"] || data.formats["application/epub+zip"] || data.formats["text/plain"] || null,
        rating: 0,
      };
    },
    "google-": async () => {
      const googleId = id.replace("google-", "");
      const url = `${API_ENDPOINTS.GOOGLE_BOOKS}/${googleId}`;
      const data = await fetchWithCache(url, `google-book-${googleId}`);
      const volumeInfo = data.volumeInfo || {};
      const accessInfo = data.accessInfo || {};
      return {
        id,
        title: volumeInfo.title || "Unknown Title",
        authors: volumeInfo.authors || [],
        coverImage: volumeInfo.imageLinks?.thumbnail || null,
        description: volumeInfo.description || "",
        publishedDate: volumeInfo.publishedDate || "",
        categories: volumeInfo.categories || [],
        language: volumeInfo.language ? [volumeInfo.language] : [],
        pageCount: volumeInfo.pageCount || 0,
        source: "google" as const,
        downloadUrl: accessInfo.epub?.downloadLink || accessInfo.pdf?.downloadLink || null,
        rating: volumeInfo.averageRating || 0,
      };
    },
    "": async () => { // Default to Open Library if no prefix
      const url = `https://openlibrary.org/works/${id}.json`;
      const data = await fetchWithCache(url, `openlibrary-book-${id}`);
      const coverImage = data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg` : null;
      return {
        id,
        title: data.title || "Unknown Title",
        authors: data.authors?.map((a: any) => a.name) || [],
        coverImage,
        description: typeof data.description === "object" ? data.description.value : data.description || "",
        publishedDate: data.first_publish_date || "",
        categories: data.subjects || [],
        language: [],
        pageCount: 0,
        source: "openlibrary" as const,
        downloadUrl: `https://openlibrary.org${data.key}`,
        rating: 0,
      };
    },
  };

  try {
    const sourceFn = Object.keys(sourceMap).find((prefix) => id.startsWith(prefix))
      ? sourceMap[id.split("-")[0] + "-"]
      : sourceMap[""];
    return await sourceFn();
  } catch (error) {
    console.error(`Failed to fetch book ${id}:`, error);
    return null;
  }
}

/**
 * Fetch featured books (e.g., popular classics)
 * @param limit - Number of books to return
 * @returns Array of featured Book objects
 */
export async function getFeaturedBooks(limit: number = 8): Promise<Book[]> {
  const url = `${API_ENDPOINTS.GUTENBERG}?page=1`;
  const cacheKey = "featured-books";

  try {
    const data = await fetchWithCache(url, cacheKey);
    return (data.results || []).slice(0, limit).map((book: any) => ({
      id: `gutenberg-${book.id}`,
      title: book.title || "Unknown Title",
      authors: book.authors?.map((a: any) => a.name || "Unknown Author") || [],
      coverImage: book.formats["image/jpeg"] || null,
      description: "",
      publishedDate: "",
      categories: book.subjects || [],
      language: book.languages || [],
      pageCount: 0,
      source: "gutenberg" as const,
      downloadUrl: book.formats["text/html"] || book.formats["application/epub+zip"] || book.formats["text/plain"] || null,
      rating: 4.5,
    }));
  } catch (error) {
    console.error("Featured books fetch failed:", error);
    return [];
  }
}

/**
 * Fetch raw book content from its download URL and extract readable text
 * @param bookId - The book ID
 * @returns Book content as a string or empty string if unavailable
 */
export async function getBookContent(bookId: string): Promise<string> {
  try {
    const book = await getBookById(bookId);
    if (!book || !book.downloadUrl) {
      console.warn(`No download URL for book ${bookId}`);
      return "";
    }

    const response = await fetch(book.downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    const rawContent = await response.text();

    if (contentType?.includes("text/html")) {
      // Parse HTML with cheerio to extract readable text
      const $ = load(rawContent);
      // Remove scripts, styles, and metadata
      $("script, style, head, meta, link").remove();
      // Extract text from body, focusing on readable content (e.g., <p>, <div>)
      const readableContent = $("body")
        .find("p, div")
        .map((_, element) => $(element).text().trim())
        .get()
        .filter((text) => text.length > 0) // Remove empty strings
        .join("\n\n"); // Separate paragraphs with double newlines
      return readableContent || "No readable content found.";
    } else if (contentType?.includes("text/plain")) {
      return rawContent;
    } else if (contentType?.includes("application/epub+zip")) {
      console.warn("EPUB format requires additional parsing");
      return "EPUB content not supported yet. Please use a text format.";
    } else {
      console.warn(`Unsupported content type: ${contentType}`);
      return "";
    }
  } catch (error) {
    console.error(`Error fetching content for ${bookId}:`, error);
    return "";
  }
}

/**
 * Generate a summary of book content using AI (mock implementation)
 * @param title - Book title
 * @param content - Content to summarize
 * @returns Summary string
 */
export async function summarizeContent(title: string, content: string): Promise<string> {
  // Mock implementation
  return `Summary of "${title}": This section contains ${content.split(" ").length} words. For a detailed summary, integrate with an AI service.`;

  // Uncomment for OpenAI integration (requires `npm install openai` and `OPENAI_API_KEY` in .env):
  /*
  import OpenAI from "openai";
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `Summarize this content from "${title}": ${content}` }],
    });
    return response.choices[0].message.content || "Failed to generate summary.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Failed to generate summary due to an error.";
  }
  */
}

/**
 * Generate an AI response to a question about book content (mock implementation)
 * @param title - Book title
 * @param content - Content context
 * @param question - User question
 * @returns Answer string
 */
export async function generateAIResponse(title: string, content: string, question: string): Promise<string> {
  // Mock implementation
  return `Regarding "${title}", in response to "${question}": This is a placeholder answer based on ${content.slice(0, 50)}...`;

  // Uncomment for OpenAI integration (requires `npm install openai` and `OPENAI_API_KEY` in .env):
  /*
  import OpenAI from "openai";
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `For "${title}", based on this content: "${content}", answer: ${question}` }],
    });
    return response.choices[0].message.content || "Failed to generate answer.";
  } catch (error) {
    console.error("Error generating answer:", error);
    return "Failed to generate answer due to an error.";
  }
  */
}