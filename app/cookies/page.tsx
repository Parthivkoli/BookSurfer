import Link from "next/link";
import Head from "next/head";

export default function CookiesPolicy() {
  return (
    <>
      <Head>
        <title>Cookie Policy - BookSurfer</title>
        <meta name="description" content="Learn how BookSurfer uses cookies to enhance user experience while respecting privacy." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
        <p className="text-gray-600">
          This Cookie Policy explains how BookSurfer uses cookies to improve user experience while maintaining privacy.
        </p>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">1. What are Cookies?</h2>
          <p className="text-gray-600 mt-2">
            Cookies are small text files stored on your device when you visit a website.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">2. How Does BookSurfer Use Cookies?</h2>
          <p className="text-gray-600 mt-2">
            BookSurfer uses cookies for essential functionality and analytics.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">3. Managing Cookies</h2>
          <p className="text-gray-600 mt-2">
            You can manage or disable cookies through your browser settings.
          </p>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>For any questions, reach out via our{" "}
            <a
              href="https://github.com/Parthivkoli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Discussions
            </a>.</p>
        </div>
      </main>
    </>
  );
}