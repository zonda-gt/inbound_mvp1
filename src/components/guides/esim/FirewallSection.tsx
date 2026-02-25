"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { BLOCKED_SERVICES, ESIM_IMAGES } from "@/lib/esim-constants";

export default function FirewallSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="firewall" className="py-12 sm:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="seal-badge mb-4 inline-block">The Firewall</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            The Great Firewall: What It Is &amp; Why It Matters
          </h2>

          <div className="mt-6 rounded-xl p-5 sm:p-6 border-l-4 border-[#C84032] text-white" style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)" }}>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              Planning a trip to China? Whether you&apos;re heading there for tourism, business, or a long-term stay, there&apos;s one thing every traveler quickly discovers: <strong className="text-white">the internet works very differently here.</strong> Google, YouTube, Instagram, WhatsApp, Netflix — all blocked. This guide cuts through the confusion and tells you exactly what to do.
            </p>
          </div>

          <p className="mt-6 text-sm sm:text-base text-foreground/80 leading-relaxed">
            China operates one of the world&apos;s most sophisticated internet censorship systems, officially known as the <strong>Golden Shield Project</strong> — universally referred to as the <strong>Great Firewall</strong>. It blocks IP addresses and DNS servers, filters URLs, and performs deep packet inspection on data traffic.
          </p>

          <div className="mt-6 rounded-xl overflow-hidden shadow-md">
            <img
              src={ESIM_IMAGES.blockedApps}
              alt="Apps blocked in China including Google, YouTube, Facebook, Instagram, WhatsApp"
              className="w-full h-auto"
            />
            <p className="text-xs text-center text-muted-foreground py-2 italic">
              The most commonly used apps and services blocked behind the Great Firewall of China.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-foreground mt-8 mb-4">
            What Exactly Gets Blocked?
          </h3>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#1A1A1A] text-white">
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Blocked Services</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Chinese Alternative</th>
                </tr>
              </thead>
              <tbody>
                {BLOCKED_SERVICES.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.category}</td>
                    <td className="px-4 py-3 text-foreground/80">{row.blocked}</td>
                    <td className="px-4 py-3 text-foreground/80">{row.alternative}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3 mt-4">
            {BLOCKED_SERVICES.map((row, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#C84032] mb-1">{row.category}</p>
                <p className="text-sm text-foreground/80"><strong>Blocked:</strong> {row.blocked}</p>
                <p className="text-sm text-foreground/60 mt-1"><strong>Alternative:</strong> {row.alternative}</p>
              </div>
            ))}
          </div>

          {/* Warning callout */}
          <div className="mt-6 flex items-start gap-3 rounded-lg p-4 sm:p-5 border-l-4 border-[#C84032] bg-[#C84032]/5">
            <AlertTriangle className="w-5 h-5 text-[#C84032] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#C84032] uppercase tracking-wide mb-1">Important for Travelers</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                The Great Firewall affects <em>everyone</em> visiting China. You won&apos;t be able to access social media, email, messaging apps, or streaming services. This means you could be completely unreachable, and unable to access travel documents stored online. Plan ahead.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
