import { z } from 'zod';

export const FormLanguageSchema = z.enum(['geometric', 'organic', 'calligraphic', 'modular']);
export const LogoTypeSchema = z.enum(['pictorial', 'abstract', 'lettermark', 'combination']);
export const ProportionSystemSchema = z.enum(['phi', 'root2']);
export const TemperatureSchema = z.enum(['warm', 'cool', 'neutral']);
export const ContrastSchema = z.enum(['high', 'medium', 'low']);

export const BrandBriefSchema = z.object({
  name: z.string(),
  industry: z.string(),
  personality: z.array(z.string()),
  motif: z.object({
    subject: z.string(),
    metaphors: z.array(z.string()),
    /** 0 = literal … 1 = pure abstract. Range enforced by the validator, not the wire schema. */
    abstraction: z.number(),
  }),
  form_language: FormLanguageSchema,
  logo_type: LogoTypeSchema,
  proportion_system: ProportionSystemSchema,
  palette_intent: z.object({
    temperature: TemperatureSchema,
    contrast: ContrastSchema,
  }),
  constraints: z.object({
    monochrome_required: z.boolean(),
    min_size_px: z.number(),
    avoid: z.array(z.string()),
  }),
});

export type BrandBrief = z.infer<typeof BrandBriefSchema>;
export type LogoType = z.infer<typeof LogoTypeSchema>;
export type FormLanguage = z.infer<typeof FormLanguageSchema>;

/** Clamp free-range numeric fields into their legal ranges (LLM output can drift). */
export function normalizeBrief(brief: BrandBrief): BrandBrief {
  return {
    ...brief,
    personality: brief.personality.slice(0, 3),
    motif: {
      ...brief.motif,
      abstraction: Math.min(1, Math.max(0, brief.motif.abstraction)),
      metaphors: brief.motif.metaphors.slice(0, 5),
    },
    constraints: {
      ...brief.constraints,
      min_size_px: Math.min(256, Math.max(8, Math.round(brief.constraints.min_size_px || 24))),
    },
  };
}
