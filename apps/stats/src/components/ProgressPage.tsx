'use client';

import { parseRich, plainText } from '@/lib/richtext';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { retryMistake } from '@/lib/actions';
import { useStats } from '@/lib/store';
import { MasteryBadge } from './MasteryBadge';

export function ProgressPage() {
  const { profile, catalog } = useStats();
  const router = useRouter();
  if (!profile)
    return (
      <p className="text-sm">
        <Link href="/" className="underline">
          Choose a learner
        </Link>{' '}
        first.
      </p>
    );
  const sections = catalog.flatMap((c) => c.sections);
  const touched = sections.filter((s) => profile.sectionStats[s.id]);
  const mistakes = [...profile.mistakes].reverse().slice(0, 100);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Progress — {profile.name}</h1>
      <section>
        <h2 className="font-semibold">Sections</h2>
        {touched.length === 0 ? (
          <p className="text-sm opacity-60">No quizzes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-2 w-full text-sm">
              <thead className="text-left text-xs uppercase opacity-60">
                <tr>
                  <th className="py-1 pr-3">Section</th>
                  <th className="py-1 pr-3">Answered</th>
                  <th className="py-1 pr-3">Correct</th>
                  <th className="py-1 pr-3">Last quiz</th>
                  <th className="py-1 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {touched.map((s) => {
                  const st = profile.sectionStats[s.id]!;
                  return (
                    <tr key={s.id} className="border-t border-[var(--line)]">
                      <td className="py-1 pr-3">
                        <Link href={`/section/${s.id}`} className="hover:underline">
                          {s.id} {s.title}
                        </Link>
                      </td>
                      <td className="py-1 pr-3">{st.answered}</td>
                      <td className="py-1 pr-3">{st.answered ? Math.round((100 * st.correct) / st.answered) : 0}%</td>
                      <td className="py-1 pr-3">{st.lastScore !== undefined ? `${Math.round(st.lastScore * 100)}%` : '—'}</td>
                      <td className="py-1 pr-3">
                        <MasteryBadge mastery={profile.mastery[s.id] ?? 'not_started'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2 className="font-semibold">Mistake log</h2>
        {mistakes.length === 0 ? (
          <p className="text-sm opacity-60">No mistakes recorded.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] bg-white text-sm">
            {mistakes.map((m) => {
              const open = profile.review[m.conceptTag]?.status === 'open';
              return (
                <li key={m.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs opacity-60">
                    <span>{new Date(m.at).toLocaleString()}</span>
                    {m.sectionId && <span>§{m.sectionId}</span>}
                    <span>during {m.context}</span>
                    <span className={open ? 'text-[var(--warn)]' : 'text-[var(--ok)]'}>{open ? 'still open' : 'understood'}</span>
                  </div>
                  {m.scenario && <p className="mt-1 line-clamp-2 text-xs opacity-70">{plainText(parseRich(m.scenario), 220)}</p>}
                  <p className="mt-1 line-clamp-3">{plainText(parseRich(m.stem), 300)}</p>
                  <p className="mt-1 text-xs">
                    <span className="opacity-60">your answer: </span>
                    {describe(m.given)} <span className="opacity-60">· correct: </span>
                    <span>{plainText(parseRich(m.correctDisplay), 200)}</span>
                  </p>
                  <button
                    onClick={async () => {
                      if (await retryMistake(m.ref)) router.push('/review');
                    }}
                    className="mt-1 text-xs underline"
                  >
                    Retry
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function describe(g: { kind: string } & Record<string, unknown>): string {
  switch (g.kind) {
    case 'mc':
      return `option ${String.fromCharCode(97 + Number(g.index))}`;
    case 'numeric':
      return String(g.raw);
    case 'fill':
      return (g.values as string[]).join(', ');
    case 'tf':
      return g.value ? 'true' : 'false';
    case 'open':
      return g.selfMark === 'missed' ? 'self-marked as missed' : String(g.text).slice(0, 80);
    default:
      return '';
  }
}
