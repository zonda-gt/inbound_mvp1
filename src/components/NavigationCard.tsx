"use client";

import { useState } from "react";
import type { NavigationData } from "@/lib/ai";
import { generateAmapTaxiLink } from "@/lib/taxi";

export default function NavigationCard({ data }: { data: NavigationData }) {
  const { destination, transit, walking } = data;
  const [copied, setCopied] = useState(false);

  // Parse "lng,lat" into separate values
  const [lng, lat] = destination.location.split(",");

  const taxiLinks = generateAmapTaxiLink({
    name: destination.inputName,
    lat,
    lng,
    chineseName: destination.name,
  });

  const handleCopy = async () => {
    const text = `${destination.name}\n${destination.address}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Navigation
        </p>
        <h3 className="mt-0.5 text-lg font-bold text-gray-900">
          {destination.inputName}
        </h3>
        <p className="text-sm text-gray-500">{destination.address}</p>
      </div>

      {/* Transit route */}
      {transit && (
        <div className="px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
            🚇 Metro / Transit — {transit.totalDuration} min
          </p>
          <ol className="space-y-2">
            {transit.segments.map((seg, i) =>
              seg.type === "walking" ? (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 shrink-0">🚶</span>
                  <span>
                    Walk {seg.distance >= 1000
                      ? `${(seg.distance / 1000).toFixed(1)}km`
                      : `${seg.distance}m`}{" "}
                    (~{seg.duration} min)
                  </span>
                </li>
              ) : (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 shrink-0">
                    {seg.lineName.includes("地铁") ? "🚇" : "🚌"}
                  </span>
                  <span>
                    <span className="font-medium">{seg.lineName}</span>
                    <br />
                    {seg.departureStop} → {seg.arrivalStop} ({seg.stopCount}{" "}
                    stop{seg.stopCount !== 1 ? "s" : ""})
                  </span>
                </li>
              ),
            )}
          </ol>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span>⏱️ ~{transit.totalDuration} min</span>
            <span>💰 {transit.cost}</span>
            {transit.transferCount > 0 && (
              <span>🔄 {transit.transferCount} transfer{transit.transferCount !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      )}

      {/* Walking route */}
      {walking && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">
            🚶 Walk only:{" "}
            {walking.distance >= 1000
              ? `${(walking.distance / 1000).toFixed(1)}km`
              : `${walking.distance}m`}
            , ~{walking.duration} min
          </p>
        </div>
      )}

      {/* Show driver box */}
      <div className="border-t border-gray-200 bg-amber-50 px-4 py-4">
        <p className="text-xs font-medium text-amber-700">
          Show this to your driver:
        </p>
        <p className="mt-1.5 text-2xl font-bold leading-tight text-gray-900">
          {destination.name}
        </p>
        <p className="mt-1 text-sm text-gray-600">{destination.address}</p>
      </div>

      {/* Action buttons */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-2">
        <button
          onClick={() => {
            // Try the native Amap deep link first
            window.location.href = taxiLinks.appLink;
            // If the app doesn't open within 1.5s, fall back to web
            setTimeout(() => {
              window.open(taxiLinks.webLink, "_blank", "noopener,noreferrer");
            }, 1500);
          }}
          className="flex w-full items-center justify-center rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          🚕 Take a Taxi to {destination.name}
        </button>
        <p className="text-center text-[11px] text-gray-400">
          Opens Amap app · Falls back to web if not installed
        </p>

        <button
          onClick={handleCopy}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {copied ? "✅ Copied!" : "📋 Copy Chinese Address"}
        </button>
      </div>
    </div>
  );
}
