/**
 * Extracts GitHub username from various input formats:
 * - github.com/username
 * - https://github.com/username
 * - @username
 * - username
 */
export function extractGitHubUsername(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // Handle @username format
  if (trimmed.startsWith('@')) {
    return trimmed.slice(1);
  }

  // Handle URL formats
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})/;
  const match = trimmed.match(urlPattern);
  if (match) {
    return match[1];
  }

  // Handle plain username (alphanumeric, hyphens, but not starting/ending with hyphen)
  const usernamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  if (usernamePattern.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Calculates the number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Formats a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Gets the color for a programming language (GitHub's language colors)
 */
export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#239120',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    Swift: '#FA7343',
    Kotlin: '#A97BFF',
    HTML: '#e34c26',
    CSS: '#563d7c',
    SCSS: '#c6538c',
    Vue: '#4fc08d',
    React: '#61dafb',
    Angular: '#dd0031',
    Dart: '#00B4AB',
    Shell: '#89e051',
    PowerShell: '#012456',
    R: '#198CE7',
    MATLAB: '#e16737',
    Scala: '#c22d40',
    Perl: '#39457e',
    Lua: '#000080',
    Clojure: '#db5855',
    Haskell: '#5e5086',
    Elixir: '#6e4a7e',
    Erlang: '#B83998',
    OCaml: '#3be133',
    'F#': '#b845fc',
    CoffeeScript: '#244776',
    'Objective-C': '#438eff',
    Assembly: '#6E4C13',
    VimL: '#199f4b',
    TeX: '#3D6117',
    Markdown: '#083fa1',
  };

  return colors[language] || '#8b949e';
}

