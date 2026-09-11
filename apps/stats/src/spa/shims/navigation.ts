import { useSyncExternalStore } from 'react';

/** Stand-ins for next/navigation on top of hash routing (#/path?query). */
function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function currentRoute(): { path: string; query: string } {
  const h = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = h.split('?');
  return { path: path || '/', query };
}

export function useHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash, () => '');
}

export function useSearchParams(): URLSearchParams {
  const hash = useHash();
  void hash;
  return new URLSearchParams(currentRoute().query);
}

export function useRouter() {
  return {
    push(href: string) {
      window.location.hash = href;
    },
    replace(href: string) {
      const url = new URL(window.location.href);
      url.hash = href;
      window.history.replaceState(null, '', url.toString());
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
    back() {
      window.history.back();
    },
  };
}

export class NotFoundError extends Error {}

export function notFound(): never {
  throw new NotFoundError('not found');
}
