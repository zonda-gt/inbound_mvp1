"use client";

import { useState, useMemo } from "react";
import type { NavigationData } from "@/lib/ai";
import { generateAmapTaxiLink } from "@/lib/taxi";
import MapView, { type RoutePolyline } from "./MapView";

// Shanghai Metro official line colors
const LINE_COLORS: Record<string, string> = {
  "1": "#E4002B",
  "2": "#97D700",
  "3": "#FFD100",
  "4": "#5C2D91",
  "5": "#A855F7",
  "6": "#E60073",
  "7": "#FF6900",
  "8": "#009DDC",
  "9": "#71C5E8",
  "10": "#C6A4CF",
  "11": "#872232",
  "12": "#007A61",
  "13": "#EF95CF",
  "14": "#827717",
  "15": "#BCA886",
  "16": "#32B16C",
  "17": "#BB8C3C",
  "18": "#D4A843",
};

function parseLineName(name: string) {
  const match = name.match(/地铁(\d+)号线/);
  if (match) {
    return {
      number: match[1],
      isMetro: true,
      display: `Line ${match[1]}`,
      color: LINE_COLORS[match[1]] || "#6B7280",
    };
  }
  return { number: null, isMetro: false, display: name, color: "#6B7280" };
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

export default function NavigationCard({ data, isDemoMode }: { data: NavigationData; isDemoMode?: boolean }) {
  const { destination, transit, walking } = data;
  const [copied, setCopied] = useState(false);
  const [showDriver, setShowDriver] = useState(false);
  const [showTaxiTooltip, setShowTaxiTooltip] = useState(false);

  const [lng, lat] = destination.location.split(",");
  const taxiLinks = generateAmapTaxiLink({
    name: destination.inputName,
    lat,
    lng,
    chineseName: destination.name,
  });

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
        const km = (walking.distance / 1000) * 0.8; // driving ≈ 80% of walking path
        const mins = Math.max(5, Math.round((km / 25) * 60));
        const cost = Math.max(14, Math.round(14 + Math.max(0, km - 3) * 2.5));
        return {
          timeLow: mins,
          timeHigh: Math.round(mins * 1.4),
          costLow: cost,
          costHigh: Math.round(cost * 1.3),
        };
      })()
    : null;

  // Only show Chinese name if it differs from the English input name
  const showChineseName =
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
        {showChineseName && (
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
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2F2F7] px-2.5 py-1.5 text-[13px] font-bold text-gray-900">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-50"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {transit.totalDuration} min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2F2F7] px-2.5 py-1.5 text-[13px] font-bold text-gray-900">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-50"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              {transit.cost}
            </span>
            {transit.transferCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[13px] font-bold text-amber-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-60"><path d="M4 17h16M4 7h16M7 17l3-10M14 17l3-10"/></svg>
                {transit.transferCount} transfer{transit.transferCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {/* Proportional route bar */}
          <div className="flex h-1 rounded-sm overflow-hidden gap-0.5 mt-2.5">
            {segments.map((seg, i) => {
              const lineInfo = seg.type === "transit" ? parseLineName(seg.lineName) : null;
              return (
                <div
                  key={i}
                  className="rounded-sm min-w-[6px]"
                  style={{
                    flex: seg.type === "walking" ? 1 : (seg.type === "transit" ? seg.stopCount : 1),
                    background: seg.type === "walking" ? "#D1D1D6" : (lineInfo?.color || "#007AFF"),
                  }}
                />
              );
            })}
          </div>
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
                    <div className="flex flex-col items-center w-8 shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"><path d="M4 17h16M4 7h16M7 17l3-10M14 17l3-10"/></svg>
                      </div>
                      {!isLast && (
                        <div className="flex-1 min-h-4 mt-1" style={{ width: 2, background: 'repeating-linear-gradient(to bottom, #D1D1D6 0px, #D1D1D6 4px, transparent 4px, transparent 8px)' }} />
                      )}
                    </div>
                    <div className="pb-4 pt-1.5">
                      <p className="text-sm font-semibold text-amber-700">
                        Transfer to {nextLine.display}
                      </p>
                      {seg.duration > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
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
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: isLast ? '#1A1A1A' : 'rgba(52,199,89,0.1)' }}>
                      {isLast ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2"/><path d="M13 7l-3 8 3 3 2 5"/><path d="M10 15l-3 5"/><path d="M10 7l5 3v4"/></svg>
                      )}
                    </div>
                    {!isLast && (
                      <div className="flex-1 min-h-4 mt-1" style={{ width: 2, background: 'repeating-linear-gradient(to bottom, #D1D1D6 0px, #D1D1D6 4px, transparent 4px, transparent 8px)' }} />
                    )}
                  </div>
                  <div className="pb-4 pt-1.5">
                    <p className="text-sm text-gray-600">
                      Walk {seg.duration} min ({fmtDist(seg.distance)}){walkTo}
                    </p>
                  </div>
                </div>
              );
            }

            // ── Transit (metro/bus) segment ──
            const line = parseLineName(seg.lineName);
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center w-8 shrink-0">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: line.color }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 11h16"/><path d="M12 3v8"/></svg>
                  </div>
                  {!isLast && (
                    <div
                      className="flex-1 min-h-4 mt-1 rounded-sm"
                      style={{ width: 3, backgroundColor: line.color + "25" }}
                    />
                  )}
                </div>
                <div className="pb-4 pt-1.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-white" style={{ background: line.color }}>
                      {line.display}
                    </span>
                    {seg.direction && (
                      <span className="text-xs text-gray-400">→ {seg.direction}</span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-700">
                    {seg.departureStop} → {seg.arrivalStop}
                  </p>
                  <span className="inline-flex items-center text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                    {seg.stopCount} stop{seg.stopCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Section D: Alternative options ── */}
      <div className="border-t border-gray-100 px-4 py-3">
        {taxiEst && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0"><path d="M5 17h14v-5l-2-5H7L5 12v5z"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9 7l1-3h4l1 3"/></svg>
            Taxi: ~{taxiEst.timeLow}-{taxiEst.timeHigh} min, ¥{taxiEst.costLow}-{taxiEst.costHigh}
          </div>
        )}
        {walking && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0"><circle cx="13" cy="4" r="2"/><path d="M13 7l-3 8 3 3 2 5"/><path d="M10 15l-3 5"/><path d="M10 7l5 3v4"/></svg>
            Walk: {fmtDist(walking.distance)}, ~{walking.duration} min
          </div>
        )}
      </div>

      {/* ── Section E: Action buttons ── */}
      <div className="border-t border-gray-100 px-4 py-4 space-y-2.5">
        <button
          onClick={() => {
            if (isDemoMode) {
              setShowTaxiTooltip(true);
              setTimeout(() => setShowTaxiTooltip(false), 3000);
            } else {
              window.location.href = taxiLinks.appLink;
              setTimeout(() => {
                window.open(taxiLinks.webLink, "_blank", "noopener,noreferrer");
              }, 1500);
            }
          }}
          className={`flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-[15px] font-bold text-white transition-all active:scale-[0.97] ${
            isDemoMode
              ? "bg-[#1A1A1A]/60 cursor-default"
              : "bg-[#1A1A1A] hover:bg-black shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="7" width="18" height="10" rx="3" fill="currentColor" fillOpacity="0.2"/>
            <rect x="3" y="7" width="18" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="7.5" cy="19" r="1.5" fill="currentColor"/>
            <circle cx="16.5" cy="19" r="1.5" fill="currentColor"/>
            <path d="M5 7l2-4h10l2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Take a Taxi
        </button>
        {showTaxiTooltip && (
          <div className="rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-center text-xs text-amber-700">
            Taxi feature works when you&apos;re in China
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white py-2.5 text-sm font-semibold text-gray-800 transition-all hover:bg-gray-50 active:scale-[0.97] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Copied
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5"/></svg>
                Copy Address
              </>
            )}
          </button>
          <button
            onClick={() => setShowDriver((v) => !v)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${
              showDriver
                ? "border-orange-400 bg-orange-50 text-orange-700"
                : "border-black/10 bg-white text-gray-800 hover:bg-gray-50 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 8h20" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 14h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Show Driver
          </button>
        </div>

        {showDriver && (
          <div className="rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50 border border-orange-200 px-4 py-6 text-center">
            <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-orange-500 mb-3">
              Show this to your driver
            </p>
            <p className="text-3xl font-black leading-snug text-gray-900" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              {destination.name}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {destination.address}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
