'use client';

import { useState } from 'react';
import { selectProfile } from '@/lib/actions';
import { useStats } from '@/lib/store';

export function ProfilePicker() {
  const { profiles, busy, error, storageKind } = useStats();
  const [name, setName] = useState('');
  const where =
    storageKind === 'server'
      ? 'saved on the server under your name'
      : storageKind === 'page'
        ? 'saved with this page under your name, so they follow you between devices'
        : 'saved in this browser only, under your name — another browser or device starts fresh';
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5">
      <h2 className="text-lg font-semibold">Who is learning?</h2>
      <p className="mt-1 text-sm opacity-70">Progress and mistakes are {where}. No password.</p>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) void selectProfile(name);
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="rounded border border-[var(--line)] px-3 py-2 text-sm"
          maxLength={40}
          title="Up to 40 characters"
        />
        {name.length >= 40 && <span className="self-center text-xs opacity-60">40 characters is the limit</span>}
        <button disabled={!!busy || !name.trim()} className="rounded bg-[var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50">
          {busy === 'profile' ? 'Loading…' : 'Start'}
        </button>
      </form>
      {profiles.length > 0 && (
        <div className="mt-4 text-sm">
          <span className="opacity-60">Recent: </span>
          {profiles.map((p) => (
            <button key={p.id} onClick={() => void selectProfile(p.name)} className="mr-2 underline">
              {p.name}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-[var(--bad)]">{error}</p>}
    </section>
  );
}
