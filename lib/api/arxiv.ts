import { Book } from "@/types/book";

// API endpoints
const API_ENDPOINTS = {
  ARXIV: "http://export.arxiv.org/api/query",
  CORE: "https://api.core.ac.uk/v3/search/works",
  SEMANTIC_SCHOLAR: "https://api.semanticscholar.org/graph/v1/paper/search",
  OPENAIRE: "https://api.openaire.eu/search/publications",
  PUBMED_SEARCH: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
  PUBMED_FETCH: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
  DOAJ: "https://doaj.org/api/search/articles",
} as const;

// Cache setup
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Optimized fetch utility from books.ts
async function fetchWithCache(url: string, cacheKey: string, timeoutMs: number = 10000, options: RequestInit = {}): Promise<any> {
  if (!url || !cacheKey) {
    throw new Error('URL and cache key are required');
  }

  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached.data;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { 
      signal: controller.signal, 
      cache: "no-store", 
      headers: { "User-Agent": "ResearchPaperApp/1.0", ...(options.headers || {}) } 
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
      const text = await response.text();
      if (!text) throw new Error('Empty XML response');
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) throw new Error("XML parsing error");
      data = xmlToJson(xmlDoc.documentElement);
    } else {
      data = await response.text();
    }

    if (data) {
      cache.set(cacheKey, { data, timestamp: now });
      console.log(`Fetched and cached data for ${cacheKey}`);
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeout);
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

// XML to JSON converter from books.ts
function xmlToJson(xml: Element): any {
  if (!xml) return null;

  const obj: any = {};
  
  if (xml.nodeType === 1 && xml.attributes.length > 0) {
    obj["@attributes"] = {};
    for (let i = 0; i < xml.attributes.length; i++) {
      const attribute = xml.attributes.item(i);
      if (attribute && attribute.nodeName && attribute.nodeValue) {
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3 && xml.nodeValue) {
    obj.text = xml.nodeValue.trim();
  }

  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      if (!item) continue;

      const nodeName = item.nodeName;
      if (!nodeName) continue;

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
    }
  }

  return obj;
}

/**
 * Remove duplicate papers based on title similarity
 */
function removeDuplicates(papers: Book[]): Book[] {
  const uniquePapers: Book[] = [];
  const titles = new Set<string>();

  for (const paper of papers) {
    const normalizedTitle = paper.title.toLowerCase().trim();
    let isDuplicate = false;
    for (const existingTitle of titles) {
      if (isSimilar(normalizedTitle, existingTitle)) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      uniquePapers.push(paper);
      titles.add(normalizedTitle);
    }
  }
  return uniquePapers;
}

/**
 * Check if two strings are similar
 */
function isSimilar(str1: string, str2: string): boolean {
  if (Math.abs(str1.length - str2.length) > 10) return false;
  if (str1.includes(str2) || str2.includes(str1)) return true;
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 3));
  let overlap = 0;
  for (const word of words1) if (words2.has(word)) overlap++;
  const overlapRatio = overlap / Math.max(words1.size, words2.size);
  return overlapRatio > 0.7;
}

/**
 * Generate a unique ID
 */
function generateUniqueId(source: string): string {
  return `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Fetch papers from arXiv
 */
export async function searchArxiv(query: string, maxResults: number = 10): Promise<Book[]> {
  const url = `${API_ENDPOINTS.ARXIV}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}`;
  const cacheKey = `arxiv-${query}-${maxResults}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    const entries = Array.isArray(data.feed.entry) ? data.feed.entry : data.feed.entry ? [data.feed.entry] : [];
    const papers: Book[] = entries.map((entry: any) => {
      const pdfLink = entry.link?.find((l: any) => l["@attributes"].type === "application/pdf")?.["@attributes"]?.href;
      return {
        id: `arxiv-${entry.id?.text.split('/abs/').pop() || generateUniqueId("arxiv")}`,
        title: entry.title?.text?.trim().replace(/\s+/g, " ") || "Untitled Paper",
        authors: Array.isArray(entry.author) ? entry.author.map((a: any) => a.name?.text || "Unknown Author") : [entry.author?.name?.text || "Unknown Author"],
        coverImage: null,
        description: entry.summary?.text?.trim().replace(/\s+/g, " ") || "No abstract available",
        publishedDate: entry.published?.text || "",
        categories: Array.isArray(entry.category) ? entry.category.map((c: any) => c["@attributes"].term) : entry.category ? [entry.category["@attributes"].term] : [],
        language: ["English"],
        pageCount: 0,
        source: "arxiv" as const,
        downloadUrl: pdfLink || null,
        rating: 0,
      };
    }).filter((paper: Book) => paper.downloadUrl);
    return papers;
  } catch (error) {
    console.error("arXiv search failed:", error);
    return [];
  }
}

/**
 * Fetch papers from CORE
 */
export async function searchCore(query: string, maxResults: number = 10): Promise<Book[]> {
  const apiKey = process.env.CORE_API_KEY || "";
  const url = `${API_ENDPOINTS.CORE}?q=${encodeURIComponent(query)}&limit=${maxResults}`;
  const cacheKey = `core-${query}-${maxResults}`;

  try {
    const data = await fetchWithCache(url, cacheKey, 10000, { headers: { Authorization: `Bearer ${apiKey}` } });
    const papers: Book[] = (data.results || []).map((result: any) => ({
      id: `core-${result.id || generateUniqueId("core")}`,
      title: result.title?.trim().replace(/\s+/g, " ") || "Untitled Paper",
      authors: Array.isArray(result.authors) ? result.authors.map((a: any) => typeof a === "string" ? a : a.name || "Unknown Author") : ["Unknown Author"],
      coverImage: null,
      description: result.abstract?.trim().replace(/\s+/g, " ") || "No abstract available",
      publishedDate: result.publishedDate || result.yearPublished || "",
      categories: result.topics || [],
      language: ["English"],
      pageCount: 0,
      source: "core" as const,
      downloadUrl: result.downloadUrl || result.fullTextIdentifier || null,
      rating: 0,
    })).filter((paper: Book) => paper.downloadUrl);
    return papers;
  } catch (error) {
    console.error("CORE search failed:", error);
    return [];
  }
}

/**
 * Fetch papers from Semantic Scholar
 */
export async function searchSemanticscholar(query: string, maxResults: number = 10): Promise<Book[]> {
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY || "";
  const fields = "paperId,title,authors,abstract,year,openAccessPdf,url,fieldsOfStudy";
  const url = `${API_ENDPOINTS.SEMANTIC_SCHOLAR}?query=${encodeURIComponent(query)}&limit=${maxResults}&fields=${fields}`;
  const cacheKey = `semanticscholar-${query}-${maxResults}`;

  try {
    const data = await fetchWithCache(url, cacheKey, 10000, { headers: { "x-api-key": apiKey } });
    const papers: Book[] = (data.data || []).map((paper: any) => ({
      id: `semanticscholar-${paper.paperId || generateUniqueId("semanticscholar")}`,
      title: paper.title?.trim().replace(/\s+/g, " ") || "Untitled Paper",
      authors: paper.authors?.map((a: any) => a.name || "Unknown Author") || ["Unknown Author"],
      coverImage: null,
      description: paper.abstract?.trim().replace(/\s+/g, " ") || "No abstract available",
      publishedDate: paper.year ? `${paper.year}` : "",
      categories: paper.fieldsOfStudy || [],
      language: ["English"],
      pageCount: 0,
      source: "semanticscholar" as const,
      downloadUrl: paper.openAccessPdf?.url || null,
      rating: 0,
    })).filter((paper: Book) => paper.downloadUrl);
    return papers;
  } catch (error) {
    console.error("Semantic Scholar search failed:", error);
    return [];
  }
}

/**
 * Fetch papers from OpenAIRE
 */
export async function searchOpenaire(query: string, maxResults: number = 10): Promise<Book[]> {
  const url = `${API_ENDPOINTS.OPENAIRE}?format=json&size=${maxResults}&title=${encodeURIComponent(query)}`;
  const cacheKey = `openaire-${query}-${maxResults}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    const results = data?.response?.results?.result || [];
    const papers: Book[] = results.map((result: any) => {
      const metadata = result.metadata?.["oaf:entity"]?.["oaf:result"];
      if (!metadata) return null;
      const instances = Array.isArray(metadata.instance) ? metadata.instance : [metadata.instance];
      const pdfUrl = instances.find((i: any) => i?.webresource?.mime?.__text === "application/pdf")?.webresource?.url?.__text;
      return {
        id: `openaire-${metadata.objectIdentifier?.["oaf:pid"]?.__text || generateUniqueId("openaire")}`,
        title: metadata.title?.__text?.trim().replace(/\s+/g, " ") || "Untitled Paper",
        authors: Array.isArray(metadata.creator) ? metadata.creator.map((c: any) => c.__text || "Unknown Author") : [metadata.creator?.__text || "Unknown Author"],
        coverImage: null,
        description: metadata.description?.__text?.trim().replace(/\s+/g, " ") || "No abstract available",
        publishedDate: metadata.dateofacceptance?.__text || metadata.publicationdate?.__text || "",
        categories: Array.isArray(metadata.subject) ? metadata.subject.map((s: any) => s.__text) : metadata.subject ? [metadata.subject.__text] : [],
        language: ["English"],
        pageCount: 0,
        source: "openaire" as const,
        downloadUrl: pdfUrl || null,
        rating: 0,
      };
    }).filter((paper: Book | null) => paper && paper.downloadUrl);
    return papers as Book[];
  } catch (error) {
    console.error("OpenAIRE search failed:", error);
    return [];
  }
}

/**
 * Fetch papers from PubMed
 */
export async function searchPubmed(query: string, maxResults: number = 10): Promise<Book[]> {
  const searchUrl = `${API_ENDPOINTS.PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${maxResults}`;
  const cacheKeySearch = `pubmed-search-${query}-${maxResults}`;

  try {
    const searchData = await fetchWithCache(searchUrl, cacheKeySearch);
    const ids = searchData?.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    const fetchUrl = `${API_ENDPOINTS.PUBMED_FETCH}?db=pubmed&id=${ids.join(",")}&retmode=xml`;
    const cacheKeyFetch = `pubmed-fetch-${ids.join("-")}`;
    const fetchData = await fetchWithCache(fetchUrl, cacheKeyFetch);

    const articles = Array.isArray(fetchData.PubmedArticle) ? fetchData.PubmedArticle : fetchData.PubmedArticle ? [fetchData.PubmedArticle] : [];
    const papers: Book[] = articles.map((article: any) => {
      const pubDate = article.MedlineCitation?.Article?.Journal?.JournalIssue?.PubDate;
      const publishedDate = pubDate?.Year?.text ? `${pubDate.Year.text}-${pubDate.Month?.text || ""}-${pubDate.Day?.text || ""}`.trim() : "";
      return {
        id: `pubmed-${article.MedlineCitation?.PMID?.text || generateUniqueId("pubmed")}`,
        title: article.MedlineCitation?.Article?.ArticleTitle?.text?.trim().replace(/\s+/g, " ") || "Untitled Paper",
        authors: Array.isArray(article.MedlineCitation?.Article?.AuthorList?.Author) ? 
          article.MedlineCitation.Article.AuthorList.Author.map((a: any) => `${a.LastName?.text || ""} ${a.Initials?.text || ""}`.trim() || "Unknown Author") : 
          [article.MedlineCitation?.Article?.AuthorList?.Author?.LastName?.text || "Unknown Author"],
        coverImage: null,
        description: article.MedlineCitation?.Article?.Abstract?.AbstractText?.text?.trim().replace(/\s+/g, " ") || "No abstract available",
        publishedDate,
        categories: Array.isArray(article.MedlineCitation?.KeywordList?.Keyword) ? 
          article.MedlineCitation.KeywordList.Keyword.map((k: any) => k.text) : 
          article.MedlineCitation?.KeywordList?.Keyword ? [article.MedlineCitation.KeywordList.Keyword.text] : [],
        language: ["English"],
        pageCount: 0,
        source: "pubmed" as const,
        downloadUrl: null, // PubMed doesn't provide direct PDFs
        rating: 0,
      };
    });
    return papers;
  } catch (error) {
    console.error("PubMed search failed:", error);
    return [];
  }
}

/**
 * Fetch papers from DOAJ
 */
export async function searchDoaj(query: string, maxResults: number = 10): Promise<Book[]> {
  const url = `${API_ENDPOINTS.DOAJ}/${encodeURIComponent(query)}?pageSize=${maxResults}`;
  const cacheKey = `doaj-${query}-${maxResults}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    const papers: Book[] = (data.results || []).map((result: any) => {
      const bibjson = result.bibjson || {};
      const links = Array.isArray(bibjson.link) ? bibjson.link : bibjson.link ? [bibjson.link] : [];
      const pdfUrl = links.find((l: any) => l.type === "fulltext" && l.url.endsWith(".pdf"))?.url;
      return {
        id: `doaj-${result.id || generateUniqueId("doaj")}`,
        title: bibjson.title?.trim().replace(/\s+/g, " ") || "Untitled Paper",
        authors: bibjson.author?.map((a: any) => a.name || "Unknown Author") || ["Unknown Author"],
        coverImage: null,
        description: bibjson.abstract?.trim().replace(/\s+/g, " ") || "No abstract available",
        publishedDate: bibjson.year ? `${bibjson.year}-${bibjson.month || ""}`.trim() : "",
        categories: bibjson.keywords || [],
        language: ["English"],
        pageCount: 0,
        source: "doaj" as const,
        downloadUrl: pdfUrl || null,
        rating: 0,
      };
    }).filter((paper: Book) => paper.downloadUrl);
    return papers;
  } catch (error) {
    console.error("DOAJ search failed:", error);
    return [];
  }
}

/**
 * Main function to search research papers across multiple sources
 */
export async function searchResearchPapers(
  query: string,
  maxResults: number = 10,
  sources: Array<"arxiv" | "core" | "semanticscholar" | "openaire" | "pubmed" | "doaj"> = [
    "arxiv",
    "core",
    "semanticscholar",
    "openaire",
    "pubmed",
    "doaj",
  ]
): Promise<Book[]> {
  try {
    const papers: Book[] = [];
    const resultsPerSource = Math.ceil(maxResults / sources.length);
    const searchFunctions: { [key: string]: (q: string, m: number) => Promise<Book[]> } = {
      arxiv: searchArxiv,
      core: searchCore,
      semanticscholar: searchSemanticscholar,
      openaire: searchOpenaire,
      pubmed: searchPubmed,
      doaj: searchDoaj,
    };

    const fetchPromises = sources.map(source =>
      Promise.race([
        searchFunctions[source](query, resultsPerSource),
        new Promise<Book[]>(resolve => setTimeout(() => resolve([]), 10000)),
      ])
    );

    const results = await Promise.allSettled(fetchPromises);
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        papers.push(...result.value);
      } else {
        console.warn(`Search failed for source ${sources[index]}:`, result.reason);
      }
    });

    const uniquePapers = removeDuplicates(papers);
    uniquePapers.sort((a, b) => {
      const titleMatchA = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const titleMatchB = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      if (titleMatchA !== titleMatchB) return titleMatchB - titleMatchA;
      return new Date(b.publishedDate || "0").getTime() - new Date(a.publishedDate || "0").getTime();
    });

    return uniquePapers.slice(0, maxResults);
  } catch (error) {
    console.error("Error fetching research papers:", error);
    return [];
  }
}