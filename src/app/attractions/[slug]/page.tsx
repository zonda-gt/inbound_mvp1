import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import AttractionPageComponent from "@/components/guides/attractions/AttractionDetail";
import { getAllAttractionSlugs, getAttractionBySlug } from "@/lib/attractions";
import { SITE_URL } from "@/lib/site";
import type { AttractionData } from "@/types/attraction";

const CITY_PREFIXES = ["shanghai-", "chongqing-", "chengdu-"];

/** Legacy slugs (pre-city-prefix era) default to Shanghai. Returns the prefixed slug if it exists. */
async function resolveLegacySlug(slug: string): Promise<string | null> {
  if (CITY_PREFIXES.some((p) => slug.startsWith(p))) return null;
  const prefixed = `shanghai-${slug}`;
  const data = await getAttractionBySlug(prefixed);
  return data ? prefixed : null;
}

export const revalidate = 3600; // ISR: revalidate every hour
export const dynamicParams = true; // allow slugs not in generateStaticParams

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAllAttractionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAttractionBySlug(slug);

  if (!data) {
    return { title: "Attraction Not Found | HelloChina" };
  }

  const canonical = `${SITE_URL}/attractions/${slug}`;

  return {
    title: `${data.attraction_name_en} — HelloChina Guide`,
    description: data.hook,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "HelloChina",
      title: data.attraction_name_en,
      description: data.hook,
    },
    twitter: {
      card: "summary_large_image",
      title: data.attraction_name_en,
      description: data.hook,
    },
  };
}

function AttractionSchema({ data }: { data: AttractionData }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: data.attraction_name_en,
    alternateName: data.attraction_name_cn,
    description: data.hook,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address_cn,
      addressCountry: "CN",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function AttractionPage({ params }: Props) {
  const { slug } = await params;
  const data = await getAttractionBySlug(slug);

  if (!data) {
    const legacyTarget = await resolveLegacySlug(slug);
    if (legacyTarget) permanentRedirect(`/attractions/${legacyTarget}`);
    notFound();
  }

  return (
    <>
      <AttractionSchema data={data} />
      <AttractionPageComponent data={data} />
    </>
  );
}
