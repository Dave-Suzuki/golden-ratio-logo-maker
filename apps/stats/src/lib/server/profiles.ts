import { toView } from '../progress';
import type { Profile, ProfileView } from '../types';
import { sections } from './content';

export function view(p: Profile): ProfileView {
  return toView(
    p,
    sections().map((s) => s.id),
  );
}
