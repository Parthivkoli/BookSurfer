'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-rose-900 to-rose-800 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-rose-300 mb-4">Error!</h1>
        <h2 className="text-2xl font-bold text-white mb-4">Library Error</h2>
        <p className="text-rose-100 mb-6">
          There was a problem loading your library. Please try again.
        </p>
        <div className="bg-rose-700 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm text-rose-100 font-mono break-all">
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
