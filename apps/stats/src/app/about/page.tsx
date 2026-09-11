import Link from 'next/link';
import { extraSets } from '@/lib/server/content';

export default function AboutPage() {
  const extra = extraSets();
  return (
    <div className="prose prose-sm max-w-3xl space-y-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">About this trainer</h1>
      <section>
        <h2 className="font-semibold">How it works</h2>
        <ul className="list-disc pl-5">
          <li>Every question belongs to one OpenStax section. Quizzes mix auto-graded items (multiple choice, numeric, true/false, fill-in) with worked problems you self-assess against the model solution, and generated problems with fresh numbers.</li>
          <li>Each mistake is logged and opens a concept for review. A concept closes after two correct answers in a row.</li>
          <li>A section is <em>mastered</em> when your last quiz there scored 80% or better and no concept from it is open.</li>
          <li>Printed tests are reproducible: the test code (scope:id:seed) always regenerates the same questions and answer key. "New test" changes the seed.</li>
          <li>Progress is stored on the server as a JSON file per learner name. There are no passwords; this is a self-study tool.</li>
        </ul>
      </section>
      <section>
        <h2 className="font-semibold">Sources and licenses</h2>
        <ul className="list-disc pl-5">
          <li>
            <a className="underline" href="https://openstax.org/books/introductory-statistics-2e">Introductory Statistics 2e</a> by Barbara Illowsky and Susan Dean, OpenStax (Rice University), CC BY 4.0 — exercises, practice tests, final exams, chapter reviews, formula reviews and glossary; plus the OpenStax "Try It" answer guide.
          </li>
          <li>
            <a className="underline" href="https://oer.galileo.usg.edu/mathematics-ancillary/9">Lecture Notes for OpenStax Introductory Statistics</a> by Daphne Skipper, Neal Smith, Robert Scott, Marvalisa Payne and Christopher Terry (GALILEO / University System of Georgia, 2017), CC BY 4.0 — the teaching text.
          </li>
          {Object.entries(extra).map(([src, e]) => (
            <li key={src}>
              {e.sets.map((s) => (
                <span key={s.title}>
                  {s.url ? (
                    <a className="underline" href={s.url}>
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}{' '}
                  ({s.count} items)
                </span>
              ))}{' '}
              — {e.license}
            </li>
          ))}
        </ul>
        <p>Changes: exercises were converted to plain text, classified by answer type and in places lightly reworded so they can be auto-graded.</p>
      </section>
      <section>
        <h2 className="font-semibold">More practice elsewhere</h2>
        <ul className="list-disc pl-5">
          <li>
            <a className="underline" href="https://www.deanza.edu/faculty/bloomroberta/math10/math10exampractice.html">De Anza College Math 10 practice exams</a> (multiple choice, keys on the last page).
          </li>
          <li>
            <a className="underline" href="https://pressbooks.lib.vt.edu/significantstatistics/">Significant Statistics (Virginia Tech)</a> — extra practice per chapter, CC BY-SA 4.0.
          </li>
          <li>
            <a className="underline" href="https://www.myopenmath.com/info/selfstudy.php">MyOpenMath self-study courses</a> — auto-graded question banks aligned to this textbook.
          </li>
        </ul>
      </section>
      <p>
        <Link href="/" className="underline">
          Back to chapters
        </Link>
      </p>
    </div>
  );
}
