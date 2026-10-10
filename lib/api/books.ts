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

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

const ADULT_KEYWORDS = [
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
];

function safeText(value?: string): boolean {
  return Boolean(value && value.trim().length > 0);
}

function normalizeCategories(categories?: string[]): string[] | undefined {
  if (!categories || categories.length === 0) return undefined;
  return categories
    .map((category) => category.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    const hasAdultContent = ADULT_KEYWORDS.some((keyword) => searchableText.includes(keyword));
    if (hasAdultContent) return false;

    const title = (book.title || "").toLowerCase();
    const isLikelyNoise = ["?", "undefined", "null"].some((token) => title.includes(token));
    if (isLikelyNoise) return false;

    return true;
  });
}

function xmlToJson(xml: Element | null): any {
  if (!xml) return {};

  const node = {} as Record<string, any>;

  if (xml.attributes && xml.attributes.length > 0) {
    node["@attributes"] = {};
    for (let i = 0; i < xml.attributes.length; i += 1) {
      const attribute = xml.attributes.item(i);
      if (attribute) node["@attributes"][attribute.nodeName] = attribute.nodeValue;
    }
  }

  if (xml.childNodes && xml.childNodes.length > 0) {
    for (let i = 0; i < xml.childNodes.length; i += 1) {
      const item = xml.childNodes.item(i);
      if (!item) continue;

      if (item.nodeType === 1) {
        const key = item.nodeName;
        const child = xmlToJson(item as Element);

        if (node[key] === undefined) {
          node[key] = child;
        } else if (!Array.isArray(node[key])) {
          node[key] = [node[key], child];
        } else {
          node[key].push(child);
        }
      } else if (item.nodeType === 3) {
        const text = item.nodeValue?.trim();
        if (text) node.text = text;
      }
    }
  }

  return node;
}

async function fetchWithCache(url: string, cacheKey: string): Promise<any> {
  const existing = cache.get(cacheKey);
  const now = Date.now();

  if (existing && now - existing.timestamp < CACHE_TTL) {
    return existing.data;
  }

  let attempt = 0;
  while (attempt < 3) {
    try {
      const response = await fetch(url, {
        cache: "force-cache",
        next: { revalidate: 900 },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "no response body");
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const contentType = response.headers.get("content-type") || "";
      let data: any;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
        const text = await response.text();
        const parsed = load(text, { xmlMode: true });
        data = parsed.xml ? parsed.xml() : xmlToJson(parsed.root().get(0) as Element | null);
      } else {
        data = await response.text();
      }

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      attempt += 1;
      if (attempt >= 3) {
        console.error(`Fetch failed for ${url}:`, error);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  return null;
}

function buildOpenLibraryBook(book: any): Book | null {
  if (!book || !book.title) return null;

  const authors = Array.isArray(book.author_name)
    ? book.author_name.filter(safeText)
    : undefined;

  const coverImage = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined;
  const description = typeof book.description === "string" ? book.description : undefined;
  const categories = Array.isArray(book.subject) ? normalizeCategories(book.subject) : undefined;

  return {
    id: book.key || `openlibrary-${book.cover_i || Math.random().toString(36).slice(2)}`,
    title: book.title,
    authors,
    author: authors?.[0],
    coverImage,
    description,
    publishedDate: book.first_publish_year?.toString(),
    categories,
    language: Array.isArray(book.language) ? book.language : undefined,
    pageCount: typeof book.number_of_pages_median === "number" ? book.number_of_pages_median : undefined,
    source: "openlibrary",
    downloadUrl: book.key ? `https://openlibrary.org${book.key}` : undefined,
    rating: typeof book.rating_average === "number" ? book.rating_average : undefined,
  };
}

function buildGutenbergBook(book: any): Book | null {
  if (!book || !book.title) return null;

  const authors = Array.isArray(book.authors)
    ? book.authors.map((author: any) => author.name || "Unknown Author").filter(Boolean)
    : undefined;

  const downloadUrl =
    book.formats?.["text/html"] ||
    book.formats?.["application/epub+zip"] ||
    book.formats?.["text/plain"] ||
    book.formats?.["application/x-mobipocket-ebook"] ||
    book.formats?.["application/octet-stream"];

  if (!downloadUrl) return null;

  return {
    id: `gutenberg-${book.id}`,
    title: book.title,
    authors,
    author: authors?.[0],
    coverImage: book.formats?.["image/jpeg"],
    description: book.summary || undefined,
    publishedDate: book.bookshelf || undefined,
    categories: Array.isArray(book.subjects) ? normalizeCategories(book.subjects) : undefined,
    language: Array.isArray(book.languages) ? book.languages : undefined,
    source: "gutenberg",
    downloadUrl,
    rating: 4,
  };
}

function buildGoogleBook(item: any): Book | null {
  if (!item || !item.volumeInfo?.title) return null;

  const volumeInfo = item.volumeInfo || {};
  const accessInfo = item.accessInfo || {};
  const authors = Array.isArray(volumeInfo.authors)
    ? volumeInfo.authors.filter(Boolean)
    : undefined;
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
    categories: Array.isArray(volumeInfo.categories)
      ? normalizeCategories(volumeInfo.categories)
      : undefined,
    language: volumeInfo.language ? [volumeInfo.language] : undefined,
    pageCount: volumeInfo.pageCount,
    source: "google",
    downloadUrl,
    rating: typeof volumeInfo.averageRating === "number" ? volumeInfo.averageRating : undefined,
  };
}

export async function searchOpenLibrary(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10, subject, sort } = params;
  const queryString = new URLSearchParams({
    q: query || "fiction",
    page: String(Math.max(1, page)),
    limit: String(Math.max(1, Math.min(limit, 40))),
    has_fulltext: "true",
    ...(subject && { subject }),
    ...(sort && { sort }),
  });

  const data = await fetchWithCache(
    `${API_ENDPOINTS.OPEN_LIBRARY}?${queryString.toString()}`,
    `openlibrary-${query}-${page}-${limit}-${subject || ""}-${sort || ""}`,
  );

  if (!data || !Array.isArray(data.docs)) return [];

  const books = data.docs.map(buildOpenLibraryBook).filter(Boolean) as Book[];
  return applyContentFilters(books);
}

export async function searchGutenberg(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10, languages } = params;
  const queryString = new URLSearchParams({
    page: String(Math.max(1, page)),
    ...(query && { search: query }),
    ...(languages?.length && { languages: languages.join(",") }),
    ...(limit && { per_page: String(Math.max(1, Math.min(limit, 30))) }),
  });

  const data = await fetchWithCache(
    `${API_ENDPOINTS.GUTENBERG}?${queryString.toString()}`,
    `gutenberg-${query}-${page}-${languages?.join(",") || ""}-${limit}`,
  );

  if (!data || !Array.isArray(data.results)) return [];

  const books = data.results.map(buildGutenbergBook).filter(Boolean) as Book[];
  return applyContentFilters(books);
}

export async function searchGoogleBooks(params: BookSearchParams): Promise<Book[]> {
  const { query = "free ebooks", page = 1, limit = 10 } = params;
  const startIndex = (Math.max(1, page) - 1) * Math.max(1, limit);

  const data = await fetchWithCache(
    `${API_ENDPOINTS.GOOGLE_BOOKS}?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${Math.max(1, Math.min(limit, 30))}&filter=free-ebooks`,
    `google-${query}-${page}-${limit}`,
  );

  if (!data || !Array.isArray(data.items)) return [];

  const books = data.items.map(buildGoogleBook).filter(Boolean) as Book[];
  return applyContentFilters(books);
}

export async function searchInternetArchive(params: BookSearchParams): Promise<Book[]> {
  const { query = "", page = 1, limit = 10 } = params;
  const queryString = new URLSearchParams({
    q: query ? `title:(${query}) AND mediatype:texts` : "mediatype:texts",
    fl: "identifier,title,creator,description,subject,language,year,downloads,avg_rating",
    sort: "avg_rating desc",
    output: "json",
    rows: String(Math.max(1, Math.min(limit, 20))),
    page: String(Math.max(1, page)),
  });

  const data = await fetchWithCache(
    `${API_ENDPOINTS.INTERNET_ARCHIVE}?${queryString.toString()}`,
    `internetarchive-${query}-${page}-${limit}`,
  );

  if (!data || !Array.isArray(data.response?.docs)) return [];

  const books: Book[] = data.response.docs
    .map((book: any) => ({
      id: `internetarchive-${book.identifier}`,
      title: book.title || "Untitled",
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
  const queryString = new URLSearchParams({
    title: query || "",
    offset: String((Math.max(1, page) - 1) * Math.max(1, limit)),
    limit: String(Math.max(1, Math.min(limit, 20))),
    format: "json",
  });

  const data = await fetchWithCache(
    `${API_ENDPOINTS.LIBRIVOX}?${queryString.toString()}`,
    `librivox-${query}-${page}-${limit}`,
  );

  if (!data || !Array.isArray(data.books)) return [];

  const books: Book[] = data.books
    .map((book: any) => {
      const authorNames = book.authors
        ?.map((author: any) => `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim())
        .filter(Boolean);

      return {
        id: `librivox-${book.id}`,
        title: book.title || "Untitled",
        authors: authorNames,
        author: authorNames?.[0],
        description: book.description,
        publishedDate: book.copyright_year,
        language: book.language ? [book.language] : undefined,
        source: "librivox",
        downloadUrl: `https://librivox.org/api/feed/audiobooks/${book.id}/rss`,
        rating: 4,
      };
    })
    .filter((book) => Boolean(book.title));

  return applyContentFilters(books);
}

export async function searchFeedbooks(params: BookSearchParams): Promise<Book[]> {
  const { query = "", limit = 10 } = params;
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
      rating: 4,
    });
  });

  let filtered = books.filter((book) => Boolean(book.downloadUrl));
  if (query) {
    const queryLower = query.toLowerCase();
    filtered = filtered.filter((book) => {
      const matchesTitle = book.title.toLowerCase().includes(queryLower);
      const matchesAuthor = book.authors?.some((author) => author.toLowerCase().includes(queryLower));
      const matchesDescription = book.description?.toLowerCase().includes(queryLower);
      return matchesTitle || Boolean(matchesAuthor) || Boolean(matchesDescription);
    });
  }

  return applyContentFilters(filtered.slice(0, Math.max(1, Math.min(limit, 20))));
}

export async function searchBooks(
  params: BookSearchParams & {
    sources?: ("openlibrary" | "gutenberg" | "google" | "internetarchive" | "librivox" | "feedbooks")[];
  },
): Promise<{ books: Book[]; totalItems: number; page: number; limit: number; totalPages: number }> {
  const requestedSources = params.sources && params.sources.length ? params.sources : [...DEFAULT_SOURCES];
  const sourceMap: Record<string, (p: BookSearchParams) => Promise<Book[]>> = {
    openlibrary: searchOpenLibrary,
    gutenberg: searchGutenberg,
    google: searchGoogleBooks,
    internetarchive: searchInternetArchive,
    librivox: searchLibriVox,
    feedbooks: searchFeedbooks,
  };

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(params.limit ?? 20, 60));

  try {
    const results = await Promise.allSettled(requestedSources.map((source) => sourceMap[source](params)));
    const seen = new Map<string, Book>();
    const combined: Book[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;

      for (const book of result.value) {
        const key = `${book.source}:${book.id}`;
        if (!seen.has(key) && book.title && book.title.trim()) {
          seen.set(key, book);
          combined.push(book);
        }
      }
    }

    combined.sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (a.title || "").localeCompare(b.title || "");
    });

    const totalItems = combined.length;
    const sliced = combined.slice((page - 1) * limit, page * limit);

    return {
      books: sliced,
      totalItems,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    };
  } catch (error) {
    console.error("Multi-source book search failed:", error);
    return {
      books: [],
      totalItems: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
}

export function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    cache.delete(cacheKey);
    return;
  }

  cache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

export { API_ENDPOINTS, DEFAULT_SOURCES };
