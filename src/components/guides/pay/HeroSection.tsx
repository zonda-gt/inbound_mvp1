"use client";

import { motion } from "framer-motion";
import { ChevronDown, Smartphone, CreditCard, MapPin } from "lucide-react";
import { IMAGES } from "@/lib/guide-constants";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={IMAGES.hero}
          alt="Chinese street market with QR code payment"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/50 to-[#1A1A1A]/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-24 sm:pt-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="seal-badge mb-4 sm:mb-6" style={{ background: "rgba(200,64,50,0.15)", color: "#F5F0E8", borderColor: "rgba(200,64,50,0.4)" }}>
            Updated for 2025/2026
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl">
            The Ultimate Guide to{" "}
            <span className="text-[#FFD700]">Paying in China</span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            Everything you need to know about Alipay, WeChat Pay, and mobile payments
            as a foreigner visiting China. Set up before you land, pay like a local.
          </p>

          {/* Quick stats */}
          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-6">
            {[
              { icon: Smartphone, label: "2 Apps to Install", sublabel: "Alipay + WeChat" },
              { icon: CreditCard, label: "Visa & Mastercard", sublabel: "International cards OK" },
              { icon: MapPin, label: "Works Everywhere", sublabel: "Shops, transport, food" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 sm:py-3 border border-white/10"
              >
                <item.icon className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-white/60">{item.sublabel}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown className="w-6 h-6 text-white/40" />
        </motion.div>
      </div>
    </section>
  );
}
