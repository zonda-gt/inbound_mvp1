'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useRef } from 'react';
import { getAnonymousUserId, getDeviceType } from '@/lib/tracking';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || key === 'phc_your_key_here') return;

    initialized.current = true;
    posthog.init(key, {
      api_host: host || 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      persistence: 'localStorage',
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: { password: true, email: true },
      },
      loaded: (ph) => {
        const anonId = getAnonymousUserId();
        if (anonId) ph.identify(anonId);
        ph.register({ device_type: getDeviceType(), app_version: 'v2' });
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
