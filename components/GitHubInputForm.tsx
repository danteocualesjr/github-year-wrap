'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { extractGitHubUsername } from '@/lib/utils';

export default function GitHubInputForm() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const username = extractGitHubUsername(input);

    if (!username) {
      setError('Please enter a valid GitHub username or URL');
      setIsLoading(false);
      return;
    }

    router.push(`/review/${username}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
            placeholder="Enter GitHub username or URL (e.g., github.com/username)"
            className="flex-1 px-6 py-4 bg-github-gray border border-github-border rounded-lg text-github-text placeholder-github-text-muted focus:outline-none focus:ring-2 focus:ring-github-green focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-github-green hover:bg-[#2ea043] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? 'Generating...' : 'Generate Review'}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </form>
      <p className="text-github-text-muted text-sm mt-4 text-center">
        Enter your GitHub username or profile URL to generate your Year-in-Review
      </p>
    </div>
  );
}

