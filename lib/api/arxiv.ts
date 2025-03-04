import { Book } from "@/types/book"; // Ensure this import matches your project structure

/**
 * Fetches research papers from multiple academic sources.
 * @param query - Search query for papers.
 * @param maxResults - Maximum number of results to return (default: 10).
 * @param sources - Optional array of sources to search (default: all sources).
 * @returns Array of Book objects representing research papers.
 */
export async function searchResearchPapers(
  query: string, 
  maxResults: number = 10,
  sources: Array<"arxiv" | "core" | "semanticscholar" | "openaire" | "pubmed" | "doaj"> = ["arxiv", "core", "semanticscholar", "openaire", "pubmed", "doaj"]
): Promise<Book[]> {
  try {
    // Array to store results from all sources
    const papers: Book[] = [];
    const resultsPerSource = Math.ceil(maxResults / sources.length);
    
    // Track errors for reporting
    const errors: Record<string, string> = {};

    // Create fetch promises based on selected sources
    const fetchPromises: Promise<void>[] = [];

    // 1. Fetch from arXiv API
    if (sources.includes("arxiv")) {
      fetchPromises.push(fetchArxivPapers(query, resultsPerSource, papers, errors));
    }

    // 2. Fetch from CORE API
    if (sources.includes("core")) {
      fetchPromises.push(fetchCorePapers(query, resultsPerSource, papers, errors));
    }

    // 3. Fetch from Semantic Scholar API
    if (sources.includes("semanticscholar")) {
      fetchPromises.push(fetchSemanticScholarPapers(query, resultsPerSource, papers, errors));
    }

    // 4. Fetch from OpenAIRE API (European Open Science Infrastructure)
    if (sources.includes("openaire")) {
      fetchPromises.push(fetchOpenAirePapers(query, resultsPerSource, papers, errors));
    }

    // 5. Fetch from PubMed API (biomedical literature)
    if (sources.includes("pubmed")) {
      fetchPromises.push(fetchPubMedPapers(query, resultsPerSource, papers, errors));
    }

    // 6. Fetch from DOAJ API (Directory of Open Access Journals)
    if (sources.includes("doaj")) {
      fetchPromises.push(fetchDoajPapers(query, resultsPerSource, papers, errors));
    }

    // Wait for all fetch operations to complete
    await Promise.allSettled(fetchPromises);

    // Log any errors that occurred
    if (Object.keys(errors).length > 0) {
      console.error("Errors occurred while fetching papers:", errors);
    }

    // Remove duplicates based on title similarity
    const uniquePapers = removeDuplicates(papers);

    // Sort papers by relevance (could be enhanced with a more sophisticated algorithm)
    uniquePapers.sort((a, b) => {
      // Prioritize papers with query terms in the title
      const titleMatchA = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const titleMatchB = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      
      if (titleMatchA !== titleMatchB) return titleMatchB - titleMatchA;
      
      // Then sort by publication date (if available)
      if (a.publishedDate && b.publishedDate) {
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      }
      
      return 0;
    });

    // Limit total results to maxResults
    return uniquePapers.slice(0, maxResults);
  } catch (error) {
    console.error("Error fetching research papers:", error);
    return []; // Return empty array on error to avoid crashing
  }
}

/**
 * Remove duplicate papers based on title similarity
 */
function removeDuplicates(papers: Book[]): Book[] {
  const uniquePapers: Book[] = [];
  const titles = new Set<string>();
  
  for (const paper of papers) {
    // Normalize the title for comparison
    const normalizedTitle = paper.title.toLowerCase().trim();
    
    // Check if we already have a similar title
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
 * Check if two strings are similar (basic implementation)
 */
function isSimilar(str1: string, str2: string): boolean {
  // If one is significantly longer than the other, they're different
  if (Math.abs(str1.length - str2.length) > 10) return false;
  
  // If one is a substring of the other, they're similar
  if (str1.includes(str2) || str2.includes(str1)) return true;
  
  // Calculate word overlap (more sophisticated algorithms could be used)
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 3));
  
  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }
  
  const overlapRatio = overlap / Math.max(words1.size, words2.size);
  return overlapRatio > 0.7; // 70% word overlap threshold
}

/**
 * Generate a unique ID for a paper
 */
function generateUniqueId(source: string): string {
  return `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Fetch papers from arXiv
 */
async function fetchArxivPapers(
  query: string, 
  maxResults: number, 
  papers: Book[], 
  errors: Record<string, string>
): Promise<void> {
  try {
    const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
      query
    )}&start=0&max_results=${maxResults}`;
    
    const arxivResponse = await fetch(arxivUrl, { 
      headers: { 'User-Agent': 'ResearchPaperApp/1.0' } 
    });

    if (!arxivResponse.ok) {
      errors.arxiv = `arXiv API request failed: ${arxivResponse.status}`;
      return;
    }
    
    const arxivData = await arxivResponse.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(arxivData, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      errors.arxiv = "Failed to parse arXiv XML response";
      return;
    }
    
    const entries = xmlDoc.getElementsByTagName("entry");
    if (entries.length > 0) {
      Array.from(entries)
        .slice(0, maxResults)
        .forEach((entry) => {
          const titleNode = entry.getElementsByTagName("title")[0];
          const title = titleNode?.textContent?.trim().replace(/\s+/g, ' ') || "Untitled Paper";

          const authorNodes = entry.getElementsByTagName("author");
          const authors = Array.from(authorNodes)
            .map((author) => {
              const nameNode = author.getElementsByTagName("name")[0];
              return nameNode?.textContent?.trim() || "Unknown Author";
            })
            .filter(Boolean);

          const abstractNode = entry.getElementsByTagName("summary")[0];
          const abstract = abstractNode?.textContent?.trim().replace(/\s+/g, ' ') || "No abstract available";

          const publishedNode = entry.getElementsByTagName("published")[0];
          const publishedDate = publishedNode?.textContent?.trim() || "";

          const linkNodes = Array.from(entry.getElementsByTagName("link"));
          let pdfUrl = "";
          let detailsUrl = "";
          
          linkNodes.forEach((link) => {
            const linkType = link.getAttribute("title");
            const href = link.getAttribute("href") || "";
            
            if (linkType === "pdf") {
              pdfUrl = href;
            } else if (linkType === null && link.getAttribute("rel") === "alternate") {
              detailsUrl = href;
            }
          });

          const idNode = entry.getElementsByTagName("id")[0];
          const id = idNode?.textContent?.split("/abs/").pop() || generateUniqueId("arxiv");

          const categories = Array.from(entry.getElementsByTagName("category"))
            .map(cat => cat.getAttribute("term") || "")
            .filter(Boolean);

          papers.push({
            id,
            title,
            authors,
            abstract,
            publishedDate,
            pdfUrl,
            detailsUrl,
            source: "arxiv" as const,
            coverImage: "", 
            description: abstract,
            rating: 0,
            categories: categories,
            citationCount: null
          });
        });
    }
  } catch (error) {
    errors.arxiv = `Error fetching from arXiv: ${(error as Error).message}`;
  }
}

/**
 * Fetch papers from CORE
 */
async function fetchCorePapers(
  query: string, 
  maxResults: number, 
  papers: Book[], 
  errors: Record<string, string>
): Promise<void> {
  try {
    const coreApiKey = process.env.CORE_API_KEY || ""; // Add your API key to env variables
    const coreUrl = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(query)}&limit=${maxResults}`;
    
    const coreResponse = await fetch(coreUrl, {
      headers: {
        'Authorization': `Bearer ${coreApiKey}`,
        'User-Agent': 'ResearchPaperApp/1.0'
      }
    });

    if (!coreResponse.ok) {
      errors.core = `CORE API request failed: ${coreResponse.status}`;
      return;
    }
    
    const coreData = await coreResponse.json();
    if (!coreData.results || !Array.isArray(coreData.results)) {
      errors.core = "Unexpected CORE API response format";
      return;
    }
    
    coreData.results
      .slice(0, maxResults)
      .forEach((result: any) => {
        // Extract and normalize data
        const authors = Array.isArray(result.authors) 
          ? result.authors.map((author: any) => {
              return typeof author === 'string' ? author : (author.name || "Unknown Author");
            })
          : ["Unknown Author"];
          
        const abstract = typeof result.abstract === 'string' 
          ? result.abstract.trim().replace(/\s+/g, ' ') 
          : "No abstract available";
          
        papers.push({
          id: result.id || generateUniqueId("core"),
          title: result.title?.trim().replace(/\s+/g, ' ') || "Untitled Paper",
          authors,
          abstract,
          publishedDate: result.publishedDate || result.yearPublished || "",
          pdfUrl: result.downloadUrl || result.fullTextIdentifier || "",
          detailsUrl: result.links?.find((l: any) => l.type === "webpage")?.url || "",
          source: "core" as const,
          coverImage: "",
          description: abstract,
          rating: 0,
          categories: result.topics || [],
          citationCount: result.citationCount || null
        });
      });
  } catch (error) {
    errors.core = `Error fetching from CORE: ${(error as Error).message}`;
  }
}

/**
 * Fetch papers from Semantic Scholar
 */
async function fetchSemanticScholarPapers(
  query: string, 
  maxResults: number, 
  papers: Book[], 
  errors: Record<string, string>
): Promise<void> {
  try {
    const semanticApiKey = process.env.SEMANTIC_SCHOLAR_API_KEY || ""; // Add your API key
    const fields = "paperId,title,authors,abstract,year,openAccessPdf,url,venue,citationCount,fieldsOfStudy";
    const semanticUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${maxResults}&fields=${fields}`;
    
    const semanticResponse = await fetch(semanticUrl, {
      headers: {
        'x-api-key': semanticApiKey,
        'User-Agent': 'ResearchPaperApp/1.0'
      }
    });

    if (!semanticResponse.ok) {
      errors.semanticscholar = `Semantic Scholar API request failed: ${semanticResponse.status}`;
      return;
    }
    
    const semanticData = await semanticResponse.json();
    if (!semanticData.data || !Array.isArray(semanticData.data)) {
      errors.semanticscholar = "Unexpected Semantic Scholar API response format";
      return;
    }
    
    semanticData.data
      .slice(0, maxResults)
      .forEach((paper: any) => {
        papers.push({
          id: paper.paperId || generateUniqueId("semanticscholar"),
          title: paper.title?.trim().replace(/\s+/g, ' ') || "Untitled Paper",
          authors: paper.authors?.map((author: any) => author.name) || ["Unknown Author"],
          abstract: paper.abstract?.trim().replace(/\s+/g, ' ') || "No abstract available",
          publishedDate: paper.year ? `${paper.year}` : "",
          pdfUrl: paper.openAccessPdf?.url || "",
          detailsUrl: paper.url || "",
          source: "semanticscholar" as const,
          coverImage: "",
          description: paper.abstract || "No description available",
          rating: 0,
          categories: paper.fieldsOfStudy || [],
          venue: paper.venue || "",
          citationCount: paper.citationCount || null
        });
      });
  } catch (error) {
    errors.semanticscholar = `Error fetching from Semantic Scholar: ${(error as Error).message}`;
  }
}

/**
 * Fetch papers from OpenAIRE
 */
async function fetchOpenAirePapers(
  query: string, 
  maxResults: number, 
  papers: Book[], 
  errors: Record<string, string>
): Promise<void> {
  try {
    const openAireUrl = `https://api.openaire.eu/search/publications?format=json&size=${maxResults}&title=${encodeURIComponent(query)}`;
    
    const openAireResponse = await fetch(openAireUrl, {
      headers: { 'User-Agent': 'ResearchPaperApp/1.0' }
    });

    if (!openAireResponse.ok) {
      errors.openaire = `OpenAIRE API request failed: ${openAireResponse.status}`;
      return;
    }
    
    const openAireData = await openAireResponse.json();
    const results = openAireData?.response?.results?.result;
    
    if (!results || !Array.isArray(results)) {
      errors.openaire = "Unexpected OpenAIRE API response format";
      return;
    }
    
    results
      .slice(0, maxResults)
      .forEach((result: any) => {
        const metadata = result.metadata?.['oaf:entity']?.['oaf:result'];
        if (!metadata) return;
        
        const title = metadata.title?.__text || "Untitled Paper";
        
        const authorInfo = metadata.creator || [];
        const authors = Array.isArray(authorInfo) 
          ? authorInfo.map((author: any) => author?.__text || "Unknown Author")
          : [authorInfo?.__text || "Unknown Author"];
        
        const description = metadata.description?.__text || "No abstract available";
        
        const dateInfo = metadata.dateofacceptance?.__text || metadata.publicationdate?.__text || "";
        
        const resourceList = metadata.instance || [];
        const instances = Array.isArray(resourceList) ? resourceList : [resourceList];
        
        let pdfUrl = "";
        let detailsUrl = "";
        
        instances.forEach((instance: any) => {
          const url = instance?.webresource?.url?.__text || "";
          const mime = instance?.webresource?.mime?.__text || "";
          
          if (mime === "application/pdf") {
            pdfUrl = url;
          } else if (url && !detailsUrl) {
            detailsUrl = url;
          }
        });
        
        papers.push({
          id: metadata.objectIdentifier?.['oaf:pid']?.__text || generateUniqueId("openaire"),
          title: title.trim().replace(/\s+/g, ' '),
          authors,
          abstract: description.trim().replace(/\s+/g, ' '),
          publishedDate: dateInfo,
          pdfUrl,
          detailsUrl,
          source: "openaire" as const,
          coverImage: "",
          description: description.trim().replace(/\s+/g, ' '),
          rating: 0,
          categories: metadata.subject?.map((s: any) => s.__text) || []
        });
      });
  } catch (error) {
    errors.openaire = `Error fetching from OpenAIRE: ${(error as Error).message}`;
  }
}

/**
 * Fetch papers from PubMed
 */
async function fetchPubMedPapers(
  query: string, 
  maxResults: number, 
  papers: Book[], 
  errors: Record<string, string>
): Promise<void> {
  try {
    // First, search for IDs
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${maxResults}`;
    
    const searchResponse = await fetch(esearchUrl, {
      headers: { 'User-Agent': 'ResearchPaperApp/1.0' }
    });

    if (!searchResponse.ok) {
      errors.pubmed = `PubMed search API request failed: ${searchResponse.status}`;
      return;
    }
    
    const searchData = await searchResponse.json();
    const ids = searchData?.esearchresult?.idlist;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      // No results found, but not an error
      return;
    }
    
    // Then, fetch details for these IDs
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
    
    const fetchResponse = await fetch(efetchUrl, {
      headers: { 'User-Agent': 'ResearchPaperApp/1.0' }
    });

    if (!fetchResponse.ok) {
      errors.pubmed = `PubMed fetch API request failed: ${fetchResponse.status}`;
      return;
    }
    
    const xmlData = await fetchResponse.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      errors.pubmed = "Failed to parse PubMed XML response";
      return;
    }
    
    const articles = xmlDoc.getElementsByTagName("PubmedArticle");
    
    Array.from(articles)
      .slice(0, maxResults)
      .forEach((article) => {
        // Extract PMID (PubMed ID)
        const pmidNode = article.querySelector("PMID");
        const pmid = pmidNode?.textContent || generateUniqueId("pubmed");
        
        // Extract title
        const titleNode = article.querySelector("ArticleTitle");
        const title = titleNode?.textContent?.trim().replace(/\s+/g, ' ') || "Untitled Paper";
        
        // Extract authors
        const authorList = article.querySelector("AuthorList");
        const authorNodes = authorList?.querySelectorAll("Author") || [];
        const authors = Array.from(authorNodes)
          .map((authorNode) => {
            const lastName = authorNode.querySelector("LastName")?.textContent || "";
            const initials = authorNode.querySelector("Initials")?.textContent || "";
            return lastName && initials ? `${lastName} ${initials}` : (lastName || "Unknown Author");
          })
          .filter(Boolean);
        
        if (authors.length === 0) authors.push("Unknown Author");
        
        // Extract abstract
        const abstractNode = article.querySelector("AbstractText");
        const abstract = abstractNode?.textContent?.trim().replace(/\s+/g, ' ') || "No abstract available";
        
        // Extract publication date
        const pubDateNode = article.querySelector("PubDate");
        let publishedDate = "";
        
        if (pubDateNode) {
          const year = pubDateNode.querySelector("Year")?.textContent || "";
          const month = pubDateNode.querySelector("Month")?.textContent || "";
          const day = pubDateNode.querySelector("Day")?.textContent || "";
          
          publishedDate = year;
          if (month) publishedDate = `${publishedDate}-${month}`;
          if (day) publishedDate = `${publishedDate}-${day}`;
        }
        
        // Get keywords/categories
        const keywordNodes = article.querySelectorAll("Keyword");
        const categories = Array.from(keywordNodes)
          .map(node => node.textContent?.trim() || "")
          .filter(Boolean);
        
        // Get journal info
        const journalNode = article.querySelector("Journal");
        const journal = journalNode?.querySelector("Title")?.textContent || "";
        
        papers.push({
          id: pmid,
          title,
          authors,
          abstract,
          publishedDate,
          pdfUrl: "", // PubMed API doesn't directly provide PDF links
          detailsUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source: "pubmed" as const,
          coverImage: "",
          description: abstract,
          rating: 0,
          categories,
          venue: journal
        });
      });
  } catch (error) {
    errors.pubmed = `Error fetching from PubMed: ${(error as Error).message}`;
  }
}

/**
 * Fetch papers from Directory of Open Access Journals (DOAJ)
 */
async function fetchDoajPapers(
  query: string, 
  maxResults: number, 
  papers: Book[], 
  errors: Record<string, string>
): Promise<void> {
  try {
    const doajUrl = `https://doaj.org/api/search/articles/${encodeURIComponent(query)}?pageSize=${maxResults}`;
    
    const doajResponse = await fetch(doajUrl, {
      headers: { 'User-Agent': 'ResearchPaperApp/1.0' }
    });

    if (!doajResponse.ok) {
      errors.doaj = `DOAJ API request failed: ${doajResponse.status}`;
      return;
    }
    
    const doajData = await doajResponse.json();
    const results = doajData?.results || [];
    
    if (!Array.isArray(results)) {
      errors.doaj = "Unexpected DOAJ API response format";
      return;
    }
    
    results
      .slice(0, maxResults)
      .forEach((result: any) => {
        // Extract bibjson data
        const bibjson = result.bibjson || {};
        
        // Get title
        const title = bibjson.title || "Untitled Paper";
        
        // Get authors
        const authorInfo = bibjson.author || [];
        const authors = authorInfo.map((author: any) => {
          const name = author.name || "";
          return name || "Unknown Author";
        });
        
        if (authors.length === 0) authors.push("Unknown Author");
        
        // Get abstract
        const abstract = bibjson.abstract || "No abstract available";
        
        // Get publication date
        const year = bibjson.year || "";
        const month = bibjson.month || "";
        let publishedDate = year;
        if (month) publishedDate = `${publishedDate}-${month}`;
        
        // Get links
        const links = bibjson.link || [];
        let pdfUrl = "";
        let detailsUrl = "";
        
        links.forEach((link: any) => {
          const type = link.type || "";
          const url = link.url || "";
          
          if (type === "fulltext" && url) {
            if (url.endsWith(".pdf")) {
              pdfUrl = url;
            } else {
              detailsUrl = url;
            }
          }
        });
        
        if (!detailsUrl && links.length > 0) {
          detailsUrl = links[0].url || "";
        }
        
        // Get keywords/categories
        const categories = bibjson.keywords || [];
        
        // Get journal info
        const journal = bibjson.journal?.title || "";
        
        papers.push({
          id: result.id || generateUniqueId("doaj"),
          title: title.trim().replace(/\s+/g, ' '),
          authors,
          abstract: abstract.trim().replace(/\s+/g, ' '),
          publishedDate,
          pdfUrl,
          detailsUrl,
          source: "doaj" as const,
          coverImage: "",
          description: abstract.trim().replace(/\s+/g, ' '),
          rating: 0,
          categories,
          venue: journal
        });
      });
  } catch (error) {
    errors.doaj = `Error fetching from DOAJ: ${(error as Error).message}`;
  }
}