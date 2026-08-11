import { z } from 'zod';
import { RotationAngleSchema } from './plan';
import { BrandBriefSchema } from './brief';

/**
 * A ParamDelta is the only way a mark changes: the same operations the sliders
 * perform, expressible by the NL-edit path. Applying a delta always goes back
 * through validatePlan, so a mark can never leave its proportion system (REF-1).
 */
export const ParamDeltaSchema = z.discriminatedUnion('op', [
  /** step the stroke weight along the φ series; direction ±1 */
  z.object({ op: z.literal('weight'), direction: z.union([z.literal(1), z.literal(-1)]) }),
  /** rotate the whole mark by a whitelisted angle */
  z.object({ op: z.literal('rotate'), angle: RotationAngleSchema }),
  /** grow/shrink the counterform (the `by` element of the first subtract) one φ-step */
  z.object({ op: z.literal('counterform'), direction: z.union([z.literal(1), z.literal(-1)]) }),
  /** toggle the optical-correction layer */
  z.object({ op: z.literal('optical'), enabled: z.boolean() }),
  /** mirror the whole mark */
  z.object({ op: z.literal('mirror'), axis: z.enum(['vertical', 'horizontal']) }),
  /** the request is beyond parameter reach: re-plan with an updated brief */
  z.object({ op: z.literal('replan'), brief: BrandBriefSchema, note: z.string() }),
  /** could not map the instruction; message shown to the user */
  z.object({ op: z.literal('unrecognized'), message: z.string() }),
]);

export type ParamDelta = z.infer<typeof ParamDeltaSchema>;
