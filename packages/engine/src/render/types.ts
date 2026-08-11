import type { GuideLine, GuideRect } from '../lattice/types';
import type { OpticalCorrection } from '../schema/plan';

export interface MarkPath {
  d: string;
  role: 'fill' | 'stroke';
  strokeWidth?: number;
}

export interface MarkPaths {
  paths: MarkPath[];
  nodeCount: number;
}

export interface GuideCircle {
  cx: number;
  cy: number;
  r: number;
  label: string;
}

export interface ConstructionGeometry {
  latticeLines: GuideLine[];
  guideRects: GuideRect[];
  guideCircles: GuideCircle[];
  anchors: { x: number; y: number; id: string }[];
  labels: { x: number; y: number; text: string }[];
  spiralPath?: string;
}

export interface RenderResult {
  size: number;
  /** the mark with optical corrections applied (if enabled) */
  mark: MarkPaths;
  /** the pure mathematical state — corrections off (REF-3 honesty toggle) */
  markPure: MarkPaths;
  construction: ConstructionGeometry;
  opticalApplied: OpticalCorrection[];
}
