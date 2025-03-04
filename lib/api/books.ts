import { Book, BookSearchParams } from "@/types/book";
import { load } from "cheerio";

// API endpoints
const API_ENDPOINTS = {
  OPEN_LIBRARY: "https://openlibrary.org/search.json",
  GUTENBERG: "https://gutendex.com/books",
  GOOGLE_BOOKS: "https://www.googleapis.com/books/v1/volumes",
  INTERNET_ARCHIVE: "https://archive.org/advancedsearch.php",
  LIBRIVOX: "https://librivox.org/api/feed/audiobooks",
  STANDARD_EBOOKS: "https://standardebooks.org/ebooks",
  FEEDBOOKS: "https://www.feedbooks.com/publicdomain/catalog.atom",
} as const;

type SourceType = "openlibrary" | "gutenberg" | "google" | "internetarchive" | "librivox" | "standardebooks" | "feedbooks";

// Cache setup (in-memory for simplicity; consider Redis for production)
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Content filtering options - applied to all sources
const CONTENT_FILTERS = {
  // Keywords that indicate potentially adult or inappropriate content
  adultContentKeywords: [
    "erotic", "explicit", "adult", "xxx", "mature content",
    "sexual content", "18+", "r-rated", "x-rated", "pornographic"
  ],
  // Minimum rating threshold (where applicable)
  minimumRating: 3.0,
  // Default approved genres/categories (can be expanded)
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
    // Filter out books with adult content keywords in title, description, or categories
    const combinedText = `${book.title} ${book.description || ""} ${book.categories.join(" ")}`.toLowerCase();
    const hasAdultContent = CONTENT_FILTERS.adultContentKeywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    if (hasAdultContent) return false;
    
    // Keep books with acceptable ratings (if rating exists)
    if (book.rating && book.rating < CONTENT_FILTERS.minimumRating) return false;
    
    // Prefer books in approved categories (if categories exist)
    if (book.categories.length > 0) {
      const hasApprovedCategory = book.categories.some(category => 
        CONTENT_FILTERS.approvedCategories.some(approved => 
          category.toLowerCase().includes(approved.toLowerCase())
        )
      );
      if (!hasApprovedCategory) return false;
    }
    
    return true;
  });
}

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
    
    // Handle different response types
    const contentType = response.headers.get("content-type") || "";
    let data;
    
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
      const text = await response.text();
      // Simple XML to JSON conversion (consider using xml2js for production)
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      data = xmlToJson(xmlDoc);
    } else if (contentType.includes("text/html")) {
      const text = await response.text();
      // For HTML responses, return the raw HTML
      data = { html: text };
    } else {
      data = await response.text();
    }
    
    cache.set(cacheKey, { data, timestamp: now });
    return data;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

/**
 * Helper function to convert XML to JSON
 * Basic implementation - consider using xml2js for production
 */
function xmlToJson(xml: Document): any {
  const obj: any = {};
  
  if (xml.nodeType === 1) {
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (let i = 0; i < xml.attributes.length; i++) {
        const attribute = xml.attributes.item(i);
        if (attribute) {
          obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    }
  } else if (xml.nodeType === 3) {
    obj.text = xml.nodeValue?.trim();
  }
  
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      if (item) {
        const nodeName = item.nodeName;
        if (typeof obj[nodeName] === "undefined") {
          obj[nodeName] = xmlToJson(item as any);
        } else {
          if (typeof obj[nodeName].push === "undefined") {
            const old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item as any));
        }
      }
    }
  }
  return obj;
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
    const books = (data.docs || []).map((book: any) => ({
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
      rating: book.rating_average || 0,
    }));
    
    return applyContentFilters(books);
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
    const books = (data.results || []).map((book: any) => ({
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
      rating: 4.0, // Most Gutenberg books are classics with high cultural value
    }));
    
    return applyContentFilters(books);
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
    const books = (data.items || []).map((item: any) => {
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
    
    return applyContentFilters(books);
  } catch (error) {
    console.error("Google Books search failed:", error);
    return [];
  }
}

/**
 * Search books from Internet Archive's Open Library
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchInternetArchive(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const queryParams = new URLSearchParams({
    q: `title:(${query}) AND mediatype:texts`,
    fl: "identifier,title,creator,description,subject,language,year,downloads,avg_rating",
    sort: "avg_rating desc",
    output: "json",
    rows: limit.toString(),
    page: page.toString(),
  });

  const url = `${API_ENDPOINTS.INTERNET_ARCHIVE}?${queryParams.toString()}`;
  const cacheKey = `internetarchive-${query}-${page}-${limit}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    const books = (data.response?.docs || []).map((book: any) => ({
      id: `internetarchive-${book.identifier}`,
      title: book.title || "Unknown Title",
      authors: Array.isArray(book.creator) ? book.creator : book.creator ? [book.creator] : [],
      coverImage: `https://archive.org/services/img/${book.identifier}`,
      description: book.description || "",
      publishedDate: book.year || "",
      categories: Array.isArray(book.subject) ? book.subject : book.subject ? [book.subject] : [],
      language: Array.isArray(book.language) ? book.language : book.language ? [book.language] : [],
      pageCount: 0,
      source: "internetarchive" as const,
      downloadUrl: `https://archive.org/details/${book.identifier}`,
      rating: book.avg_rating || 0,
    }));
    
    return applyContentFilters(books);
  } catch (error) {
    console.error("Internet Archive search failed:", error);
    return [];
  }
}

/**
 * Search audiobooks from LibriVox
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchLibriVox(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const queryParams = new URLSearchParams({
    title: query,
    offset: ((page - 1) * limit).toString(),
    limit: limit.toString(),
    format: "json",
  });

  const url = `${API_ENDPOINTS.LIBRIVOX}?${queryParams.toString()}`;
  const cacheKey = `librivox-${query}-${page}-${limit}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    const books = (data.books || []).map((book: any) => ({
      id: `librivox-${book.id}`,
      title: book.title || "Unknown Title",
      authors: book.authors?.map((a: any) => `${a.first_name} ${a.last_name}`) || [],
      coverImage: null, // LibriVox doesn't provide direct cover images
      description: book.description || "",
      publishedDate: book.copyright_year || "",
      categories: [], // LibriVox doesn't provide detailed categories
      language: [book.language || "English"],
      pageCount: 0,
      source: "librivox" as const,
      downloadUrl: `https://librivox.org/api/feed/audiobooks/${book.id}/rss`,
      rating: 4.0, // Most LibriVox books are classics with high cultural value
    }));
    
    return applyContentFilters(books);
  } catch (error) {
    console.error("LibriVox search failed:", error);
    return [];
  }
}

/**
 * Search Standard Ebooks - a curated collection of high-quality ebooks
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchStandardEbooks(params: BookSearchParams): Promise<Book[]> {
  // Standard Ebooks doesn't have a formal API, we'll scrape their catalog page
  const url = `${API_ENDPOINTS.STANDARD_EBOOKS}`;
  const cacheKey = `standardebooks-${params.query || "all"}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    const $ = load(data.html);
    
    let books: Book[] = [];
    
    // Parse the HTML catalog
    $(".ebook-list li").each((_, element) => {
      const $element = $(element);
      const title = $element.find("h3").text().trim();
      const author = $element.find("p.author").text().trim();
      const description = $element.find("p.description").text().trim();
      const link = $element.find("a").attr("href");
      
      // Only include books that match the search query if one was provided
      if (params.query && !title.toLowerCase().includes(params.query.toLowerCase()) && 
          !author.toLowerCase().includes(params.query.toLowerCase())) {
        return;
      }
      
      books.push({
        id: `standardebooks-${link?.split("/").pop() || Math.random().toString(36).slice(2)}`,
        title: title || "Unknown Title",
        authors: author ? [author] : [],
        coverImage: link ? `https://standardebooks.org${link}/images/cover.jpg` : null,
        description: description || "",
        publishedDate: "",
        categories: [],
        language: ["English"], // Standard Ebooks are primarily in English
        pageCount: 0,
        source: "standardebooks" as const,
        downloadUrl: link ? `https://standardebooks.org${link}/download/epub` : null,
        rating: 4.5, // Standard Ebooks are highly curated for quality
      });
    });
    
    // Handle pagination and limit
    const startIndex = (params.page || 1 - 1) * (params.limit || 10);
    books = books.slice(startIndex, startIndex + (params.limit || 10));
    
    return applyContentFilters(books);
  } catch (error) {
    console.error("Standard Ebooks search failed:", error);
    return [];
  }
}

/**
 * Search Feedbooks public domain books
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchFeedbooks(params: BookSearchParams): Promise<Book[]> {
  // Feedbooks provides an Atom feed of public domain books
  const queryParams = new URLSearchParams({
    search: params.query || "",
    page: params.page?.toString() || "1",
  });
  
  const url = `${API_ENDPOINTS.FEEDBOOKS}?${queryParams.toString()}`;
  const cacheKey = `feedbooks-${params.query || "all"}-${params.page || 1}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    // Parse the Atom feed (simplified, would need proper XML parsing in production)
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
      
      // Extract categories
      const categories: string[] = [];
      $element.find("category").each((_, catElement) => {
        categories.push($(catElement).attr("term") || "");
      });
      
      books.push({
        id: `feedbooks-${id.split("/").pop() || Math.random().toString(36).slice(2)}`,
        title: title || "Unknown Title",
        authors: author ? [author] : [],
        coverImage: coverUrl || null,
        description: description || "",
        publishedDate: "",
        categories,
        language: ["English"], // Default to English, expand as needed
        pageCount: 0,
        source: "feedbooks" as const,
        downloadUrl: downloadUrl || null,
        rating: 4.0, // Most Feedbooks public domain books are classics
      });
    });
    
    return applyContentFilters(books.slice(0, params.limit || 10));
  } catch (error) {
    console.error("Feedbooks search failed:", error);
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
  const sources = params.sources || (["openlibrary", "gutenberg", "google", "internetarchive", "librivox", "standardebooks", "feedbooks"] as SourceType[]);
  const searchFunctions: { [key in SourceType]: (p: BookSearchParams) => Promise<Book[]> } = {
    openlibrary: searchOpenLibrary,
    gutenberg: searchGutenberg,
    google: searchGoogleBooks,
    internetarchive: searchInternetArchive,
    librivox: searchLibriVox,
    standardebooks: searchStandardEbooks,
    feedbooks: searchFeedbooks
  };

  try {
    const promises = sources.map((source) => searchFunctions[source](params));
    const results = await Promise.allSettled(promises);

    let allBooks: Book[] = [];
    let totalItems = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allBooks = [...allBooks, ...result.value];
        // Estimate total items based on source (these are approximations)
        if (sources[index] === "google") totalItems += 1000;
        else if (sources[index] === "gutenberg") totalItems += 60000;
        else if (sources[index] === "openlibrary") totalItems += 10000;
        else if (sources[index] === "internetarchive") totalItems += 20000;
        else if (sources[index] === "librivox") totalItems += 15000;
        else if (sources[index] === "standardebooks") totalItems += 500;
        else if (sources[index] === "feedbooks") totalItems += 5000;
      } else {
        console.warn(`Search failed for source ${sources[index]}:`, result.reason);
      }
    });

    // Sort by rating to prioritize high-quality books
    allBooks.sort((a, b) => {
      // First by rating (highest first)
      if (b.rating !== a.rating) return b.rating - a.rating;
      // Then alphabetically by title
      return a.title.localeCompare(b.title);
    });

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
        rating: 4.0,
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
    "internetarchive-": async () => {
      const archiveId = id.replace("internetarchive-", "");
      const url = `https://archive.org/metadata/${archiveId}`;
      const data = await fetchWithCache(url, `internetarchive-book-${archiveId}`);
      const metadata = data.metadata || {};
      return {
        id,
        title: metadata.title || "Unknown Title",
        authors: metadata.creator ? (Array.isArray(metadata.creator) ? metadata.creator : [metadata.creator]) : [],
        coverImage: `https://archive.org/services/img/${archiveId}`,
        description: metadata.description || "",
        publishedDate: metadata.year || "",
        categories: metadata.subject ? (Array.isArray(metadata.subject) ? metadata.subject : [metadata.subject]) : [],
        language: metadata.language ? (Array.isArray(metadata.language) ? metadata.language : [metadata.language]) : [],
        pageCount: 0,
        source: "internetarchive" as const,
        downloadUrl: `https://archive.org/download/${archiveId}/${archiveId}.pdf`,
        rating: metadata.avg_rating || 4.0,
      };
    },
    "librivox-": async () => {
      const librivoxId = id.replace("librivox-", "");
      const url = `${API_ENDPOINTS.LIBRIVOX}?id=${librivoxId}&format=json`;
      const data = await fetchWithCache(url, `librivox-book-${librivoxId}`);
      const book = data.books?.[0] || {};
      return {
        id,
        title: book.title || "Unknown Title",
        authors: book.authors?.map((a: any) => `${a.first_name} ${a.last_name}`) || [],
        coverImage: null,
        description: book.description || "",
        publishedDate: book.copyright_year || "",
        categories: [],
        language: [book.language || "English"],
        pageCount: 0,
        source: "librivox" as const,
        downloadUrl: `https://librivox.org/rss/${librivoxId}`,
        rating: 4.0,
      };
    },
    "standardebooks-": async () => {
      const standardEbooksId = id.replace("standardebooks-", "");
      const url = `${API_ENDPOINTS.STANDARD_EBOOKS}/${standardEbooksId}`;
      const data = await fetchWithCache(url, `standardebooks-book-${standardEbooksId}`);
      const $ = load(data.html);
      
      const title = $("h1").text().trim();
      const author = $("h2").text().trim();
      const description = $(".description").text().trim();
      
      return {
        id,
        title: title || "Unknown Title",
        authors: author ? [author] : [],
        coverImage: `${url}/images/cover.jpg`,
        description: description || "",
        publishedDate: "",
        categories: [],
        language: ["English"],
        pageCount: 0,
        source: "standardebooks" as const,
        downloadUrl: `${url}/download/epub`,
        rating: 4.5,
      };
    },
    "feedbooks-": async () => {
      const feedbooksId = id.replace("feedbooks-", "");
      // For Feedbooks, we might need to construct the URL differently
      // This is a placeholder implementation
      return {
        id,
        title: "Book from Feedbooks",
        authors: ["Unknown Author"],
        coverImage: null,
        description: "Book details unavailable",
        publishedDate: "",
        categories: [],
        language: ["English"],
        pageCount: 0,
        source: "feedbooks" as const,
        downloadUrl: `https://www.feedbooks.com/book/${feedbooksId}`,
        rating: 4.0,
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
    // Determine which source function to use based on the ID prefix
    const sourcePrefix = Object.keys(sourceMap).find(prefix => id.startsWith(prefix));
    const sourceFn = sourcePrefix ? sourceMap[sourcePrefix] : sourceMap[""];
    
    const book = await sourceFn();
    
    // Apply content filter to ensure appropriate content
    if (book) {
      const filteredBooks = applyContentFilters([book]);
      return filteredBooks.length > 0 ? filteredBooks[0] : null;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch book with ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetch the content (e.g., text) of a book by its ID
 * @param id - Book ID with source prefix (e.g., "gutenberg-123")
 * @returns Book content as a string or null if not found
 */
export async function getBookContent(id: string): Promise<string | null> {
  try {
    // First, get the book metadata to find the download URL
    const book = await getBookById(id);
    if (!book || !book.downloadUrl) {
      console.error(`No download URL found for book ID: ${id}`);
      return null;
    }

    // Fetch the content from the download URL
    const cacheKey = `book-content-${id}`;
    const cachedContent = cache.get(cacheKey);
    const now = Date.now();

    if (cachedContent && now - cachedContent.timestamp < CACHE_TTL) {
      return cachedContent.data as string;
    }

    const response = await fetch(book.downloadUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} for URL: ${book.downloadUrl}`);
    }

    let content: string;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/plain")) {
      content = await response.text();
    } else if (contentType.includes("application/epub+zip")) {
      // Handle EPUB files (simplified; consider using epub.js for parsing)
      const arrayBuffer = await response.arrayBuffer();
      content = "EPUB content not directly readable as text. Consider using a library like epub.js.";
    } else if (contentType.includes("text/html")) {
      const text = await response.text();
      const $ = load(text);
      content = $("body").text().trim() || "No readable text found in HTML.";
    } else {
      content = await response.text();
    }

    // Cache the content
    cache.set(cacheKey, { data: content, timestamp: now });
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
    // Extract source and ID information
    const source = id.split('-')[0] as SourceType;
    
    // Get similar books based on the source
    let searchParams: BookSearchParams = { limit };
    
    // First retrieve the current book to get its metadata
    const book = await getBookById(id);
    if (!book) return [];
    
    // Build search parameters based on the book's metadata
    if (book.authors.length > 0) {
      // Try to find books by the same author first
      searchParams.author = book.authors[0];
    } else if (book.categories.length > 0) {
      // Or try to find books in the same category
      searchParams.subject = book.categories[0];
    } else {
      // As a fallback, find books with similar titles
      const titleWords = book.title.split(' ')
        .filter(word => word.length > 4)  // Only use meaningful words
        .slice(0, 2);                      // Take just the first couple of words
      
      if (titleWords.length > 0) {
        searchParams.query = titleWords.join(' ');
      } else {
        // If we can't extract meaningful words, just search for similar books
        searchParams.query = "classic literature";
      }
    }
    
    // Search for similar books
    const { books } = await searchBooks({
      ...searchParams,
      sources: [source]  // Start with the same source
    });
    
    // Filter out the original book
    let recommendations = books.filter(rec => rec.id !== id);
    
    // If we don't have enough recommendations, expand to other sources
    if (recommendations.length < limit) {
      const { books: moreBooks } = await searchBooks({
        ...searchParams,
        sources: Object.keys(API_ENDPOINTS).map(k => k.toLowerCase()) as SourceType[]
      });
      
      // Add additional books but avoid duplicates
      const existingIds = new Set(recommendations.map(b => b.id));
      const additionalBooks = moreBooks.filter(b => b.id !== id && !existingIds.has(b.id));
      
      recommendations = [...recommendations, ...additionalBooks];
    }
    
    // Return the top recommendations up to the limit
    return recommendations.slice(0, limit);
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
    // We'll fetch from multiple sources and combine the results
    const sources: SourceType[] = ["openlibrary", "gutenberg", "standardebooks"];
    const params: BookSearchParams = {
      limit: Math.ceil(limit / sources.length) + 5, // Request extra to account for filtering
      subject: category
    };
    
    // For each source, use a different strategy to get "trending" books
    const promises = sources.map(async (source) => {
      switch (source) {
        case "openlibrary":
          // For Open Library, search for trending subjects or highly rated books
          return searchOpenLibrary({
            ...params,
            query: category || "trending",
            sort: "rating"
          });
          
        case "gutenberg":
          // For Gutenberg, get the most downloaded books
          return searchGutenberg({
            ...params,
            query: category || "popular"
          });
          
        case "standardebooks":
          // Standard Ebooks are already curated for quality
          return searchStandardEbooks({
            ...params,
            query: category || ""
          });
          
        default:
          return [];
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    // Collect all books from successful results
    let allBooks: Book[] = [];
    results.forEach(result => {
      if (result.status === "fulfilled") {
        allBooks = [...allBooks, ...result.value];
      }
    });
    
    // Sort by rating and return the top results
    allBooks.sort((a, b) => b.rating - a.rating);
    return allBooks.slice(0, limit);
  } catch (error) {
    console.error("Failed to get trending books:", error);
    return [];
  }
}

/**
 * Get featured books (popular or trending) for the homepage
 * @param limit - Maximum number of books to return
 * @returns Array of featured books
 */
export async function getFeaturedBooks(limit: number = 4): Promise<Book[]> {
  return getTrendingBooks(limit); // Use trending books as featured books
}

/**
 * Get new releases or recently added books
 * @param limit - Maximum number of books to return
 * @param daysBack - How many days back to consider as "new"
 * @returns Array of new books
 */
export async function getNewReleases(limit: number = 10, daysBack: number = 30): Promise<Book[]> {
  try {
    // For this demo, we'll focus on sources that provide recent additions
    const sources: SourceType[] = ["openlibrary", "standardebooks"];
    
    const params: BookSearchParams = {
      limit: Math.ceil(limit / sources.length) + 3,
      sort: "new"
    };
    
    const promises = sources.map(async (source) => {
      switch (source) {
        case "openlibrary":
          // For Open Library, we can query recently added books
          return searchOpenLibrary({
            ...params,
            query: "recent"
          });
          
        case "standardebooks":
          // For Standard Ebooks, we'll get the latest additions
          return searchStandardEbooks({
            ...params
          });
          
        default:
          return [];
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    // Collect all books from successful results
    let allBooks: Book[] = [];
    results.forEach(result => {
      if (result.status === "fulfilled") {
        allBooks = [...allBooks, ...result.value];
      }
    });
    
    // Filter to only include books with a recent published date if available
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const newBooks = allBooks.filter(book => {
      if (!book.publishedDate) return true; // Include if no date (can't filter)
      
      const publishDate = new Date(book.publishedDate);
      return !isNaN(publishDate.getTime()) && publishDate >= cutoffDate;
    });
    
    // If we don't have enough books after filtering, just return the most recent ones
    if (newBooks.length < limit) {
      return allBooks.slice(0, limit);
    }
    
    return newBooks.slice(0, limit);
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
      author: authorName,
      limit
    };
    
    // Search across multiple sources
    const { books } = await searchBooks({
      ...params,
      sources: ["openlibrary", "gutenberg", "google", "standardebooks"]
    });
    
    // Filter to ensure we only get books by this author
    const authorNameLower = authorName.toLowerCase();
    const filteredBooks = books.filter(book => 
      book.authors.some(author => 
        author.toLowerCase().includes(authorNameLower) || 
        authorNameLower.includes(author.toLowerCase())
      )
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

// Export API endpoints for direct access if needed
export { API_ENDPOINTS };