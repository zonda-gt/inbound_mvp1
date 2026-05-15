import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import RestaurantDetail from "@/components/guides/restaurants/RestaurantDetail";
import { getRestaurantBySlug, getAllRestaurantSlugsWithProfile } from "@/lib/curated-restaurants";
import { SITE_URL } from "@/lib/site";

const CITY_PREFIXES = ["shanghai-", "chongqing-", "chengdu-"];

/** Legacy slugs (pre-city-prefix era) default to Shanghai. Returns the prefixed slug if it exists. */
async function resolveLegacySlug(slug: string): Promise<string | null> {
  if (CITY_PREFIXES.some((p) => slug.startsWith(p))) return null;
  const prefixed = `shanghai-${slug}`;
  const data = await getRestaurantBySlug(prefixed);
  return data ? prefixed : null;
}

export const revalidate = 3600; // ISR: revalidate every hour
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllRestaurantSlugsWithProfile();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);

  if (!data) {
    return { title: "Restaurant Not Found | HelloChina" };
  }

  const canonical = `${SITE_URL}/restaurants/${slug}`;

  return {
    title: `${data.name_en} — HelloChina Guide`,
    description: data.foreigner_hook || data.verdict || data.name_en,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "HelloChina",
      title: data.name_en,
      description: data.foreigner_hook || data.verdict || data.name_en,
    },
    twitter: {
      card: "summary_large_image",
      title: data.name_en,
      description: data.foreigner_hook || data.verdict || data.name_en,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RestaurantSchema({ data }: { data: any }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: data.name_en,
    alternateName: data.name_cn,
    description: data.foreigner_hook || data.verdict,
    servesCuisine: data.cuisine,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address_cn || data.address,
      addressCountry: "CN",
    },
    ...(data.latitude && data.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: data.latitude,
            longitude: data.longitude,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const data = await getRestaurantBySlug(slug);

  if (!data) {
    const legacyTarget = await resolveLegacySlug(slug);
    if (legacyTarget) permanentRedirect(`/restaurants/${legacyTarget}`);
    notFound();
  }

  return (
    <>
      <RestaurantSchema data={data} />
      <RestaurantDetail data={data} />
    </>
  );
}
