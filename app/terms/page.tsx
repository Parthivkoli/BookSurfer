import Link from "next/link";
import Head from "next/head";

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - BookSurfer</title>
        <meta name="description" content="Terms of Service for BookSurfer, an open-source AI-powered book reading platform." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

        <p className="text-gray-600 mb-8">
          Welcome to <strong>BookSurfer</strong>, an open-source, AI-powered book reading platform. By accessing or using our platform, you agree to be bound by these Terms.
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Open-Source License</h2>
          <p className="text-gray-600">
            BookSurfer is released under the <strong>MIT License</strong>. You are free to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of the software, as long as the original copyright and license notice is included.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. No Warranty</h2>
          <p className="text-gray-600">
            The software is provided <strong>"as is"</strong>, without warranty of any kind. We are not liable for any damages arising from the use or inability to use this software.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. User Conduct</h2>
          <p className="text-gray-600">
            You agree to use BookSurfer in a lawful manner. Do not misuse the service to distribute harmful, illegal, or copyrighted material without appropriate rights.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Contributions</h2>
          <p className="text-gray-600">
            Contributions to BookSurfer (via pull requests or issues) are welcome and subject to the same MIT License. By contributing, you agree that your work may be modified or redistributed under that license.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Changes to These Terms</h2>
          <p className="text-gray-600">
            We may update these Terms of Service from time to time. Any changes will be posted here with an updated date.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. Contact</h2>
          <p className="text-gray-600">
            For questions or concerns, reach out via{" "}
            <a
              href="https://github.com/Parthivkoli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              our GitHub repository
            </a>
            .
          </p>
        </section>

        <div className="mt-8 text-sm text-gray-500">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        </div>
      </main>
    </>
  );
}
