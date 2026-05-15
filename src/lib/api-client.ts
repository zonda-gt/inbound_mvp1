const DEFAULT_REMOTE_API_BASE_URL = "https://app.hellochina.chat";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured) return trimTrailingSlash(configured);

  if (typeof window === "undefined") return "";

  const protocol = window.location.protocol;
  const isBundledCapacitor =
    protocol === "capacitor:" ||
    protocol === "ionic:" ||
    protocol === "file:";

  return isBundledCapacitor ? DEFAULT_REMOTE_API_BASE_URL : "";
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = normalizePath(path);
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
