import { Book } from "@/types/book";

/**
 * Recommends books purely client-side using Open Library subjects and TF-IDF inspired overlap
 */
export async function getRecommendations(
  seedBook: Book, 
  limit: number = 4
): Promise<Book[]> {
  try {
    // We need subjects or categories to find similar books
    const subjects = seedBook.categories || [];
    if (subjects.length === 0) {
      // Fallback: search by author
      if (seedBook.authors && seedBook.authors.length > 0) {
        return fetchBooksByAuthor(seedBook.authors[0], limit);
      }
      return [];
    }

    // Pick top 2 subjects to search Open Library
    const searchQuery = subjects.slice(0, 2).map((s: string) => `subject:${encodeURIComponent(s.toLowerCase())}`).join(" OR ");
    const response = await fetch(`https://openlibrary.org/search.json?q=${searchQuery}&limit=20`);
    
    if (!response.ok) throw new Error("Failed to fetch from Open Library");
    
    const data = await response.json();
    const docs = data.docs || [];

    // Filter out the seed book itself
    const filteredDocs = docs.filter((doc: any) => 
      doc.title?.toLowerCase() !== seedBook.title?.toLowerCase() &&
      doc.key !== seedBook.id
    );

    // Score documents based on subject overlap with seed book
    const scoredDocs = filteredDocs.map((doc: any) => {
      let score = 0;
      const docSubjects = doc.subject || [];
      
      // Calculate TF-IDF style subject overlap
      docSubjects.forEach((sub: string) => {
        if (subjects.some((s: string) => s.toLowerCase() === sub.toLowerCase())) {
          score += 2; // Direct match
        } else if (subjects.some((s: string) => sub.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(sub.toLowerCase()))) {
          score += 1; // Partial match
        }
      });

      // Boost if same author
      if (doc.author_name && seedBook.authors) {
        if (doc.author_name.some((a: string) => seedBook.authors!.includes(a))) {
          score += 3;
        }
      }

      return { doc, score };
    });

    // Sort by score descending and take top results
    scoredDocs.sort((a: any, b: any) => b.score - a.score);
    const topResults = scoredDocs.slice(0, limit).map((item: any) => item.doc);

    // Map OL docs back to our Book format
    return topResults.map((doc: any) => mapOpenLibraryDocToBook(doc));

  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}

async function fetchBooksByAuthor(author: string, limit: number): Promise<Book[]> {
  try {
    const response = await fetch(`https://openlibrary.org/search.json?author=${encodeURIComponent(author)}&limit=${limit + 1}`);
    const data = await response.json();
    const docs = (data.docs || []).slice(0, limit);
    return docs.map((doc: any) => mapOpenLibraryDocToBook(doc));
  } catch (e) {
    console.error("Failed to fetch author books", e);
    return [];
  }
}

function mapOpenLibraryDocToBook(doc: any): Book {
  const coverId = doc.cover_i;
  let coverImage = null;
  if (coverId) {
    // High-res Open Library cover image
    coverImage = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  }

  return {
    id: doc.key.replace("/works/", "ol-"),
    title: doc.title,
    authors: doc.author_name || ["Unknown Author"],
    coverImage: coverImage || undefined,
    description: doc.first_publish_year ? `First published in ${doc.first_publish_year}` : "No description available.",
    publishedDate: doc.first_publish_year?.toString(),
    categories: doc.subject?.slice(0, 5) || [],
    language: doc.language || ["en"],
    pageCount: doc.number_of_pages_median || 0,
    source: "openlibrary",
    downloadUrl: `https://openlibrary.org${doc.key}`,
    rating: doc.ratings_average ? Number(doc.ratings_average.toFixed(1)) : 0,
  };
}
