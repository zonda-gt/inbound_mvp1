"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CHECKLIST_DATA } from "@/lib/esim-constants";

export default function EsimChecklistSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [checked, setChecked] = useState<boolean[]>(new Array(CHECKLIST_DATA.length).fill(false));

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const doneCount = checked.filter(Boolean).length;
  const progress = (doneCount / CHECKLIST_DATA.length) * 100;

  return (
    <section className="py-12 sm:py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="seal-badge mb-4 inline-block">Checklist</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Pre-Departure Checklist
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Before you fly to China, make sure you&apos;ve ticked every box:
          </p>

          {/* Progress bar */}
          <div className="mt-6 mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{doneCount} of {CHECKLIST_DATA.length} completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2e7d32] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {CHECKLIST_DATA.map((item, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                onClick={() => toggle(i)}
                className={`w-full text-left flex items-start gap-3 rounded-lg border p-4 transition-all ${
                  checked[i]
                    ? "bg-[#2e7d32]/5 border-[#2e7d32]/20"
                    : "bg-card border-border hover:border-[#C84032]/30"
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  checked[i] ? "bg-[#2e7d32] border-[#2e7d32]" : "border-border"
                }`}>
                  {checked[i] && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-colors ${checked[i] ? "text-foreground/50 line-through" : "text-foreground"}`}>
                    {item.task}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.why}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Bottom line */}
          <div className="mt-8 bg-[#2e7d32]/5 border border-[#2e7d32]/15 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5" role="img" aria-label="target">🎯</span>
              <div>
                <h4 className="font-semibold text-[#2e7d32] text-sm sm:text-base mb-1">Bottom Line</h4>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  The best setup for most travelers in 2026 is a <strong>roaming eSIM from Trip.com or Airalo</strong> for your mobile data (no VPN needed), combined with a premium VPN like <strong>ExpressVPN or NordVPN</strong> installed before departure for hotel Wi-Fi. Set up Alipay at home. This combination is legal, reliable, fast, and covers all your bases.
                  Need help? Your <strong>AI Local Friend</strong> can walk you through each step.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
