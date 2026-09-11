import type { Template } from '../../src/lib/types';
import { CH02_TEMPLATES } from './ch02';
import { CH03_TEMPLATES } from './ch03';
import { CH04_TEMPLATES } from './ch04';
import { CH06_TEMPLATES } from './ch06';
import { CH07_TEMPLATES } from './ch07';
import { CH08_TEMPLATES } from './ch08';
import { CH09_TEMPLATES } from './ch09';

export const TEMPLATES: Template[] = [
  ...CH02_TEMPLATES,
  ...CH03_TEMPLATES,
  ...CH04_TEMPLATES,
  ...CH06_TEMPLATES,
  ...CH07_TEMPLATES,
  ...CH08_TEMPLATES,
  ...CH09_TEMPLATES,
];

export function templatesFor(sectionId: string): Template[] {
  return TEMPLATES.filter((t) => t.sectionId === sectionId);
}

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
