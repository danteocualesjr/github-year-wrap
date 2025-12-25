import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GitHub Year in Review 2024',
  description: 'Generate your beautiful GitHub Year-in-Review summary',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-github-dark text-github-text antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

