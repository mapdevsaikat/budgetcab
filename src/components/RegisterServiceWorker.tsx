'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js so the app satisfies Chromium PWA installability (SW + manifest + HTTPS).
 * Dev parity: localhost is a secure context and can receive beforeinstallprompt when criteria match.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // Non-fatal: install UI still offers manual instructions when beforeinstallprompt is absent
      }
    };

    register();
  }, []);

  return null;
}
