import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const supabase = getSupabaseServerClient()!;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('attraction-images')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from('attraction-images')
    .getPublicUrl(storagePath);

  // Append to images array in DB
  const { data: row } = await supabase
    .from('attractions')
    .select('images')
    .eq('slug', slug)
    .single();

  const newImages = [...(row?.images || []), publicUrl];
  await supabase.from('attractions').update({ images: newImages }).eq('slug', slug);

  return NextResponse.json({ url: publicUrl, images: newImages });
}
