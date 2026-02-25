"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TROUBLESHOOTING_DATA } from "@/lib/esim-constants";

export default function EsimTroubleshootingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="troubleshooting" className="py-12 sm:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="seal-badge mb-4 inline-block">Troubleshooting</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            When Things Go Wrong
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Even with the best preparation, things can go sideways. Here&apos;s how to fix the most common problems.
          </p>

          {/* Desktop table */}
          <div className="hidden sm:block mt-8 overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#1A1A1A] text-white">
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-[40%]">Problem</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Fix</th>
                </tr>
              </thead>
              <tbody>
                {TROUBLESHOOTING_DATA.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground align-top">{row.problem}</td>
                    <td className="px-4 py-3 text-foreground/80 leading-relaxed">{row.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden mt-6 space-y-3">
            {TROUBLESHOOTING_DATA.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="bg-card rounded-lg border border-border p-4"
              >
                <p className="text-sm font-semibold text-foreground mb-2">{row.problem}</p>
                <p className="text-sm text-foreground/70 leading-relaxed">{row.fix}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
