import { templateById, TEMPLATES } from '../../../content/templates';
import type { ReviewSource } from '../review';
import { instantiate } from '../testgen';
import { allQuestions, questionById } from './content';

export const serverReviewSource: ReviewSource = {
  // a concept key is a question id or a template id (see conceptKey); older profiles still carry
  // section tags, which keep working through the conceptTag match
  byTag: (tag) => allQuestions().filter((q) => (q.id === tag || q.conceptTag === tag) && !q.needsFigure),
  templatesByTag: (tag) => TEMPLATES.filter((t) => t.id === tag || t.conceptTag === tag),
  resolve: (ref) => {
    if (ref.kind === 'bank') return questionById(ref.id);
    if (ref.kind === 'template') {
      const t = templateById(ref.templateId);
      return t ? instantiate(t, ref.seed) : undefined;
    }
    return ref.snapshot;
  },
};
