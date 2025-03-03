import { getBookById, getBookContent } from "@/lib/api/books";
import ReaderClient from "./ReaderClient";
import { Metadata } from "next";

// Fetch initial data with error handling
async function fetchInitialData(bookId: string) {
  try {
    const book = await getBookById(bookId);
    if (!book || !book.downloadUrl) {
      console.warn(`Book not found or missing download URL for ID: ${bookId}`);
      return { book: null, content: "" };
    }
    const bookContent = await getBookContent(bookId);
    return { book, content: bookContent || "No content available." };
  } catch (error) {
    console.error(`Error fetching book data for ID: ${bookId}`, error);
    return { book: null, content: "" };
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  const book = await getBookById(id);
  if (!book) {
    return {
      title: "Book Not Found - BookSurfer",
      description: "The requested book could not be found.",
    };
  }
  return {
    title: `${book.title} - BookSurfer`,
    description: book.description || `Read "${book.title}" on BookSurfer, the free online reading platform.`,
  };
}

// Server Component to render the page
export default async function ReaderPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { book, content } = await fetchInitialData(id);

  return <ReaderClient initialBook={book} initialContent={content} bookId={id} />;
}