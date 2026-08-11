import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Is this real? — Kiwari',
  description:
    'What the golden ratio does and does not do. The honest version, with sources — from a tool built on proportion systems.',
};

export default function IsThisReal() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-10">
      <Link href="/" className="text-sm opacity-60 hover:opacity-100">
        ← Kiwari
      </Link>
      <h1 className="mt-4 text-3xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>
        Is this real?
      </h1>
      <p className="mt-1 text-sm italic opacity-60">
        A tool built on the golden ratio, on what the golden ratio actually is.
      </p>

      <div className="prose-sm mt-8 space-y-6 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">The short answer</h2>
          <p className="mt-1">
            The golden ratio is <strong>not a law of beauty</strong>, and we will not tell you it is. It is a
            proportion system — a disciplined way to make the hundreds of small dimensional decisions in a mark
            relate to each other instead of being arbitrary. That is a real benefit, and a modest one.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">What the evidence actually says</h2>
          <ul className="mt-1 list-disc space-y-2 pl-5">
            <li>
              There is <strong>no reliable evidence</strong> that people universally prefer golden-ratio proportions.
              Gustav Fechner&apos;s famous 1876 rectangle experiments have replicated poorly, and Godkewitsch (1974)
              showed the apparent preference could be an artifact of how the stimuli were arranged.
            </li>
            <li>
              Most famous claims are <strong>retrofitted</strong>. George Markowsky&apos;s &ldquo;Misconceptions about
              the Golden Ratio&rdquo; (<em>College Mathematics Journal</em>, 1992) showed that the Parthenon
              measurements are selected after the fact to fit — measure differently and φ disappears.
            </li>
            <li>
              Mathematician Keith Devlin notes that as an irrational number, nothing physical can strictly{' '}
              <em>be</em> φ at all — every real-world &ldquo;golden&rdquo; measurement is an approximation with error
              bars wide enough to fit many other ratios.
            </li>
            <li>
              Those golden-spiral overlays on the Apple and Twitter logos that circulate online?{' '}
              <strong>They don&apos;t actually fit.</strong> Look closely at where the circles land.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">What we claim instead</h2>
          <p className="mt-1">A proportion system does four real things:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              It <strong>removes arbitrary decisions</strong>. Every radius in a Kiwari mark is r₀·φⁿ; every anchor
              sits on a lattice. &ldquo;How big should this circle be?&rdquo; has a principled answer.
            </li>
            <li>
              It produces <strong>internal consistency</strong> — the parts of the mark relate, which is a large share
              of what reads as &ldquo;intentional&rdquo; versus &ldquo;clip-art&rdquo;.
            </li>
            <li>
              It makes a mark <strong>explainable</strong>. You can show the construction to a co-founder, a client,
              or yourself in six months.
            </li>
            <li>
              It gives a non-designer a <strong>defensible starting point</strong> instead of a blank canvas.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">The tell that we mean it</h2>
          <p className="mt-1">
            If φ were magic, alternatives wouldn&apos;t work. They do. Kiwari also builds marks on the{' '}
            <strong>√2 system</strong> (大和比, the Japanese carpentry and A-series paper proportion) and pentagonal
            symmetry — and you can rebuild any mark on a different system and hear the difference for yourself. The
            value is the discipline, not the number.
          </p>
          <p className="mt-2">
            One more honesty note: our engine sometimes applies small <em>optical corrections</em> — a mark nudged a
            few units because human vision doesn&apos;t match arithmetic. Every correction is labeled with its reason,
            and you can always toggle them off and see the pure mathematical state. Deviation from the grid is not
            failure; great marks break grids deliberately. We just refuse to hide it.
          </p>
        </section>

        <section className="rounded-xl border border-[var(--line)] bg-white p-4 text-xs opacity-70">
          <p className="font-semibold uppercase tracking-wide">Sources</p>
          <p className="mt-1">
            Markowsky, &ldquo;Misconceptions about the Golden Ratio,&rdquo; College Mathematics Journal 23(1), 1992 ·
            Godkewitsch, &ldquo;The golden section: an artifact of stimulus range?&rdquo; 1974 · Devlin, &ldquo;The
            Myth That Will Not Go Away,&rdquo; 2007 · Brownlee, &ldquo;The Golden Ratio: Design&apos;s Biggest
            Myth,&rdquo; Fast Company, 2015.
          </p>
        </section>
      </div>
    </main>
  );
}
