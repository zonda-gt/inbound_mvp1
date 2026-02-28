"use client";

import { useState } from "react";

interface OnboardingScreenProps {
  onFinish: () => void;
}

const INTERESTS = [
  { label: "Street Food", icon: "🍜" },
  { label: "Bars & Nightlife", icon: "🍸" },
  { label: "History & Culture", icon: "🏛️" },
  { label: "Specialty Coffee", icon: "☕" },
  { label: "Shopping", icon: "🛍️" },
  { label: "Parks & Nature", icon: "🌿" },
];

const DEFAULT_INTERESTS = new Set([
  "Street Food",
  "Bars & Nightlife",
  "Specialty Coffee",
]);

const CITIES = [
  { label: "Shanghai", icon: "🏙️" },
  { label: "Beijing", icon: "🏯" },
  { label: "Chengdu", icon: "🌸" },
  { label: "Other city", icon: "🌊" },
];

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [obStep, setObStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
    () => new Set(DEFAULT_INTERESTS)
  );
  const [selectedCity, setSelectedCity] = useState("Shanghai");

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (obStep < 2) {
      setObStep(obStep + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="v2-ob-wrap">
      <div
        className="v2-ob-slides"
        style={{ transform: `translateX(-${obStep * 33.333}%)` }}
      >
        {/* ===== Slide 1 — Marketing Hero ===== */}
        <div className="v2-ob-slide v2-ob-slide-1">
          <div
            className="v2-ob-bg"
            style={{
              background:
                "radial-gradient(ellipse 140% 70% at 50% -10%, rgba(208,2,27,0.55) 0%, rgba(120,0,10,0.2) 40%, transparent 65%), radial-gradient(ellipse 80% 40% at 80% 80%, rgba(201,168,76,0.12) 0%, transparent 60%), linear-gradient(180deg, #0A0A0F 0%, #100508 100%)",
            }}
          />

          <div className="v2-ob1-top">
            <div className="v2-ob1-logo">
              <div className="v2-ob1-logo-mark">{"你"}</div>
              <div className="v2-ob1-logo-text">
                Hello<em>China</em>
              </div>
            </div>

            <h1 className="v2-ob1-headline">
              Your local friend in
              <br />
              <span className="hi">every city.</span>
            </h1>

            <p className="v2-ob1-tagline">
              Discover restaurants, navigate the metro, and decode China — all
              in English.
            </p>
          </div>

          <div className="v2-ob1-cards-area">
            {/* Feature pill 1 — Find Food */}
            <div className="v2-ob1-feat v2-ob1-feat-1">
              <div
                className="v2-ob1-feat-icon"
                style={{
                  background: "linear-gradient(135deg,#FF6B35,#D0021B)",
                }}
              >
                {"🍜"}
              </div>
              <div className="v2-ob1-feat-text">
                <div className="v2-ob1-feat-title">Find Food</div>
                <div className="v2-ob1-feat-sub">Near you, right now</div>
              </div>
            </div>

            {/* Feature pill 2 — Metro & Taxi */}
            <div className="v2-ob1-feat v2-ob1-feat-2">
              <div
                className="v2-ob1-feat-icon"
                style={{
                  background: "linear-gradient(135deg,#007AFF,#5856D6)",
                }}
              >
                {"🚇"}
              </div>
              <div className="v2-ob1-feat-text">
                <div className="v2-ob1-feat-title">Metro & Taxi</div>
                <div className="v2-ob1-feat-sub">Step-by-step routes</div>
              </div>
            </div>

            {/* Feature pill 3 — Photo AI */}
            <div className="v2-ob1-feat v2-ob1-feat-3">
              <div
                className="v2-ob1-feat-icon"
                style={{
                  background: "linear-gradient(135deg,#34C759,#30B050)",
                }}
              >
                {"📷"}
              </div>
              <div className="v2-ob1-feat-text">
                <div className="v2-ob1-feat-title">Photo AI</div>
                <div className="v2-ob1-feat-sub">Point & understand</div>
              </div>
            </div>

            {/* Feature pill 4 — Pocket Phrases */}
            <div className="v2-ob1-feat v2-ob1-feat-4">
              <div
                className="v2-ob1-feat-icon"
                style={{
                  background: "linear-gradient(135deg,#C9A84C,#A07830)",
                }}
              >
                {"💬"}
              </div>
              <div className="v2-ob1-feat-text">
                <div className="v2-ob1-feat-title">Pocket Phrases</div>
                <div className="v2-ob1-feat-sub">Tap to speak</div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="v2-ob1-phone">
              <div className="v2-ob1-phone-inner">
                <div className="v2-ob1-screen-preview">
                  <div className="v2-ob1-preview-header">
                    <div className="v2-ob1-preview-logo-row">
                      <div className="v2-ob1-preview-logo">
                        Hello<span>China</span>
                      </div>
                      <div className="v2-ob1-preview-avatar">T</div>
                    </div>
                    <div className="v2-ob1-preview-greeting">
                      {"Hey there! 👋"}
                      <span>What are you looking for?</span>
                    </div>
                    <div className="v2-ob1-preview-search">
                      {"🔍 Find restaurants, metro..."}
                    </div>
                  </div>

                  <div className="v2-ob1-preview-body">
                    <div className="v2-ob1-preview-card">
                      <div className="v2-ob1-preview-card-img">{"🍜"}</div>
                      <div className="v2-ob1-preview-card-text">
                        <div className="v2-ob1-preview-card-name">
                          Xun Yu Ji Noodles
                        </div>
                        <div className="v2-ob1-preview-card-sub">
                          {"¥38 · 4.4★ · 3 min walk"}
                        </div>
                      </div>
                      <div className="v2-ob1-preview-card-badge">Open</div>
                    </div>

                    <div className="v2-ob1-preview-card">
                      <div
                        className="v2-ob1-preview-card-img"
                        style={{
                          background:
                            "linear-gradient(135deg,#2c1810,#4a2c1a)",
                        }}
                      >
                        {"☕"}
                      </div>
                      <div className="v2-ob1-preview-card-text">
                        <div className="v2-ob1-preview-card-name">
                          COMMUNE Reserve
                        </div>
                        <div className="v2-ob1-preview-card-sub">
                          {"¥130 · 4.7★ · Rooftop bar"}
                        </div>
                      </div>
                      <div className="v2-ob1-preview-card-badge">Hot</div>
                    </div>

                    <div className="v2-ob1-preview-card">
                      <div
                        className="v2-ob1-preview-card-img"
                        style={{
                          background:
                            "linear-gradient(135deg,#1a1033,#2d1b4e)",
                        }}
                      >
                        {"🎵"}
                      </div>
                      <div className="v2-ob1-preview-card-text">
                        <div className="v2-ob1-preview-card-name">
                          Mengtian LiveHouse
                        </div>
                        <div className="v2-ob1-preview-card-sub">
                          {"¥200 · Live music tonight"}
                        </div>
                      </div>
                      <div className="v2-ob1-preview-card-badge" style={{ background: "#C9A84C" }}>Tonight</div>
                    </div>
                  </div>

                  <div className="v2-ob1-preview-nav">
                    <div className="v2-ob1-preview-nav-item active">
                      <span>{"🏠"}</span>
                      <span className="v2-ob1-preview-nav-label">Home</span>
                    </div>
                    <div className="v2-ob1-preview-nav-item">
                      <span>{"🔍"}</span>
                      <span className="v2-ob1-preview-nav-label">Discover</span>
                    </div>
                    <div className="v2-ob1-preview-nav-item">
                      <span>{"🚇"}</span>
                      <span className="v2-ob1-preview-nav-label">Navigate</span>
                    </div>
                    <div className="v2-ob1-preview-nav-item">
                      <span>{"📷"}</span>
                      <span className="v2-ob1-preview-nav-label">Photo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="v2-ob1-bottom">
            <div className="v2-ob1-social-proof">
              <div className="v2-ob1-avatars">
                <div
                  className="v2-ob1-av"
                  style={{
                    background: "linear-gradient(135deg,#FF6B35,#D0021B)",
                  }}
                >
                  T
                </div>
                <div
                  className="v2-ob1-av"
                  style={{
                    background: "linear-gradient(135deg,#007AFF,#5856D6)",
                  }}
                >
                  K
                </div>
                <div
                  className="v2-ob1-av"
                  style={{
                    background: "linear-gradient(135deg,#34C759,#30B050)",
                  }}
                >
                  M
                </div>
                <div
                  className="v2-ob1-av"
                  style={{
                    background: "linear-gradient(135deg,#C9A84C,#B8941E)",
                  }}
                >
                  J
                </div>
              </div>
              <div className="v2-ob1-proof-text">
                <strong>4,200+</strong> travellers exploring China
              </div>
            </div>

            <div className="v2-ob-dots">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`v2-ob-dot${obStep === i ? " active" : ""}`}
                />
              ))}
            </div>

            <button className="v2-ob-btn" onClick={handleNext}>
              {"Get started — it's free →"}
            </button>

            <div className="v2-ob-skip" onClick={onFinish}>
              Skip intro
            </div>
          </div>
        </div>

        {/* ===== Slide 2 — Interest Picker ===== */}
        <div className="v2-ob-slide">
          <div
            className="v2-ob-bg"
            style={{
              background:
                "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(201,168,76,0.25) 0%, transparent 60%), linear-gradient(180deg, #0A0A0F, #0d0a05)",
            }}
          />

          <div className="v2-ob-content">
            <span className="v2-ob-emoji">{"🎯"}</span>

            <h2 className="v2-ob-title">
              {"What's your "}<span className="gold">vibe?</span>
            </h2>

            <p className="v2-ob-sub">
              {"Pick what matters to you — we'll personalise everything."}
            </p>

            <div className="v2-ob-interests">
              {INTERESTS.map(({ label, icon }) => (
                <div
                  key={label}
                  className={`v2-interest-chip${
                    selectedInterests.has(label) ? " selected" : ""
                  }`}
                  onClick={() => toggleInterest(label)}
                >
                  <span className="v2-interest-chip-icon">{icon}</span>
                  <span className="v2-interest-chip-label">{label}</span>
                </div>
              ))}
            </div>

            <div className="v2-ob-dots">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`v2-ob-dot${obStep === i ? " active" : ""}`}
                />
              ))}
            </div>

            <button className="v2-ob-btn" onClick={handleNext}>
              {"Looks good →"}
            </button>
          </div>
        </div>

        {/* ===== Slide 3 — City Picker ===== */}
        <div className="v2-ob-slide">
          <div
            className="v2-ob-bg"
            style={{
              background:
                "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,122,255,0.2) 0%, transparent 60%), linear-gradient(180deg, #0A0A0F, #050a14)",
            }}
          />

          <div className="v2-ob-content">
            <span className="v2-ob-emoji">{"📍"}</span>

            <h2 className="v2-ob-title">
              {"Where are you "}<span className="hi">now?</span>
            </h2>

            <p className="v2-ob-sub">
              {"We'll show you the best spots nearby."}
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              {CITIES.map(({ label, icon }) => (
                <div
                  key={label}
                  className={`v2-interest-chip${
                    selectedCity === label ? " selected" : ""
                  }`}
                  onClick={() => setSelectedCity(label)}
                >
                  <span className="v2-interest-chip-icon">{icon}</span>
                  <span className="v2-interest-chip-label">{label}</span>
                </div>
              ))}
            </div>

            <div className="v2-ob-dots">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`v2-ob-dot${obStep === i ? " active" : ""}`}
                />
              ))}
            </div>

            <button className="v2-ob-btn" onClick={handleNext}>
              {"Start exploring 🎉"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
