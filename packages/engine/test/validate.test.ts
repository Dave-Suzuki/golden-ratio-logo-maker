import { describe, expect, it } from 'vitest';
import { validatePlan, visibleIds } from '../src/validate';
import { allCanonicalPlans, crescentPlan } from './fixtures';

const mutate = (fn: (p: any) => void) => {
  const p = JSON.parse(JSON.stringify(crescentPlan));
  fn(p);
  return p;
};

const codesOf = (raw: unknown) => {
  const r = validatePlan(raw);
  return r.ok ? [] : r.issues.map((i) => i.code);
};

describe('validatePlan — acceptance', () => {
  it('accepts every canonical family plan', () => {
    for (const plan of allCanonicalPlans) {
      const r = validatePlan(plan);
      expect(r.ok, JSON.stringify(!r.ok && r.issues)).toBe(true);
    }
  });

  it('visibleIds returns only unconsumed shapes', () => {
    expect(visibleIds(crescentPlan)).toEqual(['crescent']);
  });
});

describe('validatePlan — rejection', () => {
  it('rejects off-lattice addresses', () => {
    expect(codesOf(mutate((p) => (p.elements[0].at = 'L9.4')))).toContain('E_OFF_LATTICE');
    expect(codesOf(mutate((p) => (p.elements[0].at = 'nonsense')))).toContain('E_OFF_LATTICE');
  });

  it('rejects addresses beyond the plan depth', () => {
    // depth 4 → L5 does not exist
    expect(codesOf(mutate((p) => (p.elements[0].at = 'L5.4')))).toContain('E_OFF_LATTICE');
  });

  it('rejects unknown composite references and forward references', () => {
    expect(codesOf(mutate((p) => (p.composite[0].of = 'ghost')))).toContain('E_UNKNOWN_REF');
    expect(
      codesOf(
        mutate((p) => {
          p.composite = [
            { op: 'subtract', of: 'later', by: 'a', as: 'x' },
            { op: 'unite', of: 'b', by: 'x', as: 'later' },
          ];
        }),
      ),
    ).toContain('E_UNKNOWN_REF');
  });

  it('rejects duplicate ids', () => {
    expect(codesOf(mutate((p) => (p.elements[1].id = 'a')))).toContain('E_DUP_ID');
    expect(codesOf(mutate((p) => (p.composite[0].as = 'b')))).toContain('E_DUP_ID');
  });

  it('rejects out-of-range depth and radius steps', () => {
    expect(codesOf(mutate((p) => (p.canvas.depth = 9)))).toContain('E_DEPTH');
    expect(codesOf(mutate((p) => (p.canvas.depth = 1)))).toContain('E_DEPTH');
    expect(codesOf(mutate((p) => (p.elements[0].r.step = -9)))).toContain('E_STEP_RANGE');
    expect(codesOf(mutate((p) => (p.elements[0].r.step = 3)))).toContain('E_STEP_RANGE');
  });

  it('rejects a non-whitelisted rotation angle smuggled via raw JSON', () => {
    const p = mutate((q) => {
      q.transforms = [{ kind: 'rotate', targets: ['crescent'], angle: 45, about: 'L1.4' }];
    });
    expect(codesOf(p)).toContain('E_SCHEMA');
  });

  it('rejects a family/lattice mismatch', () => {
    expect(codesOf(mutate((p) => (p.canvas.lattice = 'pentagonal')))).toContain('E_LATTICE_MISMATCH');
  });

  it('rejects oversized or unexplained optical corrections', () => {
    expect(codesOf(mutate((p) => (p.optical.corrections[0].dx = 300)))).toContain('E_OPTICAL_RANGE');
    expect(codesOf(mutate((p) => (p.optical.corrections[0].scale = 1.5)))).toContain('E_OPTICAL_RANGE');
    expect(codesOf(mutate((p) => (p.optical.corrections[0].reason = ' ')))).toContain('E_OPTICAL_REASON');
  });

  it('rejects element overflow and empty plans', () => {
    expect(
      codesOf(
        mutate((p) => {
          for (let i = 0; i < 13; i++) {
            p.elements.push({ type: 'circle', id: `x${i}`, at: 'L1.4', r: { step: -1 } });
          }
        }),
      ),
    ).toContain('E_TOO_MANY_ELEMENTS');
    expect(codesOf(mutate((p) => (p.elements = [])))).toContain('E_EMPTY');
  });

  it('requires a strokeStep when the render mode strokes', () => {
    expect(codesOf(mutate((p) => (p.style = { strokeStep: null, render: 'stroke' })))).toContain('E_STROKE_STEP');
    expect(codesOf(mutate((p) => (p.style = { strokeStep: 0, render: 'stroke' })))).toContain('E_STROKE_STEP');
  });

  it('never throws on garbage input', () => {
    expect(validatePlan(null).ok).toBe(false);
    expect(validatePlan({}).ok).toBe(false);
    expect(validatePlan('phi').ok).toBe(false);
  });
});
