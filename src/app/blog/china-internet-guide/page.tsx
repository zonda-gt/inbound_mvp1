import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { NAV_LINKS } from "@/lib/esim-constants";

import PayNavbar from "@/components/guides/pay/PayNavbar";
import PayFooter from "@/components/guides/pay/PayFooter";
import StickyBanner from "@/components/guides/pay/StickyBanner";
import InlineCTA from "@/components/guides/pay/InlineCTA";
import CTASection from "@/components/guides/pay/CTASection";

import EsimHero from "@/components/guides/esim/EsimHero";
import QuickAnswerSection from "@/components/guides/esim/QuickAnswerSection";
import FirewallSection from "@/components/guides/esim/FirewallSection";
import ConnectivityOptionsSection from "@/components/guides/esim/ConnectivityOptionsSection";
import EsimGuideSection from "@/components/guides/esim/EsimGuideSection";
import VpnSection from "@/components/guides/esim/VpnSection";
import EsimTroubleshootingSection from "@/components/guides/esim/TroubleshootingSection";
import RedditQuotesSection from "@/components/guides/esim/RedditQuotesSection";
import VerdictSection from "@/components/guides/esim/VerdictSection";
import EsimChecklistSection from "@/components/guides/esim/EsimChecklistSection";

/* ── Fonts ── */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-pay-serif",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-pay-sans",
  display: "swap",
});

/* ── SEO Metadata ── */
const title = "Internet in China 2026: The Complete Traveler's Guide to eSIM & VPN";
const description =
  "Everything you need to know about staying connected in China in 2026. eSIM vs VPN, blocked apps, the Great Firewall explained, and the best options for tourists.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "article",
    url: "https://hellochina.chat/blog/china-internet-guide",
    images: [
      {
        url: "https://hellochina.chat/images/guides/esim/hero_banner.jpg",
        width: 1200,
        height: 630,
        alt: "Internet in China — eSIM & VPN Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://hellochina.chat/images/guides/esim/hero_banner.jpg"],
  },
  alternates: {
    canonical: "https://hellochina.chat/blog/china-internet-guide",
  },
};

/* ── Page ── */
export default function ChinaInternetGuidePage() {
  return (
    <div
      className={`${playfair.variable} ${sourceSans.variable} pay-guide min-h-screen`}
    >
      <PayNavbar
        navLinks={NAV_LINKS}
        brandIcon="网络"
        brandLabel="HelloChina Guide"
      />
      <main>
        <EsimHero />
        <QuickAnswerSection />
        <FirewallSection />
        <ConnectivityOptionsSection />
        <EsimGuideSection />
        <InlineCTA
          heading="Need help choosing an eSIM?"
          description="Your AI Local Friend recommends the best option based on your trip length, phone model, and budget."
          prompt="Help me choose an eSIM for my trip to China"
        />
        <VpnSection />
        <EsimTroubleshootingSection />
        <InlineCTA
          heading="Internet not working in China?"
          description="Describe your issue and your AI Local Friend will troubleshoot it in real time."
          prompt="I'm having internet connectivity issues in China"
        />
        <RedditQuotesSection />
        <VerdictSection />
        <EsimChecklistSection />
        <CTASection />
      </main>
      <PayFooter />
      <StickyBanner />
    </div>
  );
}
