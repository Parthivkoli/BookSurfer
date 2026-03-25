import { Book, BookSearchParams } from "@/types/book";
import { load } from "cheerio";

// API endpoints
const API_ENDPOINTS = {
  OPEN_LIBRARY: "https://openlibrary.org/search.json",
  GUTENBERG: "https://gutendex.com/books",
  GOOGLE_BOOKS: "https://www.googleapis.com/books/v1/volumes",
  INTERNET_ARCHIVE: "https://archive.org/advancedsearch.php",
  LIBRIVOX: "https://librivox.org/api/feed/audiobooks",
  FEEDBOOKS: "https://www.feedbooks.com/publicdomain/catalog.atom",
} as const;

// Cache setup (in-memory for simplicity; consider Redis for production)
const cache: Map<string, { data: any; timestamp: number }> = new Map();
// Increased cache TTL from 15 minutes to 24 hours for better performance
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Content filtering options - applied to all sources
const CONTENT_FILTERS = {
  adultContentKeywords: [
    "erotic", "explicit", "adult", "xxx", "mature content",
    "sexual content", "18+", "r-rated", "x-rated", "pornographic"
  ],
  minimumRating: 0, // Allow unrated books (will display with default 4.0 if hardcoded or 0 if unrated)
  approvedCategories: [
    "fiction", "non-fiction", "classic", "literature", "biography",
    "history", "science", "philosophy", "education", "reference",
    "self-help", "business", "technology", "poetry", "drama",
    "children", "young adult", "adventure", "fantasy", "science fiction"
  ]
};

/**
 * Filters books based on content guidelines
 * @param books - Array of books to filter
 * @returns Filtered array of books
 */
function applyContentFilters(books: Book[]): Book[] {
  return books.filter(book => {
    const combinedText = `${book.title} ${book.description ?? book.abstract ?? ""} ${book.categories?.join(" ") ?? ""}`.toLowerCase();
    const hasAdultContent = CONTENT_FILTERS.adultContentKeywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    if (hasAdultContent) return false;
    if (book.rating !== undefined && book.rating < CONTENT_FILTERS.minimumRating) return false;
    
    // if (book.categories && book.categories.length > 0) {
    //   const hasApprovedCategory = book.categories.some(category => 
    //     CONTENT_FILTERS.approvedCategories.some(approved => 
    //       category.toLowerCase().includes(approved.toLowerCase())
    //     )
    //   );
    //   if (!hasApprovedCategory) return false;
    // }
    
    return true;
  });
}

import { createCacheKey, searchCache } from "@/lib/cache";

/**
 * Generic fetch utility with robust error handling.
 * Next.js native fetch handles caching when executed on the server.
 * When on client, this acts as a normal fetch.
 * @param url - The URL to fetch
 * @param cacheTags - Cache tags for Next.js cache revalidation
 * @param revalidate - Cache TTL in seconds
 * @returns Fetched data
 */
async function fetchWithRetry(url: string, revalidate: number = 3600, timeoutMs: number = 6000): Promise<any> {
  const MAX_RETRIES = 2;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      console.log(`Fetching URL: ${url} (Attempt ${retries + 1})`);
      const response = await fetch(url, { 
        next: { revalidate },
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error details available");
        if (response.status >= 500 && retries < MAX_RETRIES - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        throw new Error(`HTTP error! Status: ${response.status}, URL: ${url}, Details: ${errorText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
        const text = await response.text();
        const parser = new (typeof DOMParser !== 'undefined' ? DOMParser : require('xmldom').DOMParser)();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        data = xmlToJson(xmlDoc.documentElement);
      } else if (contentType.includes("text/html")) {
        const text = await response.text();
        data = { html: text };
      } else {
        data = await response.text();
      }

      return data;
    } catch (error) {
      const isAbort = (error as any)?.name === "AbortError";
      if (isAbort && retries < MAX_RETRIES - 1) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }

      if (error instanceof TypeError && error.message.includes("fetch") && retries < MAX_RETRIES - 1) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      console.error(`Fetch failed after ${retries + 1} attempts for ${url}:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}


/**
 * Helper function to convert XML to JSON
 * @param xml - XML Element to convert
 * @returns JSON representation of the XML
 */
function xmlToJson(xml: Element): any {
  const obj: any = {};
  
  if (xml.attributes.length > 0) {
    obj["@attributes"] = {};
    for (let i = 0; i < xml.attributes.length; i++) {
      const attribute = xml.attributes.item(i);
      if (attribute) {
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  }
  
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      if (item) {
        if (item.nodeType === 1) {
          const nodeName = item.nodeName;
          if (typeof obj[nodeName] === "undefined") {
            obj[nodeName] = xmlToJson(item as Element);
          } else {
            if (typeof obj[nodeName].push === "undefined") {
              const old = obj[nodeName];
              obj[nodeName] = [];
              obj[nodeName].push(old);
            }
            obj[nodeName].push(xmlToJson(item as Element));
          }
        } else if (item.nodeType === 3) {
          const text = item.nodeValue?.trim();
          if (text) {
            obj.text = text;
          }
        }
      }
    }
  }
  return obj;
}

/**
 * Search books from Open Library API (only readable books)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchOpenLibrary(params: BookSearchParams): Promise<{ books: Book[]; totalItems: number }> {
  const { query = "", page = 1, limit = 10, subject, sort } = params;
  
  // Handle wildcard query which causes 422 on Open Library
  const normalizedQuery = (query === "*" || !query) ? "" : query;
  
  const queryParams = new URLSearchParams({
    q: normalizedQuery || "classic",
    page: page.toString(),
    limit: limit.toString(),
    ...(subject && { subject }),
    // Open Library does not reliably support `sort=relevance` (it can return 500).
    // When users choose "relevance" in the UI, just omit the sort and let Open Library default.
    ...(sort && sort !== "relevance" && { sort }),
  });

  const url = `${API_ENDPOINTS.OPEN_LIBRARY}?${queryParams.toString()}`;

  try {
    const data = await fetchWithRetry(url, 60);
    const books = (data.docs || []).map((book: any) => ({
      id: book.key ? book.key.replace(/^\//, "") : `openlibrary-${book.cover_i || Math.random().toString(36).slice(2)}`,
      title: book.title || "Unknown Title",
      authors: Array.isArray(book.author_name) ? book.author_name : undefined,
      author: Array.isArray(book.author_name) ? book.author_name[0] : undefined,
      coverImage: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined,
      description: typeof book.description === "string" ? book.description : undefined,
      publishedDate: book.first_publish_year?.toString(),
      categories: Array.isArray(book.subject) ? book.subject : undefined,
      language: Array.isArray(book.language) ? book.language : undefined,
      pageCount: book.number_of_pages_median,
      source: "openlibrary" as const,
      downloadUrl: book.key ? `https://openlibrary.org${book.key}` : undefined,
      rating: book.rating_average,
    }));
    
    return {
      books: applyContentFilters(books),
      totalItems: data.numFound || books.length,
    };
  } catch (error) {
    console.error("Open Library search failed:", error);
    return { books: [], totalItems: 0 };
  }
}

/**
 * Search books from Project Gutenberg API (all books are readable)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchGutenberg(params: BookSearchParams): Promise<{ books: Book[]; totalItems: number }> {
  const { query = "", page = 1, limit = 10, languages } = params;
  
  // Handle wildcard query for Gutendex
  const normalizedQuery = (query === "*" || !query) ? "" : query;
  
  const queryParams = new URLSearchParams({
    search: normalizedQuery,
    page: page.toString(),
    ...(languages?.length && { languages: languages.join(",") }),
  });

  const url = `${API_ENDPOINTS.GUTENBERG}?${queryParams.toString()}`;

  try {
    const data = await fetchWithRetry(url, 3600);
    const books = (data.results || []).map((book: any) => ({
      id: `gutenberg-${book.id}`,
      title: book.title || "Unknown Title",
      authors: Array.isArray(book.authors) ? book.authors.map((a: any) => a.name || "Unknown Author") : undefined,
      author: Array.isArray(book.authors) && book.authors.length ? book.authors[0].name : undefined,
      coverImage: book.formats?.["image/jpeg"],
      description: undefined,
      publishedDate: undefined,
      categories: Array.isArray(book.subjects) ? book.subjects : undefined,
      language: Array.isArray(book.languages) ? book.languages : undefined,
      pageCount: undefined,
      source: "gutenberg" as const,
      downloadUrl:
        book.formats?.["text/html"] ||
        book.formats?.["application/epub+zip"] ||
        book.formats?.["text/plain"],
      rating: 4.0,
    })).filter((book: Book) => book.downloadUrl !== undefined);
    
    return {
      books: applyContentFilters(books),
      totalItems: data.count || books.length,
    };
  } catch (error) {
    console.error("Gutenberg search failed:", error);
    return { books: [], totalItems: 0 };
  }
}

/**
 * Search books from Google Books API (only readable books)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchGoogleBooks(params: BookSearchParams): Promise<{ books: Book[]; totalItems: number }> {
  const { query = "", page = 1, limit = 10 } = params;
  
  // Handle wildcard query
  const normalizedQuery = (query === "*" || !query) ? "free ebooks" : query;
  
  const startIndex = (page - 1) * limit;
  const queryParams = new URLSearchParams({
    q: normalizedQuery,
    startIndex: startIndex.toString(),
    maxResults: limit.toString(),
    filter: "free-ebooks",
  });

  const url = `${API_ENDPOINTS.GOOGLE_BOOKS}?${queryParams.toString()}`;

  try {
    const data = await fetchWithRetry(url, 3600);
    const books = (data.items || []).map((item: any) => {
      const volumeInfo = item.volumeInfo || {};
      const accessInfo = item.accessInfo || {};
      return {
        id: `google-${item.id}`,
        title: volumeInfo.title || "Unknown Title",
        authors: Array.isArray(volumeInfo.authors) ? volumeInfo.authors : undefined,
        author: Array.isArray(volumeInfo.authors) && volumeInfo.authors.length ? volumeInfo.authors[0] : undefined,
        coverImage: volumeInfo.imageLinks?.thumbnail,
        description: volumeInfo.description,
        publishedDate: volumeInfo.publishedDate,
        categories: Array.isArray(volumeInfo.categories) ? volumeInfo.categories : undefined,
        language: volumeInfo.language ? [volumeInfo.language] : undefined,
        pageCount: volumeInfo.pageCount,
        source: "google" as const,
        downloadUrl: accessInfo.epub?.downloadLink || accessInfo.pdf?.downloadLink,
        rating: volumeInfo.averageRating,
      };
    }).filter((book: Book) => book.downloadUrl !== undefined);
    
    return {
      books: applyContentFilters(books),
      totalItems: data.totalItems || books.length,
    };
  } catch (error) {
    console.error("Google Books search failed:", error);
    return { books: [], totalItems: 0 };
  }
}

/**
 * Search books from Internet Archive (all books assumed readable)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchInternetArchive(params: BookSearchParams): Promise<{ books: Book[]; totalItems: number }> {
  const { query = "", page = 1, limit = 10 } = params;
  
  // Handle wildcard query
  const normalizedQuery = (query === "*" || !query) ? "" : query;
  
  const queryParams = new URLSearchParams({
    q: normalizedQuery ? `title:(${normalizedQuery}) AND mediatype:texts` : "mediatype:texts",
    fl: "identifier,title,creator,description,subject,language,year,downloads,avg_rating",
    sort: "avg_rating desc",
    output: "json",
    rows: limit.toString(),
    page: page.toString(),
  });

  const url = `${API_ENDPOINTS.INTERNET_ARCHIVE}?${queryParams.toString()}`;

  try {
    const data = await fetchWithRetry(url, 3600);
    const books = (data.response?.docs || []).map((book: any) => ({
      id: `internetarchive-${book.identifier}`,
      title: book.title || "Unknown Title",
      authors: Array.isArray(book.creator) ? book.creator : book.creator ? [book.creator] : undefined,
      author: Array.isArray(book.creator) && book.creator.length ? book.creator[0] : book.creator,
      coverImage: `https://archive.org/services/img/${book.identifier}`,
      description: book.description?.[0] || book.description || undefined,
      publishedDate: book.year,
      categories: Array.isArray(book.subject) ? book.subject : book.subject ? [book.subject] : undefined,
      language: Array.isArray(book.language) ? book.language : book.language ? [book.language] : undefined,
      pageCount: undefined,
      source: "internetarchive" as const,
      downloadUrl: `https://archive.org/details/${book.identifier}`,
      rating: book.avg_rating,
    }));
    
    return {
      books: applyContentFilters(books),
      totalItems: data.response?.numFound || books.length,
    };
  } catch (error) {
    console.error("Internet Archive search failed:", error);
    return { books: [], totalItems: 0 };
  }
}

/**
 * Search audiobooks from LibriVox (all books assumed readable)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchLibriVox(params: BookSearchParams): Promise<{ books: Book[]; totalItems: number }> {
  const { query = "", page = 1, limit = 10 } = params;
  
  // Handle wildcard query
  const normalizedQuery = (query === "*" || !query) ? "" : query;
  
  const queryParams = new URLSearchParams({
    title: normalizedQuery,
    offset: ((page - 1) * limit).toString(),
    limit: limit.toString(),
    format: "json",
  });

  const url = `${API_ENDPOINTS.LIBRIVOX}?${queryParams.toString()}`;

  try {
    const data = await fetchWithRetry(url, 3600);
    const books = (data.books || []).map((book: any) => ({
      id: `librivox-${book.id}`,
      title: book.title || "Unknown Title",
      authors: book.authors?.map((a: any) => `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()) || undefined,
      author: book.authors?.[0] ? `${book.authors[0].first_name ?? ""} ${book.authors[0].last_name ?? ""}`.trim() : undefined,
      coverImage: undefined,
      description: book.description,
      publishedDate: book.copyright_year,
      categories: undefined,
      language: book.language ? [book.language] : undefined,
      pageCount: undefined,
      source: "librivox" as const,
      downloadUrl: `https://librivox.org/api/feed/audiobooks/${book.id}/rss`,
      rating: 4.0,
    }));
    
    return {
      books: applyContentFilters(books),
      totalItems: data.num_results || books.length,
    };
  } catch (error) {
    console.error("LibriVox search failed:", error);
    return { books: [], totalItems: 0 };
  }
}

/**
 * Search Feedbooks public domain books (all books assumed readable)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchFeedbooks(params: BookSearchParams): Promise<{ books: Book[]; totalItems: number }> {
  const { query, limit = 10 } = params;
  const url = API_ENDPOINTS.FEEDBOOKS;

  try {
    const data = await fetchWithRetry(url, 3600);
    const $ = load(data);

    let books: Book[] = [];

    $("entry").each((_, element) => {
      const $element = $(element);
      const title = $element.find("title").text().trim();
      const author = $element.find("author name").text().trim();
      const description = $element.find("summary").text().trim();
      const id = $element.find("id").text().trim();
      const coverUrl = $element.find('link[rel="http://opds-spec.org/image"]').attr("href");
      const downloadUrl = $element.find('link[rel="http://opds-spec.org/acquisition"]').attr("href");

      const categories: string[] = [];
      $element.find("category").each((_, catElement) => {
        categories.push($(catElement).attr("term") || "");
      });

      books.push({
        id: `feedbooks-${id.split("/").pop() || Math.random().toString(36).slice(2)}`,
        title: title || "Unknown Title",
        authors: author ? [author] : undefined,
        author,
        coverImage: coverUrl,
        description,
        publishedDate: undefined,
        categories: categories.length ? categories : undefined,
        language: ["English"],
        pageCount: undefined,
        source: "feedbooks" as const,
        downloadUrl,
        rating: 4.0,
      });
    });

    books = books.filter(book => book.downloadUrl !== undefined);
    
    if (query && query !== "*") {
      const queryLower = query.toLowerCase();
      books = books.filter((book) =>
        book.title.toLowerCase().includes(queryLower) ||
        book.description?.toLowerCase().includes(queryLower) ||
        book.authors?.some((author) => author.toLowerCase().includes(queryLower))
      );
    }

    const filteredBooks = applyContentFilters(books.slice(0, limit));
    return {
      books: filteredBooks,
      totalItems: books.length,
    };
  } catch (error) {
    console.error("Feedbooks search failed:", error);
    return { books: [], totalItems: 0 };
  }
}

/**
 * Search books across multiple sources
 * @param params - Search parameters with optional source filter
 * @returns Books and total count
 */
export async function searchBooks(params: BookSearchParams & { sources?: ("openlibrary" | "gutenberg" | "google" | "internetarchive" | "librivox" | "feedbooks")[] }): Promise<{
  books: Book[];
  totalItems: number;
}> {
  const sources = params.sources || ["openlibrary", "gutenberg", "google"];
  const searchFunctions: { [key: string]: (p: BookSearchParams) => Promise<{ books: Book[]; totalItems: number }> } = {
    openlibrary: searchOpenLibrary,
    gutenberg: searchGutenberg,
    google: searchGoogleBooks,
    internetarchive: searchInternetArchive,
    librivox: searchLibriVox,
    feedbooks: searchFeedbooks
  };

  try {
    const validSources = sources.filter((source) => source in searchFunctions);
    const desiredLimit = params.limit ?? 12;

    const queryKey = params.query?.trim() || "";
    const languagesKey = (params.languages ?? []).slice().sort().join(",");
    const sourcesKey = validSources.slice().sort().join(",");

    const cacheKey = createCacheKey(
      "search",
      queryKey,
      params.page ?? 1,
      desiredLimit,
      params.subject ?? "",
      params.sort ?? "relevance",
      languagesKey || undefined,
      sourcesKey || undefined
    );

    const cached = searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let allBooks: Book[] = [];
    let totalItems = 0;

    // Speed + reliability: try sources in order and stop once we have enough books.
    for (const source of validSources) {
      if (allBooks.length >= desiredLimit) break;

      const remaining = desiredLimit - allBooks.length;
      // Ask each source for extra because content filters may remove items.
      const perSourceLimit = Math.max(remaining * 2, 10);

      const res = await searchFunctions[source]({ ...params, limit: perSourceLimit });
      if (res?.books?.length) {
        allBooks = allBooks.concat(res.books);
        totalItems += res.totalItems ?? res.books.length;
      } else {
        console.warn(`Search returned no books for source ${source}`);
      }
    }

    // Ensure we always have something to show.
    // If every selected source fails, fall back to OpenLibrary with a safe default query.
    if (allBooks.length === 0) {
      const fallbackQuery = queryKey ? queryKey : "*";
      const fallbackRes = await searchOpenLibrary({
        ...params,
        query: fallbackQuery,
        // Override requested limit so we have room for filtering.
        limit: desiredLimit * 2,
      });
      allBooks = fallbackRes.books;
      totalItems = fallbackRes.totalItems ?? allBooks.length;
    }

    const result = {
      books: allBooks.slice(0, desiredLimit),
      totalItems,
    };

    // Cache only successful (non-empty) results to avoid "blank" caching.
    if (result.books.length > 0) {
      searchCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error("Multi-source search failed:", error);
    return { books: [], totalItems: 0 };
  }
}

/**
 * Fetch detailed info for a book by its ID
 * @param id - Book ID with source prefix
 * @returns Book details or null if not found
 */
export async function getBookById(id: string): Promise<Book | null> {
  const sourceMap: { [key: string]: () => Promise<Book | null> } = {
    "gutenberg-": async () => {
      const gutenbergId = id.replace("gutenberg-", "");
      const url = `${API_ENDPOINTS.GUTENBERG}/${gutenbergId}`;
      const data = await fetchWithRetry(url, 300);
      if (!data) return null;
      return {
        id,
        title: data.title || "Unknown Title",
        authors: data.authors?.map((a: any) => a.name || "Unknown Author"),
        author: data.authors?.[0]?.name,
        coverImage: data.formats?.["image/jpeg"],
        description: undefined,
        publishedDate: undefined,
        categories: data.subjects,
        language: data.languages,
        pageCount: undefined,
        source: "gutenberg" as const,
        downloadUrl: 
          data.formats?.["text/plain; charset=utf-8"] || 
          data.formats?.["text/plain"] || 
          data.formats?.["text/html"] || 
          data.formats?.["application/epub+zip"],
        rating: 4.0,
      };
    },
    "google-": async () => {
      const googleId = id.replace("google-", "");
      const url = `${API_ENDPOINTS.GOOGLE_BOOKS}/${googleId}`;
      const data = await fetchWithRetry(url, 300);
      if (!data) return null;
      const volumeInfo = data.volumeInfo || {};
      const accessInfo = data.accessInfo || {};
      return {
        id,
        title: volumeInfo.title || "Unknown Title",
        authors: volumeInfo.authors,
        author: volumeInfo.authors?.[0],
        coverImage: volumeInfo.imageLinks?.thumbnail,
        description: volumeInfo.description,
        publishedDate: volumeInfo.publishedDate,
        categories: volumeInfo.categories,
        language: volumeInfo.language ? [volumeInfo.language] : undefined,
        pageCount: volumeInfo.pageCount,
        source: "google" as const,
        downloadUrl: accessInfo.epub?.downloadLink || accessInfo.pdf?.downloadLink,
        rating: volumeInfo.averageRating,
      };
    },
    "internetarchive-": async () => {
      const archiveId = id.replace("internetarchive-", "");
      const url = `https://archive.org/metadata/${archiveId}`;
      const data = await fetchWithRetry(url, 300);
      if (!data) return null;
      const metadata = data.metadata || {};
      return {
        id,
        title: metadata.title || "Unknown Title",
        authors: metadata.creator ? (Array.isArray(metadata.creator) ? metadata.creator : [metadata.creator]) : undefined,
        author: metadata.creator ? (Array.isArray(metadata.creator) ? metadata.creator[0] : metadata.creator) : undefined,
        coverImage: `https://archive.org/services/img/${archiveId}`,
        description: metadata.description,
        publishedDate: metadata.year,
        categories: metadata.subject ? (Array.isArray(metadata.subject) ? metadata.subject : [metadata.subject]) : undefined,
        language: metadata.language ? (Array.isArray(metadata.language) ? metadata.language : [metadata.language]) : undefined,
        pageCount: undefined,
        source: "internetarchive" as const,
        downloadUrl: `https://archive.org/download/${archiveId}/${archiveId}.pdf`,
        rating: metadata.avg_rating,
      };
    },
    "librivox-": async () => {
      const librivoxId = id.replace("librivox-", "");
      const url = `${API_ENDPOINTS.LIBRIVOX}?id=${librivoxId}&format=json`;
      const data = await fetchWithRetry(url, 300);
      if (!data) return null;
      const book = data.books?.[0] || {};
      return {
        id,
        title: book.title || "Unknown Title",
        authors: book.authors?.map((a: any) => `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()),
        author: book.authors?.[0] ? `${book.authors[0].first_name ?? ""} ${book.authors[0].last_name ?? ""}`.trim() : undefined,
        coverImage: undefined,
        description: book.description,
        publishedDate: book.copyright_year,
        categories: undefined,
        language: book.language ? [book.language] : undefined,
        pageCount: undefined,
        source: "librivox" as const,
        downloadUrl: `https://librivox.org/rss/${librivoxId}`,
        rating: 4.0,
      };
    },
    "feedbooks-": async () => {
      const feedbooksId = id.replace("feedbooks-", "");
      const url = `${API_ENDPOINTS.FEEDBOOKS}`;
      const data = await fetchWithRetry(url, 300);
      if (!data) return null;
      const $ = load(data);
      const entry = $("entry").filter((_, e) => $(e).find("id").text().includes(feedbooksId)).first();
      if (!entry.length) return null;
      const title = entry.find("title").text().trim();
      const author = entry.find("author name").text().trim();
      const description = entry.find("summary").text().trim();
      const coverUrl = entry.find('link[rel="http://opds-spec.org/image"]').attr("href");
      const downloadUrl = entry.find('link[rel="http://opds-spec.org/acquisition"]').attr("href");
      const categories: string[] = [];
      entry.find("category").each((_, catElement) => {
        categories.push($(catElement).attr("term") || "");
      });
      return {
        id,
        title: title || "Unknown Title",
        authors: author ? [author] : undefined,
        author,
        coverImage: coverUrl,
        description,
        publishedDate: undefined,
        categories: categories.length ? categories : undefined,
        language: ["English"],
        pageCount: undefined,
        source: "feedbooks" as const,
        downloadUrl,
        rating: 4.0,
      };
    },
    "": async () => {
      const url = `https://openlibrary.org/works/${id}.json`;
      const data = await fetchWithRetry(url, 300);
      if (!data) return null;
      const coverImage = data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg` : undefined;
      return {
        id,
        title: data.title || "Unknown Title",
        authors: data.authors?.map((a: any) => a.name || "Unknown Author"),
        author: data.authors?.[0]?.name,
        coverImage,
        description: typeof data.description === "object" ? data.description.value : data.description,
        publishedDate: data.first_publish_date,
        categories: data.subjects,
        language: undefined,
        pageCount: undefined,
        source: "openlibrary" as const,
        downloadUrl: data.key ? `https://openlibrary.org${data.key}` : undefined,
        rating: undefined,
      };
    },
  };

  try {
    const sourcePrefix = Object.keys(sourceMap).find(prefix => id.startsWith(prefix));
    const sourceFn = sourcePrefix !== undefined ? sourceMap[sourcePrefix] : sourceMap[""];
    const book = await sourceFn();
    
    if (!book || !book.downloadUrl) return null;
    
    const filteredBooks = applyContentFilters([book]);
    return filteredBooks.length > 0 ? filteredBooks[0] : null;
  } catch (error) {
    console.error(`Failed to fetch book with ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetch the content of a book by its ID
 * @param id - Book ID with source prefix
 * @returns Book content as a string or null if not found
 */
export async function getBookContent(id: string): Promise<string | null> {
  try {
    const book = await getBookById(id);
    if (!book || (!book.downloadUrl && !book.pdfUrl)) {
      console.error(`No download URL or PDF URL found for book ID: ${id}`);
      return null;
    }

    const url = book.downloadUrl || book.pdfUrl;
    console.log(`Fetching book content from URL: ${url}`);
    const response = await fetch(url!, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error(`Failed to fetch book content: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! Status: ${response.status} for URL: ${url}`);
    }

    let content: string;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/plain")) {
      content = await response.text();
    } else if (contentType.includes("application/epub+zip")) {
      content = "EPUB_FILE_DETECTED"; // Signal to ReaderClient to use epub.js directly
    } else if (contentType.includes("application/pdf")) {
      content = "PDF_FILE_DETECTED"; // Signal to ReaderClient to use pdf.js directly
    } else if (contentType.includes("text/html")) {
      const text = await response.text();
      // Improved cleaning for Gutenberg HTML
      const $ = load(text);
      
      // Remove boilerplate, nav, and scripts
      $("script, style, nav, footer, .header, #menu, .links").remove();
      
      // Try to find main content areas in Gutenberg or others
      const mainContent = $(".bodytext, #content, main, article").text().trim();
      content = mainContent || $("body").text().trim() || "No readable content found.";
    } else {
      content = await response.text();
    }

    return content;
  } catch (error) {
    console.error(`Error fetching content for book ID ${id}:`, error);
    return null;
  }
}

/**
 * Get recommended books based on a book ID
 * @param id - Book ID to get recommendations for
 * @param limit - Maximum number of recommendations to return
 * @returns Array of recommended books
 */
export async function getRecommendedBooks(id: string, limit: number = 5): Promise<Book[]> {
  try {
    const book = await getBookById(id);
    if (!book) return [];
    
    const searchParams: BookSearchParams = { limit };
    if (book.authors?.length) {
      searchParams.query = book.authors[0];
    } else if (book.author) {
      searchParams.query = book.author;
    } else if (book.categories?.length) {
      searchParams.subject = book.categories[0];
    } else {
      const titleWords = book.title.split(' ')
        .filter(word => word.length > 4)
        .slice(0, 2);
      searchParams.query = titleWords.length ? titleWords.join(' ') : "classic literature";
    }
    
    const result = await searchBooks({
      ...searchParams,
      sources: ["openlibrary", "gutenberg", "google"]
    });
    
    return result.books.filter(rec => rec.id !== id).slice(0, limit);
  } catch (error) {
    console.error("Failed to get book recommendations:", error);
    return [];
  }
}

/**
 * Get trending or popular books
 * @param limit - Maximum number of books to return
 * @param category - Optional category filter
 * @returns Array of trending books
 */
export async function getTrendingBooks(limit: number = 10, category?: string): Promise<Book[]> {
  try {
    const cacheKey = createCacheKey("trending", limit, category ?? "");
    const cached = searchCache.get(cacheKey);
    if (cached && Array.isArray(cached)) return cached as Book[];

    // Faster approach: prefer OpenLibrary first, then fall back to Gutenberg.
    // This reduces external requests and avoids long parallel waits/timeouts.
    const openParams: BookSearchParams = {
      // Fetch slightly extra in case content filters remove some items
      limit: Math.ceil(limit * 1.25),
      subject: category,
      sort: "rating",
      page: 1,
      query: "*",
    };

    const openResult = await searchOpenLibrary(openParams);
    let allBooks = openResult.books.slice(0, limit);

    if (allBooks.length < limit) {
      const remaining = limit - allBooks.length;
      const gutenbergResult = await searchGutenberg({
        query: category || "popular",
        page: 1,
        // Gutenberg paginates by page; `limit` here mainly impacts downstream slicing.
        limit: Math.max(remaining, 10),
      });
      allBooks = [...allBooks, ...gutenbergResult.books].slice(0, limit);
    }

    allBooks.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    // If everything fails, try a broader OpenLibrary fallback.
    if (allBooks.length === 0) {
      const fallback = await searchOpenLibrary({
        query: "*",
        page: 1,
        limit: limit * 2,
        sort: "rating",
      });
      allBooks = fallback.books.slice(0, limit);
    }

    if (allBooks.length > 0) {
      searchCache.set(cacheKey, allBooks);
    }

    return allBooks;
  } catch (error) {
    console.error("Failed to get trending books:", error);
    return [];
  }
}

/**
 * Get featured books for the homepage
 * @param limit - Maximum number of books to return
 * @returns Array of featured books
 */
export async function getFeaturedBooks(limit: number = 4): Promise<Book[]> {
  return getTrendingBooks(limit);
}

/**
 * Get new releases or recently added books
 * @param limit - Maximum number of books to return
 * @param daysBack - How many days back to consider as "new"
 * @returns Array of new books
 */
export async function getNewReleases(limit: number = 10, daysBack: number = 30): Promise<Book[]> {
  try {
    const sources: ("openlibrary" | "gutenberg" | "google")[] = ["openlibrary"];
    const params: BookSearchParams = {
      limit: Math.ceil(limit / sources.length) + 3,
      sort: "date"
    };
    
    const promises = sources.map(async () => searchOpenLibrary({ ...params, query: "recent" }));
    const results = await Promise.allSettled(promises);
    
    let allBooks: Book[] = [];
    results.forEach(result => {
      if (result.status === "fulfilled") {
        allBooks = [...allBooks, ...result.value.books];
      }
    });
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const newBooks = allBooks.filter(book => {
      if (!book.publishedDate) return true;
      const publishDate = new Date(book.publishedDate);
      return !isNaN(publishDate.getTime()) && publishDate >= cutoffDate;
    });
    
    return newBooks.length < limit ? allBooks.slice(0, limit) : newBooks.slice(0, limit);
  } catch (error) {
    console.error("Failed to get new releases:", error);
    return [];
  }
}

/**
 * Get books by a specific author
 * @param authorName - Name of the author to search for
 * @param limit - Maximum number of books to return
 * @returns Array of books by the author
 */
export async function getBooksByAuthor(authorName: string, limit: number = 10): Promise<Book[]> {
  try {
    const params: BookSearchParams = {
      query: authorName,
      limit,
      sort: "relevance"
    };
    
    const result = await searchBooks({
      ...params,
      sources: ["openlibrary", "gutenberg", "google"]
    });
    
    const authorNameLower = authorName.toLowerCase();
    const filteredBooks = result.books.filter(book => 
      (book.authors?.some(author => author.toLowerCase().includes(authorNameLower)) ||
       book.author?.toLowerCase().includes(authorNameLower)) ?? false
    );
    
    return filteredBooks.slice(0, limit);
  } catch (error) {
    console.error(`Failed to get books by author ${authorName}:`, error);
    return [];
  }
}

/**
 * Clear the cache for a specific key or all keys
 * @param cacheKey - Optional specific key to clear
 */
export function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    cache.delete(cacheKey);
  } else {
    cache.clear();
  }
}

/**
 * Get cache statistics
 * @returns Information about the current cache state
 */
export function getCacheStats(): { size: number, keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

export { API_ENDPOINTS };