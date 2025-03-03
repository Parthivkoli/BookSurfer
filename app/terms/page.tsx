import Link from "next/link";
import Head from "next/head";

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - BookSurfer</title>
        <meta name="description" content="Terms of Service for BookSurfer, an open-source book reading platform." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-gray-600 mb-6">
          Welcome to <strong>BookSurfer</strong>, an open-source platform for book lovers.
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Open-Source and License</h2>
          <p className="text-gray-600">
            BookSurfer is an <strong>open-source project</strong> licensed under the MIT License.
          </p>
        </section>

        <div className="mt-8 text-sm text-gray-500">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          <p>
            For any questions, feel free to contribute or raise issues on our{" "}
            <a
              href="https://github.com/Parthivkoli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub repository
            </a>.
          </p>
        </div>
      </main>
    </>
  );
}