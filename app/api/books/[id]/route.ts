import { NextRequest, NextResponse } from "next/server";
import { getBookById } from "@/lib/api/books";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: "Missing book ID" }, { status: 400 });
    }

    const book = await getBookById(params.id);
    
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    
    return NextResponse.json(book);
  } catch (error: any) {
    console.error(`API /books/${params.id} failed:`, error);
    return NextResponse.json({ error: "Failed to fetch book details" }, { status: 500 });
  }
}
