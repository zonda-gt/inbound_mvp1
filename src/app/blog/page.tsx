import type { Metadata } from "next";
import Link from "next/link";
import BlogStickyHeader from "@/components/blog/BlogStickyHeader";
import { formatBlogDate, getAllBlogPosts } from "@/lib/blog";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

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
    <div className="min-h-screen bg-white text-slate-900">
      <BlogStickyHeader />

      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563EB]">HelloChina Journal</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            China travel intelligence, without the fluff
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Real-world playbooks for payments, connectivity, maps, and daily life in China. Built for travelers who want fewer surprises.
          </p>
        </section>

        <section className="mt-10 space-y-4 sm:mt-12 sm:space-y-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>{formatBlogDate(post.date)}</span>
                <span aria-hidden>•</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                {post.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">{post.description}</p>
              <p className="mt-4 text-sm font-semibold text-[#2563EB]">Read article</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
