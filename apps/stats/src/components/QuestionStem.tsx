'use client';

import { useState } from 'react';
import { estimateLines, parseRich } from '@/lib/richtext';
import { Clamp } from './Clamp';
import { RichText } from './RichText';

// re-exported so existing imports keep working
export { RichText } from './RichText';

/** Above this many estimated lines a scenario is collapsed by default. */
const SCENARIO_LINES = 8;
const SCENARIO_PX = 208;
/**
 * A scenario built around a table gets a much larger budget. Cutting one at 208px left a header
 * and a single row on screen — worse than no table at all, since the learner has to expand it
 * before they can read anything. The table scrolls inside its own box (max-height 22rem), so the
 * scenario cannot run away even without the clamp.
 */
const SCENARIO_TABLE_PX = 620;
/** A question itself is only ever clamped when it is genuinely enormous. */
const STEM_LINES = 26;
const STEM_PX = 560;

function Scenario({ text, repeated, measureKey }: { text: string; repeated: boolean; measureKey: string }) {
  const [shown, setShown] = useState(!repeated);
  const blocks = parseRich(text);
  const hasTable = blocks.some((b) => b.kind === 'table');
  const maxPx = hasTable ? SCENARIO_TABLE_PX : SCENARIO_PX;
  const long = !hasTable && estimateLines(blocks) > SCENARIO_LINES;

  if (repeated && !shown) {
    return (
      <div className="scenario scenario-repeated">
        <span>Same scenario as the previous question.</span>
        <button type="button" onClick={() => setShown(true)} className="clamp-toggle">
          Show it again
        </button>
      </div>
    );
  }

  return (
    <div className="scenario">
      <p className="eyebrow scenario-label">Scenario</p>
      <Clamp maxPx={maxPx} probablyLong={long} measureKey={measureKey} openLabel="Show all of the scenario">
        <RichText text={text} />
      </Clamp>
    </div>
  );
}

/**
 * A question: the scenario it refers to (quiet, collapsible) and the question itself (dominant).
 * The question is what the learner has to act on, so it never competes with the background data.
 */
export function QuestionStem({
  stem,
  context,
  repeatedContext = false,
  stemId,
  measureKey,
}: {
  stem: string;
  context?: string | null;
  repeatedContext?: boolean;
  stemId?: string;
  measureKey?: string;
}) {
  const key = measureKey ?? stem.slice(0, 40);
  const stemLong = estimateLines(parseRich(stem)) > STEM_LINES;
  return (
    <div>
      {/* keyed so each question starts with its own collapsed/expanded state */}
      {context && <Scenario key={key} text={context} repeated={repeatedContext} measureKey={key} />}
      <div id={stemId} className="question-text prose-measure">
        {stemLong ? (
          <Clamp maxPx={STEM_PX} probablyLong measureKey={key} openLabel="Show the whole question">
            <RichText text={stem} />
          </Clamp>
        ) : (
          <RichText text={stem} />
        )}
      </div>
    </div>
  );
}
