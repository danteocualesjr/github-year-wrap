import { GitHubUser, GitHubRepository, LanguageStats, ContributionDay, MonthlySummary, YearReviewData } from './types';
import { daysBetween, getLanguageColor } from './utils';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Fetches user profile data from GitHub API
 */
export async function fetchUserProfile(username: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_BASE}/users/${username}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    if (response.status === 403) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches all repositories for a user (with pagination)
 */
export async function fetchUserRepositories(username: string): Promise<GitHubRepository[]> {
  const repos: GitHubRepository[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      throw new Error(`Failed to fetch repositories: ${response.statusText}`);
    }

    const pageRepos: GitHubRepository[] = await response.json();
    
    if (pageRepos.length === 0) {
      break;
    }

    repos.push(...pageRepos);

    // If we got fewer than perPage, we're done
    if (pageRepos.length < perPage) {
      break;
    }

    page++;
  }

  return repos;
}

/**
 * Fetches contribution data using GitHub GraphQL API
 * This provides accurate contribution counts and activity
 */
async function fetchContributionsGraphQL(username: string, year: number = 2024): Promise<{ total: number; days: ContributionDay[] }> {
  const startDate = `${year}-01-01T00:00:00Z`;
  const endDate = `${year}-12-31T23:59:59Z`;
  
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        query,
        variables: {
          username,
          from: startDate,
          to: endDate,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL error');
    }

    const contributionsCollection = data.data?.user?.contributionsCollection;
    if (!contributionsCollection) {
      throw new Error('User not found or no contributions data');
    }

    const total = contributionsCollection.totalCommitContributions +
                  contributionsCollection.totalIssueContributions +
                  contributionsCollection.totalPullRequestContributions +
                  contributionsCollection.totalPullRequestReviewContributions;

    // Build contribution days array from calendar
    const days: ContributionDay[] = [];
    const weeks = contributionsCollection.contributionCalendar?.weeks || [];
    
    weeks.forEach((week: any) => {
      week.contributionDays.forEach((day: any) => {
        const count = day.contributionCount || 0;
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        
        if (count > 0) {
          if (count <= 3) level = 1;
          else if (count <= 7) level = 2;
          else if (count <= 15) level = 3;
          else level = 4;
        }
        
        days.push({
          date: day.date,
          count,
          level,
        });
      });
    });

    return { total, days };
  } catch (error) {
    console.error('Error fetching contributions via GraphQL:', error);
    throw error;
  }
}

/**
 * Fetches commits from repositories to calculate contributions
 * This is a fallback method when GraphQL is not available
 */
async function fetchCommitsFromRepos(username: string, repos: GitHubRepository[], year: number = 2024): Promise<{ total: number; days: ContributionDay[] }> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  
  // Initialize contribution map for all days
  const contributionMap = new Map<string, number>();
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    contributionMap.set(dateKey, 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fetch commits from repositories (limit to most active repos to avoid rate limits)
  const activeRepos = repos
    .filter(repo => !repo.fork && !repo.private)
    .sort((a, b) => {
      const aDate = new Date(a.pushed_at);
      const bDate = new Date(b.pushed_at);
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 50); // Limit to top 50 most active repos

  let totalCommits = 0;

  for (const repo of activeRepos) {
    try {
      const since = startDate.toISOString();
      const until = endDate.toISOString();
      
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${repo.full_name}/commits?author=${username}&since=${since}&until=${until}&per_page=100`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const commits = await response.json();
        totalCommits += commits.length;

        commits.forEach((commit: any) => {
          if (commit.commit?.author?.date) {
            const commitDate = new Date(commit.commit.author.date);
            if (commitDate >= startDate && commitDate <= endDate) {
              const dateKey = commitDate.toISOString().split('T')[0];
              const current = contributionMap.get(dateKey) || 0;
              contributionMap.set(dateKey, current + 1);
            }
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching commits from ${repo.full_name}:`, error);
      // Continue with other repos
    }
  }

  // Convert to ContributionDay array
  const days: ContributionDay[] = [];
  const maxCount = Math.max(...Array.from(contributionMap.values()), 1);

  contributionMap.forEach((count, date) => {
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      const ratio = count / maxCount;
      if (ratio < 0.25) level = 1;
      else if (ratio < 0.5) level = 2;
      else if (ratio < 0.75) level = 3;
      else level = 4;
    }
    
    days.push({
      date,
      count,
      level,
    });
  });

  return { total: totalCommits, days: days.sort((a, b) => a.date.localeCompare(b.date)) };
}

/**
 * Fetches contribution events for a user
 * Tries GraphQL first, falls back to fetching commits from repos
 */
export async function fetchContributionEvents(username: string, repos: GitHubRepository[], year: number = 2024): Promise<ContributionDay[]> {
  try {
    // Try GraphQL API first (more accurate but may require auth for higher limits)
    const graphqlResult = await fetchContributionsGraphQL(username, year);
    return graphqlResult.days;
  } catch (error) {
    console.log('GraphQL failed, falling back to commits API:', error);
    // Fallback to fetching commits from repositories
    try {
      const commitsResult = await fetchCommitsFromRepos(username, repos, year);
      return commitsResult.days;
    } catch (fallbackError) {
      console.error('Both methods failed:', fallbackError);
      // Return empty contributions as last resort
      const days: ContributionDay[] = [];
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        days.push({
          date: currentDate.toISOString().split('T')[0],
          count: 0,
          level: 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return days;
    }
  }
}

/**
 * Calculates top languages from repositories
 */
export function calculateTopLanguages(repos: GitHubRepository[]): LanguageStats[] {
  const languageCounts = new Map<string, number>();

  repos.forEach((repo) => {
    if (repo.language && !repo.fork) {
      const count = languageCounts.get(repo.language) || 0;
      languageCounts.set(repo.language, count + 1);
    }
  });

  const total = repos.filter((r) => !r.fork).length;
  const languages: LanguageStats[] = Array.from(languageCounts.entries())
    .map(([language, count]) => ({
      language,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      color: getLanguageColor(language),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return languages;
}

/**
 * Calculates monthly summaries from contribution graph data
 */
export function calculateMonthlySummaries(
  repos: GitHubRepository[],
  year: number = 2024,
  contributionGraph: ContributionDay[] = []
): MonthlySummary[] {
  const monthlyData = new Map<string, { commits: number; reposCreated: number }>();

  // Initialize all months
  for (let month = 0; month < 12; month++) {
    const monthKey = new Date(year, month, 1).toLocaleString('default', { month: 'long' }).toUpperCase();
    monthlyData.set(monthKey, { commits: 0, reposCreated: 0 });
  }

  // Count commits per month from contribution graph
  contributionGraph.forEach((day) => {
    const date = new Date(day.date);
    if (date.getFullYear() === year) {
      const monthKey = date.toLocaleString('default', { month: 'long' }).toUpperCase();
      const data = monthlyData.get(monthKey);
      if (data) {
        data.commits += day.count;
        monthlyData.set(monthKey, data);
      }
    }
  });

  // Count repositories created per month
  repos.forEach((repo) => {
    const createdDate = new Date(repo.created_at);
    if (createdDate.getFullYear() === year) {
      const monthKey = createdDate.toLocaleString('default', { month: 'long' }).toUpperCase();
      const data = monthlyData.get(monthKey);
      if (data) {
        data.reposCreated++;
        monthlyData.set(monthKey, data);
      }
    }
  });

  const summaries: MonthlySummary[] = Array.from(monthlyData.entries()).map(
    ([month, data]) => ({
      month,
      commits: data.commits,
      repositoriesCreated: data.reposCreated,
    })
  );

  return summaries;
}

/**
 * Aggregates all data into YearReviewData
 */
export async function generateYearReviewData(
  username: string,
  year: number = 2024
): Promise<YearReviewData> {
  const [user, repos] = await Promise.all([
    fetchUserProfile(username),
    fetchUserRepositories(username),
  ]);

  const topLanguages = calculateTopLanguages(repos);
  const contributionGraph = await fetchContributionEvents(username, repos, year);
  
  // Try to get accurate total from GraphQL, otherwise sum from graph
  let totalContributions = 0;
  try {
    const graphqlResult = await fetchContributionsGraphQL(username, year);
    totalContributions = graphqlResult.total;
  } catch (error) {
    // Fallback: sum from contribution graph
    totalContributions = contributionGraph.reduce((sum, day) => sum + day.count, 0);
  }

  const monthlySummaries = calculateMonthlySummaries(repos, year, contributionGraph);

  // Calculate total stars
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

  // Calculate membership days
  const createdDate = new Date(user.created_at);
  const membershipDays = daysBetween(createdDate, new Date());

  return {
    user,
    totalContributions,
    topLanguages,
    contributionGraph,
    monthlySummaries,
    totalStars,
    totalRepositories: user.public_repos,
    membershipDays,
  };
}

