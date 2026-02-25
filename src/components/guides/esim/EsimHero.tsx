"use client";

import { motion } from "framer-motion";
import { ESIM_IMAGES } from "@/lib/esim-constants";

export default function EsimHero() {
  return (
    <section className="relative min-h-[75vh] sm:min-h-[80vh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={ESIM_IMAGES.hero}
          alt="Shanghai skyline — Internet in China guide"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/50 to-[#1A1A1A]/20" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 pt-24 sm:pt-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div
            className="seal-badge mb-4 sm:mb-6"
            style={{ background: "rgba(200,64,50,0.15)", color: "#F5F0E8", borderColor: "rgba(200,64,50,0.4)" }}
          >
            2026 Updated Guide
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl">
            Internet in China:{" "}
            <span className="text-[#FFD700]">eSIM &amp; VPN Guide</span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            Everything you need to stay connected, access your apps, and navigate
            the Great Firewall — without the stress.
          </p>

          <div className="mt-6 sm:mt-10 flex flex-wrap gap-3 sm:gap-6">
            {[
              { label: "10 min read" },
              { label: "February 2026" },
              { label: "Editorial Team" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2"
              >
                <span className="text-xs sm:text-sm font-medium text-white/90">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
