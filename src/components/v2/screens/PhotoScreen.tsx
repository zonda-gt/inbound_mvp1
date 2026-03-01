"use client";

import { useState, useRef, useCallback } from "react";

interface PhotoScreenProps {
  onNavigate: (screen: string) => void;
}

/** Compress image client-side: resize to max 1000px longest side, JPEG 0.7 quality */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
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
      // Strip the data:image/jpeg;base64, prefix
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

/** Simple markdown-ish rendering: bold, bullets, newlines */
function renderResponse(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((p, j) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={j}>{p.slice(2, -2)}</strong>;
      }
      return <span key={j}>{p}</span>;
    });

    // Bullet lines
    if (line.match(/^\s*[-•]\s/)) {
      return (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: "#D0021B", flexShrink: 0 }}>•</span>
          <span>{rendered}</span>
        </div>
      );
    }
    // Numbered lines
    if (line.match(/^\d+\.\s/)) {
      return (
        <div key={i} style={{ marginBottom: 4 }}>
          {rendered}
        </div>
      );
    }
    // Empty lines
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
    // Normal text
    return <div key={i} style={{ marginBottom: 2 }}>{rendered}</div>;
  });
}

export default function PhotoScreen({ onNavigate }: PhotoScreenProps) {
  const [activeMode, setActiveMode] = useState<"TRANSLATE" | "IDENTIFY" | "MENU">("IDENTIFY");
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // base64
  const [imagePreview, setImagePreview] = useState<string | null>(null); // data URL for display
  const [userMessage, setUserMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    setError("");
    setResponse("");
    try {
      const base64 = await compressImage(file);
      setCapturedImage(base64);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
    } catch {
      setError("Failed to process image. Please try again.");
    }
  }, []);

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
              if (parsed.text) {
                setResponse((prev) => prev + parsed.text);
              }
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [capturedImage, userMessage, activeMode]);

  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setImagePreview(null);
    setResponse("");
    setError("");
    setUserMessage("");
  }, []);

  const hasResult = response.length > 0 || loading;

  return (
    <div className="v2-photo-shell">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        style={{ display: "none" }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        style={{ display: "none" }}
      />

      {/* ───── Background / Preview ───── */}
      {imagePreview ? (
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `url(${imagePreview})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: hasResult ? "brightness(0.3)" : "brightness(0.6)",
          transition: "filter 0.3s",
        }} />
      ) : (
        <div className="v2-photo-bg-scene">
          <span className="v2-photo-scene-emoji">{activeMode === "MENU" ? "🍽️" : activeMode === "TRANSLATE" ? "🔤" : "🔍"}</span>
        </div>
      )}

      {/* ───── Viewfinder Grid (only when no image) ───── */}
      {!imagePreview && (
        <div className="v2-vf-grid">
          <div className="v2-vf-h" style={{ top: "33%" }} />
          <div className="v2-vf-h" style={{ top: "66%" }} />
          <div className="v2-vf-v" style={{ left: "33%" }} />
          <div className="v2-vf-v" style={{ left: "66%" }} />
          <div className="v2-vf-focus" />
        </div>
      )}

      {/* ───── Camera Top Bar ───── */}
      <div className="v2-cam-top">
        <button className="v2-cam-btn" onClick={() => { if (capturedImage) handleReset(); else onNavigate("home"); }}>
          ←
        </button>
        <span className="v2-cam-mode-label">📷 Photo AI</span>
        <button className="v2-cam-btn" style={{ opacity: 0.5 }}>⚡</button>
      </div>

      {/* ───── Camera Modes ───── */}
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

      {/* ───── Camera Controls (no image yet) ───── */}
      {!capturedImage && !hasResult && (
        <div className="v2-cam-controls">
          <button className="v2-cam-gallery" onClick={() => fileInputRef.current?.click()}>🖼️</button>
          <button className="v2-cam-shutter" onClick={() => cameraInputRef.current?.click()}>
            <span className="v2-cam-shutter-inner" />
          </button>
          <button className="v2-cam-flip" onClick={() => fileInputRef.current?.click()}>🔄</button>
        </div>
      )}

      {/* ───── Image captured, pre-send ───── */}
      {capturedImage && !hasResult && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,.85) 40%)",
          padding: "60px 16px 24px", zIndex: 10,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {/* Optional message input */}
          <div style={{
            display: "flex", gap: 8, alignItems: "center",
          }}>
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleScan(); }}
              placeholder="Ask about this... (optional)"
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 24,
                border: "1px solid rgba(255,255,255,.2)",
                background: "rgba(255,255,255,.1)",
                color: "#fff", fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={handleScan}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#D0021B", border: "none",
                color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={handleReset} style={{
              padding: "8px 20px", borderRadius: 20,
              background: "rgba(255,255,255,.15)", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              ✕ Retake
            </button>
          </div>
        </div>
      )}

      {/* ───── AI Result Panel ───── */}
      {hasResult && (
        <div
          ref={resultRef}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            maxHeight: "70%", overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            background: "rgba(0,0,0,.88)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderRadius: "20px 20px 0 0",
            padding: "20px 16px 24px",
            zIndex: 10,
          }}
        >
          {/* Thumbnail + mode tag */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            {imagePreview && (
              <img
                src={imagePreview}
                alt=""
                style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }}
              />
            )}
            <div>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: 1, color: "#D0021B",
                background: "rgba(208,2,27,.15)", padding: "3px 8px",
                borderRadius: 6,
              }}>
                ✦ {activeMode}
              </span>
              {userMessage && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                  &ldquo;{userMessage}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Response content */}
          <div style={{ fontSize: 14, color: "#fff", lineHeight: 1.65 }}>
            {response ? renderResponse(response) : (
              // Loading shimmer
              <div>
                <div style={{ height: 14, width: "80%", background: "rgba(255,255,255,.1)", borderRadius: 6, marginBottom: 10 }} />
                <div style={{ height: 14, width: "60%", background: "rgba(255,255,255,.1)", borderRadius: 6, marginBottom: 10 }} />
                <div style={{ height: 14, width: "70%", background: "rgba(255,255,255,.1)", borderRadius: 6, marginBottom: 10 }} />
                <div style={{ height: 14, width: "45%", background: "rgba(255,255,255,.1)", borderRadius: 6 }} />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 10,
              background: "rgba(208,2,27,.2)", color: "#ff6b6b",
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          {!loading && response && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  background: "rgba(255,255,255,.12)", border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                📷 Scan again
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(response).catch(() => {});
                }}
                style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,.12)", border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                📋
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#D0021B",
                animation: "pulse 1s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Analyzing...</span>
            </div>
          )}
        </div>
      )}

      {/* Pulse animation */}
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    </div>
  );
}
