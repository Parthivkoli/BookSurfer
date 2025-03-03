import Link from "next/link";
import Head from "next/head";

export default function FAQ() {
  return (
    <>
      <Head>
        <title>FAQ - BookSurfer</title>
        <meta name="description" content="Frequently Asked Questions about BookSurfer, an open-source book reading platform." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold">1. What is BookSurfer?</h2>
          <p className="text-gray-600 mt-2">
            BookSurfer is an <strong>open-source book reading platform</strong>.
          </p>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Still have questions? Reach out on our{" "}
            <a
              href="https://github.com/Parthivkoli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Discussions
            </a> page.</p>
        </div>
      </main>
    </>
  );
}