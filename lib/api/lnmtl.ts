// lib/api/lnmtl.ts
export async function searchLNMTL(genre: string, sortBy: string = "popular") {
    const url = `https://lnmtl.com/novels?genre=${encodeURIComponent(genre)}&sort=${sortBy}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.novels.map((novel: any) => ({
      id: novel.id,
      title: novel.title,
      chapters: novel.chapters,
      genre: novel.genre,
      source: "lnmtl" as const,
    }));
  }