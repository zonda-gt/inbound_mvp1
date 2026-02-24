import "server-only";

import { promises as fs } from "fs";
import path from "path";

export type BlogPostMeta = {
  title: string;
  slug: string;
  description: string;
  date: string;
  readTime: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");

const FRONTMATTER_FIELDS = [
  "title",
  "slug",
  "description",
  "date",
  "readTime",
] as const;

type FrontmatterField = (typeof FRONTMATTER_FIELDS)[number];

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n");
}

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(markdown: string, filePath: string): BlogPost {
  const normalized = normalizeMarkdown(markdown);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    throw new Error(`Missing frontmatter in blog post: ${filePath}`);
  }

  const frontmatterBlock = match[1];
  const content = normalized.slice(match[0].length).trim();
  const entries: Record<string, string> = {};

  for (const rawLine of frontmatterBlock.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = stripQuotes(line.slice(separatorIndex + 1).trim());
    if (!key) continue;

    entries[key] = value;
  }

  const meta: Partial<BlogPostMeta> = {};
  for (const field of FRONTMATTER_FIELDS) {
    const value = entries[field];
    if (!value) {
      throw new Error(`Missing "${field}" in blog frontmatter: ${filePath}`);
    }
    meta[field] = value;
  }

  return {
    ...(meta as Record<FrontmatterField, string>),
    content,
  };
}

async function readBlogFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(BLOG_CONTENT_DIR);
    return files.filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function compareByDateDesc(a: BlogPostMeta, b: BlogPostMeta): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const files = await readBlogFiles();

  const posts = await Promise.all(
    files.map(async (file) => {
      const absolutePath = path.join(BLOG_CONTENT_DIR, file);
      const markdown = await fs.readFile(absolutePath, "utf8");
      const parsed = parseFrontmatter(markdown, absolutePath);
      return {
        title: parsed.title,
        slug: parsed.slug,
        description: parsed.description,
        date: parsed.date,
        readTime: parsed.readTime,
      };
    }),
  );

  return posts.sort(compareByDateDesc);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const files = await readBlogFiles();

  for (const file of files) {
    const absolutePath = path.join(BLOG_CONTENT_DIR, file);
    const markdown = await fs.readFile(absolutePath, "utf8");
    const parsed = parseFrontmatter(markdown, absolutePath);
    if (parsed.slug === slug) return parsed;
  }

  return null;
}

export function formatBlogDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
