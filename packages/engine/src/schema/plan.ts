import { z } from 'zod';
import { LogoTypeSchema } from './brief';

/**
 * The ConstructionPlan DSL (PRD §8.3).
 *
 * Conformance is structural: radii are only expressible as φ-steps (r = r₀·ratio^step),
 * positions only as lattice addresses, rotations only as whitelisted angles.
 * Numeric *ranges* (depth, step bounds, correction magnitudes) live in validate.ts —
 * the structured-output API strips min/max constraints from wire schemas.
 */

export const FamilySchema = z.enum([
  'phi_circle_chain',
  'golden_rect_subdivision',
  'pentagonal',
  'root2_grid',
]);
export type Family = z.infer<typeof FamilySchema>;

export const LatticeKindSchema = z.enum(['golden_subdivision', 'pentagonal', 'root2_grid']);
export type LatticeKind = z.infer<typeof LatticeKindSchema>;

/** Whitelisted rotation angles (degrees). Arbitrary rotation is rejected. */
export const ROTATION_ANGLES = [137.5, -137.5, 72, -72, 90, -90, 60, -60] as const;
/** Whitelisted arc start angles (degrees, 0 = +x axis, positive clockwise in SVG space). */
export const ARC_START_ANGLES = [0, 45, 60, 72, 90, 120, 135, 137.5, 144, 180, 216, 225, 270, 315] as const;
/** Whitelisted arc sweeps (degrees). */
export const ARC_SWEEPS = [60, 72, 90, 120, 137.5, 144, 180, 216, 270, 300] as const;
/** Whitelisted ring-repetition counts. */
export const RING_COUNTS = [2, 3, 4, 5, 6] as const;

const literalUnion = <T extends readonly number[]>(values: T) =>
  z.union(values.map((v) => z.literal(v)) as unknown as [z.ZodLiteral<number>, z.ZodLiteral<number>, ...z.ZodLiteral<number>[]]);

export const RotationAngleSchema = literalUnion(ROTATION_ANGLES);
export const ArcStartSchema = literalUnion(ARC_START_ANGLES);
export const ArcSweepSchema = literalUnion(ARC_SWEEPS);
export const RingCountSchema = literalUnion(RING_COUNTS);

/** A radius expressed as a step on the lattice's geometric series: r = r₀ · ratio^step. */
export const StepRefSchema = z.object({ step: z.number().int() });
export type StepRef = z.infer<typeof StepRefSchema>;

export const ElementSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('circle'), id: z.string(), at: z.string(), r: StepRefSchema }),
  z.object({
    type: z.literal('arc'),
    id: z.string(),
    at: z.string(),
    r: StepRefSchema,
    startAngle: ArcStartSchema,
    sweep: ArcSweepSchema,
  }),
  z.object({ type: z.literal('line'), id: z.string(), from: z.string(), to: z.string() }),
  z.object({
    type: z.literal('polygon'),
    id: z.string(),
    at: z.string(),
    r: StepRefSchema,
    sides: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    pointUp: z.boolean(),
  }),
  z.object({ type: z.literal('rect'), id: z.string(), cell: z.string() }),
]);
export type PlanElement = z.infer<typeof ElementSchema>;

export const CompositeOpSchema = z.object({
  op: z.enum(['unite', 'subtract', 'intersect']),
  of: z.string(),
  by: z.string(),
  as: z.string(),
});
export type CompositeOp = z.infer<typeof CompositeOpSchema>;

export const TransformSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('rotate'),
    targets: z.array(z.string()),
    angle: RotationAngleSchema,
    about: z.string(),
  }),
  z.object({
    kind: z.literal('mirror'),
    targets: z.array(z.string()),
    axis: z.enum(['vertical', 'horizontal']),
  }),
  z.object({
    kind: z.literal('ring'),
    target: z.string(),
    count: RingCountSchema,
    angle: RotationAngleSchema,
    about: z.string(),
  }),
]);
export type PlanTransform = z.infer<typeof TransformSchema>;

export const OpticalCorrectionSchema = z.object({
  target: z.string(),
  dx: z.number(),
  dy: z.number(),
  scale: z.number(),
  reason: z.string(),
});
export type OpticalCorrection = z.infer<typeof OpticalCorrectionSchema>;

export const ConstructionPlanSchema = z.object({
  version: z.literal(1),
  family: FamilySchema,
  logoType: LogoTypeSchema,
  canvas: z.object({
    size: z.literal(1000),
    lattice: LatticeKindSchema,
    depth: z.number().int(),
  }),
  elements: z.array(ElementSchema),
  composite: z.array(CompositeOpSchema),
  transforms: z.array(TransformSchema),
  style: z.object({
    /** stroke weight = w₀ · φ^step (w₀ = size/φ⁴ ≈ 145.9); null = filled shapes only */
    strokeStep: z.number().int().nullable(),
    render: z.enum(['stroke', 'fill', 'mixed']),
  }),
  optical: z.object({
    enabled: z.boolean(),
    corrections: z.array(OpticalCorrectionSchema),
  }),
});
export type ConstructionPlan = z.infer<typeof ConstructionPlanSchema>;

/** Which lattice each family constructs on. */
export const FAMILY_LATTICE: Record<Family, LatticeKind> = {
  phi_circle_chain: 'golden_subdivision',
  golden_rect_subdivision: 'golden_subdivision',
  pentagonal: 'pentagonal',
  root2_grid: 'root2_grid',
};

/** The geometric ratio each family's step series is built on. */
export const PHI = (1 + Math.sqrt(5)) / 2;
export const ROOT2 = Math.SQRT2;
export function ratioFor(family: Family): number {
  return family === 'root2_grid' ? ROOT2 : PHI;
}
