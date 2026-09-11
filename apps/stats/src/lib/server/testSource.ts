import { templatesFor } from '../../../content/templates';
import type { ContentSource } from '../testgen';
import { bankFor, chapterOf, testItems } from './content';

/** Wires generated content + TS templates into the deterministic test builder. */
export const serverSource: ContentSource = {
  bank: (sectionId, includeExtra) => bankFor(sectionId, { includeExtra }),
  templates: (sectionId) => templatesFor(sectionId),
  sectionsOfChapter: (chapter) => chapterOf(chapter)?.sections.map((s) => s.id) ?? [],
  testItems: (prefix, n) => testItems(prefix, n),
};
