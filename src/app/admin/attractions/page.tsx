import { isAuthenticated } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase';
import AdminNav from '@/components/admin/AdminNav';
import AttractionSearch from '@/components/admin/AttractionSearch';

export default async function AdminAttractionsPage() {
  if (!(await isAuthenticated())) redirect('/admin/login');

  const supabase = getSupabaseServerClient();
  const { data: attractions } = await supabase!
    .from('attractions')
    .select('slug, name_en, name_cn, images')
    .order('name_en');

  return (
    <div>
      <AdminNav breadcrumb="Attractions" />
      <div className="max-w-4xl mx-auto py-8 px-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          Attractions <span className="text-gray-400 font-normal text-base">({attractions?.length ?? 0})</span>
        </h1>
        <AttractionSearch attractions={attractions ?? []} />
      </div>
    </div>
  );
}
