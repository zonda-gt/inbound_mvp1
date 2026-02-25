"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { COMPARISON_DATA } from "@/lib/guide-constants";
import { Check, Minus } from "lucide-react";

function WinnerBadge({ winner }: { winner: string }) {
  if (winner === "alipay") {
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full"
        style={{ backgroundColor: "#1677FF15", color: "#1677FF" }}
      >
        <Check className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (winner === "wechat") {
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full"
        style={{ backgroundColor: "#07C16015", color: "#07C160" }}
      >
        <Check className="w-3.5 h-3.5" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted">
      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
    </span>
  );
}

export default function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="comparison" className="py-12 sm:py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="seal-badge mb-4 inline-block">Head to Head</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Alipay vs WeChat Pay
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            A detailed comparison to help you understand the differences.
            We recommend setting up both, but if you can only choose one, Alipay is generally
            the better option for foreign visitors.
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-foreground text-sm border-b-2 border-foreground/10 w-[30%]">
                    Feature
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm border-b-2 border-foreground/10 w-[30%]">
                    <span className="flex items-center gap-2" style={{ color: "#1677FF" }}>
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M21.422 15.358c-3.32-1.326-6.092-3.015-6.092-3.015s1.5-3.783 1.862-5.722c.362-1.94-.218-3.306-2.004-3.306s-2.726 1.24-3.268 3.36c-.542 2.12-.724 3.9-.724 3.9S8.39 12.28 6.57 13.4c-1.82 1.12-4.57 2.96-4.57 5.28 0 2.32 2.18 3.32 4.36 3.32s4.54-1.42 6.54-3.42c0 0 2.82 1.52 5.64 2.28 2.82.76 3.46-.44 3.46-1.94s-.26-2.24-2.58-3.56z"/>
                      </svg>
                      Alipay
                    </span>
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-sm border-b-2 border-foreground/10 w-[30%]">
                    <span className="flex items-center gap-2" style={{ color: "#07C160" }}>
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.68 4.908c-3.958 0-7.168 2.69-7.168 6.01 0 3.318 3.21 6.01 7.168 6.01.779 0 1.534-.1 2.243-.3a.68.68 0 0 1 .567.077l1.504.882a.258.258 0 0 0 .132.043.23.23 0 0 0 .23-.233c0-.057-.023-.113-.038-.168l-.308-1.17a.467.467 0 0 1 .168-.527C21.583 16.963 22.446 15.3 22.446 16.909c0-3.32-3.21-6.01-7.168-6.01z"/>
                      </svg>
                      WeChat Pay
                    </span>
                  </th>
                  <th className="text-center py-4 px-3 font-semibold text-sm border-b-2 border-foreground/10 w-[10%]">
                    Edge
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, i) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-sm font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-muted-foreground">
                      {row.alipay}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-muted-foreground">
                      {row.wechat}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <WinnerBadge winner={row.winner} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {COMPARISON_DATA.map((row, i) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-foreground">{row.feature}</h4>
                  <WinnerBadge winner={row.winner} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "#1677FF15", color: "#1677FF" }}
                    >
                      Alipay
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{row.alipay}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "#07C16015", color: "#07C160" }}
                    >
                      WeChat
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{row.wechat}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full" style={{ backgroundColor: "#1677FF15", color: "#1677FF" }}>
              <Check className="w-2.5 h-2.5" />
            </span>
            Alipay advantage
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full" style={{ backgroundColor: "#07C16015", color: "#07C160" }}>
              <Check className="w-2.5 h-2.5" />
            </span>
            WeChat Pay advantage
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted">
              <Minus className="w-2.5 h-2.5 text-muted-foreground" />
            </span>
            Tie
          </div>
        </div>
      </div>
    </section>
  );
}
