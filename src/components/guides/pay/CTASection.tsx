"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-10 sm:py-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-xl sm:rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 50%, #1A1A1A 100%)",
          }}
        >
          {/* Decorative elements */}
          <div
            className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #1677FF 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-48 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #07C160 0%, transparent 70%)",
              transform: "translate(-30%, 30%)",
            }}
          />

          <div className="relative z-10 px-6 py-8 sm:px-12 sm:py-14 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6">
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70" />
              <span className="text-[11px] sm:text-xs font-medium text-white/70">
                Your AI Local Friend
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
              Ready to set up payments?
            </h2>
            <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed">
              Your AI Local Friend walks you through every step — from downloading
              the apps to making your first payment — personalized to your phone,
              cards, and travel dates.
            </p>

            <Link
              href="https://app.hellochina.chat"
              className="inline-flex items-center gap-2 bg-[#FFD700] text-[#1A1A1A] font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-[#FFD700]/90 transition-colors text-xs sm:text-sm active:scale-95"
            >
              Ask Your AI Local Friend
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-white/30">
              Free. No sign-up. Works on any device.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
