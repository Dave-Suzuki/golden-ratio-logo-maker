import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ProfileBadge } from '@/components/ProfileBadge';

export const metadata: Metadata = {
  title: 'Stats Trainer — OpenStax Introductory Statistics',
  description: 'Section-by-section quizzes, mistake review and printable tests for OpenStax Introductory Statistics 2e.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="no-print border-b border-[var(--line)] bg-white/70">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold tracking-tight text-[var(--accent)]">
              Stats Trainer
            </Link>
            <Link href="/" className="hover:underline">
              Chapters
            </Link>
            <Link href="/review" className="hover:underline">
              Review mistakes
            </Link>
            <Link href="/progress" className="hover:underline">
              Progress
            </Link>
            <Link href="/about" className="hover:underline">
              About
            </Link>
            <span className="ml-auto">
              <ProfileBadge />
            </span>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs opacity-60">
          Questions adapted from <em>Introductory Statistics 2e</em> (OpenStax, Rice University), CC BY 4.0. Teaching notes adapted from
          Skipper et al., <em>Lecture Notes for OpenStax Introductory Statistics</em> (GALILEO/USG 2017), CC BY 4.0. See{' '}
          <Link href="/about" className="underline">
            About
          </Link>{' '}
          for all attributions.
        </footer>
      </body>
    </html>
  );
}
