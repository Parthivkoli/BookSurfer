import Link from "next/link";
import Head from "next/head";

export default function Contribute() {
  return (
    <>
      <Head>
        <title>Contribute to BookSurfer</title>
        <meta name="description" content="Learn how to contribute to BookSurfer, the open-source AI-powered book reading platform." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Contribute to BookSurfer</h1>

        <p className="text-gray-600 mb-6">
          BookSurfer is an open-source, AI-powered book reading platform. Whether you're a developer, designer, or book enthusiast — we welcome your contributions!
        </p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Ways You Can Help</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>🧠 Improve features or suggest new ones.</li>
            <li>🐛 Report or fix bugs via GitHub Issues or PRs.</li>
            <li>📖 Help us curate open-access book content.</li>
            <li>🌐 Enhance UI/UX or accessibility features.</li>
            <li>📝 Improve documentation or translate the UI.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Getting Started</h2>
          <p className="text-gray-600 mb-2">
            Head over to our GitHub repository to start contributing:
          </p>
          <a
            href="https://github.com/Parthivkoli/BookSurfer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            github.com/Parthivkoli/BookSurfer
          </a>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Code of Conduct</h2>
          <p className="text-gray-600">
            Please treat everyone with respect. We follow an open and inclusive contributor culture. Harassment or toxic behavior will not be tolerated.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Submit a Pull Request</h2>
          <p className="text-gray-600 mb-2">
            Make sure to fork the repository and work on a separate branch. Before submitting a pull request:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Ensure your code follows the project’s structure.</li>
            <li>Test your changes locally.</li>
            <li>Link the related issue, if applicable.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Join the Discussion</h2>
          <p className="text-gray-600">
            If you're unsure where to begin, check out the{" "}
            <a
              href="https://github.com/Parthivkoli/BookSurfer/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Discussions
            </a>{" "}
            to ask questions, share feedback, or suggest ideas.
          </p>
        </section>

        <div className="mt-8 text-sm text-gray-500">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        </div>
      </main>
    </>
  );
}
