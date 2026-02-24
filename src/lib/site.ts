const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hellochina.ai";

export const SITE_URL = rawSiteUrl.replace(/\/+$/, "");
export const DEFAULT_OG_IMAGE = `${SITE_URL}/blog-og.svg`;
