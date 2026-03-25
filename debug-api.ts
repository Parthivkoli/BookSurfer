import { searchOpenLibrary, searchGutenberg, searchGoogleBooks } from "./lib/api/books";

async function debug() {
  const params = { query: "science", page: 1, limit: 10 };
  
  console.log("Testing Open Library...");
  const ol = await searchOpenLibrary(params);
  console.log(`Open Library: ${ol.totalItems} books`);
  ol.books.slice(0, 2).forEach(b => console.log(` - ${b.title} (${b.source})`));

  console.log("\nTesting Gutenberg...");
  const gt = await searchGutenberg(params);
  console.log(`Gutenberg: ${gt.totalItems} books`);
  gt.books.slice(0, 2).forEach(b => console.log(` - ${b.title} (${b.source})`));

  console.log("\nTesting Google Books...");
  const gb = await searchGoogleBooks(params);
  console.log(`Google Books: ${gb.totalItems} books`);
  gb.books.slice(0, 2).forEach(b => console.log(` - ${b.title} (${b.source})`));
}

debug().catch(console.error);
