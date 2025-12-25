'use client';

import Image from 'next/image';
import { YearReviewData } from '@/lib/types';
import { formatNumber, daysBetween } from '@/lib/utils';
import ContributionGraph from './ContributionGraph';
import LanguageList from './LanguageList';
import StatsGrid from './StatsGrid';
import DownloadButtons from './DownloadButtons';
import ShareButtons from './ShareButtons';
import { useRef } from 'react';

interface YearReviewCardProps {
  data: YearReviewData;
  username: string;
}

export default function YearReviewCard({ data, username }: YearReviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const membershipDays = daysBetween(new Date(data.user.created_at), new Date());
  const currentMonth = data.monthlySummaries[data.monthlySummaries.length - 1];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Main Card */}
      <div
        ref={cardRef}
        className="relative bg-github-gray border border-github-border rounded-xl p-8 md:p-12 shadow-2xl overflow-hidden"
      >
        {/* Subtle glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-github-green opacity-5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-2 text-github-text-muted">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm">github.com/{username}</span>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <Image
                src={data.user.avatar_url}
                alt={data.user.name || username}
                width={120}
                height={120}
                className="rounded-full border-2 border-github-border"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-github-text mb-2">
                {data.user.name || username}
              </h1>
              {data.user.bio && (
                <p className="text-github-text-muted mb-4">{data.user.bio}</p>
              )}
              {data.user.company && (
                <p className="text-github-text-muted">{data.user.company}</p>
              )}
              <div className="mt-4 text-2xl font-bold text-github-text">
                Member for <span className="text-github-green">{formatNumber(membershipDays)} Days</span>
              </div>
            </div>
          </div>

          {/* 2025 Contributions */}
          <div className="border-t border-github-border pt-6">
            <h2 className="text-xl text-github-text-muted mb-2">2025 Contributions</h2>
            <div className="text-5xl md:text-6xl font-bold text-github-green">
              {formatNumber(data.totalContributions)}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <LanguageList languages={data.topLanguages} />
              <StatsGrid
                repositories={data.totalRepositories}
                followers={data.user.followers}
                stars={data.totalStars}
                following={data.user.following}
              />
            </div>

            {/* Right Column */}
            <div>
              <ContributionGraph contributions={data.contributionGraph} />
              
              {/* Monthly Summary */}
              {currentMonth && (
                <div className="mt-6 p-4 bg-github-dark rounded-lg border border-github-border">
                  <h3 className="text-sm font-semibold text-github-text-muted mb-3">
                    {currentMonth.month} 2025
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-github-text">
                      <span>&lt;/&gt;</span>
                      <span>
                        <span className="font-bold">{formatNumber(currentMonth.commits)}</span> commits in{' '}
                        <span className="font-bold">{formatNumber(data.totalRepositories)}</span> repositories
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-github-text">
                      <span>[ ]</span>
                      <span>
                        <span className="font-bold">{formatNumber(currentMonth.repositoriesCreated)}</span> repositories created
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-github-border">
            <div className="flex items-center gap-2 text-github-text-muted">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm">2025 Year in Review</span>
            </div>
            <div className="flex items-center gap-4 text-github-text-muted">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.897l-7.334 3.259 1.4-8.168L.132 9.209l8.2-1.191z"/>
                </svg>
                <span className="text-sm">{formatNumber(data.totalStars)}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm">{formatNumber(data.totalRepositories)}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                <span className="text-sm">{formatNumber(data.user.followers)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <DownloadButtons cardRef={cardRef} username={username} />
        <ShareButtons data={data} username={username} />
      </div>
    </div>
  );
}

