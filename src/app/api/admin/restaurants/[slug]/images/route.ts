import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const supabase = getSupabaseServerClient()!;

  const { data, error } = await supabase
    .from('restaurants_v2')
    .select('images, image_tags')
    .eq('slug', slug)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data.images || [], image_tags: data.image_tags || {} });
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const { images } = await req.json();
  const supabase = getSupabaseServerClient()!;

  const { error } = await supabase
    .from('restaurants_v2')
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

  // Get current images and tags
  const { data, error: fetchError } = await supabase
    .from('restaurants_v2')
    .select('images, image_tags')
    .eq('slug', slug)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const newImages = (data.images || []).filter((u: string) => u !== url);
  const newTags = { ...(data.image_tags || {}) };
  delete newTags[url];

  const { error } = await supabase
    .from('restaurants_v2')
    .update({ images: newImages, image_tags: newTags })
    .eq('slug', slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Delete from storage
  const marker = '/public/restaurant-images/';
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const storagePath = url.slice(idx + marker.length);
    await supabase.storage.from('restaurant-images').remove([storagePath]);
  }

  return NextResponse.json({ ok: true, images: newImages });
}
