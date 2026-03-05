import { isAuthenticated } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase';
import AdminNav from '@/components/admin/AdminNav';
import RestaurantImageManager from '@/components/admin/RestaurantImageManager';
import AdminSearch from '@/components/admin/AdminSearch';

type Props = { params: Promise<{ slug: string }> };

export default async function AdminRestaurantPage({ params }: Props) {
  if (!(await isAuthenticated())) redirect('/admin/login');
  const { slug } = await params;

  const supabase = getSupabaseServerClient()!;

  const [{ data }, { data: restaurants }, { data: attractions }] = await Promise.all([
    supabase.from('restaurants_v2').select('slug, name_en, name_cn, images, image_tags').eq('slug', slug).single(),
    supabase.from('restaurants_v2').select('slug, name_en, name_cn'),
    supabase.from('attractions').select('slug, name_en, name_cn'),
  ]);

  if (!data) return <div className="p-8 text-gray-500">Restaurant not found.</div>;

  const searchItems = [
    ...(restaurants || []).map((r) => ({ ...r, type: 'restaurant' as const })),
    ...(attractions || []).map((a) => ({ ...a, type: 'attraction' as const })),
  ];

  return (
    <div>
      <AdminNav
        breadcrumb="Restaurants"
        breadcrumbHref="/admin/restaurants"
        subbreadcrumb={data.name_en}
      />
      <div className="max-w-5xl mx-auto py-8 px-6">
        <AdminSearch items={searchItems} />
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{data.name_en}</h1>
          <p className="text-sm text-gray-400">{data.name_cn} · {data.slug}</p>
        </div>
        <RestaurantImageManager
          slug={data.slug}
          initialImages={data.images || []}
          initialTags={data.image_tags || {}}
        />
      </div>
    </div>
  );
}
