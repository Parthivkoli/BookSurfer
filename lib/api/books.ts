import { Book, BookSearchParams } from "@/types/book";
import { load } from "cheerio";

const API_ENDPOINTS = {
  OPEN_LIBRARY: "https://openlibrary.org/search.json",
  GUTENBERG: "https://gutendex.com/books",
  GOOGLE_BOOKS: "https://www.googleapis.com/books/v1/volumes",
  INTERNET_ARCHIVE: "https://archive.org/advancedsearch.php",
  LIBRIVOX: "https://librivox.org/api/feed/audiobooks",
  FEEDBOOKS: "https://www.feedbooks.com/publicdomain/catalog.atom",
} as const;

const DEFAULT_SOURCES = [
  "openlibrary",
  "gutenberg",
  "google",
  "internetarchive",
  "librivox",
  "feedbooks",
] as const;

const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 15 * 60 * 1000;

const CONTENT_FILTERS = {
  adultContentKeywords: [
    "erotic",
    "explicit",
    "adult",
    "xxx",
    "mature content",
    "sexual content",
    "18+",
    "r-rated",
    "x-rated",
    "pornographic",
  ],
  minimumRating: 2.5,
};

function isSafeText(value?: string): boolean {
  return Boolean(value && value.trim().length > 0);
}

function normalizeCategories(categories?: string[]): string[] | undefined {
  if (!categories || categories.length === 0) return undefined;
  return categories
    .map((category) => category.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function applyContentFilters(books: Book[]): Book[] {
  return books.filter((book) => {
    const searchableText = [
      book.title,
      book.description,
      book.abstract,
      book.author,
      book.authors?.join(" "),
      book.categories?.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const hasAdultContent = CONTENT_FILTERS.adultContentKeywords.some((keyword) =>
      searchableText.includes(keyword.toLowerCase())
    );

    if (hasAdultContent) return false;

    if (typeof book.rating === "number" && book.rating > 0 && book.rating < CONTENT_FILTERS.minimumRating) {
      return false;
    }

    return true;
  });
}

function xmlToJson(xml: Element | null): any {
  if (!xml) return {};
  const obj: any = {};

  if (xml.attributes && xml.attributes.length > 0) {
    obj["@attributes"] = {};
    for (let i = 0; i < xml.attributes.length; i++) {
      const attribute = xml.attributes.item(i);
      if (attribute) obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
    }
  }

  if (xml.childNodes && xml.childNodes.length > 0) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      if (!item) continue;

      if (item.nodeType === 1) {
        const nodeName = item.nodeName;
        if (obj[nodeName] === undefined) {
          obj[nodeName] = xmlToJson(item as Element);
        } else {
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]];
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

  return obj;
}

async function fetchWithCache(url: string, cacheKey: string): Promise<any> {
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let retries = 0;
  while (retries < 3) {
    try {
      const response = await fetch(url, {
        cache: "force-cache",
        next: { revalidate: 900 },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "No error details available");
        throw new Error(`HTTP ${response.status} for ${url}: ${text}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let data: any;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
        const text = await response.text();
        const parsed = load(text, { xmlMode: true });
        data = parsed.xml ? { xml: parsed.xml() } : xmlToJson(parsed.root().get(0) as Element | null);
      } else {
        data = await response.text();
      }

      cache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      retries += 1;
      if (retries >= 3) {
        console.error(`Fetch failed for ${url}:`, error);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * retries));
    }
  }

  return null;
}

function buildBookFromOpenLibrary(book: any): Book | null {
  if (!book || !book.title) return null;

  const authors = Array.isArray(book.author_name) ? book.author_name.filter(isSafeText) : undefined;
  const coverImage = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined;
  const categories = Array.isArray(book.subject) ? normalizeCategories(book.subject) : undefined;

  return {
    id: book.key || `openlibrary-${book.cover_i || Math.random().toString(36).slice(2)}`,
    title: book.title,
    authors,
    author: authors?.[0],
    coverImage,
    description: typeof book.description === "string" ? book.description : undefined,
    publishedDate: book.first_publish_year?.toString(),
    categories,
    language: Array.isArray(book.language) ? book.language : undefined,
    pageCount: book.number_of_pages_median,
    source: "openlibrary",
    downloadUrl: book.key ? `https://openlibrary.org${book.key}` : undefined,
    rating: typeof book.rating_average === "number" ? book.rating_average : undefined,
  };
}

function buildBookFromGutenberg(book: any): Book | null {
  if (!book || !book.title) return null;

  const authors = Array.isArray(book.authors)
    ? book.authors.map((author: any) => author.name || "Unknown Author").filter(Boolean)
    : undefined;

  const downloadUrl =
    book.formats?.["text/html"] ||
    book.formats?.["application/epub+zip"] ||
    book.formats?.["text/plain"] ||
    book.formats?.["application/x-mobipocket-ebook"];

  if (!downloadUrl) return null;

  return {
    id: `gutenberg-${book.id}`,
    title: book.title,
    authors,
    author: authors?.[0],
    coverImage: book.formats?.["image/jpeg"],
    description: undefined,
    publishedDate: undefined,
    categories: Array.isArray(book.subjects) ? normalizeCategories(book.subjects) : undefined,
    language: Array.isArray(book.languages) ? book.languages : undefined,
    source: "gutenberg",
    downloadUrl,
    rating: 4.0,
  };
}

function buildBookFromGoogle(item: any): Book | null {
  if (!item || !item.volumeInfo?.title) return null;

  const volumeInfo = item.volumeInfo || {};
  const accessInfo = item.accessInfo || {};
  const authors = Array.isArray(volumeInfo.authors) ? volumeInfo.authors.filter(Boolean) : undefined;
  const downloadUrl = accessInfo.epub?.downloadLink || accessInfo.pdf?.downloadLink;

  if (!downloadUrl) return null;

  return {
    id: `google-${item.id}`,
    title: volumeInfo.title,
    authors,
    author: authors?.[0],
    coverImage: volumeInfo.imageLinks?.thumbnail,
    description: volumeInfo.description,
    publishedDate: volumeInfo.publishedDate,
    categories: Array.isArray(volumeInfo.categories) ? normalizeCategories(volumeInfo.categories) : undefined,
    language: volumeInfo.language ? [volumeInfo.language] : undefined,
    pageCount: volumeInfo.pageCount,
    source: "google",
    downloadUrl,
    rating: typeof volumeInfo.averageRating === "number" ? volumeInfo.averageRating : undefined,
  };
}

export async function searchOpenLibrary(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10, subject, sort } = params;
  const queryParams = new URLSearchParams({
    q: query || "*:*",
    page: String(page),
    limit: String(limit),
    has_fulltext: "true",
    ...(subject && { subject }),
    ...(sort && { sort }),
  });

  const url = `${API_ENDPOINTS.OPEN_LIBRARY}?${queryParams.toString()}`;
  const data = await fetchWithCache(url, `openlibrary-${query}-${page}-${limit}-${subject || ""}-${sort || ""}`);
  if (!data || !Array.isArray(data.docs)) return [];

  const books = data.docs.map(buildBookFromOpenLibrary).filter(Boolean) as Book[];
  return applyContentFilters(books);
}

export async function searchGutenberg(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, languages } = params;
  const queryParams = new URLSearchParams({
    search: query || "",
    page: String(page),
    ...(languages?.length && { languages: languages.join(",") }),
  });

  const url = `${API_ENDPOINTS.GUTENBERG}?${queryParams.toString()}`;
  const data = await fetchWithCache(url, `gutenberg-${query}-${page}-${languages?.join(",") || ""}`);
  if (!data || !Array.isArray(data.results)) return [];

  const books = data.results.map(buildBookFromGutenberg).filter(Boolean) as Book[];
  return applyContentFilters(books);
}

export async function searchGoogleBooks(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const startIndex = (page - 1) * limit;
  const queryParams = new URLSearchParams({
    q: query || "free ebooks",
    startIndex: String(startIndex),
    maxResults: String(limit),
    filter: "free-ebooks",
  });

  const url = `${API_ENDPOINTS.GOOGLE_BOOKS}?${queryParams.toString()}`;
  const data = await fetchWithCache(url, `google-${query}-${startIndex}-${limit}`);
  if (!data || !Array.isArray(data.items)) return [];

  const books = data.items.map(buildBookFromGoogle).filter(Boolean) as Book[];
  return applyContentFilters(books);
}

export async function searchInternetArchive(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const queryParams = new URLSearchParams({
    q: query ? `title:(${query}) AND mediatype:texts` : "mediatype:texts",
    fl: "identifier,title,creator,description,subject,language,year,downloads,avg_rating",
    sort: "avg_rating desc",
    output: "json",
    rows: String(limit),
    page: String(page),
  });

  const url = `${API_ENDPOINTS.INTERNET_ARCHIVE}?${queryParams.toString()}`;
  const data = await fetchWithCache(url, `internetarchive-${query}-${page}-${limit}`);
  if (!data || !Array.isArray(data.response?.docs)) return [];

  const books: Book[] = data.response.docs
    .map((book: any) => ({
      id: `internetarchive-${book.identifier}`,
      title: book.title || "Unknown Title",
      authors: Array.isArray(book.creator) ? book.creator : book.creator ? [book.creator] : undefined,
      author: Array.isArray(book.creator) && book.creator.length ? book.creator[0] : book.creator,
      coverImage: `https://archive.org/services/img/${book.identifier}`,
      description: book.description,
      publishedDate: book.year,
      categories: Array.isArray(book.subject) ? normalizeCategories(book.subject) : book.subject ? [book.subject] : undefined,
      language: Array.isArray(book.language) ? book.language : book.language ? [book.language] : undefined,
      source: "internetarchive",
      downloadUrl: `https://archive.org/details/${book.identifier}`,
      rating: typeof book.avg_rating === "number" ? book.avg_rating : undefined,
    }))
    .filter((book) => Boolean(book.title));

  return applyContentFilters(books);
}

export async function searchLibriVox(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const queryParams = new URLSearchParams({
    title: query || "",
    offset: String((page - 1) * limit),
    limit: String(limit),
    format: "json",
  });

  const url = `${API_ENDPOINTS.LIBRIVOX}?${queryParams.toString()}`;
  const data = await fetchWithCache(url, `librivox-${query}-${page}-${limit}`);
  if (!data || !Array.isArray(data.books)) return [];

  const books: Book[] = data.books.map((book: any) => ({
    id: `librivox-${book.id}`,
    title: book.title || "Unknown Title",
    authors: book.authors?.map((author: any) => `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim()).filter(Boolean),
    author: book.authors?.[0] ? `${book.authors[0].first_name ?? ""} ${book.authors[0].last_name ?? ""}`.trim() : undefined,
    description: book.description,
    publishedDate: book.copyright_year,
    language: book.language ? [book.language] : undefined,
    source: "librivox",
    downloadUrl: `https://librivox.org/api/feed/audiobooks/${book.id}/rss`,
    rating: 4.0,
  }));

  return applyContentFilters(books);
}

export async function searchFeedbooks(params: BookSearchParams): Promise<Book[]> {
  const { query, limit = 10 } = params;
  const data = await fetchWithCache(API_ENDPOINTS.FEEDBOOKS, "feedbooks-all");
  if (!data) return [];

  const $ = load(data as string, { xmlMode: true });
  const books: Book[] = [];

  $("entry").each((_, element) => {
    const $element = $(element);
    const title = $element.find("title").text().trim();
    const author = $element.find("author name").text().trim();
    const description = $element.find("summary").text().trim();
    const id = $element.find("id").text().trim();
    const coverUrl = $element.find('link[rel="http://opds-spec.org/image"]').attr("href");
    const downloadUrl = $element.find('link[rel="http://opds-spec.org/acquisition"]').attr("href");

    if (!title || !downloadUrl) return;

    const categories: string[] = [];
    $element.find("category").each((__, cat) => {
      const term = $(cat).attr("term");
      if (term) categories.push(term);
    });

    books.push({
      id: `feedbooks-${id.split("/").pop() || Math.random().toString(36).slice(2)}`,
      title,
      authors: author ? [author] : undefined,
      author,
      coverImage: coverUrl,
      description,
      publishedDate: undefined,
      categories: categories.length ? categories : undefined,
      language: ["English"],
      source: "feedbooks",
      downloadUrl,
      rating: 4.0,
    });
  });

  let filtered = books.filter((book) => book.downloadUrl !== undefined);
  if (query) {
    const queryLower = query.toLowerCase();
    filtered = filtered.filter(
      (book) =>
        book.title.toLowerCase().includes(queryLower) ||
        book.description?.toLowerCase().includes(queryLower) ||
        book.authors?.some((author) => author.toLowerCase().includes(queryLower))
    );
  }

  return applyContentFilters(filtered.slice(0, limit));
}

export async function searchBooks(
  params: BookSearchParams & {
    sources?: ("openlibrary" | "gutenberg" | "google" | "internetarchive" | "librivox" | "feedbooks")[];
  }
): Promise<{ books: Book[]; totalItems: number; page: number; limit: number; totalPages: number }> {
  const requestedSources = (params.sources && params.sources.length ? params.sources : [...DEFAULT_SOURCES]) as typeof DEFAULT_SOURCES;
  const sourceMap: Record<string, (p: BookSearchParams) => Promise<Book[]>> = {
    openlibrary: searchOpenLibrary,
    gutenberg: searchGutenberg,
    google: searchGoogleBooks,
    internetarchive: searchInternetArchive,
    librivox: searchLibriVox,
    feedbooks: searchFeedbooks,
  };

  try {
    const results = await Promise.allSettled(requestedSources.map((source) => sourceMap[source](params)));
    const allBooks: Book[] = [];
    const seen = new Map<string, Book>();

    results.forEach((result) => {
      if (result.status !== "fulfilled") return;
      for (const book of result.value) {
        const key = `${book.source}:${book.id}`;
        if (!seen.has(key)) {
          seen.set(key, book);
          allBooks.push(book);
        }
      }
    });

    allBooks.sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return a.title.localeCompare(b.title);
    });

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(params.limit ?? 20, 60));
    const slicedBooks = allBooks.slice((page - 1) * limit, page * limit);
    const totalItems = allBooks.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      books: slicedBooks,
      totalItems,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error("Multi-source book search failed:", error);
    return { books: [], totalItems: 0, page: params.page ?? 1, limit: params.limit ?? 20, totalPages: 1 };
  }
}

export function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    cache.delete(cacheKey);
  } else {
    cache.clear();
  }
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

export { API_ENDPOINTS };
