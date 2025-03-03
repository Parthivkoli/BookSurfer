// lib/api/webnovel.ts
import cheerio from "cheerio";

export async function scrapeWebnovel(genre: string) {
  const url = `https://www.webnovel.com/category/${encodeURIComponent(genre)}`;
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  const novels = $(".novel-list .novel-item")
    .map((i, el) => ({
      id: $(el).attr("data-id") || "",
      title: $(el).find(".novel-title").text(),
      genre: genre,
      source: "webnovel" as const,
    }))
    .get();
  return novels;
}