"use client";

import { useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: { securityJsCode: string };
  }
}

let loadPromise: Promise<any> | null = null;

function loadAMapScript(): Promise<any> {
  if (loadPromise) return loadPromise;

  const key = process.env.NEXT_PUBLIC_AMAP_JS_KEY;
  const secret = process.env.NEXT_PUBLIC_AMAP_JS_SECRET;

  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_AMAP_JS_KEY not set"));
  }

  // Set security config before loading the script (required for JS API 2.0)
  if (secret) {
    window._AMapSecurityConfig = { securityJsCode: secret };
  }

  loadPromise = new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Scale`;
    script.onload = () => resolve(window.AMap);
    script.onerror = () => reject(new Error("Failed to load Amap JS API"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useAMap() {
  const [AMap, setAMap] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAMapScript().then(setAMap).catch(setError);
  }, []);

  return { AMap, error, loaded: !!AMap };
}
