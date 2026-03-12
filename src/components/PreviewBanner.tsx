"use client";

import { useState } from "react";

type PreviewBannerProps = {
  hasLocation: boolean;
  city?: string | null;
  isDemoMode: boolean;
  demoReason: "outside_china" | "no_permission" | null;
  onLocationGranted?: (lat: number, lng: number) => void;
};

export default function PreviewBanner({ hasLocation, city, isDemoMode, demoReason, onLocationGranted }: PreviewBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  if (dismissed && !isDemoMode) return null;

  const handleEnableLocation = () => {
    if (!navigator.geolocation || requesting) return;
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRequesting(false);
        onLocationGranted?.(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setRequesting(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );
  };

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

  const showEnableButton = isDemoMode && demoReason === "no_permission";

  return (
    <div className={`flex items-center justify-between ${bgClass} px-4 py-2 text-xs ${textClass}`}>
      {showEnableButton ? (
        <>
          <span>📍 Location access is off</span>
          <button
            onClick={handleEnableLocation}
            disabled={requesting}
            className="ml-3 shrink-0 rounded-full bg-amber-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {requesting ? "Requesting…" : "Enable Location"}
          </button>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
