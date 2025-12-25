import GitHubInputForm from '@/components/GitHubInputForm';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold text-github-text mb-4">
          GitHub Year in Review
        </h1>
        <p className="text-xl text-github-text-muted max-w-2xl mx-auto">
          Generate your beautiful GitHub Year-in-Review summary for 2025
        </p>
      </div>
      
      <GitHubInputForm />
    </main>
  );
}

