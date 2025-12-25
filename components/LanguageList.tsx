'use client';

import { LanguageStats } from '@/lib/types';

interface LanguageListProps {
  languages: LanguageStats[];
}

export default function LanguageList({ languages }: LanguageListProps) {
  const topLanguages = languages.slice(0, 3);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-github-text">Top Languages</h3>
      <div className="space-y-2">
        {topLanguages.map((lang, index) => (
          <div key={lang.language} className="flex items-center gap-3">
            <span className="text-github-text-muted font-medium">
              {index + 1}.
            </span>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: lang.color }}
            />
            <span className="text-github-text">{lang.language}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

