import posthog from 'posthog-js';

// ── Event property types ──

type EventMap = {
  // CORE
  screen_view: { screen: string };
  search: { query: string; result_count: number; tab?: string };
  search_result_click: { slug: string; type: 'restaurant' | 'attraction' | 'collection'; query: string };
  place_view: { slug: string; type: 'restaurant' | 'attraction'; source?: string };
  place_save: { slug: string; type: 'restaurant' | 'attraction'; action: 'save' | 'unsave' };
  place_go: { slug: string; type: 'restaurant' | 'attraction' };
  place_ask: { slug: string; type: 'restaurant' | 'attraction' };
  place_share: { slug: string; type: 'restaurant' | 'attraction'; format: string };

  // NAVIGATION
  navigate_search: { destination: string };
  navigate_mode_select: { mode: 'metro' | 'taxi' | 'walk'; destination: string };
  navigate_deeplink: { app: 'amap' | 'didi'; destination: string };
  booking_form_open: { destination: string };
  booking_submit: { destination: string; guests: number };
  booking_abandoned: { destination: string; step_reached: string };

  // LENS
  lens_capture: { method: 'capture' | 'upload' };
  lens_scan_complete: { mode: string; has_response: boolean };
  lens_followup: { question_text: string; scan_mode: string };

  // AUTH
  auth_start: { method: 'apple' | 'google' | 'email' };
  auth_complete: { method: string };

  // BROWSE
  carousel_swipe: { carousel: string; index: number; direction: 'left' | 'right' };
  discover_tab_switched: { tab: 'eat' | 'experience' | 'drink' };
  filter_tapped: { filter: string; tab: string };
  neighbourhood_tapped: { neighbourhood: string };
  phrase_played: { phrase: string };
};

// ── Track function ──

export function track<E extends keyof EventMap>(event: E, properties: EventMap[E]): void {
  try {
    posthog.capture(event, properties);
  } catch {
    // PostHog not initialized — silently ignore
  }
}
