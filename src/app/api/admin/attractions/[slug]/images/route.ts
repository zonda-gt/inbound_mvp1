import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const supabase = getSupabaseServerClient()!;

  // DB images array is the ordered source of truth.
  // Fall back to alphabetical storage listing only if DB array is empty.
  const { data: row } = await supabase.from('attractions').select('images').eq('slug', slug).single();
  let images: string[] = row?.images && row.images.length > 0 ? row.images : [];

  if (images.length === 0) {
    const imageExts = new Set(['.jpeg', '.jpg', '.png', '.webp', '.avif']);
    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attraction-images`;
    const { data: files } = await supabase.storage
      .from('attraction-images')
      .list(slug, { limit: 200, sortBy: { column: 'name', order: 'asc' } });
    if (files && files.length > 0) {
      images = files
        .filter((f) => imageExts.has('.' + f.name.split('.').pop()?.toLowerCase()))
        .map((f) => `${baseUrl}/${slug}/${f.name}`);
    }
  }

  return NextResponse.json({ images });
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const { images } = await req.json();
  const supabase = getSupabaseServerClient()!;

  const { error } = await supabase
    .from('attractions')
    .update({ images })
    .eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const { url } = await req.json();
  const supabase = getSupabaseServerClient()!;

  const { data } = await supabase
    .from('attractions')
    .select('images')
    .eq('slug', slug)
    .single();

  const newImages = (data?.images || []).filter((u: string) => u !== url);

  const { error } = await supabase
    .from('attractions')
    .update({ images: newImages })
    .eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Delete from storage
  const marker = '/public/attraction-images/';
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const storagePath = url.slice(idx + marker.length);
    await supabase.storage.from('attraction-images').remove([storagePath]);
  }

  return NextResponse.json({ ok: true, images: newImages });
}
