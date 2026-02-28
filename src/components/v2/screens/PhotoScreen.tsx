"use client";

import { useState } from "react";

interface PhotoScreenProps {
  onNavigate: (screen: string) => void;
}

export default function PhotoScreen({ onNavigate }: PhotoScreenProps) {
  const [showResult, setShowResult] = useState(false);
  const [activeMode, setActiveMode] = useState<"TRANSLATE" | "IDENTIFY" | "MENU">("IDENTIFY");

  return (
    <div className="v2-photo-shell">
      {/* ───── Background Scene ───── */}
      <div className="v2-photo-bg-scene">
        <span className="v2-photo-scene-emoji">🍜</span>
      </div>

      {/* ───── Viewfinder Grid ───── */}
      <div className="v2-vf-grid">
        <div className="v2-vf-h" style={{ top: "33%" }} />
        <div className="v2-vf-h" style={{ top: "66%" }} />
        <div className="v2-vf-v" style={{ left: "33%" }} />
        <div className="v2-vf-v" style={{ left: "66%" }} />
        <div className="v2-vf-focus" />
      </div>

      {/* ───── Camera Top Bar ───── */}
      <div className="v2-cam-top">
        <button className="v2-cam-btn" onClick={() => onNavigate("home")}>
          ←
        </button>
        <span className="v2-cam-mode-label">📷 Photo AI</span>
        <button className="v2-cam-btn">⚡</button>
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

      {/* ───── Camera Controls (shown when no result) ───── */}
      {!showResult && (
        <div className="v2-cam-controls">
          <button className="v2-cam-gallery">🖼️</button>
          <button
            className="v2-cam-shutter"
            onClick={() => setShowResult(true)}
          >
            <span className="v2-cam-shutter-inner" />
          </button>
          <button className="v2-cam-flip">🔄</button>
        </div>
      )}

      {/* ───── AI Result Panel (shown after shutter click) ───── */}
      {showResult && (
        <div className="v2-ai-result-panel">
          <span className="v2-ai-result-tag">✦ AI Identified</span>
          <h2 className="v2-ai-result-name">Wok-Fried Noodles</h2>
          <p className="v2-ai-result-cn">
            现炒浇头面 &middot; Xi&agrave;n ch&#462;o ji&#257;o t&oacute;u mi&agrave;n
          </p>
          <p className="v2-ai-result-desc">
            A Shanghai classic — fresh hand-pulled noodles tossed in a
            screaming-hot wok. The smoky &lsquo;wok breath&rsquo; (镬气) is the
            signature. Order the beef brisket topping for the full experience.
          </p>
          <div className="v2-ai-chips">
            <span className="v2-ai-chip">🌶️ Medium spice</span>
            <span className="v2-ai-chip">¥25–45</span>
            <span className="v2-ai-chip">⏱ 5 min wait</span>
            <span className="v2-ai-chip">⭐ Local favourite</span>
            <span className="v2-ai-chip">🏅 Dish Passport</span>
          </div>
          <div className="v2-ai-actions">
            <button
              className="v2-ai-act-primary"
              onClick={() => onNavigate("discover")}
            >
              🍜 Find nearby
            </button>
            <button
              className="v2-ai-act-secondary"
              onClick={() => setShowResult(false)}
            >
              📷 Scan again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
