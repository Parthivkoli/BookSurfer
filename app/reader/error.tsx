'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-900 to-orange-800 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-orange-300 mb-4">500</h1>
        <h2 className="text-2xl font-bold text-white mb-4">Server Error</h2>
        <p className="text-orange-100 mb-6">
          Something went wrong on our end. Our team has been notified.
        </p>
        <div className="bg-orange-700 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm text-orange-100 font-mono break-all">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
