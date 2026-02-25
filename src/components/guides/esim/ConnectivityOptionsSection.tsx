"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CONNECTIVITY_OPTIONS } from "@/lib/esim-constants";

const BADGE_STYLES: Record<string, string> = {
  green: "bg-[#2e7d32]/10 text-[#2e7d32]",
  red: "bg-[#C84032]/10 text-[#C84032]",
  orange: "bg-[#e65100]/10 text-[#e65100]",
  blue: "bg-[#1565c0]/10 text-[#1565c0]",
};

export default function ConnectivityOptionsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="options" className="py-12 sm:py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="seal-badge mb-4 inline-block">Options</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Your Connectivity Options in China
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Despite the restrictions, there are several ways to stay connected. Each comes with trade-offs in cost, convenience, and access to blocked content.
          </p>

          {/* Desktop table */}
          <div className="hidden sm:block mt-8 overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#1A1A1A] text-white">
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Option</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Pros</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Cons</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {CONNECTIVITY_OPTIONS.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.option}</td>
                    <td className="px-4 py-3 text-foreground/80">{row.pros}</td>
                    <td className="px-4 py-3 text-foreground/80">{row.cons}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${BADGE_STYLES[row.verdictColor]}`}>
                        {row.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden mt-6 space-y-3">
            {CONNECTIVITY_OPTIONS.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-card rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-foreground">{row.option}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${BADGE_STYLES[row.verdictColor]}`}>
                    {row.verdict}
                  </span>
                </div>
                <p className="text-sm text-foreground/70"><strong className="text-[#2e7d32]">+</strong> {row.pros}</p>
                <p className="text-sm text-foreground/70 mt-1"><strong className="text-[#C84032]">−</strong> {row.cons}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
