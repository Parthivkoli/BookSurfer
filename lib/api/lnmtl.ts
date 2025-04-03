// lib/api/lnmtl.ts
import { load } from "cheerio";
import { Book } from "@/types/book";

interface LightNovelBase {
  id: string;
  title: string;
  chapters?: number;
  genre?: string;
  source: "lnmtl" | "royalroad";
  url?: string;
}

export type LightNovel = LightNovelBase & Partial<Book>;

// Shared fetch utility with retry logic (similar to books.ts)
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let attempts = 0;
  while (attempts < retries) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok && response.status >= 500 && attempts < retries - 1) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} for ${url}`);
      }
      return response;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("Failed to fetch") && attempts < retries - 1) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        continue;
      }
      console.error(`Failed to fetch ${url} after ${attempts + 1} attempts:`, error);
      throw error;
    }
  }
  throw new Error(`Max retries reached for ${url}`);
}

/**
 * Search LNMTL for light novels (scraped)
 * @param genre - Genre to filter by
 * @param sortBy - Sort criteria (e.g., "popular", "latest")
 * @returns Array of LightNovel objects
 */
export async function searchLNMTL(genre: string, sortBy: string = "popular"): Promise<LightNovelBase[]> {
  const url = `https://lnmtl.com/novel?orderBy=${sortBy}&genre=${encodeURIComponent(genre)}`;
  try {
    const response = await fetchWithRetry(url);
    const html = await response.text();
    const $ = load(html);
    const novels: LightNovelBase[] = [];

    $("div.novel-item").each((_, element) => {
      const $el = $(element);
      const id = $el.attr("data-id") || $el.find("a").attr("href")?.split("/").pop() || "";
      const title = $el.find(".novel-title").text().trim();
      const chapters = parseInt($el.find(".chapter-count").text().trim()) || 0;

      novels.push({
        id,
        title: title || "Unknown Title",
        chapters,
        genre,
        source: "lnmtl",
        url: `https://lnmtl.com/novel/${id}`,
      });
    });

    return novels;
  } catch (error) {
    console.error("LNMTL search failed:", error);
    return [];
  }
}

/**
 * Search Royal Road for light novels (API-based)
 * @param genre - Genre to filter by
 * @param sortBy - Sort criteria (e.g., "popular", "latest")
 * @returns Array of LightNovel objects
 */
export async function searchRoyalRoad(genre: string, sortBy: string = "popular"): Promise<LightNovelBase[]> {
  const sortMap: { [key: string]: string } = {
    popular: "popularity",
    latest: "latest-updates",
  };
  const sort = sortMap[sortBy] || "popularity";
  const url = `https://www.royalroad.com/fictions/search?tagsAdd=${encodeURIComponent(genre)}&sort=${sort}`;
  try {
    const response = await fetchWithRetry(url);
    const html = await response.text(); // Royal Road API isn't public; scraping instead
    const $ = load(html);
    const novels: LightNovelBase[] = [];

    $(".fiction-list-item").each((_, element) => {
      const $el = $(element);
      const title = $el.find(".fiction-title").text().trim();
      const id = $el.find("a").attr("href")?.split("/").pop() || "";
      const chaptersText = $el.find(".stats .chapters").text().trim();
      const chapters = chaptersText ? parseInt(chaptersText.replace(/\D/g, "")) : undefined;

      novels.push({
        id,
        title: title || "Unknown Title",
        chapters,
        genre,
        source: "royalroad",
        url: `https://www.royalroad.com/fiction/${id}`,
      });
    });

    return novels.filter((novel: LightNovelBase) => novel.id && novel.title !== "Unknown Title");
  } catch (error) {
    console.error("Royal Road search failed:", error);
    return [];
  }
}

/**
 * Search across all light novel sources
 * @param genre - Genre to filter by
 * @param sortBy - Sort criteria (e.g., "popular", "latest")
 * @param sources - Optional array of sources to search
 * @returns Array of LightNovel objects
 */
export async function searchLightNovels(
  genre: string,
  sortBy: string = "popular",
  sources: ("lnmtl" | "royalroad")[] = ["lnmtl", "royalroad"]
): Promise<LightNovel[]> {
  const searchFunctions: { [key: string]: (g: string, s: string) => Promise<LightNovelBase[]> } = {
    lnmtl: searchLNMTL,
    royalroad: searchRoyalRoad,
  };

  try {
    const promises = sources.map(source => searchFunctions[source](genre, sortBy));
    const results = await Promise.allSettled(promises);

    let allNovels: LightNovel[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allNovels = [...allNovels, ...result.value.map(novel => ({ ...novel, source: sources[index] as "lnmtl" | "royalroad" } as LightNovel))];
      } else {
        console.warn(`Search failed for source ${sources[index]}:`, result.reason);
      }
    });

    // Sort by title or chapters if available
    allNovels.sort((a, b) => {
      if (sortBy === "popular" && a.chapters && b.chapters) {
        return (b.chapters || 0) - (a.chapters || 0);
      }
      return a.title.localeCompare(b.title);
    });

    return allNovels;
  } catch (error) {
    console.error("Multi-source light novel search failed:", error);
    return [];
  }
}

// Example usage:
// async function test() {
//   const novels = await searchLightNovels("fantasy", "popular");
//   console.log(novels);
// }
// test();