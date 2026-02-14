"use client";

import { useState, useMemo } from "react";
import type { NavigationData } from "@/lib/ai";
import MapView, { type RoutePolyline } from "./MapView";

// Common transit line colors for Japan/Korea systems
const LINE_COLORS: Record<string, string> = {
  // Tokyo Metro
  "Ginza": "#FF9500",
  "Marunouchi": "#F62E36",
  "Hibiya": "#B5B5AC",
  "Tozai": "#009BBF",
  "Chiyoda": "#00BB85",
  "Yurakucho": "#C1A470",
  "Hanzomon": "#8F76D6",
  "Namboku": "#00AC9B",
  "Fukutoshin": "#9C5E31",
  // JR / Yamanote
  "Yamanote": "#9ACD32",
  "Chuo": "#FF4500",
  "Sobu": "#FFD700",
  // Seoul Metro
  "1": "#0052A4",
  "2": "#00A84D",
  "3": "#EF7C1C",
  "4": "#00A5DE",
  "5": "#996CAC",
  "6": "#CD7C2F",
  "7": "#747F00",
  "8": "#E6186C",
  "9": "#BDB092",
};

function getLineColor(lineName: string): string {
  // Check for exact matches first
  for (const [key, color] of Object.entries(LINE_COLORS)) {
    if (lineName.includes(key)) return color;
  }
  // Extract number for Seoul-style numbered lines
  const numMatch = lineName.match(/\b(\d+)\b/);
  if (numMatch && LINE_COLORS[numMatch[1]]) {
    return LINE_COLORS[numMatch[1]];
  }
  return "#6B7280";
}

function parseLineName(name: string) {
  const color = getLineColor(name);
  // Check if it looks like a metro/subway line
  const isMetro = /metro|subway|line|号線|호선/i.test(name) ||
    /^[A-Z]\d*$/.test(name) || // Single letter + optional number (e.g. "G" for Ginza)
    /^\d+$/.test(name); // Just a number
  const numMatch = name.match(/(\d+)/);

  return {
    number: numMatch ? numMatch[1] : null,
    isMetro,
    display: name,
    color,
  };
}

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

function parsePolylineStr(str: string): Array<[number, number]> {
  return str
    .split(";")
    .map((p) => {
      const [lng, lat] = p.split(",").map(Number);
      return [lng, lat] as [number, number];
    })
    .filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat));
}

export default function NavigationCard({ data }: { data: NavigationData }) {
  const { destination, transit, walking } = data;
  const [copied, setCopied] = useState(false);
  const [showDriver, setShowDriver] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      `${destination.name}\n${destination.address}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Rough taxi estimate from walking-route distance
  const taxiEst = walking
    ? (() => {
        const km = (walking.distance / 1000) * 0.8;
        const mins = Math.max(5, Math.round((km / 25) * 60));
        // Use a generic cost range (currency varies by country)
        const baseCost = Math.max(500, Math.round(500 + Math.max(0, km - 2) * 300));
        return {
          timeLow: mins,
          timeHigh: Math.round(mins * 1.4),
          costLow: baseCost,
          costHigh: Math.round(baseCost * 1.3),
        };
      })()
    : null;

  // Only show local name if it differs from the English input name
  const showLocalName =
    destination.name !== destination.inputName &&
    destination.name !== destination.address;

  const segments = transit?.segments || [];

  // Build route polylines for the map
  const routeData = useMemo(() => {
    const originCoords = data.origin.split(",").map(Number) as [number, number];
    const destCoords = destination.location.split(",").map(Number) as [number, number];

    const polylines: RoutePolyline[] = [];
    for (const seg of segments) {
      if (!seg.polyline) continue;
      const path = parsePolylineStr(seg.polyline);
      if (path.length < 2) continue;

      if (seg.type === "walking") {
        polylines.push({ path, color: "#9CA3AF", dashed: true });
      } else {
        const line = parseLineName(seg.lineName);
        polylines.push({ path, color: line.color });
      }
    }

    return { origin: originCoords, destination: destCoords, polylines };
  }, [data.origin, destination.location, segments]);

  const hasPolylines = routeData.polylines.length > 0;

  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ── Section A: Header ── */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-xl font-bold text-gray-900 leading-tight">
          {destination.inputName}
        </h3>
        {showLocalName && (
          <p className="mt-0.5 text-[15px] text-gray-500">
            {destination.name}
          </p>
        )}
        <p className="mt-0.5 text-sm text-gray-400">{destination.address}</p>
      </div>

      {/* ── Map ── */}
      {hasPolylines && (
        <div className="px-4 pb-3">
          <MapView
            route={routeData}
            height="180px"
            userLocation={routeData.origin}
            isApproximateLocation={false}
          />
        </div>
      )}

      {/* ── Section B: Key stats badges ── */}
      {transit && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            ⏱ {transit.totalDuration} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            💰 {transit.cost}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${
              transit.transferCount > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            🔄 {transit.transferCount} transfer
            {transit.transferCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Section C: Step-by-step route timeline ── */}
      {segments.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-4">
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const nextSeg = segments[i + 1];
            const prevSeg = i > 0 ? segments[i - 1] : null;

            if (seg.type === "walking") {
              // ── Transfer walk (between two transit segments) ──
              const isTransfer =
                prevSeg?.type === "transit" && nextSeg?.type === "transit";

              if (isTransfer) {
                const nextLine = parseLineName(
                  (nextSeg as Extract<typeof nextSeg, { type: "transit" }>)
                    .lineName
                );
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center w-7 shrink-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs">
                        🔄
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 min-h-4 bg-gray-200" />
                      )}
                    </div>
                    <div className="pb-4 pt-1">
                      <p className="text-sm font-medium text-amber-700">
                        Transfer to {nextLine.display}
                      </p>
                      {seg.duration > 0 && (
                        <p className="text-xs text-gray-400">
                          Walk {seg.duration} min ({fmtDist(seg.distance)})
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              // ── Regular walking step ──
              let walkTo = "";
              if (isLast) {
                walkTo = ` to ${destination.inputName}`;
              } else if (nextSeg?.type === "transit") {
                walkTo = ` to ${(nextSeg as Extract<typeof nextSeg, { type: "transit" }>).departureStop}`;
              }

              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center w-7 shrink-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs">
                      {isLast ? "📍" : "🚶"}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 flex-1 min-h-4 bg-gray-200" />
                    )}
                  </div>
                  <div className="pb-4 pt-1">
                    <p className="text-sm text-gray-500">
                      Walk {seg.duration} min ({fmtDist(seg.distance)})
                      {walkTo}
                    </p>
                  </div>
                </div>
              );
            }

            // ── Transit (metro/train/bus) segment ──
            const line = parseLineName(seg.lineName);
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center w-7 shrink-0">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[10px] font-bold"
                    style={{ backgroundColor: line.color }}
                  >
                    {line.number || "🚃"}
                  </div>
                  {!isLast && (
                    <div
                      className="w-0.5 flex-1 min-h-4"
                      style={{ backgroundColor: line.color + "30" }}
                    />
                  )}
                </div>
                <div className="pb-4 pt-1 space-y-0.5">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: line.color }}
                  >
                    {line.display}
                    {seg.direction && (
                      <span className="font-normal text-gray-400">
                        {" "}
                        → toward {seg.direction}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="text-xs text-gray-400 mr-1.5">Board</span>
                    {seg.departureStop}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="text-xs text-gray-400 mr-1.5">Exit</span>
                    {seg.arrivalStop}
                  </p>
                  <p className="text-xs text-gray-400">
                    {seg.stopCount} stop{seg.stopCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Section D: Alternative options ── */}
      <div className="border-t border-gray-100 px-4 py-3">
        {taxiEst && (
          <p className="text-sm text-gray-500">
            🚕 Taxi alternative: ~{taxiEst.timeLow}-{taxiEst.timeHigh} min,
            ~¥{taxiEst.costLow}-{taxiEst.costHigh}
          </p>
        )}
        {walking && (
          <p className="text-xs text-gray-400 mt-1">
            🚶 Walk only: {fmtDist(walking.distance)}, ~{walking.duration} min
          </p>
        )}
      </div>

      {/* ── Section E: Action buttons ── */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {copied ? "✅ Copied!" : "📋 Copy Address"}
          </button>
          <button
            onClick={() => setShowDriver((v) => !v)}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
              showDriver
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            📱 Show Driver
          </button>
        </div>

        {showDriver && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-5 text-center">
            <p className="text-xs font-medium text-amber-600 mb-2">
              Show this to your taxi driver:
            </p>
            <p className="text-3xl font-bold leading-snug text-gray-900">
              {destination.name}
            </p>
            <p className="mt-1.5 text-base text-gray-600">
              {destination.address}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
