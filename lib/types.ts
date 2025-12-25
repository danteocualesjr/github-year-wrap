export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  private: boolean;
  fork: boolean;
}

export interface LanguageStats {
  language: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface MonthlySummary {
  month: string;
  commits: number;
  repositoriesCreated: number;
}

export interface YearReviewData {
  user: GitHubUser;
  totalContributions: number;
  topLanguages: LanguageStats[];
  contributionGraph: ContributionDay[];
  monthlySummaries: MonthlySummary[];
  totalStars: number;
  totalRepositories: number;
  membershipDays: number;
}

