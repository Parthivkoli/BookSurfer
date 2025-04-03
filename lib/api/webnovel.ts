// lib/api/webnovel.ts
import { load } from "cheerio";
import { Book } from "@/types/book";

export async function scrapeWebnovel(genre: string): Promise<Book[]> {
  const url = `https://www.webnovel.com/category/${encodeURIComponent(genre)}`;
  const response = await fetch(url);
  const html = await response.text();
  const $ = load(html);
  const novels = $(".novel-list .novel-item")
    .map((i, el) => ({
      id: $(el).attr("data-id") || "",
      title: $(el).find(".novel-title").text(),
      authors: [$(el).find(".novel-author").text() || "Unknown Author"],
      genre: genre,
      source: "webnovel" as const,
      description: $(el).find(".novel-description").text(),
      coverImage: $(el).find(".novel-cover img").attr("src"),
    }))
    .get();
  return novels;
}