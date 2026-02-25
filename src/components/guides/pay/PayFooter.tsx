import Link from "next/link";

export default function PayFooter() {
  return (
    <footer className="bg-[#1A1A1A] text-white/50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-white">支付</span>
              <span className="text-sm font-medium text-white/70">China Pay Guide</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              A comprehensive guide to mobile payments in China for international visitors.
              Updated for 2025/2026 travel season.
            </p>
            <Link
              href="/"
              className="inline-block mt-3 text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              ← Back to HelloChina.chat
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3">
              Quick Links
            </h4>
            <div className="space-y-2">
              {[
                { label: "Overview", href: "#overview" },
                { label: "Setup Guide", href: "#setup" },
                { label: "Comparison Table", href: "#comparison" },
                { label: "Real-World Scenarios", href: "#scenarios" },
                { label: "Fees & Limits", href: "#fees" },
                { label: "Troubleshooting", href: "#troubleshooting" },
                { label: "Pre-Trip Checklist", href: "#checklist" },
                { label: "FAQ", href: "#faq" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-xs text-white/40 hover:text-white/70 transition-colors py-0.5"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-3">
              Official Resources
            </h4>
            <div className="space-y-2">
              {[
                { label: "Alipay Official Site", href: "https://www.alipay.com" },
                { label: "WeChat Pay Official", href: "https://pay.weixin.qq.com" },
                { label: "Alipay+ for Tourists", href: "https://www.alipayplus.com" },
                { label: "Wise (Backup Card)", href: "https://wise.com" },
                { label: "China Travel Tips", href: "https://www.chinasurvival.com" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-white/40 hover:text-white/70 transition-colors py-0.5"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>

          </div>
        </div>

        <div
          className="mb-4 sm:mb-6"
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)",
          }}
        />

        <div className="text-center sm:text-left">
          <p className="text-[11px] sm:text-xs text-white/30">
            Last updated: February 2026. Information may change — always verify with
            official sources.
          </p>
        </div>
      </div>
    </footer>
  );
}
