"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap } from "lucide-react";
import { QUICK_ANSWER_DATA } from "@/lib/esim-constants";

export default function QuickAnswerSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="quick-answer" className="py-10 sm:py-14 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="rounded-xl border-2 border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/5 to-card p-5 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#FFD700]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Just Tell Me What to Buy
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {QUICK_ANSWER_DATA.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-card rounded-lg p-4 border-l-4 border-[#C84032]"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#C84032] mb-2">
                  {item.label}
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {item.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
