import { z } from 'zod';

const base = {
  id: z.string().min(1),
  sectionId: z.string().nullable(),
  conceptTag: z.string().min(1),
  stem: z.string().min(1),
  context: z.string().nullable().optional(),
  explanation: z.array(z.string()),
  source: z.string(),
  sourceRef: z.record(z.string(), z.unknown()).optional(),
  needsFigure: z.boolean().optional(),
  license: z.string().optional(),
};

export const QuestionSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('mc'), options: z.array(z.string()).min(2).max(6), correctIndex: z.number().int().min(0) }),
  z.object({ ...base, kind: z.literal('numeric'), answer: z.number(), tolerance: z.object({ abs: z.number().min(0).optional(), rel: z.number().min(0).optional() }), unit: z.string().nullable().optional() }),
  z.object({ ...base, kind: z.literal('fill'), blanks: z.array(z.object({ label: z.string(), answer: z.string().min(1), accept: z.array(z.string()).optional() })).min(1), symbolSet: z.enum(['hypothesis', 'notation']).optional() }),
  z.object({ ...base, kind: z.literal('tf'), answer: z.boolean() }),
  z.object({ ...base, kind: z.literal('open'), modelSolution: z.string().min(1), rubric: z.array(z.string()).optional() }),
]);

export const GivenSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('mc'), index: z.number().int().min(0) }),
  z.object({ kind: z.literal('numeric'), raw: z.string().max(80) }),
  z.object({ kind: z.literal('fill'), values: z.array(z.string().max(40)).max(8) }),
  z.object({ kind: z.literal('tf'), value: z.boolean() }),
  z.object({ kind: z.literal('open'), text: z.string().max(4000), selfMark: z.enum(['got', 'missed']).optional() }),
]);

export const TestSpecSchema = z.object({
  scope: z.enum(['section', 'chapter', 'practice-test', 'final', 'review']),
  id: z.string().min(1).max(20),
  count: z.number().int().min(1).max(100),
  seed: z.number().int().min(0),
  templateShare: z.number().min(0).max(1).optional(),
  openShare: z.number().min(0).max(1).optional(),
  includeExtra: z.boolean().optional(),
});

export const QuestionRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('bank'), id: z.string() }),
  z.object({ kind: z.literal('template'), templateId: z.string(), seed: z.number().int() }),
  z.object({ kind: z.literal('llm'), snapshot: QuestionSchema }),
]);

export const ProgressEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('answer'),
    sessionId: z.string().min(1).max(80),
    spec: TestSpecSchema,
    context: z.enum(['quiz', 'review']),
    question: QuestionSchema,
    ref: QuestionRefSchema,
    given: GivenSchema,
    at: z.string().datetime().optional(),
  }),
  z.object({ type: z.literal('finish'), sessionId: z.string().min(1).max(80), spec: TestSpecSchema, at: z.string().datetime().optional() }),
]);

export const ProfileNameSchema = z.object({ name: z.string().trim().min(1).max(40) });
