import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { FAQ_DATA } from "@/lib/guide-constants";

import PayNavbar from "@/components/guides/pay/PayNavbar";
import HeroSection from "@/components/guides/pay/HeroSection";
import OverviewSection from "@/components/guides/pay/OverviewSection";
import SetupSection from "@/components/guides/pay/SetupSection";
import ComparisonSection from "@/components/guides/pay/ComparisonSection";
import HowToPaySection from "@/components/guides/pay/HowToPaySection";
import ScenariosSection from "@/components/guides/pay/ScenariosSection";
import FeesSection from "@/components/guides/pay/FeesSection";
import TroubleshootingSection from "@/components/guides/pay/TroubleshootingSection";
import ChecklistSection from "@/components/guides/pay/ChecklistSection";
import TipsSection from "@/components/guides/pay/TipsSection";
import FAQSection from "@/components/guides/pay/FAQSection";
import CTASection from "@/components/guides/pay/CTASection";
import PayFooter from "@/components/guides/pay/PayFooter";
import StickyBanner from "@/components/guides/pay/StickyBanner";
import InlineCTA from "@/components/guides/pay/InlineCTA";

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
const title = "The Ultimate Guide to Paying in China (2025/2026) — Alipay & WeChat Pay Setup";
const description =
  "Everything foreigners need to know about Alipay, WeChat Pay, and mobile payments in China. Step-by-step setup, fees, comparison, troubleshooting, and a pre-trip checklist.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "article",
    url: "https://hellochina.chat/blog/china-payment-guide",
    images: [
      {
        url: "https://hellochina.chat/images/guides/hero.webp",
        width: 1200,
        height: 630,
        alt: "The Ultimate Guide to Paying in China",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://hellochina.chat/images/guides/hero.webp"],
  },
  alternates: {
    canonical: "https://hellochina.chat/blog/china-payment-guide",
  },
};

/* ── FAQ Schema.org Structured Data ── */
function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ── Page ── */
export default function ChinaPaymentGuidePage() {
  return (
    <>
      <FAQSchema />
      <div
        className={`${playfair.variable} ${sourceSans.variable} pay-guide min-h-screen`}
      >
        <PayNavbar />
        <main>
          <HeroSection />
          <OverviewSection />
          <SetupSection />
          <InlineCTA
            heading="Stuck on a setup step?"
            description="Your AI Local Friend walks you through Alipay & WeChat Pay setup, personalized to your phone and cards."
            prompt="Help me set up Alipay and WeChat Pay for my trip to China"
          />
          <ComparisonSection />
          <HowToPaySection />
          <ScenariosSection />
          <FeesSection />
          <TroubleshootingSection />
          <InlineCTA
            heading="Hit a payment issue in China?"
            description="Describe your problem and your AI Local Friend will troubleshoot it in real time."
            prompt="I'm having trouble with mobile payments in China"
          />
          <ChecklistSection />
          <TipsSection />
          <FAQSection />
          <CTASection />
        </main>
        <PayFooter />
        <StickyBanner message="Got questions about paying in China? Ask your AI Local Friend" />
      </div>
    </>
  );
}
