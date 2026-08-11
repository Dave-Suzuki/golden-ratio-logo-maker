import type * as paperTypes from './paperNS';
import { buildLattice, r0For, type Lattice, type Pt } from '../lattice';
import { ratioFor, type ConstructionPlan, type PlanElement } from '../schema/plan';
import { visibleIds } from '../validate';
import { paper, withScope } from './paper';
import type { ConstructionGeometry, MarkPath, MarkPaths, RenderResult } from './types';

const STROKE_W0 = 1000 / Math.pow((1 + Math.sqrt(5)) / 2, 4); // ≈ 145.9

export function strokeWeight(strokeStep: number): number {
  const PHI = (1 + Math.sqrt(5)) / 2;
  return STROKE_W0 * Math.pow(PHI, strokeStep);
}

/**
 * Deterministic plan → geometry. Pure: same plan, byte-identical output.
 * A fresh PaperScope per call keeps parallel renders isolated.
 */
export function renderPlan(plan: ConstructionPlan): RenderResult {
  const lattice = buildLattice(plan.canvas.lattice, plan.canvas.depth);
  const ratio = ratioFor(plan.family);
  const r0 = r0For(plan.canvas.lattice);
  const radiusOf = (step: number) => r0 * Math.pow(ratio, step);

  return withScope((scope) => {
    // 1. elements
    const items = new Map<string, paperTypes.Item[]>();
    for (const el of plan.elements) {
      items.set(el.id, [buildElement(scope, el, lattice, radiusOf)]);
    }

    // 2. composites (operands validated to be single items — booleans run before ring)
    for (const op of plan.composite) {
      const a = items.get(op.of)![0]! as paperTypes.PathItem;
      const b = items.get(op.by)![0]! as paperTypes.PathItem;
      const result =
        op.op === 'unite'
          ? a.unite(b, { insert: false })
          : op.op === 'subtract'
            ? a.subtract(b, { insert: false })
            : a.intersect(b, { insert: false });
      items.set(op.as, [result]);
    }

    // 3. visible set, in definition order
    const visible = new Map<string, paperTypes.Item[]>();
    for (const id of visibleIds(plan)) visible.set(id, items.get(id)!);

    // 4. transforms
    for (const t of plan.transforms) {
      if (t.kind === 'rotate') {
        const about = pt(lattice, t.about);
        for (const id of t.targets) {
          visible.get(id)?.forEach((item) => item.rotate(t.angle, new paper.Point(about.x, about.y)));
        }
      } else if (t.kind === 'mirror') {
        const center = new paper.Point(500, 500);
        for (const id of t.targets) {
          visible.get(id)?.forEach((item) => {
            if (t.axis === 'vertical') item.scale(-1, 1, center);
            else item.scale(1, -1, center);
          });
        }
      } else {
        const group = visible.get(t.target);
        if (group) {
          const about = pt(lattice, t.about);
          const copies: paperTypes.Item[] = [...group];
          for (let i = 1; i < t.count; i++) {
            for (const item of group) {
              const clone = item.clone({ insert: false });
              clone.rotate(t.angle * i, new paper.Point(about.x, about.y));
              copies.push(clone);
            }
          }
          visible.set(t.target, copies);
        }
      }
    }

    // 5. serialize pure state, then apply optical corrections and serialize again
    const markPure = serialize(visible, plan);
    const applied: RenderResult['opticalApplied'] = [];
    if (plan.optical.enabled) {
      for (const c of plan.optical.corrections) {
        const group = visible.get(c.target);
        if (!group) continue;
        for (const item of group) {
          item.translate(new paper.Point(c.dx, c.dy));
          if (c.scale !== 1) item.scale(c.scale, item.bounds.center);
        }
        applied.push(c);
      }
    }
    const mark = plan.optical.enabled && applied.length > 0 ? serialize(visible, plan) : markPure;

    return {
      size: 1000,
      mark,
      markPure,
      construction: buildConstruction(plan, lattice, radiusOf, ratio),
      opticalApplied: applied,
    };
  });
}

function pt(lattice: Lattice, addr: string): Pt {
  const p = lattice.points.get(addr);
  if (!p) throw new Error(`unvalidated plan: unknown lattice address '${addr}'`);
  return p;
}

function buildElement(
  scope: paperTypes.PaperScope,
  el: PlanElement,
  lattice: Lattice,
  radiusOf: (step: number) => number,
): paperTypes.Item {
  switch (el.type) {
    case 'circle': {
      const c = pt(lattice, el.at);
      return new paper.Path.Circle({ center: [c.x, c.y], radius: radiusOf(el.r.step), insert: false });
    }
    case 'arc': {
      const c = pt(lattice, el.at);
      const r = radiusOf(el.r.step);
      const at = (deg: number) => {
        const a = (deg * Math.PI) / 180;
        return new paper.Point(c.x + r * Math.cos(a), c.y + r * Math.sin(a));
      };
      return new paper.Path.Arc({
        from: at(el.startAngle),
        through: at(el.startAngle + el.sweep / 2),
        to: at(el.startAngle + el.sweep),
        insert: false,
      });
    }
    case 'line': {
      const a = pt(lattice, el.from);
      const b = pt(lattice, el.to);
      return new paper.Path.Line({ from: [a.x, a.y], to: [b.x, b.y], insert: false });
    }
    case 'polygon': {
      const c = pt(lattice, el.at);
      const r = radiusOf(el.r.step);
      const offset = el.pointUp ? -90 : -90 + 180 / el.sides;
      const segments: [number, number][] = [];
      for (let v = 0; v < el.sides; v++) {
        const a = ((offset + (v * 360) / el.sides) * Math.PI) / 180;
        segments.push([c.x + r * Math.cos(a), c.y + r * Math.sin(a)]);
      }
      return new paper.Path({ segments, closed: true, insert: false });
    }
    case 'rect': {
      const cell = lattice.cells.get(el.cell);
      if (!cell) throw new Error(`unvalidated plan: unknown cell '${el.cell}'`);
      return new paper.Path.Rectangle({
        point: [cell.x, cell.y],
        size: [cell.w, cell.h],
        insert: false,
      });
    }
  }
}

function serialize(visible: Map<string, paperTypes.Item[]>, plan: ConstructionPlan): MarkPaths {
  const paths: MarkPath[] = [];
  let nodeCount = 0;
  const weight = plan.style.strokeStep !== null ? strokeWeight(plan.style.strokeStep) : undefined;
  let bx1 = Infinity, by1 = Infinity, bx2 = -Infinity, by2 = -Infinity;

  for (const [, group] of visible) {
    for (const item of group) {
      const pathItem = item as paperTypes.PathItem;
      const d = pathItem.pathData;
      if (!d) continue;
      const open = isOpen(pathItem);
      const role: MarkPath['role'] =
        plan.style.render === 'fill' ? 'fill'
        : plan.style.render === 'stroke' ? 'stroke'
        : open ? 'stroke' : 'fill';
      const path: MarkPath = { d, role };
      if (role === 'stroke') path.strokeWidth = weight ?? strokeWeight(-3);
      paths.push(path);
      nodeCount += countNodes(pathItem);
      const b = item.bounds;
      const pad = role === 'stroke' ? (path.strokeWidth ?? 0) / 2 : 0;
      bx1 = Math.min(bx1, b.x - pad);
      by1 = Math.min(by1, b.y - pad);
      bx2 = Math.max(bx2, b.x + b.width + pad);
      by2 = Math.max(by2, b.y + b.height + pad);
    }
  }
  const bounds = Number.isFinite(bx1)
    ? { x: round3(bx1), y: round3(by1), w: round3(bx2 - bx1), h: round3(by2 - by1) }
    : { x: 0, y: 0, w: 1000, h: 1000 };
  return { paths, nodeCount, bounds };
}

function round3(n: number): number {
  return Number(n.toFixed(3));
}

function isOpen(item: paperTypes.PathItem): boolean {
  if ('closed' in item) return !(item as paperTypes.Path).closed;
  const children = (item as paperTypes.CompoundPath).children as paperTypes.Path[] | undefined;
  return children ? children.some((c) => !c.closed) : false;
}

function countNodes(item: paperTypes.PathItem): number {
  if ('segments' in item && (item as paperTypes.Path).segments) {
    return (item as paperTypes.Path).segments.length;
  }
  const children = (item as paperTypes.CompoundPath).children as paperTypes.Path[] | undefined;
  return children ? children.reduce((n, c) => n + c.segments.length, 0) : 0;
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶' };
function sup(n: number): string {
  return String(n).split('').map((ch) => SUP[ch] ?? ch).join('');
}

export function stepLabel(step: number, ratio: number): string {
  const sym = Math.abs(ratio - Math.SQRT2) < 1e-9 ? '√2' : 'φ';
  if (step === 0) return 'r₀';
  return `r₀·${sym}${sup(step)}`;
}

function buildConstruction(
  plan: ConstructionPlan,
  lattice: Lattice,
  radiusOf: (step: number) => number,
  ratio: number,
): ConstructionGeometry {
  const guideCircles: ConstructionGeometry['guideCircles'] = [];
  const anchors: ConstructionGeometry['anchors'] = [];
  const labels: ConstructionGeometry['labels'] = [];
  const seenAnchors = new Set<string>();

  const addAnchor = (addr: string) => {
    if (seenAnchors.has(addr)) return;
    seenAnchors.add(addr);
    const p = lattice.points.get(addr);
    if (p) anchors.push({ x: p.x, y: p.y, id: addr });
  };

  for (const el of plan.elements) {
    if (el.type === 'circle' || el.type === 'arc' || el.type === 'polygon') {
      addAnchor(el.at);
      const c = lattice.points.get(el.at)!;
      guideCircles.push({ cx: c.x, cy: c.y, r: radiusOf(el.r.step), label: stepLabel(el.r.step, ratio) });
      if (el.type === 'arc') {
        labels.push({ x: c.x, y: c.y - radiusOf(el.r.step) - 14, text: `${el.sweep}°` });
      }
    } else if (el.type === 'line') {
      addAnchor(el.from);
      addAnchor(el.to);
    }
  }
  for (const t of plan.transforms) {
    if (t.kind === 'rotate' || t.kind === 'ring') {
      addAnchor(t.about);
      const p = lattice.points.get(t.about)!;
      labels.push({ x: p.x + 12, y: p.y - 12, text: `${Math.abs(t.angle)}°` });
    }
  }

  const ratioText = plan.canvas.lattice === 'root2_grid' ? '1 : √2' : '1 : φ';
  const frame = lattice.rects[0];
  if (frame) {
    labels.push({ x: frame.x + frame.w - 8, y: frame.y - 10, text: ratioText });
  } else {
    labels.push({ x: 992, y: 30, text: ratioText });
  }

  return {
    latticeLines: lattice.lines,
    guideRects: lattice.rects,
    guideCircles,
    anchors,
    labels,
    spiralPath: lattice.spiralPath,
  };
}
