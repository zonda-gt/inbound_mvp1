"use client";

import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
    __googleMapsCallback: () => void;
  }
}

let loadPromise: Promise<any> | null = null;

function loadGoogleMapsScript(): Promise<any> {
  if (loadPromise) return loadPromise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_KEY not set"));
  }

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    window.__googleMapsCallback = () => {
      resolve(window.google.maps);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=__googleMapsCallback&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps JS API"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useGoogleMaps() {
  const [maps, setMaps] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadGoogleMapsScript().then(setMaps).catch(setError);
  }, []);

  return { maps, error, loaded: !!maps };
}
