"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

interface StickyBannerProps {
  message?: string;
}

export default function StickyBanner({
  message = "Planning a China trip? Get insider tips most tourists never find",
}: StickyBannerProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero (~85vh)
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-5 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div
              className="relative flex items-center gap-3 sm:gap-4 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg border border-white/10"
              style={{
                background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
              }}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white leading-snug">
                    {message}
                  </p>
                </div>
              </div>

              <Link
                href="/chat"
                className="flex-shrink-0 bg-[#FFD700] text-[#1A1A1A] font-semibold text-xs px-3.5 py-2 rounded-lg hover:bg-[#FFD700]/90 transition-colors active:scale-95"
              >
                Chat Now
              </Link>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
