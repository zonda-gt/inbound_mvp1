"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { ESIM_IMAGES, VPN_PROVIDERS, VPN_PROS, VPN_CONS } from "@/lib/esim-constants";

const BADGE_STYLES: Record<string, string> = {
  green: "bg-[#2e7d32]/10 text-[#2e7d32]",
  red: "bg-[#C84032]/10 text-[#C84032]",
  blue: "bg-[#1565c0]/10 text-[#1565c0]",
};

export default function VpnSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="vpn" className="py-12 sm:py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="seal-badge mb-4 inline-block">VPN Guide</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            VPNs in China: What You Need to Know
          </h2>

          <p className="mt-4 text-sm sm:text-base text-foreground/80 leading-relaxed">
            A <strong>Virtual Private Network (VPN)</strong> encrypts your internet traffic and routes it through a server outside China, bypassing the Great Firewall. It&apos;s the traditional method — but comes with important caveats in 2026.
          </p>

          <div className="mt-6 rounded-xl overflow-hidden shadow-md">
            <img
              src={ESIM_IMAGES.esimVsVpn}
              alt="eSIM vs VPN comparison for China travel"
              className="w-full h-auto"
            />
            <p className="text-xs text-center text-muted-foreground py-2 italic">
              A clear side-by-side comparison of eSIM and VPN approaches for internet access in China.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-foreground mt-8 mb-2">The Legal Reality</h3>
          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
            China officially allows only government-approved VPN services for corporate use. <strong>Most commercial VPNs are technically banned.</strong> However, no widely-documented cases of tourists being fined exist — but stay discreet and use a reputable provider.
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-lg p-4 border-l-4 border-[#C84032] bg-[#C84032]/5">
            <AlertTriangle className="w-5 h-5 text-[#C84032] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#C84032] uppercase tracking-wide mb-1">Critical: Install Before You Arrive</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                VPN provider websites are blocked in China. You <strong>cannot download or purchase a VPN once inside the country.</strong> Install, sign in, and test your VPN before boarding. Also download manual configuration files (OpenVPN/IKEv2) as a backup.
              </p>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-foreground mt-8 mb-4">
            Which VPNs Work Best in China?
          </h3>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#1A1A1A] text-white">
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">VPN Provider</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">China Reliability</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Obfuscation</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody>
                {VPN_PROVIDERS.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${BADGE_STYLES[row.reliabilityColor]}`}>
                        {row.reliability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{row.obfuscation === "None" ? "❌ None" : `✅ ${row.obfuscation}`}</td>
                    <td className="px-4 py-3 text-foreground/80">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {VPN_PROVIDERS.map((row, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-foreground">{row.name}</p>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${BADGE_STYLES[row.reliabilityColor]}`}>
                    {row.reliability}
                  </span>
                </div>
                <p className="text-sm text-foreground/70">{row.obfuscation === "None" ? "❌ No obfuscation" : `✅ ${row.obfuscation}`}</p>
                <p className="text-sm text-muted-foreground">{row.price}</p>
              </div>
            ))}
          </div>

          {/* Pros / Cons */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#2e7d32]/5 rounded-lg p-4 sm:p-5 border-l-4 border-[#2e7d32]">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#2e7d32] mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> VPN Pros
              </h4>
              <ul className="space-y-2">
                {VPN_PROS.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-[#2e7d32] font-bold flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#C84032]/5 rounded-lg p-4 sm:p-5 border-l-4 border-[#C84032]">
              <h4 className="text-sm font-bold uppercase tracking-wide text-[#C84032] mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> VPN Cons
              </h4>
              <ul className="space-y-2">
                {VPN_CONS.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-[#C84032] font-bold flex-shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Hotel WiFi trap */}
          <div className="mt-6 flex items-start gap-3 rounded-lg p-4 border-l-4 border-[#C84032] bg-[#C84032]/5">
            <AlertTriangle className="w-5 h-5 text-[#C84032] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#C84032] uppercase tracking-wide mb-1">Hotel WiFi Trap</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Your eSIM bypasses the firewall on mobile data — but the moment you switch to hotel WiFi, you&apos;re back behind it. Many hotel networks now actively block VPN protocols. <strong>Fix:</strong> Switch your VPN to OpenVPN TCP on port 443, or hotspot from your eSIM mobile data to your laptop.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
