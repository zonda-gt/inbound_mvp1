import { isAuthenticated } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import RestaurantSearch from '@/components/admin/RestaurantSearch';

export default async function AdminRestaurantsPage() {
  if (!(await isAuthenticated())) redirect('/admin/login');

  const supabase = getSupabaseServerClient();
  const { data: restaurants } = await supabase!
    .from('restaurants_v2')
    .select('slug, name_en, name_cn, images')
    .order('name_en');

  return (
    <div>
      <AdminNav breadcrumb="Restaurants" />
      <div className="max-w-4xl mx-auto py-8 px-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          Restaurants <span className="text-gray-400 font-normal text-base">({restaurants?.length ?? 0})</span>
        </h1>
        <RestaurantSearch restaurants={restaurants ?? []} />
      </div>
    </div>
  );
}
