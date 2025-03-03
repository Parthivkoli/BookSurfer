// lib/api/semanticscholar.ts
export async function searchSemanticScholar(query: string, limit: number = 10) {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data.map((paper: any) => ({
      id: paper.paperId,
      title: paper.title,
      authors: paper.authors.map((author: any) => author.name),
      abstract: paper.abstract,
      publishedDate: paper.year,
      pdfUrl: paper.openAccessPdf?.url || "",
      source: "semanticscholar" as const,
    }));
  }