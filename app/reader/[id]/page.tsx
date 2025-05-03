import { getBookById, getBookContent } from "@/lib/api/books";
import ReaderClient from "./ReaderClient";
import { Book } from "@/types/book";
import { notFound } from "next/navigation";

// Define the props type to match Next.js's expectation
interface PageProps {
  params: { id: string };
}

export default async function ReaderPage({ params }: PageProps) {
  const bookId = params.id;

  // Fetch initial data for the book
  async function fetchInitialData(): Promise<{ book: Book | null; content: string | null }> {
    try {
      // Fetch book metadata
      const book = await getBookById(bookId);
      if (!book) {
        return { book: null, content: null };
      }

      // Fetch book content
      const content = await getBookContent(bookId);
      return { book, content: content || "No content available for this book." };
    } catch (error) {
      console.error(`Error fetching book data for ID: ${bookId}`, error);
      return { book: null, content: null };
    }
  }

  const { book, content } = await fetchInitialData();

  // If book is not found, show 404 page
  if (!book) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ReaderClient 
        initialBook={book} 
        initialContent={content || ""} 
        bookId={bookId} 
      />
    </div>
  );
}