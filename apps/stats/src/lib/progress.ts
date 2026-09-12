import { grade } from './grade';
import type { ConceptReview, Given, Mastery, Profile, ProfileView, ProgressEvent, Question, SectionId } from './types';

/**
 * What "a concept" is for the review loop. The bank tags every question with its section, and
 * treating that as the concept meant two right answers to any two questions in §1.3 marked every
 * §1.3 mistake understood — including ones never asked again. A concept is now the question
 * itself: a bank item by id, a generated item by its template (so a retest gets fresh numbers).
 * Each missed question has to be answered right twice before it is considered understood.
 */
/** The learner's answer as they would say it. Options are shuffled per test, so a letter means nothing later. */
export function describeGiven(q: Question, g: Given): string {
  switch (g.kind) {
    case 'mc':
      return q.kind === 'mc' ? (q.options[g.index] ?? `option ${g.index + 1}`) : `option ${g.index + 1}`;
    case 'numeric':
      return g.raw;
    case 'tf':
      return g.value ? 'True' : 'False';
    case 'fill':
      return g.values.join(', ');
    case 'open':
      // what they wrote is the useful record; whether they marked it missed is already implied by
      // the entry being in the mistake log at all
      return g.text.trim() || (g.selfMark === 'missed' ? 'left blank, marked as missed' : 'left blank');
  }
}

export function conceptKey(q: Pick<Question, 'id' | 'source'>): string {
  return q.source === 'template' ? q.id.split('#')[0] ?? q.id : q.id;
}

export const REVIEW_STREAK = 2;
export const MASTER_SCORE = 0.8;

export function newProfile(id: string, name: string, now = new Date().toISOString()): Profile {
  return {
    id,
    name,
    version: 1,
    createdAt: now,
    updatedAt: now,
    attempts: [],
    mistakes: [],
    review: {},
    sectionStats: {},
    openSessions: {},
  };
}

/**
 * Pure reducer over learner events. Re-grades every auto-gradable answer itself; for open items it
 * trusts only the learner's explicit self-mark. Mistakes, review streaks and section stats are all
 * derived here so the storage layer stays a dumb load/save.
 */
export function applyEvent(profile: Profile, ev: ProgressEvent): Profile {
  const at = ev.at ?? new Date().toISOString();
  const p: Profile = {
    ...profile,
    attempts: [...profile.attempts],
    mistakes: [...profile.mistakes],
    review: { ...profile.review },
    sectionStats: { ...profile.sectionStats },
    openSessions: { ...profile.openSessions },
    updatedAt: at,
  };

  if (ev.type === 'answer') {
    const result = grade(ev.question, ev.given);
    if (result.correct === null) return profile; // open item without a self-mark yet: nothing to record
    const sid = ev.question.sectionId;
    const tag = conceptKey(ev.question);

    if (sid) {
      const st = { ...(p.sectionStats[sid] ?? { answered: 0, correct: 0 }) };
      st.answered += 1;
      if (result.correct) st.correct += 1;
      st.lastAt = at;
      p.sectionStats[sid] = st;
    }

    const sess = p.openSessions[ev.sessionId] ?? { spec: ev.spec, total: 0, correct: 0, sectionIds: [], startedAt: at };
    const sectionIds = sid && !sess.sectionIds.includes(sid) ? [...sess.sectionIds, sid] : sess.sectionIds;
    p.openSessions[ev.sessionId] = {
      ...sess,
      total: sess.total + 1,
      correct: sess.correct + (result.correct ? 1 : 0),
      sectionIds,
    };

    const existing = p.review[tag];
    if (result.correct) {
      if (existing && existing.status === 'open') {
        const streak = existing.streak + 1;
        p.review[tag] = {
          ...existing,
          streak,
          lastAt: at,
          status: streak >= existing.required ? 'understood' : 'open',
        };
      }
    } else {
      p.mistakes.push({
        id: `${ev.sessionId}:${ev.question.id}:${p.mistakes.length}`,
        at,
        ref: ev.ref,
        sectionId: sid,
        conceptTag: tag,
        stem: ev.question.stem,
        given: ev.given,
        correctDisplay: result.correctDisplay,
        context: ev.context,
        scenario: ev.question.context ?? null,
        givenDisplay: describeGiven(ev.question, ev.given),
      });
      const cr: ConceptReview = existing
        ? { ...existing, streak: 0, status: 'open', lastAt: at, misses: existing.misses + 1 }
        : { conceptTag: tag, sectionId: sid, streak: 0, required: REVIEW_STREAK, status: 'open', lastAt: at, misses: 1 };
      p.review[tag] = cr;
    }
    return p;
  }

  if (ev.type === 'finish') {
    const sess = p.openSessions[ev.sessionId];
    if (!sess) return p;
    delete p.openSessions[ev.sessionId];
    if (sess.total === 0) return p;
    p.attempts.push({
      id: ev.sessionId,
      at,
      spec: ev.spec,
      total: sess.total,
      correct: sess.correct,
      sectionIds: sess.sectionIds,
    });
    if (ev.spec.scope !== 'review') {
      const score = sess.correct / sess.total;
      for (const sid of sess.sectionIds) {
        const st = { ...(p.sectionStats[sid] ?? { answered: 0, correct: 0 }) };
        st.lastScore = score;
        st.lastAt = at;
        p.sectionStats[sid] = st;
      }
    }
    return p;
  }
  return p;
}

export function openConcepts(profile: Profile): ConceptReview[] {
  return Object.values(profile.review)
    .filter((r) => r.status === 'open')
    .sort((a, b) => a.lastAt.localeCompare(b.lastAt));
}

export function computeMastery(profile: Profile, sectionIds: readonly SectionId[]): Record<SectionId, Mastery> {
  const open = new Set(openConcepts(profile).map((r) => r.sectionId));
  const out: Record<SectionId, Mastery> = {};
  for (const sid of sectionIds) {
    const st = profile.sectionStats[sid];
    if (!st || st.answered === 0) out[sid] = 'not_started';
    else if ((st.lastScore ?? 0) >= MASTER_SCORE && !open.has(sid)) out[sid] = 'mastered';
    else out[sid] = 'in_progress';
  }
  return out;
}

export function toView(profile: Profile, sectionIds: readonly SectionId[]): ProfileView {
  return { ...profile, mastery: computeMastery(profile, sectionIds), openConcepts: openConcepts(profile) };
}
