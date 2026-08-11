import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@kiwari/engine'],
  // paper-core's Node emulation layer optionally requires jsdom inside a
  // try/catch; keep it un-bundled server-side so webpack doesn't chase it.
  serverExternalPackages: ['paper'],
};

export default nextConfig;
