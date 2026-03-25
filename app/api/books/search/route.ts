import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/api/books";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const subject = searchParams.get("subject") || undefined;
    const sort = searchParams.get("sort") as "relevance" | "rating" | "date" | undefined;
    const sourcesParam = searchParams.get("sources");
    const sources = sourcesParam 
      ? sourcesParam.split(",") as ("openlibrary" | "gutenberg" | "google")[]
      : undefined;

    const result = await searchBooks({ query, page, limit, subject, sort, sources });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /books/search failed:", error);
    return NextResponse.json({ books: [], totalItems: 0 }, { status: 500 });
  }
}
