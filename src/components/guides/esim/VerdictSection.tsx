"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { VERDICT_ITEMS } from "@/lib/esim-constants";

const LABEL_STYLES: Record<string, string> = {
  best: "bg-[#2e7d32] text-white",
  ok: "bg-[#f59e0b] text-white",
  avoid: "bg-[#C84032] text-white",
};

export default function VerdictSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="verdict" className="py-12 sm:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="rounded-xl p-6 sm:p-10 text-white"
          style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)" }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            The Verdict: What Should You Actually Do?
          </h2>
          <p className="text-sm sm:text-base text-white/70 mb-6">
            Here&apos;s our clear recommendation based on all the evidence:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VERDICT_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-white/[0.07] border border-white/10 rounded-lg p-4 sm:p-5"
              >
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${LABEL_STYLES[item.labelType]}`}>
                  {item.label}
                </span>
                <h4 className="text-base font-bold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-white/70 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
