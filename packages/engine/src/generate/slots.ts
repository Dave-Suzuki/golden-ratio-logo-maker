import type { BrandBrief, LogoType } from '../schema/brief';
import type { Family } from '../schema/plan';

export type AbstractionBand = 'low' | 'mid' | 'high';

export interface GenerationSlot {
  index: number;
  family: Family;
  band: AbstractionBand;
  logoType: LogoType;
}

const ALL_FAMILIES: Family[] = [
  'phi_circle_chain',
  'golden_rect_subdivision',
  'pentagonal',
  'root2_grid',
];

export function preferredFamily(brief: BrandBrief): Family {
  if (brief.proportion_system === 'root2') return 'root2_grid';
  if (brief.form_language === 'modular') return 'golden_rect_subdivision';
  return 'phi_circle_chain';
}

/**
 * The 9-candidate batch is diverse by construction (GEN-1): the brief's preferred
 * family gets 3 slots, every other family gets 2 — all four families always appear.
 * Abstraction bands and logo types cycle so no two slots share the whole triple.
 */
export function buildSlots(brief: BrandBrief): GenerationSlot[] {
  const pref = preferredFamily(brief);
  const others = ALL_FAMILIES.filter((f) => f !== pref);
  const families: Family[] = [
    pref,
    others[0]!,
    others[1]!,
    others[2]!,
    pref,
    others[0]!,
    others[1]!,
    others[2]!,
    pref,
  ];
  const bands: AbstractionBand[] =
    brief.motif.abstraction < 0.34
      ? ['low', 'low', 'mid', 'low', 'mid', 'high', 'low', 'mid', 'low']
      : brief.motif.abstraction > 0.67
        ? ['high', 'mid', 'high', 'high', 'low', 'mid', 'high', 'high', 'mid']
        : ['mid', 'low', 'high', 'mid', 'mid', 'low', 'high', 'mid', 'low'];

  const base = brief.logo_type;
  const alt1: LogoType = base === 'abstract' ? 'pictorial' : 'abstract';
  const alt2: LogoType = base === 'lettermark' ? 'combination' : 'lettermark';
  const types: LogoType[] = [base, base, alt1, base, alt2, base, alt1, base, base];

  return families.map((family, index) => ({
    index,
    family,
    band: bands[index]!,
    logoType: types[index]!,
  }));
}
