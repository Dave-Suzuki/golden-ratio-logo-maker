import { Fragment } from 'react';
import { parseRich, type RichBlock } from '@/lib/richtext';

/**
 * Renders question text from the importer's markup.
 *
 * `question` is the on-screen default: wide tables get their own scroll box so the page itself
 * never scrolls sideways. `compact` is for the short explanation steps in the feedback panel.
 * `print` removes every scroll box and height cap, because paper has neither.
 */
export type RichVariant = 'question' | 'compact' | 'print';

function FigureText({ text }: { text: string }) {
  // the parser leaves a sentinel where an image we do not have used to sit
  const parts = text.split('†figure†');
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="rich-figure">[figure not shown]</span>}
          {p}
        </Fragment>
      ))}
    </>
  );
}

function Table({ block, variant }: { block: Extract<RichBlock, { kind: 'table' }>; variant: RichVariant }) {
  const table = (
    <table className="stem-table">
      {block.caption && <caption>{block.caption}</caption>}
      {block.head && (
        <thead>
          <tr>
            {block.head.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {block.rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  if (variant === 'print') return <div className="print-table">{table}</div>;
  return <div className="table-scroll">{table}</div>;
}

function Block({ block, variant }: { block: RichBlock; variant: RichVariant }) {
  switch (block.kind) {
    case 'para':
      return (
        <p className="rich-para">
          <FigureText text={block.text} />
        </p>
      );
    case 'data':
      return (
        <p className="rich-data">
          {block.label && <span className="rich-data-label">{block.label}</span>}
          {block.values.join(', ')}
        </p>
      );
    case 'bullets':
      return (
        <ul className="rich-list">
          {block.items.map((it, i) => (
            <li key={i}>
              <FigureText text={it} />
            </li>
          ))}
        </ul>
      );
    case 'parts':
      return (
        <ol className="rich-parts">
          {block.items.map((it, i) => (
            <li key={i}>
              {it.label && <span className="rich-part-label">{it.label}.</span>}
              <span>
                <FigureText text={it.text} />
              </span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return <Table block={block} variant={variant} />;
    case 'figure':
      return <p className="rich-figure">[figure not shown{block.caption ? `: ${block.caption}` : ''}]</p>;
  }
}

export function RichText({ text, className, variant = 'question' }: { text: string; className?: string; variant?: RichVariant }) {
  const blocks = parseRich(text ?? '');
  return (
    <div className={[`rich rich-${variant}`, className].filter(Boolean).join(' ')}>
      {blocks.map((b, i) => (
        <Block key={i} block={b} variant={variant} />
      ))}
    </div>
  );
}
