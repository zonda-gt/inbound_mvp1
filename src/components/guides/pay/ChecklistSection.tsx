"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { CHECKLIST_DATA } from "@/lib/guide-constants";
import { CalendarDays, Plane, MapPin, Check } from "lucide-react";

type Phase = "oneWeek" | "dayBefore" | "onArrival";

const phases: {
  key: Phase;
  title: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "oneWeek", title: "One Week Before", icon: CalendarDays, color: "#1677FF" },
  { key: "dayBefore", title: "Day Before Departure", icon: Plane, color: "#C9A96E" },
  { key: "onArrival", title: "On Arrival in China", icon: MapPin, color: "#07C160" },
];

export default function ChecklistSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleItem = useCallback((key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const totalItems =
    CHECKLIST_DATA.oneWeek.length +
    CHECKLIST_DATA.dayBefore.length +
    CHECKLIST_DATA.onArrival.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <section id="checklist" className="py-12 sm:py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="seal-badge mb-4 inline-block">Be Prepared</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Pre-Trip Checklist
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Use this interactive checklist to make sure you&apos;re fully prepared.
            Check off each item as you complete it.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-foreground">
              Progress: {checkedCount} / {totalItems} completed
            </span>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "#07C160" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-4 sm:space-y-6"
        >
          {phases.map((phase) => {
            const items = CHECKLIST_DATA[phase.key];
            const PhaseIcon = phase.icon;
            const phaseChecked = items.filter(
              (_, i) => checked[`${phase.key}-${i}`]
            ).length;

            return (
              <div
                key={phase.key}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Phase header */}
                <div
                  className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center justify-between"
                  style={{ borderLeftWidth: 3, borderLeftColor: phase.color }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <PhaseIcon
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{ color: phase.color }}
                    />
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">
                      {phase.title}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {phaseChecked}/{items.length}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-border/50">
                  {items.map((item, i) => {
                    const key = `${phase.key}-${i}`;
                    const isChecked = !!checked[key];
                    return (
                      <button
                        key={key}
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-left hover:bg-secondary/30 transition-colors active:bg-secondary/50"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isChecked
                              ? "border-[#07C160] bg-[#07C160]"
                              : "border-border"
                          }`}
                        >
                          {isChecked && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span
                          className={`text-xs sm:text-sm transition-all ${
                            isChecked
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Completion message */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 sm:mt-6 bg-[#07C160]/10 border border-[#07C160]/30 rounded-lg p-4 sm:p-5 text-center"
          >
            <span className="text-2xl mb-2 block">🎉</span>
            <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
              You&apos;re All Set!
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              You&apos;ve completed all preparation steps. Enjoy your trip to China!
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
