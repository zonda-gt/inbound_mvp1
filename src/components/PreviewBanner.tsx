"use client";

import { useState } from "react";

type PreviewBannerProps = {
  hasLocation: boolean;
  city?: string | null;
  isDemoMode: boolean;
  demoReason: "outside_china" | "no_permission" | null;
};

export default function PreviewBanner({ hasLocation, city, isDemoMode, demoReason }: PreviewBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && !isDemoMode) return null;

  let bannerText: string;
  let bgClass: string;
  let textClass: string;

  if (isDemoMode) {
    if (demoReason === "outside_china") {
      bannerText = "\ud83c\udf0f You\u2019re not in China yet \u2014 exploring Shanghai in Demo Mode";
    } else {
      bannerText = "\ud83d\udccd Can\u2019t access your location \u2014 showing Shanghai demo";
    }
    bgClass = "bg-amber-50";
    textClass = "text-amber-700";
  } else if (hasLocation) {
    bannerText = `\ud83d\udccd Using your current location${city ? ` - ${city}` : ""}`;
    bgClass = "bg-blue-50";
    textClass = "text-blue-700";
  } else {
    bannerText = "\ud83d\udccd Preview mode \u2014 showing results for Shanghai";
    bgClass = "bg-blue-50";
    textClass = "text-blue-700";
  }

  return (
    <div className={`flex items-center justify-between ${bgClass} px-4 py-2 text-xs ${textClass}`}>
      <span>{bannerText}</span>
      {!isDemoMode && (
        <button
          onClick={() => setDismissed(true)}
          className="ml-3 shrink-0 text-blue-400 hover:text-blue-600"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      )}
    </div>
  );
}
