"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IMAGES, ALIPAY_STEPS, WECHAT_STEPS } from "@/lib/guide-constants";
import {
  Download,
  KeyRound,
  UserCheck,
  ScanFace,
  CreditCard,
  QrCode,
  Smartphone,
  Users,
  ShieldCheck,
  Wallet,
  Lock,
  AlertTriangle,
} from "lucide-react";

const alipayIcons = [Download, KeyRound, UserCheck, ScanFace, CreditCard, QrCode];
const wechatIcons = [Smartphone, Users, ShieldCheck, Wallet, Lock];

type Tab = "alipay" | "wechat";

function StepCard({
  step,
  index,
  Icon,
  variant,
  totalSteps,
}: {
  step: { number: number; title: string; description: string; warning?: string };
  index: number;
  Icon: React.ElementType;
  variant: Tab;
  totalSteps: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`${variant === "alipay" ? "alipay-step" : "wechat-step"} relative`}
    >
      <div className="flex gap-3 sm:gap-6">
        {/* Timeline line */}
        <div className="flex flex-col items-center">
          <div className="step-number text-sm sm:text-lg w-8 h-8 sm:w-10 sm:h-10">{step.number}</div>
          {index < totalSteps - 1 && (
            <div
              className="w-px flex-1 mt-2"
              style={{
                background:
                  variant === "alipay"
                    ? "linear-gradient(to bottom, rgba(22,119,255,0.3), rgba(22,119,255,0.05))"
                    : "linear-gradient(to bottom, rgba(7,193,96,0.3), rgba(7,193,96,0.05))",
              }}
            />
          )}
        </div>

        {/* Content */}
        <div className="pb-6 sm:pb-8 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <Icon
              className="w-4 h-4 flex-shrink-0"
              style={{
                color: variant === "alipay" ? "#1677FF" : "#07C160",
              }}
            />
            <h4 className="font-semibold text-foreground text-sm sm:text-base">
              {step.title}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
          {step.warning && (
            <div className="mt-2.5 sm:mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">{step.warning}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SetupSection() {
  const [activeTab, setActiveTab] = useState<Tab>("alipay");

  return (
    <section id="setup" className="py-12 sm:py-20 bg-secondary/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="seal-badge mb-4 inline-block">Step-by-Step</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Mobile Payment Setup Guide
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Follow these instructions to set up your payment apps before arriving in China.
            We recommend doing this at home where you have stable internet.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex bg-card border border-border rounded-lg p-1 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("alipay")}
              className={`relative flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 ${
                activeTab === "alipay"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === "alipay" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: "#1677FF" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor">
                  <path d="M21.422 15.358c-3.32-1.326-6.092-3.015-6.092-3.015s1.5-3.783 1.862-5.722c.362-1.94-.218-3.306-2.004-3.306s-2.726 1.24-3.268 3.36c-.542 2.12-.724 3.9-.724 3.9S8.39 12.28 6.57 13.4c-1.82 1.12-4.57 2.96-4.57 5.28 0 2.32 2.18 3.32 4.36 3.32s4.54-1.42 6.54-3.42c0 0 2.82 1.52 5.64 2.28 2.82.76 3.46-.44 3.46-1.94s-.26-2.24-2.58-3.56z" />
                </svg>
                <span className="hidden sm:inline">Alipay (Recommended)</span>
                <span className="sm:hidden">Alipay</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("wechat")}
              className={`relative flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 ${
                activeTab === "wechat"
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === "wechat" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: "#07C160" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.68 4.908c-3.958 0-7.168 2.69-7.168 6.01 0 3.318 3.21 6.01 7.168 6.01.779 0 1.534-.1 2.243-.3a.68.68 0 0 1 .567.077l1.504.882a.258.258 0 0 0 .132.043.23.23 0 0 0 .23-.233c0-.057-.023-.113-.038-.168l-.308-1.17a.467.467 0 0 1 .168-.527C21.583 16.963 22.446 15.3 22.446 16.909c0-3.32-3.21-6.01-7.168-6.01z" />
                </svg>
                <span className="hidden sm:inline">WeChat Pay</span>
                <span className="sm:hidden">WeChat</span>
              </span>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
          {/* Steps */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {/* Info banner */}
            <div
              className="mb-6 sm:mb-8 rounded-lg p-3 sm:p-4 text-xs sm:text-sm"
              style={{
                backgroundColor:
                  activeTab === "alipay" ? "#1677FF0A" : "#07C1600A",
                borderLeft: `3px solid ${
                  activeTab === "alipay" ? "#1677FF" : "#07C160"
                }`,
              }}
            >
              {activeTab === "alipay" ? (
                <span>
                  <strong>Why Alipay?</strong> It&apos;s generally more foreigner-friendly,
                  accepts both debit and credit cards (except Amex), and has easier
                  identity verification with an international passport.
                </span>
              ) : (
                <span>
                  <strong>Note:</strong> WeChat Pay verification can be stricter for
                  foreigners. New accounts may require &quot;friend verification.&quot; It&apos;s best
                  to set up <strong>both</strong> apps. WeChat Pay only accepts
                  international <em>credit</em> cards (not debit).
                </span>
              )}
            </div>

            {/* Preparation checklist */}
            <div className="mb-6 sm:mb-8 bg-card border border-border rounded-lg p-4 sm:p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base">
                What You&apos;ll Need
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  {
                    label:
                      activeTab === "alipay" ? "Alipay App" : "WeChat App",
                    sub:
                      activeTab === "alipay"
                        ? 'Blue icon with "支"'
                        : "Intl. Version OK",
                    icon: "📱",
                  },
                  {
                    label: "Bank Card",
                    sub:
                      activeTab === "alipay"
                        ? "Visa, MC, JCB (no Amex)"
                        : "Visa, MC (credit only)",
                    icon: "💳",
                  },
                  {
                    label: "Passport",
                    sub: "Info page + visa page",
                    icon: "🛂",
                  },
                  {
                    label: "Phone Number",
                    sub: "Physical SIM preferred",
                    icon: "📞",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 bg-secondary/50 rounded-md px-3 py-2.5"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "alipay"
                  ? ALIPAY_STEPS.map((step, i) => (
                      <StepCard
                        key={step.number}
                        step={step}
                        index={i}
                        Icon={alipayIcons[i]}
                        variant="alipay"
                        totalSteps={ALIPAY_STEPS.length}
                      />
                    ))
                  : WECHAT_STEPS.map((step, i) => (
                      <StepCard
                        key={step.number}
                        step={step}
                        index={i}
                        Icon={wechatIcons[i]}
                        variant="wechat"
                        totalSteps={WECHAT_STEPS.length}
                      />
                    ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* App illustration + tips */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={
                      activeTab === "alipay" ? IMAGES.alipay : IMAGES.wechat
                    }
                    alt={`${activeTab === "alipay" ? "Alipay" : "WeChat Pay"} app interface`}
                    className="w-full rounded-xl shadow-lg max-h-[300px] sm:max-h-none object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Quick tip below image */}
              <div className="mt-4 sm:mt-6 bg-card border border-border rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-xs sm:text-sm text-foreground mb-1">
                  {activeTab === "alipay" ? "Alipay TourCard" : "Pro Tip"}
                </h4>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  {activeTab === "alipay"
                    ? 'Alipay also offers TourCard — a prepaid option valid for 180 days with up to ¥10,000 balance. Search "TourCard" in the app. The 5% top-up fee can be cheaper than paying 3% per transaction on larger purchases.'
                    : "Set up your WeChat account WEEKS before travel. Don't delete it when you leave China — keep it active for your next trip. WeChat also offers metro/bus ride codes via mini-programs in most cities."}
                </p>
              </div>

              {/* Wise card recommendation */}
              <div className="mt-3 sm:mt-4 bg-[#9FE870]/10 border border-[#9FE870]/30 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-xs sm:text-sm text-foreground mb-1">
                  💡 Wise Card Backup
                </h4>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  A Wise debit card (Visa) is a great backup — real mid-market
                  exchange rates, links to Alipay, and works as a regular Visa
                  internationally. Order one before your trip.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
