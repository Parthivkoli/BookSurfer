import { NextRequest, NextResponse } from "next/server";
import { getTrendingBooks } from "@/lib/api/books";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "8");
    const category = searchParams.get("category") || undefined;

    const books = await getTrendingBooks(limit, category);
    
    return NextResponse.json({ books });
  } catch (error: any) {
    console.error("API /books/trending failed:", error);
    return NextResponse.json({ books: [] }, { status: 500 });
  }
}
