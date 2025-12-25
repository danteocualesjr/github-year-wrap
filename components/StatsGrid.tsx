'use client';

import { formatNumber } from '@/lib/utils';

interface StatsGridProps {
  repositories: number;
  followers: number;
  stars: number;
  following: number;
}

export default function StatsGrid({
  repositories,
  followers,
  stars,
  following,
}: StatsGridProps) {
  const stats = [
    { label: 'Repositories', value: repositories },
    { label: 'Followers', value: followers },
    { label: 'Stars Earned', value: stars },
    { label: 'Following', value: following },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="space-y-1">
          <div className="text-2xl font-bold text-github-text">
            {formatNumber(stat.value)}
          </div>
          <div className="text-sm text-github-text-muted">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

