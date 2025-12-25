import { notFound } from 'next/navigation';
import YearReviewCard from '@/components/YearReviewCard';
import Link from 'next/link';
import { generateYearReviewData } from '@/lib/github';

async function fetchReviewData(username: string) {
  try {
    const data = await generateYearReviewData(username, 2024);
    return data;
  } catch (error: any) {
    console.error('Error fetching review data:', error);
    if (error.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
}

export default async function ReviewPage({
  params,
}: {
  params: { username: string };
}) {
  const data = await fetchReviewData(params.username);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-github-text-muted hover:text-github-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>
      <YearReviewCard data={data} username={params.username} />
    </main>
  );
}

