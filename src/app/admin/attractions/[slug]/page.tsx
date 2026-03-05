import { isAuthenticated } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase';
import AdminNav from '@/components/admin/AdminNav';
import AttractionImageManager from '@/components/admin/AttractionImageManager';
import AdminSearch from '@/components/admin/AdminSearch';

type Props = { params: Promise<{ slug: string }> };

export default async function AdminAttractionPage({ params }: Props) {
  if (!(await isAuthenticated())) redirect('/admin/login');
  const { slug } = await params;

  const supabase = getSupabaseServerClient()!;

  const imageExts = new Set(['.jpeg', '.jpg', '.png', '.webp', '.avif']);
  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attraction-images`;

  const [{ data: files }, { data }, { data: restaurants }, { data: attractions }] = await Promise.all([
    supabase.storage.from('attraction-images').list(slug, { limit: 200, sortBy: { column: 'name', order: 'asc' } }),
    supabase.from('attractions').select('slug, name_en, name_cn, images').eq('slug', slug).single(),
    supabase.from('restaurants_v2').select('slug, name_en, name_cn'),
    supabase.from('attractions').select('slug, name_en, name_cn'),
  ]);

  if (!data) return <div className="p-8 text-gray-500">Attraction not found.</div>;

  // DB images array is the ordered source of truth.
  // Fall back to alphabetical storage listing only if DB array is empty.
  let images: string[] = data.images && data.images.length > 0 ? data.images : [];
  if (images.length === 0 && files && files.length > 0) {
    images = files
      .filter((f) => imageExts.has('.' + f.name.split('.').pop()?.toLowerCase()))
      .map((f) => `${baseUrl}/${slug}/${f.name}`);
  }

  const searchItems = [
    ...(restaurants || []).map((r) => ({ ...r, type: 'restaurant' as const })),
    ...(attractions || []).map((a) => ({ ...a, type: 'attraction' as const })),
  ];

  return (
    <div>
      <AdminNav
        breadcrumb="Attractions"
        breadcrumbHref="/admin/attractions"
        subbreadcrumb={data.name_en}
      />
      <div className="max-w-5xl mx-auto py-8 px-6">
        <AdminSearch items={searchItems} />
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{data.name_en}</h1>
          <p className="text-sm text-gray-400">{data.name_cn} · {data.slug}</p>
        </div>
        <AttractionImageManager slug={data.slug} initialImages={images} />
      </div>
    </div>
  );
}
