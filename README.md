# GitHub Year-in-Review Generator

A beautiful Next.js application that generates GitHub Year-in-Review summaries for 2024. Enter your GitHub username or profile URL, and get a stunning visual summary of your coding activity.

## Features

- 🎨 **Premium Design**: Beautiful dark theme with GitHub-inspired green accents
- 📊 **Comprehensive Stats**: View your contributions, repositories, followers, stars, and more
- 📈 **Contribution Graph**: Visual heatmap of your coding activity throughout the year
- 🌐 **Top Languages**: See your most-used programming languages
- 📥 **Download Options**: Export your review as PNG or PDF
- 🔗 **Social Sharing**: Share on LinkedIn, X (Twitter), or copy the link

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd github-year-wrap
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your GitHub username or profile URL (e.g., `github.com/username` or just `username`)
2. Click "Generate Review"
3. View your personalized Year-in-Review card
4. Download as PNG/PDF or share on social media

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **html2canvas** - PNG export functionality
- **jsPDF** - PDF export functionality
- **GitHub REST API** - Data fetching

## Project Structure

```
github-year-wrap/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── review/            # Review pages
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions and types
└── styles/                # Global styles
```

## API Rate Limiting

The app uses GitHub's public API which has rate limits:
- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour

For production use, consider:
- Adding GitHub token authentication (optional)
- Implementing caching
- Using a backend proxy

## License

MIT

# github-year-wrap
