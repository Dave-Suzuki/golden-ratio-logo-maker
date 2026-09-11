import type { AnchorHTMLAttributes, ReactNode } from 'react';

/** Stand-in for next/link inside the single-page build: routes live in the URL hash. */
export default function Link({ href, children, ...rest }: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const target = href.startsWith('http') ? href : `#${href}`;
  return (
    <a href={target} {...rest}>
      {children}
    </a>
  );
}
