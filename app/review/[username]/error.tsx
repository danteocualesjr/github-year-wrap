'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isRateLimit = error.message?.includes('rate limit');
  const resetTimeMatch = error.message?.match(/Resets at: ([^.]*)/);
  const resetTime = resetTimeMatch ? resetTimeMatch[1] : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-4xl font-bold text-github-text">
          {isRateLimit ? 'Rate Limit Exceeded' : 'Something Went Wrong'}
        </h1>
        
        <div className="bg-github-gray border border-github-border rounded-lg p-6 text-left">
          <p className="text-github-text-muted mb-4">
            {isRateLimit ? (
              <>
                GitHub's API has rate limits for unauthenticated requests (60 requests/hour).
                {resetTime && (
                  <span className="block mt-2 text-github-green">
                    Rate limit resets at: {resetTime}
                  </span>
                )}
              </>
            ) : (
              error.message || 'An unexpected error occurred'
            )}
          </p>
          
          {isRateLimit && (
            <div className="mt-4 p-4 bg-github-dark rounded border border-github-border">
              <p className="text-sm text-github-text-muted mb-2">
                <strong>Options:</strong>
              </p>
              <ul className="text-sm text-github-text-muted space-y-1 list-disc list-inside">
                <li>Wait for the rate limit to reset (usually 1 hour)</li>
                <li>Use a GitHub Personal Access Token for higher limits (5,000 requests/hour)</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-github-green hover:bg-[#2ea043] text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-github-gray hover:bg-[#1f2329] border border-github-border text-github-text font-semibold rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

