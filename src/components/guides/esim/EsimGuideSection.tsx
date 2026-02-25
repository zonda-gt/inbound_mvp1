"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Info, AlertTriangle, Shield, CheckCircle, XCircle } from "lucide-react";
import { ESIM_IMAGES, ESIM_PROS, ESIM_CONS, ESIM_PROVIDERS } from "@/lib/esim-constants";

function ProviderCard({ provider, index, isInView }: { provider: (typeof ESIM_PROVIDERS)[0]; index: number; isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="relative bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow overflow-hidden"
    >
      {provider.ribbon && (
        <span className="absolute top-3 right-3 bg-[#C84032] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
          {provider.ribbon}
        </span>
      )}
      <div className="text-[#FFD700] text-sm mb-1">
        {"★".repeat(provider.stars)}{"☆".repeat(5 - provider.stars)}
      </div>
      <h4 className="text-base sm:text-lg font-bold text-foreground">{provider.name}</h4>
      <p className="text-xs text-muted-foreground mb-2">{provider.tagline}</p>
      <p className="text-sm text-foreground/80 leading-relaxed mb-3">{provider.description}</p>
      <div className={`text-xs rounded-md p-2.5 leading-relaxed ${
        provider.noteType === "warn"
          ? "bg-[#C84032]/5 text-[#C84032] border-l-3 border-[#C84032]/30"
          : "bg-[#2e7d32]/5 text-[#2e7d32] border-l-3 border-[#2e7d32]/30"
      }`}>
        {provider.noteType === "warn" ? "⚠️ " : "✅ "}{provider.note}
      </div>
    </motion.div>
  );
}

export default function EsimGuideSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="esim" className="py-12 sm:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="seal-badge mb-4 inline-block">Recommended</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            Travel eSIM: The Recommended Solution
          </h2>

          <p className="mt-4 text-sm sm:text-base text-foreground/80 leading-relaxed">
            A travel eSIM is an <strong>embedded digital SIM card</strong> that you activate on your smartphone without needing any physical hardware. The best China-specific eSIMs route your traffic through international networks, effectively bypassing the Great Firewall without requiring a separate VPN.
          </p>

          <div className="mt-6 rounded-xl overflow-hidden shadow-md">
            <img
              src={ESIM_IMAGES.esimSetup}
              alt="How to set up a travel eSIM in 4 simple steps"
              className="w-full h-auto"
            />
            <p className="text-xs text-center text-muted-foreground py-2 italic">
              Setting up a travel eSIM takes less than 5 minutes — no airport queues, no passport scans.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-foreground mt-8 mb-4">
            Why eSIM Beats Every Other Option
          </h3>

          {/* Pros / Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#2e7d32]/5 rounded-lg p-4 sm:p-5 border-l-4 border-[#2e7d32]">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#2e7d32] mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Advantages
              </h4>
              <ul className="space-y-2">
                {ESIM_PROS.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-[#2e7d32] font-bold flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#C84032]/5 rounded-lg p-4 sm:p-5 border-l-4 border-[#C84032]">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#C84032] mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Limitations
              </h4>
              <ul className="space-y-2">
                {ESIM_CONS.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-[#C84032] font-bold flex-shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Callouts */}
          <div className="mt-6 flex items-start gap-3 rounded-lg p-4 border-l-4 border-[#1565c0] bg-[#1565c0]/5">
            <Info className="w-5 h-5 text-[#1565c0] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#1565c0] uppercase tracking-wide mb-1">Pro Tip</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Install your eSIM <em>before</em> you arrive in China. Once you&apos;re behind the firewall, accessing provider apps or websites to activate your plan can be difficult or impossible.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg p-4 border-l-4 border-[#C84032] bg-[#C84032]/5">
            <AlertTriangle className="w-5 h-5 text-[#C84032] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#C84032] uppercase tracking-wide mb-1">eSIM + Alipay Conflict</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                eSIMs can&apos;t receive Chinese SMS codes. If Alipay asks for SMS verification, it won&apos;t arrive on your eSIM number. <strong>Fix:</strong> Complete Alipay setup at home on WiFi before your trip, using your home phone number.
              </p>
            </div>
          </div>

          {/* Provider cards */}
          <h3 className="text-lg sm:text-xl font-bold text-foreground mt-10 mb-4">
            Top eSIM Providers for China (2026)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESIM_PROVIDERS.map((provider, i) => (
              <ProviderCard key={provider.name} provider={provider} index={i} isInView={isInView} />
            ))}
          </div>

          {/* Privacy note */}
          <div className="mt-6 flex items-start gap-3 rounded-lg p-4 border-l-4 border-[#8e24aa] bg-[#8e24aa]/5">
            <Shield className="w-5 h-5 text-[#8e24aa] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#8e24aa] uppercase tracking-wide mb-1">Privacy Note</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Some travel eSIM providers route traffic through Chinese-owned servers. If privacy is a priority, research your provider&apos;s network routing before purchasing, and consider pairing your eSIM with a trusted VPN on hotel Wi-Fi.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
