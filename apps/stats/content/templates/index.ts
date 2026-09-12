import type { Template } from '../../src/lib/types';
import { CH01_TEMPLATES } from './ch01';
import { CH02_DISPLAY_TEMPLATES, CH02_TEMPLATES } from './ch02';
import { CH03_TEMPLATES } from './ch03';
import { CH04_TEMPLATES } from './ch04';
import { CH05_TEMPLATES } from './ch05';
import { CH06_TEMPLATES } from './ch06';
import { CH07_TEMPLATES } from './ch07';
import { CH08_TEMPLATES } from './ch08';
import { CH09_TEMPLATES } from './ch09';
import { CH10_TEMPLATES } from './ch10';
import { CH11_HOMOGENEITY_TEMPLATES, CH11_TEMPLATES } from './ch11';
import { CH12_GRAPH_TEMPLATES, CH12_TEMPLATES } from './ch12';
import { CH13_TEMPLATES } from './ch13';

export const TEMPLATES: Template[] = [
  ...CH01_TEMPLATES,
  ...CH02_TEMPLATES,
  ...CH02_DISPLAY_TEMPLATES,
  ...CH03_TEMPLATES,
  ...CH04_TEMPLATES,
  ...CH05_TEMPLATES,
  ...CH06_TEMPLATES,
  ...CH07_TEMPLATES,
  ...CH08_TEMPLATES,
  ...CH09_TEMPLATES,
  ...CH10_TEMPLATES,
  ...CH11_TEMPLATES,
  ...CH11_HOMOGENEITY_TEMPLATES,
  ...CH12_TEMPLATES,
  ...CH12_GRAPH_TEMPLATES,
  ...CH13_TEMPLATES,
];

export function templatesFor(sectionId: string): Template[] {
  return TEMPLATES.filter((t) => t.sectionId === sectionId);
}

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
