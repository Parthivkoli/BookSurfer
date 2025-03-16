import { getBookById, getBookContent } from "@/lib/api/books";
import ReaderClient from "./ReaderClient";
import { Book } from "@/types/book";

// Define the props type to match Next.js's expectation
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReaderPage({ params }: PageProps) {
  // Await the params Promise to get the resolved { id: string }
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

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

  return (
    <div className="min-h-screen flex flex-col">
      {book ? (
        <ReaderClient initialBook={book} initialContent={content || ""} bookId={bookId} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Book not found or content unavailable.</p>
        </div>
      )}
    </div>
  );
}