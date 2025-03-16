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

type SourceType = "openlibrary" | "gutenberg" | "google" | "internetarchive" | "librivox" | "feedbooks";

// Cache setup (in-memory for simplicity; consider Redis for production)
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

// Content filtering options - applied to all sources
const CONTENT_FILTERS = {
  adultContentKeywords: [
    "erotic", "explicit", "adult", "xxx", "mature content",
    "sexual content", "18+", "r-rated", "x-rated", "pornographic"
  ],
  minimumRating: 3.0,
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
    const combinedText = `${book.title} ${book.description || ""} ${book.categories.join(" ")}`.toLowerCase();
    const hasAdultContent = CONTENT_FILTERS.adultContentKeywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    if (hasAdultContent) return false;
    
    if ((book.rating ?? 0) < CONTENT_FILTERS.minimumRating) return false;
    
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
 * Generic fetch utility with caching and retry logic
 * @param url - The URL to fetch
 * @param cacheKey - Unique key for caching
 * @returns Fetched data
 */
async function fetchWithCache(url: string, cacheKey: string): Promise<any> {
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached.data;
  }

  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Fetching URL: ${url} (Attempt ${retries + 1})`);
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error details available");
        if (response.status >= 500 && retries < MAX_RETRIES - 1) {
          // Retry on server errors (5xx)
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
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
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        data = xmlToJson(xmlDoc);
      } else if (contentType.includes("text/html")) {
        const text = await response.text();
        data = { html: text };
      } else {
        data = await response.text();
      }

      cache.set(cacheKey, { data, timestamp: now });
      console.log(`Fetched and cached data for ${cacheKey}`);
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("Failed to fetch") && retries < MAX_RETRIES - 1) {
        // Retry on network errors
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      console.error(`Fetch failed after ${retries + 1} attempts for ${url}:`, error);
      throw error; // Re-throw after max retries
    }
  }
}

/**
 * Helper function to convert XML to JSON
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
 * Search books from Open Library API (only readable books)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchOpenLibrary(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10, subject } = params;
  const queryParams = new URLSearchParams({
    q: query || "*:*",
    page: page.toString(),
    limit: limit.toString(),
    has_fulltext: "true", // Only return books with full text
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
      rating: book.rating_average ?? 0,
    }));
    
    return applyContentFilters(books); // has_fulltext ensures readability
  } catch (error) {
    console.error("Open Library search failed:", error);
    return [];
  }
}

/**
 * Search books from Project Gutenberg API (all books are readable)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchGutenberg(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10, languages } = params;
  const queryParams = new URLSearchParams({
    search: query || "",
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
      coverImage: book.formats?.["image/jpeg"] || null,
      description: "",
      publishedDate: "",
      categories: Array.isArray(book.subjects) ? book.subjects : [],
      language: Array.isArray(book.languages) ? book.languages : [],
      pageCount: 0,
      source: "gutenberg" as const,
      downloadUrl:
        book.formats?.["text/html"] ||
        book.formats?.["application/epub+zip"] ||
        book.formats?.["text/plain"] ||
        null,
      rating: 4.0,
    })).filter(book => book.downloadUrl !== null); // Ensure readable
    
    return applyContentFilters(books);
  } catch (error) {
    console.error("Gutenberg search failed:", error);
    return [];
  }
}

/**
 * Search books from Google Books API (only readable books)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchGoogleBooks(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const startIndex = (page - 1) * limit;
  const queryParams = new URLSearchParams({
    q: query || "free ebooks",
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
        rating: volumeInfo.averageRating ?? 0,
      };
    }).filter(book => book.downloadUrl !== null); // Only readable books
    
    return applyContentFilters(books);
  } catch (error) {
    console.error("Google Books search failed:", error);
    return [];
  }
}

/**
 * Search books from Internet Archive (all books assumed readable)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchInternetArchive(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const queryParams = new URLSearchParams({
    q: query ? `title:(${query}) AND mediatype:texts` : "mediatype:texts",
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
      rating: book.avg_rating ?? 0,
    }));
    
    return applyContentFilters(books); // All have downloadUrl
  } catch (error) {
    console.error("Internet Archive search failed:", error);
    return [];
  }
}

/**
 * Search audiobooks from LibriVox (all books assumed readable)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchLibriVox(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const queryParams = new URLSearchParams({
    title: query || "",
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
      authors: book.authors?.map((a: any) => `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()) || [],
      coverImage: null,
      description: book.description || "",
      publishedDate: book.copyright_year || "",
      categories: [],
      language: [book.language || "English"],
      pageCount: 0,
      source: "librivox" as const,
      downloadUrl: `https://librivox.org/api/feed/audiobooks/${book.id}/rss`,
      rating: 4.0,
    }));
    
    return applyContentFilters(books); // All have downloadUrl
  } catch (error) {
    console.error("LibriVox search failed:", error);
    return [];
  }
}

/**
 * Search Feedbooks public domain books (all books assumed readable)
 * @param params - Search parameters
 * @returns Array of Book objects
 */
export async function searchFeedbooks(params: BookSearchParams): Promise<Book[]> {
  const url = API_ENDPOINTS.FEEDBOOKS;
  const cacheKey = `feedbooks-all`;

  try {
    const data = await fetchWithCache(url, cacheKey);
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
        authors: author ? [author] : [],
        coverImage: coverUrl || null,
        description: description || "",
        publishedDate: "",
        categories,
        language: ["English"],
        pageCount: 0,
        source: "feedbooks" as const,
        downloadUrl: downloadUrl || null,
        rating: 4.0,
      });
    });

    // Filter for readability and query
    books = books.filter(book => book.downloadUrl !== null);
    if (params.query) {
      const queryLower = params.query.toLowerCase();
      books = books.filter((book) =>
        book.title.toLowerCase().includes(queryLower) ||
        book.authors.some((author) => author.toLowerCase().includes(queryLower)) ||
        book.description.toLowerCase().includes(queryLower)
      );
    }

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
  const sources = params.sources || (["openlibrary", "gutenberg", "google", "internetarchive", "librivox", "feedbooks"] as SourceType[]);
  const searchFunctions: { [key in SourceType]: (p: BookSearchParams) => Promise<Book[]> } = {
    openlibrary: searchOpenLibrary,
    gutenberg: searchGutenberg,
    google: searchGoogleBooks,
    internetarchive: searchInternetArchive,
    librivox: searchLibriVox,
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
        if (sources[index] === "google") totalItems += 1000;
        else if (sources[index] === "gutenberg") totalItems += 60000;
        else if (sources[index] === "openlibrary") totalItems += 10000;
        else if (sources[index] === "internetarchive") totalItems += 20000;
        else if (sources[index] === "librivox") totalItems += 15000;
        else if (sources[index] === "feedbooks") totalItems += 5000;
      } else {
        console.warn(`Search failed for source ${sources[index]}:`, result.reason);
      }
    });

    allBooks.sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
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
 * @param id - Book ID with source prefix
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
        coverImage: data.formats?.["image/jpeg"] || null,
        description: "",
        publishedDate: "",
        categories: data.subjects || [],
        language: data.languages || [],
        pageCount: 0,
        source: "gutenberg" as const,
        downloadUrl: data.formats?.["text/html"] || data.formats?.["application/epub+zip"] || data.formats?.["text/plain"] || null,
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
        rating: volumeInfo.averageRating ?? 0,
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
        rating: metadata.avg_rating ?? 0,
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
        authors: book.authors?.map((a: any) => `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()) || [],
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
    "feedbooks-": async () => {
      const feedbooksId = id.replace("feedbooks-", "");
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
    "": async () => {
      const url = `https://openlibrary.org/works/${id}.json`;
      const data = await fetchWithCache(url, `openlibrary-book-${id}`);
      const coverImage = data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg` : null;
      return {
        id,
        title: data.title || "Unknown Title",
        authors: data.authors?.map((a: any) => a.name) || [],
        coverImage,
        description: typeof data.description === "object" ? data.description.value ?? "" : data.description || "",
        publishedDate: data.first_publish_date || "",
        categories: data.subjects || [],
        language: [],
        pageCount: 0,
        source: "openlibrary" as const,
        downloadUrl: `https://openlibrary.org${data.key || ""}`,
        rating: 0,
      };
    },
  };

  try {
    const sourcePrefix = Object.keys(sourceMap).find(prefix => id.startsWith(prefix));
    const sourceFn = sourcePrefix ? sourceMap[sourcePrefix] : sourceMap[""];
    
    const book = await sourceFn();
    
    if (book && book.downloadUrl) {
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
 * Fetch the content of a book by its ID
 * @param id - Book ID with source prefix
 * @returns Book content as a string or null if not found
 */
export async function getBookContent(id: string): Promise<string | null> {
  try {
    const book = await getBookById(id);
    if (!book || !book.downloadUrl) {
      console.error(`No download URL found for book ID: ${id}`);
      return null;
    }

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
      const arrayBuffer = await response.arrayBuffer();
      content = "EPUB content not directly readable as text. Consider using a library like epub.js.";
    } else if (contentType.includes("text/html")) {
      const text = await response.text();
      const $ = load(text);
      content = $("body").text().trim() || "No readable text found in HTML.";
    } else {
      content = await response.text();
    }

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
    const source = id.split('-')[0] as SourceType;
    let searchParams: BookSearchParams = { limit };
    
    const book = await getBookById(id);
    if (!book) return [];
    
    if (book.authors.length > 0) {
      searchParams.author = book.authors[0];
    } else if (book.categories.length > 0) {
      searchParams.subject = book.categories[0];
    } else {
      const titleWords = book.title.split(' ')
        .filter(word => word.length > 4)
        .slice(0, 2);
      searchParams.query = titleWords.length > 0 ? titleWords.join(' ') : "classic literature";
    }
    
    const { books } = await searchBooks({
      ...searchParams,
      sources: [source]
    });
    
    let recommendations = books.filter(rec => rec.id !== id);
    
    if (recommendations.length < limit) {
      const { books: moreBooks } = await searchBooks({
        ...searchParams,
        sources: Object.keys(API_ENDPOINTS).map(k => k.toLowerCase() as SourceType)
      });
      
      const existingIds = new Set(recommendations.map(b => b.id));
      const additionalBooks = moreBooks.filter(b => b.id !== id && !existingIds.has(b.id));
      recommendations = [...recommendations, ...additionalBooks];
    }
    
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
    const sources: SourceType[] = ["openlibrary", "gutenberg"];
    const params: BookSearchParams = {
      limit: Math.ceil(limit / sources.length) + 5,
      subject: category
    };
    
    const promises = sources.map(async (source) => {
      switch (source) {
        case "openlibrary":
          return searchOpenLibrary({
            ...params,
            query: category || "trending",
            sort: "rating"
          });
        case "gutenberg":
          return searchGutenberg({
            ...params,
            query: category || "popular"
          });
        default:
          return [];
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    let allBooks: Book[] = [];
    results.forEach(result => {
      if (result.status === "fulfilled") {
        allBooks = [...allBooks, ...result.value];
      }
    });
    
    allBooks.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return allBooks.slice(0, limit);
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
    const sources: SourceType[] = ["openlibrary"];
    const params: BookSearchParams = {
      limit: Math.ceil(limit / sources.length) + 3,
      sort: "new"
    };
    
    const promises = sources.map(async (source) => {
      switch (source) {
        case "openlibrary":
          return searchOpenLibrary({
            ...params,
            query: "recent"
          });
        default:
          return [];
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    let allBooks: Book[] = [];
    results.forEach(result => {
      if (result.status === "fulfilled") {
        allBooks = [...allBooks, ...result.value];
      }
    });
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const newBooks = allBooks.filter(book => {
      if (!book.publishedDate) return true;
      const publishDate = new Date(book.publishedDate);
      return !isNaN(publishDate.getTime()) && publishDate >= cutoffDate;
    });
    
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
    
    const { books } = await searchBooks({
      ...params,
      sources: ["openlibrary", "gutenberg", "google"]
    });
    
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

export { API_ENDPOINTS };