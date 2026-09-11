import { Fragment } from 'react';

function Table({ block }: { block: string }) {
  const rows = block
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => r.split('|').map((c) => c.trim()));
  const [head, ...body] = rows;
  if (!head) return null;
  return (
    <table className="stem-table">
      <thead>
        <tr>
          {head.map((c, i) => (
            <th key={i}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Renders question text: blank-line paragraphs, single newlines as line breaks, and [TABLE]…[/TABLE] blocks as tables. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\[TABLE\]([\s\S]*?)\[\/TABLE\]/);
  return (
    <div className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Table key={i} block={part} />
        ) : (
          <Fragment key={i}>
            {part
              .split(/\n{2,}/)
              .filter((p) => p.trim())
              .map((para, j) => (
                <p key={j} className="mb-2 whitespace-pre-line">
                  {para.replace(/\[FIGURE[^\]]*\]/g, '[figure not shown]')}
                </p>
              ))}
          </Fragment>
        ),
      )}
    </div>
  );
}

export function QuestionStem({ stem, context }: { stem: string; context?: string | null }) {
  return (
    <div>
      {context && <RichText text={context} className="mb-3 rounded bg-[var(--accent-soft)]/60 p-3 text-sm" />}
      <RichText text={stem} className="text-[15px] leading-relaxed" />
    </div>
  );
}
