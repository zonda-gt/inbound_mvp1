"use client";

import { useState } from "react";

interface NavigateScreenProps {
  onNavigate: (screen: string) => void;
}

type TransportMode = "metro" | "taxi" | "walk";

export default function NavigateScreen({ onNavigate }: NavigateScreenProps) {
  const [activeMode, setActiveMode] = useState<TransportMode>("metro");

  return (
    <div className="v2-scroll-body">
      {/* ───── 1. Header ───── */}
      <section className="v2-nav-hdr v2-fade-up v2-d1">
        <h1 className="v2-nav-hdr-title">Getting There</h1>

        <div className="v2-route-card">
          {/* From row */}
          <div className="v2-route-row">
            <span className="v2-route-dot o" />
            <span className="v2-route-lbl">From</span>
            <span className="v2-route-val">
              People&apos;s Square (人民广场)
            </span>
          </div>

          {/* Vertical line divider */}
          <div className="v2-route-line-v" />

          {/* To row */}
          <div className="v2-route-row">
            <span className="v2-route-dot d" />
            <span className="v2-route-lbl">To</span>
            <span className="v2-route-val">Xun Yu Ji Noodles (寻鱼记)</span>
          </div>
        </div>
      </section>

      {/* ───── 2. Mode Toggle ───── */}
      <div className="v2-mode-toggle v2-fade-up v2-d1">
        <button
          className={`v2-mode-btn${activeMode === "metro" ? " active" : ""}`}
          onClick={() => setActiveMode("metro")}
        >
          <span className="v2-mode-icon">🚇</span>
          <span className="v2-mode-time">21 min</span>
          <span className="v2-mode-label">Metro</span>
          <span className="v2-mode-cost">¥2 · 0 transfers</span>
        </button>

        <button
          className={`v2-mode-btn${activeMode === "taxi" ? " active" : ""}`}
          onClick={() => setActiveMode("taxi")}
        >
          <span className="v2-mode-icon">🚕</span>
          <span className="v2-mode-time">5–7 min</span>
          <span className="v2-mode-label">Taxi</span>
          <span className="v2-mode-cost">¥14–18</span>
        </button>

        <button
          className={`v2-mode-btn${activeMode === "walk" ? " active" : ""}`}
          onClick={() => setActiveMode("walk")}
        >
          <span className="v2-mode-icon">🚶</span>
          <span className="v2-mode-time">8 min</span>
          <span className="v2-mode-label">Walk</span>
          <span className="v2-mode-cost">650m</span>
        </button>
      </div>

      {/* ───── 3. Map ───── */}
      <div className="v2-map-wrap v2-fade-up v2-d2">
        <div className="v2-map-inner">
          <div className="v2-map-road-h" />
          <div className="v2-map-road-v" />
          <div className="v2-map-route" />
          <span className="v2-map-pin-o">📍</span>
          <span className="v2-map-pin-d">🔴</span>
          <span className="v2-map-lbl">
            People&apos;s Square → Xun Yu Ji · 21 min via Line 1
          </span>
        </div>
      </div>

      {/* ───── 4. Steps ───── */}
      <section className="v2-steps-wrap v2-fade-up v2-d2">
        <h2 className="v2-steps-title">Step-by-step</h2>

        {/* Step 1: Walk to station */}
        <div className="v2-step">
          <div className="v2-step-ind">
            <div className="v2-step-circ walk">🚶</div>
            <div className="v2-step-conn" />
          </div>
          <div className="v2-step-body">
            <p className="v2-step-action">
              Walk 6 min to People&apos;s Square Station
            </p>
            <p className="v2-step-detail">
              Head east on Nanjing Rd W, turn right at Huangpi N Rd
            </p>
            <span className="v2-step-tag walk">↑ 440m</span>
          </div>
        </div>

        {/* Step 2: Metro */}
        <div className="v2-step">
          <div className="v2-step-ind">
            <div className="v2-step-circ metro">🚇</div>
            <div className="v2-step-conn" />
          </div>
          <div className="v2-step-body">
            <p className="v2-step-action">
              Take Line 1 → Fujin Rd direction
            </p>
            <p className="v2-step-detail">
              Board at 人民广场, ride 1 stop to 新闸路 (Xinzha Rd)
            </p>
            <span className="v2-step-tag metro">Line 1 · Red · 3 min</span>
          </div>
        </div>

        {/* Step 3: Walk to destination */}
        <div className="v2-step">
          <div className="v2-step-ind">
            <div className="v2-step-circ walk">🚶</div>
            <div className="v2-step-conn" />
          </div>
          <div className="v2-step-body">
            <p className="v2-step-action">Walk 8 min to Xun Yu Ji</p>
            <p className="v2-step-detail">
              Exit Gate B, walk north on Jiujiang Rd for 370m
            </p>
            <span className="v2-step-tag walk">↑ 370m</span>
          </div>
        </div>

        {/* Step 4: Arrive */}
        <div className="v2-step">
          <div className="v2-step-ind">
            <div className="v2-step-circ arrive">📍</div>
          </div>
          <div className="v2-step-body">
            <p className="v2-step-action">
              Arrive at Xun Yu Ji Noodles
            </p>
            <p className="v2-step-detail">
              162 Xinzha Rd, Jing&apos;an · Look for the red lanterns
            </p>
          </div>
        </div>
      </section>

      {/* ───── 5. AI Tip ───── */}
      <div className="v2-ai-strip v2-fade-up v2-d3">
        <div className="v2-ai-strip-icon">✦</div>
        <p className="v2-ai-strip-text">
          <strong>Pro tip:</strong> Take bus J167 — just 21 min and only ¥2. One
          stop from People&apos;s Square to Jiujiang Rd, then an 8-min walk.
          Perfect timing to build an appetite!
        </p>
      </div>

      {/* ───── 6. Taxi Card ───── */}
      <div className="v2-taxi-card v2-fade-up v2-d3">
        <p className="v2-taxi-card-title">🚕 Show this to your taxi driver</p>
        <p className="v2-taxi-cn">寻鱼记·现炒浇头面</p>
        <p className="v2-taxi-en">
          162 Xinzha Rd, Jing&apos;an District, Shanghai
        </p>
        <div className="v2-taxi-copy">
          <button className="v2-taxi-copy-btn primary">📋 Copy address</button>
          <button className="v2-taxi-copy-btn">📱 DiDi app</button>
        </div>
      </div>

      {/* ───── 7. Action Buttons ───── */}
      <div className="v2-nav-acts v2-fade-up v2-d4">
        <button className="v2-btn-big-red">🚕 Book DiDi Taxi</button>
        <button className="v2-btn-big-ghost">💾 Save route</button>
      </div>
    </div>
  );
}
