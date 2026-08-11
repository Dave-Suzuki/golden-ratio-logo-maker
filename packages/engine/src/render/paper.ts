// paper-core: the canvas-free build — works identically in Node (vitest, API routes)
// and the browser. Each render creates a fresh scope, so no state leaks between calls.
import paperCore from 'paper/dist/paper-core.js';
import type * as P from './paperNS';

export const paper = paperCore as P.PaperScope;

export function withScope<T>(fn: (scope: P.PaperScope) => T): T {
  const scope = new paper.PaperScope();
  scope.setup(new paper.Size(1000, 1000));
  try {
    return fn(scope);
  } finally {
    scope.project?.remove();
  }
}
