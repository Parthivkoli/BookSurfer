import { getFeaturedBooks } from "./lib/api/books";

async function test() {
  try {
    const books = await getFeaturedBooks(4);
    console.log("Books:", books);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();