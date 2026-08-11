import type { BrandBrief } from './schema/brief';
import { ratioFor, type ConstructionPlan } from './schema/plan';
import { stepLabel } from './render/renderPlan';

const FAMILY_CLAUSE: Record<ConstructionPlan['family'], string> = {
  phi_circle_chain:
    'a chain of circles whose radii walk the golden series, each inscribed in a square of the spiral subdivision',
  golden_rect_subdivision:
    'the squares of a golden-rectangle subdivision — every edge falls where the spiral cuts',
  pentagonal: 'pentagonal symmetry, where the φ ratio appears naturally in every chord and ring',
  root2_grid: 'a √2 modular grid (大和比), the same halving proportion as A-series paper',
};

/**
 * Deterministic 2–3 sentence rationale (EXP-2). Every clause is slot-filled from
 * the actual plan — construction, real step labels, real operations — never
 * boilerplate, and never an aesthetic claim.
 */
export function rationaleFor(plan: ConstructionPlan, brief?: BrandBrief): string {
  const ratio = ratioFor(plan.family);
  const sym = plan.family === 'root2_grid' ? '√2' : 'φ';
  const sentences: string[] = [];

  sentences.push(`This mark is built on ${FAMILY_CLAUSE[plan.family]}.`);

  const steps = [
    ...new Set(plan.elements.flatMap((el) => ('r' in el ? [el.r.step] : []))),
  ].sort((a, b) => b - a);
  const stepList = steps.map((s) => stepLabel(s, ratio)).join(', ');
  const op = plan.composite[0];
  const ring = plan.transforms.find((t) => t.kind === 'ring');

  if (op) {
    const verb = op.op === 'subtract' ? 'the difference' : op.op === 'unite' ? 'the union' : 'the intersection';
    const spread =
      steps.length > 1
        ? `, with radii ${steps.length === 2 ? `${Math.abs(steps[0]! - steps[1]!)} ${sym}-step${Math.abs(steps[0]! - steps[1]!) > 1 ? 's' : ''} apart` : `spanning ${stepList}`}`
        : '';
    sentences.push(
      `The ${op.as} is ${verb} of shapes anchored on lattice points${spread} — nothing is placed freehand.`,
    );
  } else if (ring) {
    sentences.push(
      `One element, repeated ${ring.count}× at ${Math.abs(ring.angle)}° around the center, so the whole form inherits its symmetry from a single decision.`,
    );
  } else if (steps.length > 1) {
    sentences.push(`Its radii step through ${stepList} on the same geometric series.`);
  }

  const motif = brief?.motif.subject;
  const closing =
    motif && motif !== 'geometric form'
      ? `Every measurement belongs to one ${sym} series, which is what makes the ${motif} read as intentional rather than drawn.`
      : `Every measurement belongs to one ${sym} series — internally consistent by construction, not by eye.`;
  sentences.push(closing);

  return sentences.slice(0, 3).join(' ');
}
