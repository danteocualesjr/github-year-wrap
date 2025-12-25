'use client';

import { ContributionDay } from '@/lib/types';

interface ContributionGraphProps {
  contributions: ContributionDay[];
}

const CONTRIBUTION_COLORS = [
  '#161b22', // level 0 - no contributions
  '#0e4429', // level 1 - 1-3 contributions
  '#006d32', // level 2 - 4-7 contributions
  '#26a641', // level 3 - 8-15 contributions
  '#39d353', // level 4 - 16+ contributions
];

export default function ContributionGraph({ contributions }: ContributionGraphProps) {
  // Group contributions by week (7 days)
  const weeks: ContributionDay[][] = [];
  let currentWeek: ContributionDay[] = [];

  contributions.forEach((day, index) => {
    currentWeek.push(day);
    
    // Start a new week every 7 days or at the end
    if (currentWeek.length === 7 || index === contributions.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-github-text">Contribution Activity</h3>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${day.date}-${dayIndex}`}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: CONTRIBUTION_COLORS[day.level],
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                title={`${day.date}: ${day.count} contributions`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-github-text-muted">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {CONTRIBUTION_COLORS.map((color, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

