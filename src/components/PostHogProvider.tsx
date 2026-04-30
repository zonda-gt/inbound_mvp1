'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useRef } from 'react';
import { getAnonymousUserId, getDeviceType } from '@/lib/tracking';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || key === 'phc_your_key_here') return;

    initialized.current = true;
    posthog.init(key, {
      api_host: '/ingest',
      ui_host: 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      persistence: 'localStorage+cookie',
      disable_session_recording: false,
      capture_performance: {
        web_vitals: true,
        web_vitals_allowed_metrics: ['LCP', 'FCP', 'CLS', 'INP'],
      },
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: { password: true, email: true },
      },
      loaded: (ph) => {
        // Force-start session recording — don't rely on /decide auto-start
        // which can fail/timeout in Instagram's in-app browser
        ph.startSessionRecording();

        const anonId = getAnonymousUserId();
        if (anonId) ph.identify(anonId);
        const isInAppBrowser = /FBAN|FBAV|Instagram/i.test(navigator.userAgent);
        ph.register({ device_type: getDeviceType(), app_version: 'v2', is_in_app_browser: isInAppBrowser });

        // Track real page load time, split by browser type
        window.addEventListener('load', () => {
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
          ph.capture('page_load_complete', {
            load_time_ms: Math.round(nav?.loadEventEnd ?? performance.now()),
            ttfb_ms: nav ? Math.round(nav.responseStart - nav.requestStart) : undefined,
            dom_interactive_ms: nav ? Math.round(nav.domInteractive) : undefined,
            referrer: document.referrer,
            is_in_app_browser: isInAppBrowser,
            connection: (navigator as any)?.connection?.effectiveType || 'unknown',
          });
        });

        // Link Supabase user ID + email so PostHog shows real identity
        const supabase = getSupabaseBrowserClient();
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) {
            ph.identify(data.session.user.id, {
              email: data.session.user.email,
              name: data.session.user.user_metadata?.full_name,
            });
          }
        });
        supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            ph.identify(session.user.id, {
              email: session.user.email,
              name: session.user.user_metadata?.full_name,
            });
          }
        });
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
