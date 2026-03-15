"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface InlineCTAProps {
  heading?: string;
  description?: string;
  prompt?: string;
}

export default function InlineCTA({
  heading = "Need a hand with setup?",
  description = "Your AI Local Friend walks you through each step, personalized to your phone, cards, and travel dates.",
  prompt,
}: InlineCTAProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const href = prompt ? `https://app.hellochina.chat?prompt=${encodeURIComponent(prompt)}` : "https://app.hellochina.chat";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
      className="my-8 sm:my-10"
    >
      <div className="relative overflow-hidden rounded-xl border border-[#FFD700]/20 bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] p-5 sm:p-6">
        {/* Glow */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #FFD700 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/15 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-white">
                {heading}
              </h4>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed mt-0.5">
                {description}
              </p>
            </div>
          </div>

          <Link
            href={href}
            className="inline-flex items-center gap-1.5 bg-[#FFD700] text-[#1A1A1A] font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg hover:bg-[#FFD700]/90 transition-colors active:scale-95 flex-shrink-0"
          >
            Ask Your AI Friend
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
