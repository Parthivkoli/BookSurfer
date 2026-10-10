import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/api/books";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const subject = searchParams.get("subject") ?? undefined;
  const languages = searchParams.getAll("language");
  const sourceParam = searchParams.get("sources") ?? "openlibrary,gutenberg,google";

  const validSources = ["openlibrary", "gutenberg", "google", "internetarchive", "librivox", "feedbooks"] as const;
  const sources = sourceParam
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is (typeof validSources)[number] => validSources.includes(value as (typeof validSources)[number]));

  try {
    const result = await searchBooks({
      query,
      page,
      limit,
      subject: subject || undefined,
      languages: languages.length ? languages : undefined,
      sources: sources.length ? sources : ["openlibrary", "gutenberg", "google"],
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Book discovery API failed:", error);
    return NextResponse.json(
      { books: [], totalItems: 0, page, limit, totalPages: 1 },
      { status: 500 }
    );
  }
}
