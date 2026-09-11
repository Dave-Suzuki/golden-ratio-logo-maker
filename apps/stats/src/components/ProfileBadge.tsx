'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { bootstrap, signOut } from '@/lib/actions';
import { useStats } from '@/lib/store';

export function ProfileBadge() {
  const profile = useStats((s) => s.profile);
  useEffect(() => {
    void bootstrap();
  }, []);
  if (!profile)
    return (
      <Link href="/" className="rounded border border-[var(--line)] px-2 py-1 text-xs">
        Choose learner
      </Link>
    );
  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="rounded bg-[var(--accent-soft)] px-2 py-1">{profile.name}</span>
      <button onClick={signOut} className="underline opacity-70">
        switch
      </button>
    </span>
  );
}
