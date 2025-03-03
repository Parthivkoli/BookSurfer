import Link from "next/link";
import Head from "next/head";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - BookSurfer</title>
        <meta name="description" content="Privacy Policy for BookSurfer, an open-source book reading platform." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-6">
          At <strong>BookSurfer</strong>, we value your privacy.
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
          <p className="text-gray-600">
            BookSurfer does not collect personal data by default.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. How We Use Your Data</h2>
          <p className="text-gray-600">
            If we do collect any data, it will be used for improving the platform.
          </p>
        </section>

        <div className="mt-8 text-sm text-gray-500">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          <p>
            For any privacy concerns, please open an issue on our{" "}
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