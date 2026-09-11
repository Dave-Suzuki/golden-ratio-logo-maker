import Link from 'next/link';
import { Suspense } from 'react';
import { useHash, currentRoute } from './shims/navigation';
import { ProfileBadge } from '@/components/ProfileBadge';
import { Home } from '@/components/Home';
import { QuizPage } from '@/components/QuizPage';
import { ReviewPage } from '@/components/ReviewPage';
import { PrintPage } from '@/components/PrintPage';
import { ProgressPage } from '@/components/ProgressPage';
import { ChapterPage } from './pages/ChapterPage';
import { SectionPage } from './pages/SectionPage';
import { AboutPage } from './pages/AboutPage';

function Route() {
  useHash();
  const { path } = currentRoute();
  let m: RegExpExecArray | null;
  if (path === '/') return <Home />;
  if ((m = /^\/chapter\/(\d+)$/.exec(path))) return <ChapterPage ch={m[1] as string} />;
  if ((m = /^\/section\/([\d.]+)$/.exec(path))) return <SectionPage id={m[1] as string} />;
  if (path === '/quiz') return <QuizPage />;
  if (path === '/review') return <ReviewPage />;
  if (path === '/print') return <PrintPage />;
  if (path === '/progress') return <ProgressPage />;
  if (path === '/about') return <AboutPage />;
  return (
    <p className="text-sm">
      Page not found.{' '}
      <Link href="/" className="underline">
        Back to chapters
      </Link>
    </p>
  );
}

export function App() {
  return (
    <>
      <header className="no-print site-header">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm">
          <Link href="/" className="brand">
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
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Suspense fallback={null}>
          <Route />
        </Suspense>
      </main>
      <footer className="no-print mx-auto max-w-5xl px-4 py-8 text-xs opacity-60">
        Questions adapted from <em>Introductory Statistics 2e</em> (OpenStax, Rice University), CC BY 4.0. Teaching notes adapted from Skipper et al.,{' '}
        <em>Lecture Notes for OpenStax Introductory Statistics</em> (GALILEO/USG 2017), CC BY 4.0. See{' '}
        <Link href="/about" className="underline">
          About
        </Link>{' '}
        for all attributions.
      </footer>
    </>
  );
}
