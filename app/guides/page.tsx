import Link from "next/link";
import Head from "next/head";

export default function Guide() {
  return (
    <>
      <Head>
        <title>Reading Guides - BookSurfer</title>
        <meta name="description" content="Explore reading guides to enhance your book experience with BookSurfer." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Reading Guides</h1>
        <p className="text-gray-600 mb-8">
          Welcome to BookSurfer's reading guides!
        </p>

        <div className="space-y-8">
          <div className="border p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-3">📖 Fiction Reading Guide</h2>
            <p className="text-gray-600">
              Fiction books transport us to different worlds.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}