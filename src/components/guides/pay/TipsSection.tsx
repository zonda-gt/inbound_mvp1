"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { IMAGES } from "@/lib/guide-constants";
import {
  Lightbulb,
  Shield,
  Globe,
  Battery,
  Wifi,
  MapPin,
  Utensils,
  Train,
} from "lucide-react";

const tips = [
  {
    icon: Shield,
    title: "Set Up Before You Fly",
    description:
      "Complete registration, identity verification, and card linking at home where you have stable internet and can receive SMS codes. The verification process can take 24–48 hours in some cases.",
    color: "#1677FF",
  },
  {
    icon: Globe,
    title: "Get a VPN Ready",
    description:
      "Google, WhatsApp, Instagram, and Facebook are blocked in China. Download and configure a VPN before you arrive. Alipay and WeChat work without a VPN, but you'll want one for everything else.",
    color: "#07C160",
  },
  {
    icon: Battery,
    title: "Keep Your Phone Charged",
    description:
      "Your phone is your wallet in China. Carry a power bank at all times. Shared power bank rental stations are everywhere — you can rent one by scanning a QR code with Alipay or WeChat.",
    color: "#C84032",
  },
  {
    icon: Wifi,
    title: "Get an eSIM or Local SIM",
    description:
      "You need mobile data for QR payments. An eSIM (like Airalo or Holafly) is the easiest option. Alternatively, buy a local SIM at the airport.",
    color: "#C9A96E",
  },
  {
    icon: MapPin,
    title: "Download Offline Maps",
    description:
      "Google Maps doesn't work well in China. Download Amap (高德地图) or Baidu Maps before your trip. Both integrate with Alipay for ride-hailing and public transport.",
    color: "#1677FF",
  },
  {
    icon: Utensils,
    title: "Use Mini-Programs for Food",
    description:
      "Many restaurants use QR code ordering — scan the code on your table to view the menu and order from your phone. Payment goes through Alipay or WeChat automatically.",
    color: "#07C160",
  },
  {
    icon: Train,
    title: "Transport Cards in Apps",
    description:
      "Both Alipay and WeChat offer virtual transit cards for metro and buses in major cities. Search for 'Transport Card' or '乘车码' in the app.",
    color: "#C84032",
  },
  {
    icon: Lightbulb,
    title: "Split Large Purchases",
    description:
      "If your purchase exceeds the per-transaction limit (¥5,000 for Alipay, ¥6,500 for WeChat), ask the merchant to split it into multiple transactions.",
    color: "#C9A96E",
  },
];

export default function TipsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="tips" className="relative py-12 sm:py-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={IMAGES.cityscape}
          alt="Chinese cityscape at dusk"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A1A1A]/85 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span
            className="seal-badge mb-4 inline-block"
            style={{
              background: "rgba(200,64,50,0.2)",
              color: "#FFD7D0",
              borderColor: "rgba(200,64,50,0.4)",
            }}
          >
            Pro Tips
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-4">
            Insider Tips for Smooth Payments
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
            Practical advice from experienced China travelers to help you avoid common
            pitfalls and make the most of mobile payments.
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
        >
          {tips.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 sm:p-5 hover:bg-white/8 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tip.color + "20" }}
                >
                  <tip.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: tip.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-xs sm:text-sm mb-1 sm:mb-1.5">
                    {tip.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
