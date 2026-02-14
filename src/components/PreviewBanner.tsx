"use client";

import { useState } from "react";

export default function PreviewBanner({ hasLocation, city }: { hasLocation: boolean; city?: string | null }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 px-4 py-2 text-xs text-blue-700">
      <span>
        {hasLocation
          ? `📍 Using your current location${city ? ` - ${city}` : ""}`
          : "📍 Preview mode — showing results for Tokyo. Enable location for personalized results."}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-3 shrink-0 text-blue-400 hover:text-blue-600"
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
