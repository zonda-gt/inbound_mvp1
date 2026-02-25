"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";

export default function FeesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="fees" className="py-12 sm:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="seal-badge mb-4 inline-block">Money Matters</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Fees &amp; Transaction Limits
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Both apps charge the same fees for international card users. Understanding the
            fee structure helps you minimize costs during your trip.
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Fee cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-10">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 text-center">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">
                Under ¥200 / txn
              </div>
              <div className="text-3xl sm:text-5xl font-bold" style={{ color: "#07C160" }}>
                Free
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">0% service fee</div>
              <div className="mt-2 sm:mt-4 text-[11px] sm:text-xs text-muted-foreground leading-relaxed hidden sm:block">
                Most street food, coffee, snacks, and small purchases fall under this threshold.
                You&apos;ll pay no extra fees on these transactions.
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 text-center">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">
                Over ¥200 / txn
              </div>
              <div className="text-3xl sm:text-5xl font-bold" style={{ color: "#C84032" }}>
                3%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Service fee on total</div>
              <div className="mt-2 sm:mt-4 text-[11px] sm:text-xs text-muted-foreground leading-relaxed hidden sm:block">
                This fee applies to foreign credit/debit cards. Restaurants, shopping, and
                transport costs often exceed this. Your card issuer may add FX fees on top.
              </div>
            </div>
          </div>

          {/* Real cost warning */}
          <div className="mb-4 sm:mb-6 flex items-start gap-2.5 sm:gap-3 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-red-800 mb-1">
                The Real Cost: Up to 6% on Larger Purchases
              </h4>
              <p className="text-xs sm:text-sm text-red-700 leading-relaxed">
                The 3% platform fee is just the start. Your bank may also charge a{" "}
                <strong>foreign transaction fee (typically 1–3%)</strong> and apply their own
                exchange rate markup. This means a ¥500 restaurant bill could cost you up to{" "}
                <strong>6% more</strong> than the sticker price.
              </p>
            </div>
          </div>

          {/* How to minimize fees */}
          <div className="mb-6 sm:mb-10 bg-[#07C160]/5 border border-[#07C160]/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: "#07C160" }} />
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2">
                  How to Minimize Fees
                </h4>
                <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground mt-px">1.</span>
                    <span>
                      <strong>Keep transactions under ¥200</strong> when possible — these are
                      completely free. Split larger purchases if the merchant allows it.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground mt-px">2.</span>
                    <span>
                      <strong>Use Alipay TourCard</strong> for larger purchases — the 5%
                      one-time top-up fee avoids the 3% per-transaction fee.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground mt-px">3.</span>
                    <span>
                      <strong>Use a Wise card</strong> — real mid-market exchange
                      rate with low, transparent fees. Link it to Alipay for QR payments.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground mt-px">4.</span>
                    <span>
                      <strong>Use a no-FX-fee credit card</strong> (e.g.,
                      Chase Sapphire, Capital One Venture) to eliminate the bank&apos;s 1–3%
                      foreign transaction fee.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Limits table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Transaction Limits</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-2.5 sm:py-3 px-4 sm:px-6 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Limit Type
                    </th>
                    <th
                      className="text-left py-2.5 sm:py-3 px-4 sm:px-6 text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#1677FF" }}
                    >
                      Alipay
                    </th>
                    <th
                      className="text-left py-2.5 sm:py-3 px-4 sm:px-6 text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#07C160" }}
                    >
                      WeChat Pay
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "Per Transaction", alipay: "¥5,000 (~$700)", wechat: "¥6,500 (~$900)" },
                    { type: "Monthly Cap", alipay: "¥50,000 (~$7,000)", wechat: "¥50,000 (~$7,000)" },
                    { type: "Annual Cap", alipay: "¥60,000 (~$8,400)", wechat: "¥60,000 (~$8,400)" },
                    { type: "Without ID Verification", alipay: "~$2,000/year", wechat: "Limited" },
                    { type: "With ID Verification", alipay: "Up to $50,000/yr", wechat: "Standard limits" },
                  ].map((row, i) => (
                    <tr
                      key={row.type}
                      className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-secondary/10"}`}
                    >
                      <td className="py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm font-medium text-foreground">
                        {row.type}
                      </td>
                      <td className="py-2.5 sm:py-3 px-4 sm:px-6 text-xs text-muted-foreground font-mono">
                        {row.alipay}
                      </td>
                      <td className="py-2.5 sm:py-3 px-4 sm:px-6 text-xs text-muted-foreground font-mono">
                        {row.wechat}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Restrictions */}
          <div className="mt-4 sm:mt-6 bg-card border border-border rounded-xl p-4 sm:p-6">
            <h3 className="font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">
              What International Cards <em>Cannot</em> Do
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {[
                "Send or receive red packets (红包)",
                "Transfer money to individuals (P2P)",
                "Top up phone credit",
                "Use wealth management services",
                "Purchase insurance products",
                "Withdraw balance to foreign cards",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C84032] flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-muted-foreground">
              International cards are for <strong>consumption only</strong> — purchases at
              merchants, both online and in physical stores. All other financial features
              require a Chinese bank account.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
