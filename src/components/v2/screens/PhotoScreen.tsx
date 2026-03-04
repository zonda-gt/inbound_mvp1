"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface PhotoScreenProps {
  onNavigate: (screen: string) => void;
  isActive: boolean;
}

/** Simple markdown-ish rendering: bold, bullets, newlines */
function renderResponse(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((p, j) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={j}>{p.slice(2, -2)}</strong>;
      }
      return <span key={j}>{p}</span>;
    });
    if (line.match(/^\s*[-•]\s/)) {
      return (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: "#D0021B", flexShrink: 0 }}>•</span>
          <span>{rendered}</span>
        </div>
      );
    }
    if (line.match(/^\d+\.\s/)) {
      return <div key={i} style={{ marginBottom: 4 }}>{rendered}</div>;
    }
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
    return <div key={i} style={{ marginBottom: 2 }}>{rendered}</div>;
  });
}

export default function PhotoScreen({ onNavigate, isActive }: PhotoScreenProps) {
  const [activeMode, setActiveMode] = useState<"TRANSLATE" | "IDENTIFY" | "MENU">("IDENTIFY");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Start/stop camera based on screen visibility
  useEffect(() => {
    if (isActive && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, capturedImage, facingMode]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied. Tap the gallery button to upload a photo instead.");
      setCameraReady(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  // Capture frame from live video
  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;

    const canvas = document.createElement("canvas");
    const MAX = 1000;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > MAX || h > MAX) {
      if (w > h) { h = Math.round(h * (MAX / w)); w = MAX; }
      else { w = Math.round(w * (MAX / h)); h = MAX; }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1];
    setCapturedImage(base64);
    setImagePreview(dataUrl);
    stopCamera();
  }, [cameraReady, stopCamera]);

  // Handle file upload (gallery)
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError("");
    setResponse("");
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      const base64: string = await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 1000;
          let w = img.width;
          let h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * (MAX / w)); w = MAX; }
            else { w = Math.round(w * (MAX / h)); h = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas not supported")); return; }
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl.split(",")[1]);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load")); };
        img.src = url;
      });
      setCapturedImage(base64);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
      stopCamera();
    } catch {
      setError("Failed to process image.");
    }
  }, [stopCamera]);

  const handleScan = useCallback(async () => {
    if (!capturedImage) return;
    setLoading(true);
    setResponse("");
    setError("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage,
          message: userMessage || undefined,
          mode: activeMode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Scan failed");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) { setError(parsed.error); break; }
              if (parsed.text) setResponse((prev) => prev + parsed.text);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [capturedImage, userMessage, activeMode]);

  // Auto-trigger scan immediately after image capture
  useEffect(() => {
    if (capturedImage && !loading && !response && !error) {
      handleScan();
    }
  }, [capturedImage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setImagePreview(null);
    setResponse("");
    setError("");
    setUserMessage("");
    // Camera will restart via the useEffect
  }, []);

  const handleFlip = useCallback(() => {
    setFacingMode((prev) => prev === "environment" ? "user" : "environment");
  }, []);

  const hasResult = response.length > 0 || loading;

  return (
    <div className="v2-photo-shell">
      {/* Hidden file input for gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        style={{ display: "none" }}
      />

      {/* ───── Live Camera Feed ───── */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0,
          display: capturedImage ? "none" : "block",
          transform: facingMode === "user" ? "scaleX(-1)" : "none",
        }}
      />

      {/* Captured image preview */}
      {imagePreview && !hasResult && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `url(${imagePreview})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(0.8)",
          transition: "filter 0.3s",
        }} />
      )}

      {/* Camera error fallback */}
      {cameraError && !capturedImage && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "#0a0a0a", padding: 32, textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.5, maxWidth: 260 }}>
            {cameraError}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: 20, padding: "12px 28px", borderRadius: 24,
              background: "#D0021B", border: "none", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Open Gallery
          </button>
        </div>
      )}

      {/* Viewfinder Grid (live camera, no capture yet) */}
      {!capturedImage && !cameraError && (
        <div className="v2-vf-grid">
          <div className="v2-vf-h" style={{ top: "33%" }} />
          <div className="v2-vf-h" style={{ top: "66%" }} />
          <div className="v2-vf-v" style={{ left: "33%" }} />
          <div className="v2-vf-v" style={{ left: "66%" }} />
          <div className="v2-vf-focus" />
        </div>
      )}

      {/* ───── Top Bar ───── */}
      <div className="v2-cam-top">
        <button className="v2-cam-btn" onClick={() => { if (capturedImage) handleReset(); else onNavigate("home"); }}>
          ←
        </button>
        <span className="v2-cam-mode-label">📷 Photo AI</span>
        <button className="v2-cam-btn" style={{ opacity: 0.5 }}>⚡</button>
      </div>

      {/* ───── Mode Selector (only before capture) ───── */}
      {!capturedImage && !hasResult && (
        <div className="v2-cam-modes">
          {(["TRANSLATE", "IDENTIFY", "MENU"] as const).map((mode) => (
            <button
              key={mode}
              className={`v2-cam-mode-opt${activeMode === mode ? " active" : ""}`}
              onClick={() => setActiveMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      {/* ───── Camera Controls (live feed, not captured) ───── */}
      {!capturedImage && !hasResult && (
        <div className="v2-cam-controls">
          <button className="v2-cam-gallery" onClick={() => fileInputRef.current?.click()}>🖼️</button>
          <button className="v2-cam-shutter" onClick={handleCapture}>
            <span className="v2-cam-shutter-inner" />
          </button>
          <button className="v2-cam-flip" onClick={handleFlip}>🔄</button>
        </div>
      )}


      {/* ───── AI Result — YouTube-style layout ───── */}
      {hasResult && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 8,
          display: "flex", flexDirection: "column",
          background: "#0a0a0a",
        }}>
          {/* Image at top */}
          {imagePreview && (
            <div style={{ flexShrink: 0, width: "100%", maxHeight: "42%", overflow: "hidden", background: "#000" }}>
              <img
                src={imagePreview}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          )}

          {/* Bottom sheet */}
          <div
            ref={resultRef}
            style={{
              flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch",
              background: "#0a0a0a",
              borderRadius: "16px 16px 0 0",
              marginTop: -12,
              position: "relative", zIndex: 1,
            }}
          >
            {/* Grab handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,.25)" }} />
            </div>

            <div style={{ padding: "4px 16px 32px" }}>
              {/* Profile row */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                {imagePreview && (
                  <img src={imagePreview} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: "cover", border: "2px solid rgba(255,255,255,.1)" }} />
                )}
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: 1.2, color: "#D0021B",
                  background: "rgba(208,2,27,.12)", padding: "4px 10px", borderRadius: 6,
                }}>
                  ✦ {activeMode}
                </span>
                <div style={{ flex: 1 }} />
                {imagePreview && (
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = imagePreview;
                      a.download = `photo-ai-${Date.now()}.jpg`;
                      a.click();
                    }}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      background: "rgba(255,255,255,.1)", border: "none",
                      color: "#fff", fontSize: 16, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    aria-label="Save photo"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* AI Response text */}
              <div style={{ fontSize: 15, color: "#fff", lineHeight: 1.7 }}>
                {response ? renderResponse(response) : (
                  <div>
                    <div style={{ height: 14, width: "80%", background: "rgba(255,255,255,.08)", borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ height: 14, width: "60%", background: "rgba(255,255,255,.08)", borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ height: 14, width: "70%", background: "rgba(255,255,255,.08)", borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ height: 14, width: "45%", background: "rgba(255,255,255,.08)", borderRadius: 6 }} />
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 10,
                  background: "rgba(208,2,27,.2)", color: "#ff6b6b", fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              {/* Continue to chat link */}
              {!loading && response && (
                <button
                  onClick={() => {
                    const msg = encodeURIComponent(response.slice(0, 500));
                    window.location.href = `/chat?context=${msg}`;
                  }}
                  style={{
                    marginTop: 20, padding: 0, border: "none", background: "none",
                    color: "#D0021B", fontSize: 14, fontWeight: 500, cursor: "pointer",
                    textDecoration: "underline", textUnderlineOffset: 3,
                  }}
                >
                  Continue in chat →
                </button>
              )}

              {loading && (
                <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#D0021B",
                    animation: "pulse 1s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Analyzing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    </div>
  );
}
