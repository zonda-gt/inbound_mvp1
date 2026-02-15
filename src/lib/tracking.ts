// Utilities for user tracking and analytics

const ANON_USER_ID_KEY = "anon_user_id";
const REFERRAL_SOURCE_KEY = "referral_source";
const SESSION_ID_KEY = "current_session_id";

/**
 * Get or create persistent anonymous user ID
 * This ID persists across sessions to track returning users
 */
export function getAnonymousUserId(): string {
  if (typeof window === "undefined") return "";

  let userId = localStorage.getItem(ANON_USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(ANON_USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * Capture referral source from URL ?ref= parameter
 * Store in sessionStorage (persists for current visit only)
 */
export function captureReferralSource(): string | null {
  if (typeof window === "undefined") return null;

  // Check if we already captured it in this session
  const existing = sessionStorage.getItem(REFERRAL_SOURCE_KEY);
  if (existing) return existing;

  // Check URL for ?ref= parameter
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (ref) {
    sessionStorage.setItem(REFERRAL_SOURCE_KEY, ref);
    return ref;
  }

  return null;
}

/**
 * Detect device type from user agent
 */
export function getDeviceType(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent.toLowerCase();
  const isMobile =
    /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);

  return isMobile ? "mobile" : "desktop";
}

/**
 * Get entry page (URL path when session started)
 */
export function getEntryPage(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname;
}

/**
 * Store current session ID in sessionStorage
 */
export function setCurrentSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_ID_KEY, sessionId);
}

/**
 * Get current session ID from sessionStorage
 */
export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_ID_KEY);
}

/**
 * Clear current session (used when starting a new chat session)
 */
export function clearCurrentSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_ID_KEY);
}

/**
 * Get current GPS coordinates (non-blocking)
 * Returns null if GPS unavailable or user denies permission
 */
export function getCurrentLocation(
  timeout = 2000,
): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const timeoutId = setTimeout(() => resolve(null), timeout);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        clearTimeout(timeoutId);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout, maximumAge: 30000 },
    );
  });
}
