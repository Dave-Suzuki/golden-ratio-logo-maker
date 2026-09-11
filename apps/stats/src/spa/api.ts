/** In-page implementation of the app's API: window.fetch calls to /api/* are answered here without a server. */
import { z } from 'zod';
import { buildReviewSet } from '../lib/review';
import { applyEvent } from '../lib/progress';
import { GivenSchema, ProgressEventSchema, ProfileNameSchema, QuestionRefSchema, QuestionSchema, TestSpecSchema } from '../lib/schemas';
import { buildTest, instantiate } from '../lib/testgen';
import { formatAnswer } from '../lib/grade';
import type { Given, Question } from '../lib/types';
import { serverSource } from '../lib/server/testSource';
import { serverReviewSource } from '../lib/server/reviewSource';
import { view } from '../lib/server/profiles';
import { chapters, extraSets, sectionById, teachFor, questionById } from './content';
import { getStore, storageKind } from './storage';
import { templateById, templatesFor } from '../../content/templates';

type Json = Record<string, unknown> | unknown[] | null;

function json(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
const bad = (message: string, status = 400) => json({ error: message }, status);

async function parseBody<T>(init: RequestInit | undefined, schema: z.ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; res: Response }> {
  let raw: unknown;
  try {
    raw = init?.body ? JSON.parse(String(init.body)) : {};
  } catch {
    return { ok: false, res: bad('invalid JSON body') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, res: bad(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')) };
  return { ok: true, data: parsed.data };
}

type SampleFn = ((input: string, opts?: Record<string, unknown>) => Promise<{ text: string }>) & { json<T>(input: string, opts?: Record<string, unknown>): Promise<T> };
let samplePromise: Promise<SampleFn | null> | null = null;
function sample(): Promise<SampleFn | null> {
  if (!samplePromise) {
    samplePromise = (async () => {
      try {
        const use = window.claude?.use;
        if (!use) return null;
        return (await use.call(window.claude, 'sample')) as SampleFn | null;
      } catch {
        return null;
      }
    })();
  }
  return samplePromise;
}

function describeGiven(given: Given, q: Question): string {
  switch (given.kind) {
    case 'mc':
      return q.kind === 'mc' ? `option ${String.fromCharCode(97 + given.index)}: ${q.options[given.index] ?? ''}` : String(given.index);
    case 'numeric':
      return given.raw;
    case 'fill':
      return given.values.join(', ');
    case 'tf':
      return given.value ? 'true' : 'false';
    case 'open':
      return given.text;
  }
}

async function explain(q: Question, given: Given): Promise<string[] | null> {
  const s = await sample();
  if (!s) return null;
  const teach = q.sectionId ? teachFor(q.sectionId) : null;
  const prompt = [
    'You are a patient introductory-statistics tutor (OpenStax Introductory Statistics 2e). A learner answered a question incorrectly.',
    'Explain, in 2–6 short numbered steps, how to reach the correct answer, and point out the specific misconception suggested by their answer. Use plain unicode math (μ, σ, x̄, p̂, √), never LaTeX.',
    'Reply with only a JSON object of the form {"steps": ["step 1", "step 2"]}.',
    '',
    `Section: ${q.sectionId ?? 'unknown'}${teach ? ` — ${teach.title}` : ''}`,
    teach?.formulaReview ? `Formula review:\n${teach.formulaReview.slice(0, 1500)}` : '',
    q.context ? `Context:\n${q.context}` : '',
    `Question:\n${q.stem}`,
    q.kind === 'mc' ? `Options:\n${q.options.map((o, i) => `${String.fromCharCode(97 + i)}. ${o}`).join('\n')}` : '',
    `Correct answer: ${formatAnswer(q)}`,
    q.explanation.length ? `Book solution:\n${q.explanation.join('\n')}` : '',
    `Learner's answer: ${describeGiven(given, q)}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  try {
    const out = await s.json<{ steps?: unknown }>(prompt, { modelTier: 'default' });
    const steps = Array.isArray(out?.steps) ? out.steps.map(String).filter(Boolean).slice(0, 8) : [];
    return steps.length ? steps : null;
  } catch {
    return null;
  }
}

export async function handle(url: URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const path = url.pathname;
  const store = getStore();

  if (path === '/api/health') return json({ ok: true, ai: Boolean(window.claude?.use), model: null, storage: await storageKind() });
  if (path === '/api/catalog') {
    return json({
      chapters: chapters().map((c) => ({ ...c, sections: c.sections.map((s) => ({ ...s, templates: templatesFor(s.id).length })) })),
      extra: extraSets(),
    });
  }
  let m: RegExpExecArray | null;
  if ((m = /^\/api\/teach\/([\d.]+)$/.exec(path))) {
    const section = sectionById(m[1] as string);
    return section ? json({ section, teach: teachFor(section.id) ?? null }) : bad('unknown section', 404);
  }
  if (path === '/api/test') {
    const num = (k: string) => (url.searchParams.has(k) ? Number(url.searchParams.get(k)) : undefined);
    const parsed = TestSpecSchema.safeParse({
      scope: url.searchParams.get('scope') ?? 'section',
      id: url.searchParams.get('id') ?? '',
      count: num('count') ?? 10,
      seed: num('seed') ?? Math.floor(Math.random() * 1_000_000),
      templateShare: num('templateShare'),
      openShare: num('openShare'),
      includeExtra: url.searchParams.has('includeExtra') ? url.searchParams.get('includeExtra') !== 'false' : undefined,
    });
    if (!parsed.success) return bad(parsed.error.issues.map((i) => i.message).join('; '));
    const test = buildTest(parsed.data, serverSource);
    return test.questions.length ? json(test as unknown as Json) : bad('no questions available for this scope', 404);
  }
  if (path === '/api/question' && method === 'POST') {
    const body = await parseBody(init, QuestionRefSchema);
    if (!body.ok) return body.res;
    const ref = body.data;
    if (ref.kind === 'bank') {
      const q = questionById(ref.id);
      return q ? json({ question: q }) : bad('unknown question', 404);
    }
    if (ref.kind === 'template') {
      const t = templateById(ref.templateId);
      return t ? json({ question: instantiate(t, ref.seed) }) : bad('unknown template', 404);
    }
    return json({ question: ref.snapshot });
  }
  if (path === '/api/explain' && method === 'POST') {
    const body = await parseBody(init, z.object({ question: QuestionSchema, given: GivenSchema }));
    if (!body.ok) return body.res;
    const explanation = await explain(body.data.question as Question, body.data.given as Given);
    return json({ explanation, source: explanation ? 'llm' : 'fallback' });
  }
  if (path === '/api/profiles') {
    if (method === 'GET') return json({ profiles: await store.list() });
    const body = await parseBody(init, ProfileNameSchema);
    if (!body.ok) return body.res;
    return json({ profile: view(await store.create(body.data.name)) });
  }
  if ((m = /^\/api\/profiles\/([a-z0-9-]+)$/.exec(path))) {
    const id = m[1] as string;
    if (method === 'DELETE') {
      await store.remove(id);
      return new Response(null, { status: 204 });
    }
    const p = await store.get(id);
    return p ? json({ profile: view(p) }) : bad('profile not found', 404);
  }
  if ((m = /^\/api\/profiles\/([a-z0-9-]+)\/events$/.exec(path)) && method === 'POST') {
    const id = m[1] as string;
    const body = await parseBody(init, ProgressEventSchema);
    if (!body.ok) return body.res;
    try {
      const p = await store.update(id, (profile) => applyEvent(profile, body.data));
      return json({ profile: view(p) });
    } catch (err) {
      return bad(err instanceof Error ? err.message : 'profile not found', 404);
    }
  }
  if ((m = /^\/api\/profiles\/([a-z0-9-]+)\/review$/.exec(path)) && method === 'POST') {
    const id = m[1] as string;
    const body = await parseBody(init, z.object({ count: z.number().int().min(1).max(40).default(8), seed: z.number().int().optional() }));
    if (!body.ok) return body.res;
    const profile = await store.get(id);
    if (!profile) return bad('profile not found', 404);
    return json(buildReviewSet(profile, body.data.count, body.data.seed ?? Date.now() % 2147483647, serverReviewSource) as unknown as Json);
  }
  return bad('not found', 404);
}

/** Route relative /api/* fetches to the in-page handler; everything else goes to the network. */
export function installFetchShim() {
  const real = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (href.startsWith('/api/')) return handle(new URL(href, 'http://local'), init);
    return real(input, init);
  }) as typeof window.fetch;
}
