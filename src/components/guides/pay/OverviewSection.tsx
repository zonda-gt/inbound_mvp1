"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Smartphone, Banknote, CreditCard, Wifi } from "lucide-react";

const paymentMethods = [
  {
    icon: Smartphone,
    title: "Mobile Payments",
    subtitle: "(Recommended)",
    description:
      "Alipay and WeChat Pay dominate China's payment landscape. Over 90% of daily transactions are made via QR codes. Linking your international card to these apps gives you the widest coverage — from street food vendors to luxury malls.",
    status: "essential",
    color: "#1677FF",
  },
  {
    icon: Banknote,
    title: "Cash (RMB/CNY)",
    subtitle: "",
    description:
      "Cash is still legal tender and businesses must accept it by law. Carry small notes (¥10–¥50) as many vendors don't keep change. Works everywhere except online services like food delivery and ride-hailing apps.",
    status: "backup",
    color: "#C84032",
  },
  {
    icon: CreditCard,
    title: "International Credit Cards",
    subtitle: "",
    description:
      "Visa and Mastercard are accepted at major hotels, department stores, and international chains, but coverage is unreliable. UnionPay cards have much wider acceptance. Best used as a backup, not your primary method.",
    status: "limited",
    color: "#C9A96E",
  },
  {
    icon: Wifi,
    title: "Digital Wallets",
    subtitle: "(Apple/Google Pay)",
    description:
      "Apple Pay works at some NFC-enabled terminals but acceptance is much lower than Alipay/WeChat. Google Pay is NOT supported in mainland China as Google services are blocked. Neither is a reliable primary option.",
    status: "limited",
    color: "#888",
  },
];

function AnimatedCard({ method, index }: { method: (typeof paymentMethods)[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: method.color + "12", color: method.color }}
        >
          <method.icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              {method.title}
              {method.subtitle && (
                <span className="text-muted-foreground font-normal text-sm sm:text-base"> {method.subtitle}</span>
              )}
            </h3>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor:
                  method.status === "essential"
                    ? "#1677FF15"
                    : method.status === "backup"
                    ? "#C8403215"
                    : "#88888815",
                color:
                  method.status === "essential"
                    ? "#1677FF"
                    : method.status === "backup"
                    ? "#C84032"
                    : "#888",
              }}
            >
              {method.status}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {method.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function OverviewSection() {
  return (
    <section id="overview" className="py-12 sm:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <span className="seal-badge mb-4 inline-block">Overview</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-4">
            How Payments Work in China
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            China has rapidly become the world&apos;s most cashless society. Understanding your
            payment options before you arrive will save you significant stress and ensure
            a smooth travel experience.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {paymentMethods.map((method, i) => (
            <AnimatedCard key={method.title} method={method} index={i} />
          ))}
        </div>

        {/* Key insight callout */}
        <div className="mt-8 sm:mt-10 bg-[#C84032]/5 border border-[#C84032]/15 rounded-lg p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="text-xl sm:text-2xl flex-shrink-0 mt-0.5" role="img" aria-label="seal">印</span>
            <div>
              <h4 className="font-semibold text-[#C84032] text-sm sm:text-base mb-1">
                The Bottom Line
              </h4>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                Download and set up <strong>both Alipay and WeChat Pay</strong> before your trip.
                This gives you the widest coverage and a backup if one app has issues.
                Carry a small amount of cash (¥500–¥1,000) for emergencies.
                Your international credit card should be your last resort, not your first choice.
                Need help? Your <strong>AI Local Friend</strong> can guide you through the entire setup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
