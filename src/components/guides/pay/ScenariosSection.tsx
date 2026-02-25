"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SCENARIOS_DATA } from "@/lib/guide-constants";

const appColors: Record<string, { bg: string; text: string; label: string }> = {
  alipay: { bg: "#1677FF15", text: "#1677FF", label: "Alipay" },
  wechat: { bg: "#07C16015", text: "#07C160", label: "WeChat" },
  both: { bg: "#C9A96E15", text: "#C9A96E", label: "Either App" },
};

export default function ScenariosSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="scenarios" className="py-12 sm:py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="seal-badge mb-4 inline-block">Real World</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Real-World Payment Scenarios
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Here&apos;s exactly what to expect in common situations. Knowing these
            scenarios in advance will make you feel like a local.
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-3 sm:space-y-4"
        >
          {SCENARIOS_DATA.map((scenario, i) => {
            const appStyle = appColors[scenario.app];
            return (
              <motion.div
                key={scenario.title}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-card border border-border rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl flex-shrink-0 mt-0.5">{scenario.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">
                        {scenario.title}
                      </h3>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
                        style={{
                          backgroundColor: appStyle.bg,
                          color: appStyle.text,
                        }}
                      >
                        {appStyle.label}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
