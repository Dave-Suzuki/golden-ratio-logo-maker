import { BrandBriefSchema, normalizeBrief, type BrandBrief } from '../schema/brief';

/**
 * Deterministic, rule-based prompt → BrandBrief. This is the no-API-key path;
 * its output goes through the same zod schema as the LLM interpreter's.
 */
export function fallbackInterpret(prompt: string): BrandBrief {
  const text = prompt.toLowerCase();

  const industry = matchFirst(text, [
    [/coffee|roast|cafe|espresso/, 'food_beverage/coffee'],
    [/restaurant|food|bakery|brew|kitchen|bar\b/, 'food_beverage'],
    [/app\b|software|saas|tech|developer|startup|ai\b|data/, 'technology'],
    [/law|legal|attorney|consult|finance|account/, 'professional_services'],
    [/health|clinic|wellness|yoga|fitness|care/, 'health_wellness'],
    [/shop|store|boutique|retail|market/, 'retail'],
    [/studio|design|art|photo|music|craft/, 'creative'],
    [/farm|garden|nature|outdoor|trail/, 'nature_outdoors'],
    [/school|learn|tutor|education|academy/, 'education'],
  ]) ?? 'general';

  const personality = PERSONALITY_WORDS.filter((w) => text.includes(w)).slice(0, 3);
  if (personality.length === 0) personality.push('balanced');

  const subject = matchFirst(text, MOTIF_PATTERNS) ?? 'geometric form';
  const metaphors = METAPHOR_MAP[subject] ?? [];

  const abstraction = /abstract|minimal|pure|reduced/.test(text)
    ? 0.8
    : /literal|realistic|recognizable|clearly/.test(text)
      ? 0.25
      : 0.55;

  const form_language = /organic|hand|natural|flowing|soft/.test(text)
    ? ('organic' as const)
    : /modular|grid|systematic|block/.test(text)
      ? ('modular' as const)
      : /calligraph|script|brush/.test(text)
        ? ('calligraphic' as const)
        : ('geometric' as const);

  const logo_type = /lettermark|monogram|initial|letter\b/.test(text)
    ? ('lettermark' as const)
    : subject !== 'geometric form'
      ? ('pictorial' as const)
      : ('abstract' as const);

  const proportion_system = /root\s?2|√2|yamato|大和/.test(text) ? ('root2' as const) : ('phi' as const);

  const temperature = /warm|cozy|earthy|sunny/.test(text)
    ? ('warm' as const)
    : /cool|calm|fresh|crisp|ocean|tech/.test(text)
      ? ('cool' as const)
      : ('neutral' as const);

  const brief: BrandBrief = {
    name: extractName(prompt),
    industry,
    personality,
    motif: { subject, metaphors, abstraction },
    form_language,
    logo_type,
    proportion_system,
    palette_intent: {
      temperature,
      contrast: /bold|strong|high contrast/.test(text) ? 'high' : 'medium',
    },
    constraints: {
      monochrome_required: /monochrome|black and white|single color/.test(text),
      min_size_px: 24,
      avoid: ANTI_CLICHE[industry] ?? [],
    },
  };
  return normalizeBrief(BrandBriefSchema.parse(brief));
}

function matchFirst(text: string, patterns: [RegExp, string][]): string | null {
  for (const [re, value] of patterns) {
    if (re.test(text)) return value;
  }
  return null;
}

/** A quoted phrase wins; else the first Title-Case run; else Untitled. */
function extractName(prompt: string): string {
  const quoted = prompt.match(/["“”']([^"“”']{2,40})["“”']/);
  if (quoted) return quoted[1]!.trim();
  const title = prompt.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/);
  if (title) return title[1]!;
  return 'Untitled';
}

const PERSONALITY_WORDS = [
  'warm', 'precise', 'bold', 'minimal', 'playful', 'elegant', 'calm', 'modern',
  'trustworthy', 'friendly', 'serious', 'quiet', 'confident', 'crafted', 'honest',
];

const MOTIF_PATTERNS: [RegExp, string][] = [
  [/crescent|moon/, 'crescent'],
  [/leaf|plant|botanical/, 'leaf'],
  [/mountain|peak|summit/, 'mountain'],
  [/wave|water|river|ocean/, 'wave'],
  [/star\b/, 'star'],
  [/sun\b|sunrise|dawn/, 'sun'],
  [/bird|wing|feather/, 'bird'],
  [/bridge/, 'bridge'],
  [/book|page|story/, 'book'],
  [/arrow|forward|direction/, 'arrow'],
  [/drop|dew|rain/, 'drop'],
  [/circle|ring|round/, 'circle'],
  [/knot|loop|weave/, 'knot'],
  [/bean\b/, 'bean'],
  [/flower|bloom|petal/, 'flower'],
];

const METAPHOR_MAP: Record<string, string[]> = {
  crescent: ['moon', 'curve', 'openness'],
  leaf: ['growth', 'nature'],
  mountain: ['stability', 'ambition'],
  wave: ['motion', 'flow'],
  star: ['guidance', 'quality'],
  sun: ['energy', 'beginning'],
  bird: ['freedom', 'lightness'],
  bridge: ['connection'],
  book: ['knowledge', 'story'],
  arrow: ['progress', 'direction'],
  drop: ['essence', 'purity'],
  circle: ['wholeness', 'continuity'],
  knot: ['craft', 'binding'],
  bean: ['origin', 'seed'],
  flower: ['bloom', 'symmetry'],
};

const ANTI_CLICHE: Record<string, string[]> = {
  'food_beverage/coffee': ['cup', 'steam'],
  food_beverage: ['fork', 'chef hat'],
  technology: ['circuit', 'swoosh'],
  health_wellness: ['heart', 'cross'],
  creative: ['lightbulb', 'pencil'],
  professional_services: ['pillar', 'scales'],
};
