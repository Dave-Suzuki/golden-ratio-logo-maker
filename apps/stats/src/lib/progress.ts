import { grade } from './grade';
import type { ConceptReview, Mastery, Profile, ProfileView, ProgressEvent, SectionId } from './types';

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
    const tag = ev.question.conceptTag;

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
