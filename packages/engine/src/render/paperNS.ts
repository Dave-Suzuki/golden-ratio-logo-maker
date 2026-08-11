// Type-only bridge to Paper.js's ambient `paper` namespace (paper.d.ts declares it
// globally). This file must not bind a local value named `paper`, or the namespace
// reference would be shadowed.
import type {} from 'paper';

export type Item = paper.Item;
export type PathItem = paper.PathItem;
export type Path = paper.Path;
export type CompoundPath = paper.CompoundPath;
export type PaperScope = paper.PaperScope;
export type Point = paper.Point;
