import { buildLattice } from './lattice';
import {
  ConstructionPlanSchema,
  FAMILY_LATTICE,
  type ConstructionPlan,
} from './schema/plan';

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; plan: ConstructionPlan }
  | { ok: false; issues: ValidationIssue[] };

export const LIMITS = {
  depthMin: 2,
  depthMax: 6,
  radiusStepMin: -6,
  radiusStepMax: 2,
  strokeStepMin: -6,
  strokeStepMax: -1,
  maxElements: 12,
  maxComposites: 8,
  maxOpticalShift: 1000 / Math.pow((1 + Math.sqrt(5)) / 2, 4), // ≈ 145.9 = size·φ⁻⁴
  opticalScaleMin: 0.95,
  opticalScaleMax: 1.05,
} as const;

/**
 * The structural gate (PRD §8.3). zod enforces shape and enums (angles, ops, families);
 * this enforces ranges and referential integrity against the plan's actual lattice.
 * Conformance is structural: a plan that parses AND validates cannot express geometry
 * off the proportion system.
 */
export function validatePlan(raw: unknown): ValidationResult {
  const parsed = ConstructionPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.slice(0, 8).map((i) => ({
        code: 'E_SCHEMA',
        path: i.path.join('.'),
        message: i.message,
      })),
    };
  }
  const plan = parsed.data;
  const issues: ValidationIssue[] = [];
  const push = (code: string, path: string, message: string) => issues.push({ code, path, message });

  if (FAMILY_LATTICE[plan.family] !== plan.canvas.lattice) {
    push(
      'E_LATTICE_MISMATCH',
      'canvas.lattice',
      `family '${plan.family}' constructs on '${FAMILY_LATTICE[plan.family]}', got '${plan.canvas.lattice}'`,
    );
  }
  if (plan.canvas.depth < LIMITS.depthMin || plan.canvas.depth > LIMITS.depthMax) {
    push('E_DEPTH', 'canvas.depth', `depth must be in [${LIMITS.depthMin}, ${LIMITS.depthMax}]`);
  }
  if (plan.elements.length === 0) {
    push('E_EMPTY', 'elements', 'plan has no elements');
  }
  if (plan.elements.length > LIMITS.maxElements) {
    push('E_TOO_MANY_ELEMENTS', 'elements', `at most ${LIMITS.maxElements} elements`);
  }
  if (plan.composite.length > LIMITS.maxComposites) {
    push('E_TOO_MANY_OPS', 'composite', `at most ${LIMITS.maxComposites} composite ops`);
  }
  if (issues.length > 0) return { ok: false, issues };

  const lattice = buildLattice(plan.canvas.lattice, plan.canvas.depth);
  const checkAddr = (addr: string, path: string) => {
    if (!lattice.points.has(addr)) {
      push(
        'E_OFF_LATTICE',
        path,
        `'${addr}' is not a lattice point of ${plan.canvas.lattice} (depth ${plan.canvas.depth})`,
      );
    }
  };
  const checkStep = (step: number, path: string) => {
    if (step < LIMITS.radiusStepMin || step > LIMITS.radiusStepMax) {
      push('E_STEP_RANGE', path, `radius step must be in [${LIMITS.radiusStepMin}, ${LIMITS.radiusStepMax}]`);
    }
  };

  const ids = new Set<string>();
  plan.elements.forEach((el, i) => {
    const p = `elements[${i}]`;
    if (ids.has(el.id)) push('E_DUP_ID', `${p}.id`, `duplicate id '${el.id}'`);
    ids.add(el.id);
    switch (el.type) {
      case 'circle':
      case 'arc':
      case 'polygon':
        checkAddr(el.at, `${p}.at`);
        checkStep(el.r.step, `${p}.r.step`);
        break;
      case 'line':
        checkAddr(el.from, `${p}.from`);
        checkAddr(el.to, `${p}.to`);
        break;
      case 'rect':
        if (!lattice.cells.has(el.cell)) {
          push('E_OFF_LATTICE', `${p}.cell`, `'${el.cell}' is not a lattice cell of ${plan.canvas.lattice}`);
        }
        break;
    }
  });

  // Composite ops must reference already-defined ids (elements or earlier results) —
  // forward references are impossible, so the op graph is a DAG by construction.
  const defined = new Set(ids);
  plan.composite.forEach((op, i) => {
    const p = `composite[${i}]`;
    if (!defined.has(op.of)) push('E_UNKNOWN_REF', `${p}.of`, `'${op.of}' is not defined at this point`);
    if (!defined.has(op.by)) push('E_UNKNOWN_REF', `${p}.by`, `'${op.by}' is not defined at this point`);
    if (op.of === op.by) push('E_SELF_OP', p, 'of and by must differ');
    if (defined.has(op.as)) push('E_DUP_ID', `${p}.as`, `result id '${op.as}' already defined`);
    defined.add(op.as);
  });

  plan.transforms.forEach((t, i) => {
    const p = `transforms[${i}]`;
    if (t.kind === 'rotate' || t.kind === 'mirror') {
      t.targets.forEach((id, j) => {
        if (!defined.has(id)) push('E_UNKNOWN_REF', `${p}.targets[${j}]`, `'${id}' is not defined`);
      });
    }
    if (t.kind === 'ring' && !defined.has(t.target)) {
      push('E_UNKNOWN_REF', `${p}.target`, `'${t.target}' is not defined`);
    }
    if (t.kind === 'rotate' || t.kind === 'ring') checkAddr(t.about, `${p}.about`);
  });

  if (plan.style.strokeStep !== null) {
    if (plan.style.strokeStep < LIMITS.strokeStepMin || plan.style.strokeStep > LIMITS.strokeStepMax) {
      push(
        'E_STROKE_STEP',
        'style.strokeStep',
        `strokeStep must be in [${LIMITS.strokeStepMin}, ${LIMITS.strokeStepMax}] or null`,
      );
    }
  } else if (plan.style.render !== 'fill') {
    push('E_STROKE_STEP', 'style.strokeStep', `render '${plan.style.render}' requires a strokeStep`);
  }

  plan.optical.corrections.forEach((c, i) => {
    const p = `optical.corrections[${i}]`;
    if (!defined.has(c.target)) push('E_UNKNOWN_REF', `${p}.target`, `'${c.target}' is not defined`);
    if (Math.abs(c.dx) > LIMITS.maxOpticalShift || Math.abs(c.dy) > LIMITS.maxOpticalShift) {
      push('E_OPTICAL_RANGE', p, `|dx|,|dy| must be ≤ ${LIMITS.maxOpticalShift.toFixed(1)} (size·φ⁻⁴)`);
    }
    if (c.scale < LIMITS.opticalScaleMin || c.scale > LIMITS.opticalScaleMax) {
      push('E_OPTICAL_RANGE', `${p}.scale`, `scale must be in [${LIMITS.opticalScaleMin}, ${LIMITS.opticalScaleMax}]`);
    }
    if (c.reason.trim().length === 0) {
      push('E_OPTICAL_REASON', `${p}.reason`, 'every optical correction must state its reason');
    }
  });

  // At least one visible output: an id never consumed as an operand.
  const consumed = new Set<string>();
  plan.composite.forEach((op) => {
    consumed.add(op.of);
    consumed.add(op.by);
  });
  const visible = [...defined].filter((id) => !consumed.has(id));
  if (visible.length === 0) push('E_NOTHING_VISIBLE', 'composite', 'every shape is consumed; nothing to render');

  return issues.length > 0 ? { ok: false, issues } : { ok: true, plan };
}

/** Ids that survive to the rendered mark, in definition order. */
export function visibleIds(plan: ConstructionPlan): string[] {
  const consumed = new Set<string>();
  plan.composite.forEach((op) => {
    consumed.add(op.of);
    consumed.add(op.by);
  });
  const all = [...plan.elements.map((e) => e.id), ...plan.composite.map((c) => c.as)];
  return all.filter((id) => !consumed.has(id));
}
