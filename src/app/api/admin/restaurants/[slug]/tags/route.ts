import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ slug: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const { image_tags } = await req.json();
  const supabase = getSupabaseServerClient()!;

  const { error } = await supabase
    .from('restaurants_v2')
    .update({ image_tags })
    .eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
