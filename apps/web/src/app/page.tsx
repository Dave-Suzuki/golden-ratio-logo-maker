import Link from 'next/link';
import { Studio } from '@/components/Studio';

export default function Home() {
  return (
    <main className="min-h-screen pb-24">
      <header className="mx-auto flex max-w-5xl items-baseline justify-between px-6 pt-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Kiwari <span className="text-sm font-normal opacity-40">木割</span>
          </h1>
          <p className="text-sm italic opacity-60">Every logo shows its work.</p>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/is-this-real" className="underline decoration-[var(--accent)] underline-offset-4 hover:text-[var(--accent)]">
            Is this real?
          </Link>
        </nav>
      </header>

      <section className="mx-auto mt-10 max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-semibold leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
          A logo that is <em>constructed</em>, not generated.
        </h2>
        <p className="mt-3 text-sm leading-relaxed opacity-70">
          Describe what you want in one sentence. A deterministic geometry engine builds nine marks on real proportion
          systems — φ circle chains, golden-rectangle subdivisions, pentagons, √2 grids. Every mark can dissolve into
          its own construction: the circles, the lattice, the ratios, the reasoning. No image model ever touches your
          mark.
        </p>
      </section>

      <div className="mt-8 px-6">
        <Studio />
      </div>
    </main>
  );
}
