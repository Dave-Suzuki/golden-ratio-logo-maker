export interface Pt {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GuideLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** subdivision depth this line belongs to — drives staggered reveal animation */
  level: number;
}

export interface GuideRect extends Rect {
  label: string;
  level: number;
}

/**
 * A lattice is the complete address space a plan may reference.
 * Addresses are opaque strings resolved against `points`/`cells`;
 * the validator never parses coordinates out of an address.
 */
export interface Lattice {
  kind: 'golden_subdivision' | 'pentagonal' | 'root2_grid';
  depth: number;
  size: number;
  points: Map<string, Pt>;
  cells: Map<string, Rect>;
  /** display geometry for the construction reveal */
  lines: GuideLine[];
  rects: GuideRect[];
  /** SVG path data for the φ spiral (golden_subdivision only) */
  spiralPath?: string;
}

export const CANVAS_SIZE = 1000;
