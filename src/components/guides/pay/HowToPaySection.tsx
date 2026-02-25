"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { IMAGES } from "@/lib/guide-constants";
import { ScanLine, QrCode, Store, ShoppingCart } from "lucide-react";

export default function HowToPaySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-to-pay" className="py-12 sm:py-20 bg-secondary/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="seal-badge mb-4 inline-block">In Practice</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            How to Actually Pay
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            There are two ways to pay with QR codes in China. Understanding the difference
            will save you from awkward moments at the checkout counter.
          </p>
        </div>

        {/* Visual guide image */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-12"
        >
          <img
            src={IMAGES.qrGuide}
            alt="Two methods of QR code payment: Scan to Pay and Show to Pay"
            className="w-full rounded-xl shadow-lg"
          />
        </motion.div>

        {/* Two methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Method 1: Scan to Pay */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: "#1677FF" }} />
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1677FF12" }}>
                <ScanLine className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#1677FF" }} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ backgroundColor: "#1677FF15", color: "#1677FF" }}>
                  Method 1
                </span>
                <h3 className="font-bold text-base sm:text-lg text-foreground mt-1">
                  &ldquo;Scan&rdquo; — You Scan Them
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4">
              Open your app and tap the <strong>Scan</strong> button (top-left in Alipay,
              or top-right &ldquo;+&rdquo; in WeChat). Point your camera at the merchant&apos;s QR code
              sticker — usually displayed on the counter or wall. The payment amount may
              auto-fill or you&apos;ll enter it manually.
            </p>

            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
              <Store className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Best for: Street vendors, small shops, taxis, restaurants</span>
            </div>
          </motion.div>

          {/* Method 2: Show to Pay */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1" style={{ background: "#07C160" }} />
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#07C16012" }}>
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#07C160" }} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ backgroundColor: "#07C16015", color: "#07C160" }}>
                  Method 2
                </span>
                <h3 className="font-bold text-base sm:text-lg text-foreground mt-1">
                  &ldquo;Pay Code&rdquo; — They Scan You
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4">
              Tap the <strong>Pay/Receive</strong> button to display your personal QR/barcode.
              Show your phone screen to the cashier, who will scan it with their scanner device.
              The code auto-refreshes every 60 seconds for security. Confirm with your
              payment password or biometrics.
            </p>

            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
              <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Best for: Supermarkets, convenience stores, malls, chain stores</span>
            </div>
          </motion.div>
        </div>

        {/* Quick tip */}
        <div className="mt-6 sm:mt-8 bg-[#C84032]/5 border border-[#C84032]/15 rounded-lg p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="text-lg sm:text-xl flex-shrink-0">印</span>
            <div>
              <h4 className="font-semibold text-[#C84032] text-xs sm:text-sm mb-1">
                Quick Tip: Know Which Method Before You Queue
              </h4>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                Look at the checkout area before you reach the front of the line. If you see a
                QR code sticker on the counter, you&apos;ll need to scan it (Method 1). If you see a
                barcode scanner device, they&apos;ll scan you (Method 2). In larger stores, the cashier
                will usually say &ldquo;扫一扫&rdquo; (sǎo yī sǎo — scan) or point to indicate which method to use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
