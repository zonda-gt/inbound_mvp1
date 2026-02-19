"use client";

import { useEffect, useRef, useState } from "react";
import { useAMap } from "@/hooks/useAMap";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RoutePolyline = {
  path: Array<[number, number]>; // [lng, lat][]
  color: string;
  dashed?: boolean;
};

export type MapMarker = {
  position: [number, number]; // [lng, lat]
  label: string;
  name: string;
  sourceIndex?: number; // original list index for card sync
};

function toFiniteCoord(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type MapViewProps = {
  // Navigation route display
  route?: {
    origin: [number, number];
    destination: [number, number];
    polylines: RoutePolyline[];
  };

  // Place markers display
  markers?: MapMarker[];
  activeMarker?: number;
  onMarkerClick?: (index: number) => void;

  // User location
  userLocation?: [number, number]; // [lng, lat]
  isApproximateLocation?: boolean; // If true, show "Approximate location" label

  // Layout
  height?: string;
  className?: string;
};

function markerHtml(label: string, active: boolean): string {
  const size = active ? 28 : 22;
  const bg = active ? "#EF4444" : "#2563EB";
  const fontSize = active ? 13 : 11;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:white;display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;transition:all 0.15s">${label}</div>`;
}

export default function MapView({
  route,
  markers,
  activeMarker,
  onMarkerClick,
  userLocation,
  isApproximateLocation = false,
  height = "200px",
  className = "",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const routeOverlaysRef = useRef<any[]>([]);
  const markerOverlaysRef = useRef<any[]>([]);
  const userLocationOverlaysRef = useRef<any[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const lastMarkersKeyRef = useRef("");

  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [orientationPermissionGranted, setOrientationPermissionGranted] = useState(() => {
    if (typeof window === "undefined") return false;
    // Non-iOS browsers do not require explicit permission.
    return typeof (DeviceOrientationEvent as any).requestPermission !== "function";
  });

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const { AMap, loaded, error } = useAMap();

  // Initialize map
  useEffect(() => {
    if (!loaded || !AMap || !containerRef.current || mapRef.current) return;

    mapRef.current = new AMap.Map(containerRef.current, {
      zoom: 13,
      viewMode: "2D",
    });

    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [AMap, loaded]);

  // Request device orientation permission (iOS only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if iOS and DeviceOrientationEvent.requestPermission exists
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      // iOS 13+ requires user gesture to request permission
      // We'll request it when the map is interacted with
      const handleUserGesture = async () => {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            setOrientationPermissionGranted(true);
          }
        } catch (error) {
          console.log('Device orientation permission denied or error:', error);
        }
        // Remove listener after first attempt
        document.removeEventListener('click', handleUserGesture);
      };

      document.addEventListener('click', handleUserGesture, { once: true });

      return () => {
        document.removeEventListener('click', handleUserGesture);
      };
    }
  }, []);

  // Track device orientation for direction arrow
  useEffect(() => {
    if (!orientationPermissionGranted || !userLocation) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Get compass heading (alpha)
      // alpha: 0-360 degrees, 0 = North, 90 = East, 180 = South, 270 = West
      if (event.alpha !== null) {
        // Adjust for screen orientation if needed
        let heading = event.alpha;

        // On some devices, we need to adjust for screen orientation
        // iOS provides webkitCompassHeading which is more reliable
        const webkitHeading = (event as any).webkitCompassHeading;
        if (webkitHeading !== undefined) {
          heading = webkitHeading;
        }

        setDeviceHeading(heading);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [orientationPermissionGranted, userLocation]);

  // Draw route polylines + origin/destination markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !AMap || !route) return;

    const originLng = toFiniteCoord(route.origin[0]);
    const originLat = toFiniteCoord(route.origin[1]);
    const destLng = toFiniteCoord(route.destination[0]);
    const destLat = toFiniteCoord(route.destination[1]);
    if (
      originLng == null ||
      originLat == null ||
      destLng == null ||
      destLat == null
    ) {
      return;
    }

    // Clean previous route overlays
    routeOverlaysRef.current.forEach((o) => map.remove(o));
    routeOverlaysRef.current = [];

    const overlays: any[] = [];

    // Draw polylines
    for (const pl of route.polylines) {
      const path = pl.path
        .map(([lng, lat]: [number, number]) => {
          const validLng = toFiniteCoord(lng);
          const validLat = toFiniteCoord(lat);
          if (validLng == null || validLat == null) return null;
          return new AMap.LngLat(validLng, validLat);
        })
        .filter((p): p is any => p !== null);

      if (path.length < 2) continue;

      const polyline = new AMap.Polyline({
        path,
        strokeColor: pl.color,
        strokeWeight: pl.dashed ? 3 : 5,
        strokeOpacity: pl.dashed ? 0.6 : 0.85,
        strokeStyle: pl.dashed ? "dashed" : "solid",
        lineJoin: "round",
      });
      map.add(polyline);
      overlays.push(polyline);
    }

    // Origin marker (blue dot)
    const originMarker = new AMap.Marker({
      position: new AMap.LngLat(originLng, originLat),
      content:
        '<div style="width:14px;height:14px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
      anchor: "center",
      zIndex: 50,
    });
    map.add(originMarker);
    overlays.push(originMarker);

    // Destination marker (red dot)
    const destMarker = new AMap.Marker({
      position: new AMap.LngLat(destLng, destLat),
      content:
        '<div style="width:14px;height:14px;border-radius:50%;background:#EF4444;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
      anchor: "center",
      zIndex: 50,
    });
    map.add(destMarker);
    overlays.push(destMarker);

    // Fit to show entire route
    map.setFitView(overlays, false, [30, 30, 30, 30]);

    routeOverlaysRef.current = overlays;

    return () => {
      overlays.forEach((o) => map.remove(o));
      routeOverlaysRef.current = [];
    };
  }, [AMap, route]);

  // Draw place markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !AMap) return;

    // Clean previous markers
    markerOverlaysRef.current.forEach((m) => map.remove(m));
    markerOverlaysRef.current = [];

    if (!markers || markers.length === 0) return;

    const newMarkers: any[] = [];
    markers.forEach((m, i) => {
      const lng = toFiniteCoord(m.position[0]);
      const lat = toFiniteCoord(m.position[1]);
      if (lng == null || lat == null) return;

      const markerIndex = m.sourceIndex ?? i;
      const isActive = activeMarker === markerIndex;
      const marker = new AMap.Marker({
        position: new AMap.LngLat(lng, lat),
        content: markerHtml(m.label, isActive),
        anchor: "center",
        zIndex: isActive ? 100 : 10,
      });
      marker.on("click", () => onMarkerClickRef.current?.(markerIndex));
      map.add(marker);
      newMarkers.push(marker);
    });

    markerOverlaysRef.current = newMarkers;

    // Only fitView when the marker set changes (not on activeMarker change)
    const key = markers
      .map((m, i) => `${m.sourceIndex ?? i}:${m.position.join(",")}`)
      .join("|");
    if (key !== lastMarkersKeyRef.current) {
      lastMarkersKeyRef.current = key;
      map.setFitView(newMarkers, false, [40, 40, 40, 40]);
    }

    // Pan to active marker
    if (activeMarker != null) {
      const target = markers.find((m, i) => (m.sourceIndex ?? i) === activeMarker);
      const pos = target?.position;
      if (pos) {
        const lng = toFiniteCoord(pos[0]);
        const lat = toFiniteCoord(pos[1]);
        if (lng != null && lat != null) {
          map.panTo(new AMap.LngLat(lng, lat));
        }
      }
    }

    return () => {
      newMarkers.forEach((m) => map.remove(m));
      markerOverlaysRef.current = [];
    };
  }, [AMap, markers, activeMarker]);

  // Draw user location blue dot and direction arrow
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !AMap || !userLocation) return;

    const userLng = toFiniteCoord(userLocation[0]);
    const userLat = toFiniteCoord(userLocation[1]);
    if (userLng == null || userLat == null) return;

    // Clean previous user location overlays
    userLocationOverlaysRef.current.forEach((o) => map.remove(o));
    userLocationOverlaysRef.current = [];

    const overlays: any[] = [];

    // Direction cone/arrow (if heading available)
    if (deviceHeading !== null) {
      const svg = `
        <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="position: absolute; left: -60px; top: -60px; transform: rotate(${deviceHeading}deg);">
          <path d="M 60 60 L 60 10 L 80 40 L 60 35 L 40 40 Z" fill="#2563EB" fill-opacity="0.3" stroke="#2563EB" stroke-width="1" stroke-opacity="0.5"/>
        </svg>
      `;

      const directionMarker = new AMap.Marker({
        position: new AMap.LngLat(userLng, userLat),
        content: svg,
        anchor: 'center',
        zIndex: 99,
      });
      map.add(directionMarker);
      overlays.push(directionMarker);
    }

    // Blue pulsing dot for user location
    const blueDotContent = `
      <div style="position: relative; width: 20px; height: 20px;">
        <!-- Pulsing outer ring -->
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 30px; height: 30px; border-radius: 50%; background: rgba(37, 99, 235, 0.2); animation: pulse 2s ease-in-out infinite;"></div>
        <!-- Inner blue dot -->
        <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; border-radius: 50%; background: #2563EB; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        <style>
          @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.2; }
          }
        </style>
      </div>
    `;

    const blueDotMarker = new AMap.Marker({
      position: new AMap.LngLat(userLng, userLat),
      content: blueDotContent,
      anchor: 'center',
      zIndex: 100,
    });
    map.add(blueDotMarker);
    overlays.push(blueDotMarker);

    // Add "Approximate location" label if needed
    if (isApproximateLocation) {
      const labelContent = `
        <div style="padding: 2px 6px; background: rgba(255,255,255,0.95); border-radius: 4px; font-size: 10px; color: #6B7280; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2); margin-top: 25px;">
          Approximate location
        </div>
      `;

      const labelMarker = new AMap.Marker({
        position: new AMap.LngLat(userLng, userLat),
        content: labelContent,
        anchor: 'top',
        offset: new AMap.Pixel(0, 10),
        zIndex: 101,
      });
      map.add(labelMarker);
      overlays.push(labelMarker);
    }

    userLocationOverlaysRef.current = overlays;

    return () => {
      overlays.forEach((o) => map.remove(o));
      userLocationOverlaysRef.current = [];
    };
  }, [AMap, userLocation, deviceHeading, isApproximateLocation]);

  // Don't render map if no key configured
  if (error) return null;

  if (!loaded) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-gray-50 ${className}`}
        style={{ height }}
      >
        <span className="text-xs text-gray-400">Loading map...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    />
  );
}
