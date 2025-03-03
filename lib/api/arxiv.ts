// lib/api/arxiv.ts
import { Book } from "@/types/book"; // Ensure this import matches your project structure

/**
 * Fetches research papers from arXiv, CORE, and Semantic Scholar.
 * @param query - Search query for papers.
 * @param maxResults - Maximum number of results to return (default: 10).
 * @returns Array of Book objects representing research papers.
 */
export async function searchArxiv(query: string, maxResults: number = 10): Promise<Book[]> {
  try {
    // Array to store results from all sources
    const papers: Book[] = [];

    // 1. Fetch from arXiv API
    const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
      query
    )}&start=0&max_results=${maxResults}`;
    const arxivResponse = await fetch(arxivUrl);

    if (!arxivResponse.ok) {
      console.warn(`arXiv API request failed: ${arxivResponse.status}`);
    } else {
      const arxivData = await arxivResponse.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(arxivData, "text/xml");

      // Handle potential XML parsing errors
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.warn("Failed to parse arXiv XML response");
      } else {
        const entries = xmlDoc.getElementsByTagName("entry");
        if (entries.length > 0) {
          Array.from(entries)
            .slice(0, maxResults) // Limit results
            .forEach((entry) => {
              const titleNode = entry.getElementsByTagName("title")[0];
              const title = titleNode?.textContent?.trim() || "Untitled Paper";

              const authorNodes = entry.getElementsByTagName("author");
              const authors = Array.from(authorNodes)
                .map((author) => {
                  const nameNode = author.getElementsByTagName("name")[0];
                  return nameNode?.textContent?.trim() || "Unknown Author";
                })
                .filter(Boolean);

              const abstractNode = entry.getElementsByTagName("summary")[0];
              const abstract = abstractNode?.textContent?.trim() || "No abstract available";

              const publishedNode = entry.getElementsByTagName("published")[0];
              const publishedDate = publishedNode?.textContent?.trim() || "";

              const linkNodes = Array.from(entry.getElementsByTagName("link"));
              let pdfUrl = "";
              const pdfLink = linkNodes.find((link) => link.getAttribute("title") === "pdf");
              if (pdfLink) {
                pdfUrl = pdfLink.getAttribute("href") || "";
              } else {
                const firstLink = linkNodes[0];
                pdfUrl = firstLink?.getAttribute("href") || "";
              }

              const idNode = entry.getElementsByTagName("id")[0];
              const id = idNode?.textContent?.split("/abs/").pop() || `arxiv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              papers.push({
                id,
                title,
                authors,
                abstract,
                publishedDate,
                pdfUrl,
                source: "arxiv" as const,
                coverImage: "", // arXiv doesn’t provide cover images typically
                description: abstract, // Use abstract as description
                rating: 0, // Default rating, can be enriched later
              });
            });
        }
      }
    }

    // 2. Fetch from CORE API (open-access papers)
    const coreUrl = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(query)}&limit=${maxResults}`;
    const coreResponse = await fetch(coreUrl);

    if (!coreResponse.ok) {
      console.warn(`CORE API request failed: ${coreResponse.status}`);
    } else {
      const coreData = await coreResponse.json();
      coreData.results
        .slice(0, maxResults - papers.length) // Limit to avoid exceeding maxResults
        .forEach((result: any) => {
          papers.push({
            id: result.id || `core-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: result.title || "Untitled Paper",
            authors: result.authors || ["Unknown Author"],
            abstract: result.abstract || "No abstract available",
            publishedDate: result.publishedDate || "",
            pdfUrl: result.fullTextIdentifier || "",
            source: "core" as const,
            coverImage: "", // CORE doesn’t typically provide cover images
            description: result.abstract || "No description available",
            rating: 0,
          });
        });
    }

    // 3. Fetch from Semantic Scholar API (scholarly articles)
    const semanticUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${maxResults - papers.length}`;
    const semanticResponse = await fetch(semanticUrl);

    if (!semanticResponse.ok) {
      console.warn(`Semantic Scholar API request failed: ${semanticResponse.status}`);
    } else {
      const semanticData = await semanticResponse.json();
      semanticData.data
        .slice(0, maxResults - papers.length) // Limit to avoid exceeding maxResults
        .forEach((paper: any) => {
          papers.push({
            id: paper.paperId || `semanticscholar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: paper.title || "Untitled Paper",
            authors: paper.authors?.map((author: any) => author.name) || ["Unknown Author"],
            abstract: paper.abstract || "No abstract available",
            publishedDate: paper.year ? `${paper.year}` : "",
            pdfUrl: paper.openAccessPdf?.url || "",
            source: "semanticscholar" as const,
            coverImage: "", // Semantic Scholar doesn’t typically provide cover images
            description: paper.abstract || "No description available",
            rating: 0,
          });
        });
    }

    // Limit total results to maxResults
    return papers.slice(0, maxResults);
  } catch (error) {
    console.error("Error fetching research papers:", error);
    return []; // Return empty array on error to avoid crashing
  }
}