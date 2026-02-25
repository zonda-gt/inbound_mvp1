"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TROUBLESHOOTING_DATA } from "@/lib/guide-constants";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

const severityConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; border: string; label: string }
> = {
  high: {
    icon: AlertCircle,
    color: "#C84032",
    bg: "#C8403208",
    border: "#C8403220",
    label: "Common",
  },
  medium: {
    icon: AlertTriangle,
    color: "#C9A96E",
    bg: "#C9A96E08",
    border: "#C9A96E20",
    label: "Occasional",
  },
  low: {
    icon: Info,
    color: "#1677FF",
    bg: "#1677FF08",
    border: "#1677FF20",
    label: "Rare",
  },
};

export default function TroubleshootingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="troubleshooting" className="py-12 sm:py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="seal-badge mb-4 inline-block">Fix It</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Troubleshooting Guide
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Common problems and their solutions. Bookmark this section — you may
            need it during your trip.
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Desktop table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[200px]">
                      Problem
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Solution
                    </th>
                    <th className="text-center py-3 px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[100px]">
                      Frequency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TROUBLESHOOTING_DATA.map((item, i) => {
                    const config = severityConfig[item.severity];
                    const SeverityIcon = config.icon;
                    return (
                      <tr
                        key={item.problem}
                        className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-start gap-2">
                            <SeverityIcon
                              className="w-4 h-4 flex-shrink-0 mt-0.5"
                              style={{ color: config.color }}
                            />
                            <span className="text-sm font-medium text-foreground">
                              {item.problem}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-sm text-muted-foreground leading-relaxed">
                          {item.solution}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm"
                            style={{
                              backgroundColor: config.bg,
                              color: config.color,
                              border: `1px solid ${config.border}`,
                            }}
                          >
                            {config.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {TROUBLESHOOTING_DATA.map((item, i) => {
              const config = severityConfig[item.severity];
              const SeverityIcon = config.icon;
              return (
                <motion.div
                  key={item.problem}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2">
                      <SeverityIcon
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: config.color }}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {item.problem}
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm flex-shrink-0"
                      style={{
                        backgroundColor: config.bg,
                        color: config.color,
                        border: `1px solid ${config.border}`,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                    {item.solution}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
