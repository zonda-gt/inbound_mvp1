import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogMarkdown from "@/components/blog/BlogMarkdown";
import BlogStickyHeader from "@/components/blog/BlogStickyHeader";
import { formatBlogDate, getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";

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
    <div className="min-h-screen bg-white text-slate-900">
      <BlogStickyHeader showBlogLink />

      <main className="mx-auto w-full max-w-[45rem] px-5 pb-20 pt-8 sm:px-6 sm:pt-10">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/blog" className="font-medium text-slate-600 hover:text-slate-900">
              Blog
            </Link>
            <span aria-hidden>•</span>
            <span>{formatBlogDate(post.date)}</span>
            <span aria-hidden>•</span>
            <span>{post.readTime}</span>
          </div>
          <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">{post.description}</p>
        </div>

        <article>
          <BlogMarkdown content={post.content} />
        </article>

        <section className="mt-16 border-t border-slate-200 pt-10">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Author</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">HelloChina Editorial Team</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              We build practical playbooks for foreigners navigating China, grounded in on-the-ground testing and real traveler pain points.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Ready to use it live?</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Try HelloChina now
            </h3>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              Type any question about China travel and get practical answers instantly.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Try HelloChina
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
