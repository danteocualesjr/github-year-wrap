import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-github-text">User Not Found</h1>
        <p className="text-github-text-muted text-lg">
          The GitHub user you're looking for doesn't exist or couldn't be found.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-github-green hover:bg-[#2ea043] text-white font-semibold rounded-lg transition-colors"
        >
          Try Another Username
        </Link>
      </div>
    </main>
  );
}

