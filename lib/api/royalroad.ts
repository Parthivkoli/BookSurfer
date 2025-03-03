// lib/api/royalroad.ts
export async function searchRoyalRoad(genre: string, sortBy: string = "trending") {
    const url = `https://royalroad.com/api/search?genre=${encodeURIComponent(genre)}&sort=${sortBy}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.fictions.map((fiction: any) => ({
      id: fiction.id,
      title: fiction.title,
      chapters: fiction.chapters,
      genre: fiction.genre,
      source: "royalroad" as const,
    }));
  }