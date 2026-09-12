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

/** The correct answer without the option letter, which is shuffled per test and meaningless later. */
function plainAnswer(q: Question, correctDisplay: string): string {
  return q.kind === 'mc' ? (q.options[q.correctIndex] ?? correctDisplay) : correctDisplay;
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

    const sessBefore = p.openSessions[ev.sessionId];
    // Two tabs on one quiz, or a resubmitted answer, used to be counted twice: a five-question
    // quiz became "answered 10" with mistakes logged for questions answered right in the other tab.
    if (sessBefore?.answered?.includes(ev.question.id)) return profile;

    if (sid) {
      const st = { ...(p.sectionStats[sid] ?? { answered: 0, correct: 0 }) };
      st.answered += 1;
      if (result.correct) st.correct += 1;
      st.lastAt = at;
      p.sectionStats[sid] = st;
    }

    const sess = p.openSessions[ev.sessionId] ?? { spec: ev.spec, total: 0, correct: 0, sectionIds: [], startedAt: at };
    const sectionIds = sid && !sess.sectionIds.includes(sid) ? [...sess.sectionIds, sid] : sess.sectionIds;
    const bySection = { ...(sess.bySection ?? {}) };
    if (sid) {
      const cur = bySection[sid] ?? { total: 0, correct: 0 };
      bySection[sid] = { total: cur.total + 1, correct: cur.correct + (result.correct ? 1 : 0) };
    }
    p.openSessions[ev.sessionId] = {
      ...sess,
      total: sess.total + 1,
      correct: sess.correct + (result.correct ? 1 : 0),
      sectionIds,
      bySection,
      answered: [...(sess.answered ?? []), ev.question.id],
    };

    const existing = p.review[tag];
    if (result.correct) {
      // A generated question's concept is its generator, so the same quiz can serve two more of
      // them; answering those must not clear a miss the learner has not come back to. Progress on
      // a concept only counts from a later sitting than the one it was missed in.
      const advance = (key: string) => {
        const c = p.review[key];
        if (!c || c.status !== 'open' || c.missedIn === ev.sessionId) return;
        const streak = c.streak + 1;
        p.review[key] = { ...c, streak, lastAt: at, status: streak >= c.required ? 'understood' : 'open' };
      };
      advance(tag);
      // profiles written before concepts were per question key them by section; without this their
      // entries can never be worked off, because no answer ever matches the key again
      if (sid && sid !== tag) advance(sid);
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
        correctPlain: plainAnswer(ev.question, result.correctDisplay),
        context: ev.context,
        scenario: ev.question.context ?? null,
        givenDisplay: describeGiven(ev.question, ev.given),
      });
      const cr: ConceptReview = existing
        ? { ...existing, streak: 0, status: 'open', lastAt: at, misses: existing.misses + 1, missedIn: ev.sessionId }
        : { conceptTag: tag, sectionId: sid, streak: 0, required: REVIEW_STREAK, status: 'open', lastAt: at, misses: 1, missedIn: ev.sessionId };
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
      for (const sid of sess.sectionIds) {
        const st = { ...(p.sectionStats[sid] ?? { answered: 0, correct: 0 }) };
        // a chapter quiz used to stamp its overall score on every section it touched, so a section
        // the learner got 0 of 6 right in showed the chapter's 35%
        const own = sess.bySection?.[sid];
        st.lastScore = own && own.total > 0 ? own.correct / own.total : sess.correct / sess.total;
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
