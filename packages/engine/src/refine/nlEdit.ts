import type { ParamDelta } from '../schema/delta';
import type { BrandBrief } from '../schema/brief';

/**
 * Rule-based NL-edit fallback (REF-2): maps common editing verbs to ParamDeltas.
 * The LLM path handles anything richer; unrecognized input returns a visible
 * message, never a silent failure.
 */
export function fallbackNlEdit(instruction: string, brief: BrandBrief): ParamDelta {
  const t = instruction.toLowerCase().trim();

  if (/heavier|bolder|thicker|stronger|more weight/.test(t)) return { op: 'weight', direction: 1 };
  if (/lighter|thinner|finer|less weight|more delicate/.test(t)) return { op: 'weight', direction: -1 };

  if (/correction|optical/.test(t)) {
    return { op: 'optical', enabled: !/off|remove|without|disable/.test(t) };
  }

  const rot = t.match(/rotate|turn|spin|tilt/);
  if (rot) {
    const left = /left|counter|anti|ccw/.test(t);
    const golden = /golden|137/.test(t);
    const small = /little|slight|bit/.test(t);
    const angle = golden ? 137.5 : small ? 60 : 90;
    return { op: 'rotate', angle: (left ? -angle : angle) as 90 | -90 | 60 | -60 | 137.5 | -137.5 };
  }

  if (/flip|mirror/.test(t)) {
    return { op: 'mirror', axis: /vertical|upside|top|bottom/.test(t) ? 'horizontal' : 'vertical' };
  }

  if (/tighter|closer|smaller gap|close the/.test(t)) return { op: 'counterform', direction: -1 };
  if (/airier|more open|open up|bigger gap|wider gap|more breathing/.test(t)) {
    return { op: 'counterform', direction: 1 };
  }

  if (/more abstract|less literal|simpler idea|abstract/.test(t)) {
    return {
      op: 'replan',
      brief: { ...brief, motif: { ...brief.motif, abstraction: Math.min(1, brief.motif.abstraction + 0.25) } },
      note: 'raised abstraction',
    };
  }
  if (/less abstract|more literal|more recognizable|clearer/.test(t)) {
    return {
      op: 'replan',
      brief: { ...brief, motif: { ...brief.motif, abstraction: Math.max(0, brief.motif.abstraction - 0.25) } },
      note: 'lowered abstraction',
    };
  }
  if (/different|another|something else|try again|new idea/.test(t)) {
    return { op: 'replan', brief, note: 'fresh construction requested' };
  }

  return {
    op: 'unrecognized',
    message: 'I could not map that to a construction parameter — try a slider, or phrases like “heavier”, “rotate left”, “more open”, “more abstract”.',
  };
}
