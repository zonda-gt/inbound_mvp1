// Utilities for user tracking and analytics

const ANON_USER_ID_KEY = "anon_user_id";
const REFERRAL_SOURCE_KEY = "referral_source";
const UTM_SOURCE_KEY = "utm_source";
const UTM_MEDIUM_KEY = "utm_medium";
const UTM_CAMPAIGN_KEY = "utm_campaign";
const ATTRIBUTION_CAPTURED_AT_KEY = "attribution_captured_at";
const ATTRIBUTION_CAPTURED_VISIT_KEY = "attribution_captured_visit";
const SESSION_ID_KEY = "current_session_id";

function normalizeAttributionToken(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function persistAttribution(
  referralSource: string,
  utmSource: string | null,
  utmMedium: string | null,
  utmCampaign: string | null,
): void {
  localStorage.setItem(REFERRAL_SOURCE_KEY, referralSource);
  localStorage.setItem(ATTRIBUTION_CAPTURED_AT_KEY, new Date().toISOString());
  sessionStorage.setItem(ATTRIBUTION_CAPTURED_VISIT_KEY, "1");

  if (utmSource) localStorage.setItem(UTM_SOURCE_KEY, utmSource);
  else localStorage.removeItem(UTM_SOURCE_KEY);

  if (utmMedium) localStorage.setItem(UTM_MEDIUM_KEY, utmMedium);
  else localStorage.removeItem(UTM_MEDIUM_KEY);

  if (utmCampaign) localStorage.setItem(UTM_CAMPAIGN_KEY, utmCampaign);
  else localStorage.removeItem(UTM_CAMPAIGN_KEY);
}

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
 * Capture referral source using UTM params first, then document.referrer.
 * Persist in localStorage so attribution survives page navigation before chat starts.
 */
export function captureReferralSource(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const utmSource = normalizeAttributionToken(params.get("utm_source"));
  const utmMedium = normalizeAttributionToken(params.get("utm_medium"));
  const utmCampaign = normalizeAttributionToken(params.get("utm_campaign"));
  const hasAnyUtm = Boolean(utmSource || utmMedium || utmCampaign);

  if (hasAnyUtm) {
    const source = utmSource || "unknown";
    const medium = utmMedium || "direct";
    const referralSource = `${source}/${medium}`;
    persistAttribution(referralSource, utmSource, utmMedium, utmCampaign);
    return referralSource;
  }

  const existing = localStorage.getItem(REFERRAL_SOURCE_KEY);
  const alreadyCapturedThisVisit =
    sessionStorage.getItem(ATTRIBUTION_CAPTURED_VISIT_KEY) === "1";
  if (alreadyCapturedThisVisit && existing) {
    return existing;
  }

  const referrer = document.referrer.toLowerCase();
  let referralSource = "direct";

  if (referrer.includes("reddit.com")) {
    referralSource = "reddit/direct";
  } else if (referrer.includes("facebook.com")) {
    referralSource = "facebook/direct";
  } else if (!referrer) {
    referralSource = "direct";
  }

  persistAttribution(referralSource, null, null, null);
  return referralSource;
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
