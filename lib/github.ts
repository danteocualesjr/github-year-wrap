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
    if (response.status === 403 || response.status === 429) {
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'soon';
      throw new Error(`GitHub API rate limit exceeded. Remaining: ${rateLimitRemaining || 0}. Resets at: ${resetTime}. Please try again later or use a GitHub token for higher limits.`);
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
      if (response.status === 403 || response.status === 429) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        const rateLimitReset = response.headers.get('x-ratelimit-reset');
        const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'soon';
        throw new Error(`GitHub API rate limit exceeded. Remaining: ${rateLimitRemaining || 0}. Resets at: ${resetTime}. Please try again later or use a GitHub token for higher limits.`);
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
async function fetchContributionsGraphQL(username: string, year: number = 2025): Promise<{ total: number; days: ContributionDay[] }> {
  const startDate = `${year}-01-01T00:00:00Z`;
  // Use today's date if querying current year, otherwise use end of year
  const isCurrentYear = year === new Date().getFullYear();
  const endDate = isCurrentYear 
    ? new Date().toISOString()
    : `${year}-12-31T23:59:59Z`;
  
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
    // Try to use GitHub token if available (for authenticated requests)
    const githubToken = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v4+json',
    };
    
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
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
      const errorText = await response.text();
      if (response.status === 403 || response.status === 429) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        const rateLimitReset = response.headers.get('x-ratelimit-reset');
        const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'soon';
        throw new Error(`GitHub API rate limit exceeded. Remaining: ${rateLimitRemaining || 0}. Resets at: ${resetTime}. Please try again later or use a GitHub token for higher limits.`);
      }
      throw new Error(`GraphQL request failed: ${response.statusText} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      const errorMessage = data.errors[0]?.message || 'GraphQL error';
      console.error('GraphQL API errors:', data.errors);
      // Check if it's a rate limit error
      if (errorMessage.includes('rate limit') || errorMessage.includes('API rate limit')) {
        throw new Error(`GitHub API rate limit exceeded. ${errorMessage}. Please try again later or use a GitHub token for higher limits.`);
      }
      // Check if it's an authentication error (GraphQL requires auth for contribution data)
      if (errorMessage.includes('requires authentication') || errorMessage.includes('Bad credentials')) {
        console.log('GraphQL requires authentication, will fall back to commits API');
        throw new Error('GraphQL requires authentication');
      }
      throw new Error(errorMessage);
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
  } catch (error: any) {
    console.error('Error fetching contributions via GraphQL:', error);
    throw error;
  }
}

/**
 * Fetches commits from repositories to calculate contributions
 * This is a fallback method when GraphQL is not available
 */
async function fetchCommitsFromRepos(username: string, repos: GitHubRepository[], year: number = 2025): Promise<{ total: number; days: ContributionDay[] }> {
  const startDate = new Date(year, 0, 1);
  // Use today's date if querying current year, otherwise use end of year
  const isCurrentYear = year === new Date().getFullYear();
  const endDate = isCurrentYear 
    ? new Date() 
    : new Date(year, 11, 31, 23, 59, 59);
  
  // Initialize contribution map for all days from start to end
  const contributionMap = new Map<string, number>();
  const currentDate = new Date(startDate);
  const finalEndDate = new Date(endDate);
  while (currentDate <= finalEndDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    contributionMap.set(dateKey, 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`Initialized contribution map for ${contributionMap.size} days (${startDate.toISOString().split('T')[0]} to ${finalEndDate.toISOString().split('T')[0]})`);

  // Fetch commits from repositories (limit to most active repos to avoid rate limits)
  // Include forks since users can contribute to their own forks
  // Note: We can only access public repos without authentication
  // Limit to top 20 repos to balance completeness vs rate limits (60 requests/hour unauthenticated)
  // Each repo might need multiple pages, so we need to be conservative
  const activeRepos = repos
    .filter(repo => !repo.private) // Only public repos (can't access private without auth)
    .sort((a, b) => {
      const aDate = new Date(a.pushed_at);
      const bDate = new Date(b.pushed_at);
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 20); // Increased to 20 repos for better coverage

  let totalCommits = 0;

  console.log(`Processing ${activeRepos.length} repositories for commits from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...`);
  
  for (const repo of activeRepos) {
    const repoOwner = repo.full_name.split('/')[0]?.toLowerCase();
    const isUserRepo = repoOwner === username.toLowerCase();
    console.log(`Checking repo: ${repo.full_name} (user-owned: ${isUserRepo})`);
    try {
      const since = startDate.toISOString();
      const until = endDate.toISOString();
      let page = 1;
      const perPage = 100;
      let hasMoreCommits = true;
      let repoCommits = 0;

      // Fetch all commits with pagination
      // Note: We fetch all commits and filter by author client-side because
      // the author parameter might not match all commits (e.g., different email formats)
      while (hasMoreCommits) {
        const url = `${GITHUB_API_BASE}/repos/${repo.full_name}/commits?since=${since}&until=${until}&per_page=${perPage}&page=${page}`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404 || response.status === 409) {
            // Repo might be empty or have no commits
            break;
          }
          if (response.status === 403 || response.status === 429) {
            const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
            console.warn(`Rate limited on ${repo.full_name}. Remaining: ${rateLimitRemaining || 0}. Stopping commits fetch.`);
            hasMoreCommits = false;
            // Stop processing all repos if we hit rate limit
            return { total: totalCommits, days: [] };
          }
          console.warn(`Failed to fetch commits from ${repo.full_name}: ${response.status} - ${errorText.substring(0, 100)}`);
          break;
        }

        const commits = await response.json();
        
        if (!Array.isArray(commits)) {
          console.warn(`Unexpected response format from ${repo.full_name}`);
          break;
        }
        
        if (commits.length === 0) {
          hasMoreCommits = false;
          break;
        }

        repoCommits += commits.length;
        totalCommits += commits.length;

        commits.forEach((commit: any) => {
          if (!commit.commit?.author?.date) return;
          
          const commitDate = new Date(commit.commit.author.date);
          if (commitDate < startDate || commitDate > endDate) return;
          
          // For user-owned repos, count ALL commits (they own the repo)
          if (isUserRepo) {
            const dateKey = commitDate.toISOString().split('T')[0];
            const current = contributionMap.get(dateKey) || 0;
            contributionMap.set(dateKey, current + 1);
            return;
          }
          
          // For other repos, check if commit is by the user
          const commitAuthor = commit.author?.login?.toLowerCase();
          const commitCommitter = commit.committer?.login?.toLowerCase();
          const authorName = commit.commit?.author?.name?.toLowerCase();
          const authorEmail = commit.commit?.author?.email?.toLowerCase();
          const usernameLower = username.toLowerCase();
          
          // Matching logic:
          // 1. Exact match on author/committer login (most reliable)
          // 2. Author name contains username or vice versa
          // 3. Author email contains username
          const hasExactMatch = commitAuthor === usernameLower || commitCommitter === usernameLower;
          const hasNameMatch = authorName && (
            authorName === usernameLower ||
            authorName.includes(usernameLower) ||
            usernameLower.includes(authorName.split(' ')[0]?.toLowerCase() || '')
          );
          const hasEmailMatch = authorEmail && authorEmail.includes(usernameLower);
          
          const isUserCommit = hasExactMatch || hasNameMatch || hasEmailMatch;
          
          if (isUserCommit) {
            const dateKey = commitDate.toISOString().split('T')[0];
            const current = contributionMap.get(dateKey) || 0;
            contributionMap.set(dateKey, current + 1);
          }
        });

        // If we got fewer than perPage, we're done with this repo
        if (commits.length < perPage) {
          hasMoreCommits = false;
        } else {
          page++;
          // Continue fetching pages, but limit to prevent excessive API calls
          // Allow up to 5 pages per repo to balance completeness vs rate limits
          if (page > 5) {
            hasMoreCommits = false;
            console.log(`Reached page limit (5) for ${repo.full_name}, stopping`);
          }
        }
      }
      
      if (repoCommits > 0) {
        console.log(`Processed ${repoCommits} commits from ${repo.full_name}`);
      }
    } catch (error: any) {
      console.error(`Error fetching commits from ${repo.full_name}:`, error.message || error);
      // Continue with other repos
    }
  }
  
  console.log(`Found ${totalCommits} total commits across all repos`);
  
  // Count total matched contributions and days with contributions
  const totalMatchedContributions = Array.from(contributionMap.values()).reduce((sum, count) => sum + count, 0);
  const daysWithContributions = Array.from(contributionMap.values()).filter(count => count > 0).length;
  console.log(`Matched ${totalMatchedContributions} contributions across ${daysWithContributions} days`);

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

  // Use matched contributions count, not total commits (already calculated above)
  return { total: totalMatchedContributions, days: days.sort((a, b) => a.date.localeCompare(b.date)) };
}

/**
 * Fetches contribution events for a user
 * Tries GraphQL first, falls back to fetching commits from repos
 */
export async function fetchContributionEvents(username: string, repos: GitHubRepository[], year: number = 2025): Promise<ContributionDay[]> {
  // Try GraphQL first - it's more efficient (single query) and doesn't hit rate limits as easily
  try {
    console.log(`Fetching contributions for ${username} in ${year} using GraphQL API...`);
    const graphqlResult = await fetchContributionsGraphQL(username, year);
    console.log(`GraphQL found ${graphqlResult.total} contributions, ${graphqlResult.days.length} days with data`);
    
    // Check if we got meaningful data (non-zero contributions or days with counts)
    const daysWithContributions = graphqlResult.days.filter(d => d.count > 0).length;
    if (graphqlResult.total > 0 || daysWithContributions > 0) {
      console.log(`Using GraphQL data: ${graphqlResult.total} total contributions across ${daysWithContributions} days`);
      return graphqlResult.days;
    } else {
      console.log('GraphQL returned empty data, falling back to commits API');
    }
  } catch (error: any) {
    console.log('GraphQL failed, trying commits API:', error.message || error);
  }

  // Fallback to commits API (limited to avoid rate limits)
  try {
    console.log(`Fetching contributions for ${username} in ${year} using commits API...`);
    const commitsResult = await fetchCommitsFromRepos(username, repos, year);
    console.log(`Found ${commitsResult.total} total commits`);
    if (commitsResult.total > 0) {
      return commitsResult.days;
    }
  } catch (fallbackError: any) {
    console.error('Commits API failed:', fallbackError.message || fallbackError);
  }

  // Return empty contributions as last resort
  console.warn('All methods failed, returning empty contributions');
  const days: ContributionDay[] = [];
  const startDate = new Date(year, 0, 1);
  const isCurrentYear = year === new Date().getFullYear();
  const endDate = isCurrentYear ? new Date() : new Date(year, 11, 31);
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
  year: number = 2025,
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
  year: number = 2025
): Promise<YearReviewData> {
  const [user, repos] = await Promise.all([
    fetchUserProfile(username),
    fetchUserRepositories(username),
  ]);

  const topLanguages = calculateTopLanguages(repos);
  const contributionGraph = await fetchContributionEvents(username, repos, year);
  
  // Calculate total from contribution graph (sum of all daily counts)
  const totalContributions = contributionGraph.reduce((sum, day) => sum + day.count, 0);
  
  console.log(`Total contributions calculated: ${totalContributions}`);

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

