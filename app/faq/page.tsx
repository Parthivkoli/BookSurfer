import Link from "next/link";
import Head from "next/head";

export default function FAQ() {
  return (
    <>
      <Head>
        <title>FAQ - BookSurfer</title>
        <meta
          name="description"
          content="Frequently Asked Questions about BookSurfer, an open-source AI-powered book reading platform."
        />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

        <div className="space-y-8 text-gray-700">
          <div>
            <h2 className="text-xl font-semibold">1. What is BookSurfer?</h2>
            <p className="mt-2">
              <strong>BookSurfer</strong> is an open-source, AI-powered book reading platform
              designed for modern readers. It allows you to read books online, summarize content
              using AI, and explore curated recommendations—all in a clean, privacy-focused interface.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">2. Is BookSurfer free to use?</h2>
            <p className="mt-2">
              Yes! BookSurfer is completely free and open-source. You can read books, access AI features,
              and even contribute to the project on GitHub.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">3. What AI features does BookSurfer offer?</h2>
            <p className="mt-2">
              BookSurfer includes AI-powered summarization, smart recommendations based on reading patterns,
              and tools to extract key insights from chapters—perfect for quick understanding or revision.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">4. Where does BookSurfer get its book content?</h2>
            <p className="mt-2">
              BookSurfer sources open-access and public domain books through APIs and community contributions.
              We aim to build a rich, freely available library of content for all readers.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">5. How can I contribute to the project?</h2>
            <p className="mt-2">
              We welcome contributors! You can help by improving the code, fixing bugs, adding books,
              or suggesting features. Visit our{" "}
              <a
                href="https://github.com/Parthivkoli/BookSurfer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GitHub repository
              </a>{" "}
              to get started.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">6. Is my reading data private?</h2>
            <p className="mt-2">
              Yes. BookSurfer is built with privacy in mind. We do not collect or store personal data
              unless explicitly allowed by the user. All features can be used without creating an account.
            </p>
          </div>
        </div>

        <div className="mt-10 text-sm text-gray-500">
          <p>
            Still have questions? Reach out through our{" "}
            <a
              href="https://github.com/Parthivkoli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Discussions
            </a>{" "}
            page, or open an issue.
          </p>
        </div>
      </main>
    </>
  );
}
