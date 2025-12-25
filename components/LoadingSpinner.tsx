'use client';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-github-border rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-github-green rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-github-text-muted">Generating your Year-in-Review...</p>
    </div>
  );
}

