"use client";

import Head from "next/head";
import { useRef, useState } from "react";
import { contactFormSchema, type ContactFormData } from "@/lib/validations/contact";
import { sanitizeHtml } from "@/lib/sanitize";

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const formData = new FormData(formRef.current!);
      const data = {
        name: (formData.get("name") as string).trim(),
        email: (formData.get("email") as string).trim(),
        message: (formData.get("message") as string).trim(),
      };

      // Validate with Zod
      const result = contactFormSchema.safeParse(data);
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path[0];
          if (path) fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
        setSubmitStatus('error');
        return;
      }

      // Sanitize the data
      const sanitizedData: ContactFormData = {
        name: sanitizeHtml(result.data.name),
        email: sanitizeHtml(result.data.email),
        message: sanitizeHtml(result.data.message),
      };

      console.log("Form submitted:", sanitizedData);
      
      // Here you would make an API call to send the email
      // await fetch('/api/contact', { method: 'POST', body: JSON.stringify(sanitizedData) })
      
      setSubmitStatus('success');
      formRef.current?.reset();
      
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldClass = (fieldName: keyof typeof errors) => {
    const baseClass = "mt-1 block w-full border rounded-md p-2";
    return errors[fieldName] 
      ? `${baseClass} border-red-500 bg-red-50` 
      : baseClass;
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

        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">
              ✓ Thank you for contacting us! We'll get back to you soon.
            </p>
          </div>
        )}

        {submitStatus === 'error' && Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium mb-2">Please fix the following errors:</p>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {Object.values(errors).map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name {errors.name && <span className="text-red-500">*</span>}
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Your name"
              disabled={isSubmitting}
              className={getFieldClass("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email {errors.email && <span className="text-red-500">*</span>}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your.email@example.com"
              disabled={isSubmitting}
              className={getFieldClass("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message {errors.message && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Your message here..."
              disabled={isSubmitting}
              className={getFieldClass("message")}
              rows={4}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {errors.message && (
              <p id="message-error" className="text-sm text-red-600 mt-1">
                {errors.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </main>
    </>
  );
}