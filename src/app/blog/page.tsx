import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import PayNavbar from "@/components/guides/pay/PayNavbar";
import PayFooter from "@/components/guides/pay/PayFooter";
import StickyBanner from "@/components/guides/pay/StickyBanner";
import { formatBlogDate, getAllBlogPosts } from "@/lib/blog";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

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

const BLOG_URL = `${SITE_URL}/blog`;

export const metadata: Metadata = {
  title: "HelloChina Blog | Practical China Travel Guides",
  description:
    "Actionable guides for foreigners traveling in China: apps, connectivity, payments, transit, and on-the-ground tips.",
  alternates: {
    canonical: BLOG_URL,
  },
  openGraph: {
    type: "website",
    url: BLOG_URL,
    siteName: "HelloChina",
    title: "HelloChina Blog | Practical China Travel Guides",
    description:
      "Actionable guides for foreigners traveling in China: apps, connectivity, payments, transit, and on-the-ground tips.",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "HelloChina Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HelloChina Blog | Practical China Travel Guides",
    description:
      "Actionable guides for foreigners traveling in China: apps, connectivity, payments, transit, and on-the-ground tips.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className={`${playfair.variable} ${sourceSans.variable} pay-guide min-h-screen`}>
      <PayNavbar
        navLinks={[]}
        brandIcon="你好"
        brandLabel="HelloChina Blog"
      />

      {/* Hero */}
      <div className="relative pt-14 md:pt-16">
        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#2D2D2D] px-4 py-16 sm:py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="seal-badge mb-4 inline-block" style={{ background: "rgba(200,64,50,0.15)", color: "#F5F0E8", borderColor: "rgba(200,64,50,0.4)" }}>
              HelloChina Journal
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              China travel intelligence,{" "}
              <span className="text-[#FFD700]">without the fluff</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Real-world playbooks for payments, connectivity, maps, and daily life in China.
              Built for travelers who want fewer surprises.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        {/* Featured interactive guide */}
        <section>
          <Link
            href="/blog/china-payment-guide"
            className="group block rounded-xl border border-[#C84032]/20 bg-card p-5 transition-all hover:border-[#C84032]/40 hover:shadow-md sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded bg-[#C84032]/10 px-2 py-0.5 text-xs font-semibold text-[#C84032]">Interactive Guide</span>
              <span>February 2026</span>
              <span aria-hidden>•</span>
              <span>25 min read</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              The Ultimate Guide to Paying in China (2025/2026)
            </h2>
            <p className="mt-3 text-base leading-7 text-foreground/70">
              Step-by-step Alipay &amp; WeChat Pay setup, fee comparison, real-world scenarios, troubleshooting, and an interactive pre-trip checklist. Everything foreigners need for mobile payments in China.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#C84032]">Read the full guide →</p>
          </Link>

          <Link
            href="/blog/china-internet-guide"
            className="group mt-4 block rounded-xl border border-[#C84032]/20 bg-card p-5 transition-all hover:border-[#C84032]/40 hover:shadow-md sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded bg-[#C84032]/10 px-2 py-0.5 text-xs font-semibold text-[#C84032]">Interactive Guide</span>
              <span>February 2026</span>
              <span aria-hidden>•</span>
              <span>10 min read</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              Internet in China 2026: eSIM &amp; VPN Guide
            </h2>
            <p className="mt-3 text-base leading-7 text-foreground/70">
              The Great Firewall explained, eSIM vs VPN comparison, top provider picks, troubleshooting, and a pre-departure checklist. Stay connected in China without the stress.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#C84032]">Read the full guide →</p>
          </Link>
        </section>

        <section className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-[#C84032]/30 hover:shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{formatBlogDate(post.date)}</span>
                <span aria-hidden>•</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                {post.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-foreground/70">{post.description}</p>
              <p className="mt-4 text-sm font-semibold text-[#C84032]">Read article →</p>
            </Link>
          ))}
        </section>
      </main>

      <PayFooter />
      <StickyBanner />
    </div>
  );
}
