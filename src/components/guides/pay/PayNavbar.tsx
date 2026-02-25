"use client";

import { useState, useEffect } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "Setup Guide", href: "#setup" },
  { label: "Comparison", href: "#comparison" },
  { label: "Scenarios", href: "#scenarios" },
  { label: "Fees", href: "#fees" },
  { label: "Checklist", href: "#checklist" },
  { label: "FAQ", href: "#faq" },
];

export default function PayNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? "bg-[#F5F0E8]/95 backdrop-blur-md shadow-sm border-b border-[#1A1A1A]/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <a href="#" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-bold text-[#1A1A1A]">
              支付
            </span>
            <span
              className={`text-sm font-medium transition-colors ${
                scrolled || mobileOpen ? "text-[#1A1A1A]/70" : "text-white/90"
              }`}
            >
              China Pay Guide
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  scrolled
                    ? "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/chat"
              className="ml-2 inline-flex items-center gap-1.5 bg-[#FFD700] text-[#1A1A1A] font-semibold text-xs px-3 py-1.5 rounded-md hover:bg-[#FFD700]/90 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              AI Local Friend
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-md transition-colors ${
              scrolled || mobileOpen ? "text-[#1A1A1A]" : "text-white"
            }`}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 top-14 bg-black/20 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-14 left-0 right-0 bg-[#F5F0E8]/98 backdrop-blur-md border-b border-[#1A1A1A]/10 shadow-lg z-50"
            >
              <div className="px-4 py-3 space-y-0.5 max-h-[70vh] overflow-y-auto">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-lg active:bg-[#1A1A1A]/10 transition-colors"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
