import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });

  const { data, error } = await supabase
    .from('attractions')
    .select('slug, name_en, name_cn, images')
    .order('name_en');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attractions: data });
}
