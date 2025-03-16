"use client"; // Added this at the very top

import Head from "next/head";
import { useRef } from "react";

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(formRef.current!);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    console.log("Form submitted:", data);
    alert("Thank you for contacting us! We will get back to you soon.");

    formRef.current?.reset(); // Reset the form after submission
  };

  return (
    <>
      <Head>
        <title>Contact Us - BookSurfer</title>
        <meta name="description" content="Get in touch with the BookSurfer team." />
      </Head>
      
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <p className="text-lg text-gray-600 mb-8">
          Have questions or feedback? Reach out to us using the form below.
        </p>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              name="message"
              required
              className="mt-1 block w-full border rounded-md p-2"
              rows={4}
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Send Message
          </button>
        </form>
      </main>
    </>
  );
}