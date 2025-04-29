import Head from "next/head";
import Link from "next/link";

export default function Blog() {
  return (
    <>
      <Head>
        <title>BookSurfer Blog</title>
        <meta name="description" content="Updates and posts from BookSurfer." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">📖 Read Our Launch Blog</h1>
        <p className="text-gray-600 mb-6">
          Learn how BookSurfer is revolutionizing open-source book reading using AI.
        </p>

        <a
          href="https://medium.com/@ParthivKoli/introducing-booksurfer-the-ai-powered-open-source-book-reading-platform-youve-been-waiting-for-44c2ab9bb106"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          🚀 Read Full Article on Medium
        </a>
      </main>
    </>
  );
}
