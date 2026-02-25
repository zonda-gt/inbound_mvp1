import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import BlogMarkdown from "@/components/blog/BlogMarkdown";
import PayNavbar from "@/components/guides/pay/PayNavbar";
import PayFooter from "@/components/guides/pay/PayFooter";
import StickyBanner from "@/components/guides/pay/StickyBanner";
import { formatBlogDate, getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";
import { MessageCircle, ArrowRight } from "lucide-react";

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

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | HelloChina Blog",
    };
  }

  const canonical = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${post.title} | HelloChina Blog`,
    description: post.description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "HelloChina",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className={`${playfair.variable} ${sourceSans.variable} pay-guide min-h-screen`}>
      <PayNavbar
        navLinks={[]}
        brandIcon="你好"
        brandLabel="HelloChina Blog"
      />

      {/* Hero banner */}
      <div className="relative pt-14 md:pt-16">
        <div className="bg-gradient-to-b from-[#1A1A1A] to-[#2D2D2D] px-4 py-16 sm:py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/50 mb-4">
              <Link href="/blog" className="font-medium text-[#FFD700]/80 hover:text-[#FFD700] transition-colors">
                Blog
              </Link>
              <span aria-hidden>•</span>
              <span>{formatBlogDate(post.date)}</span>
              <span aria-hidden>•</span>
              <span>{post.readTime}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              {post.description}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[45rem] px-5 pb-16 pt-10 sm:px-6 sm:pt-14">
        <article>
          <BlogMarkdown content={post.content} />
        </article>

        {/* Author */}
        <section className="mt-16 border-t border-border pt-10">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Author</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">HelloChina Editorial Team</h2>
            <p className="mt-3 text-base leading-7 text-foreground/70">
              We build practical playbooks for foreigners navigating China, grounded in on-the-ground testing and real traveler pain points.
            </p>
          </div>

          {/* CTA */}
          <div
            className="mt-6 relative overflow-hidden rounded-xl p-6 sm:p-8"
            style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)" }}
          >
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #FFD700 0%, transparent 70%)" }}
            />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
                <MessageCircle className="w-3.5 h-3.5 text-white/70" />
                <span className="text-[11px] font-medium text-white/70">Your AI Local Friend</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Got questions? Ask your AI Local Friend
              </h3>
              <p className="text-sm sm:text-base text-white/50 max-w-lg leading-relaxed mb-5">
                Get personalized answers about payments, navigation, apps, and daily life in China — free, no sign-up required.
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 bg-[#FFD700] text-[#1A1A1A] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#FFD700]/90 transition-colors text-sm active:scale-95"
              >
                Ask Your AI Local Friend
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PayFooter />
      <StickyBanner />
    </div>
  );
}
