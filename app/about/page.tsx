import Link from "next/link";
import Head from "next/head";

export default function About() {
  return (
    <>
      <Head>
        <title>About Us - BookSurfer</title>
        <meta name="description" content="Learn more about BookSurfer and our mission to provide the best reading experience." />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">About Us</h1>
        <p className="text-lg text-gray-600">
          Welcome to <strong>BookSurfer</strong>, your go-to platform for discovering, reading, and sharing books.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Our Vision</h2>
          <p className="text-gray-600 mt-2">
            At BookSurfer, we aim to create a seamless and engaging reading experience.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Meet Our Team</h2>
          <p className="text-gray-600 mt-2">
            Our passionate team of developers, designers, and book enthusiasts work together to bring you the best platform for book lovers.
          </p>
        </section>
      </main>
    </>
  );
}