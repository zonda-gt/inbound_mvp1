import { NextRequest } from 'next/server';
import { searchPlace, geocode } from '@/lib/amap';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const city = request.nextUrl.searchParams.get('city') || undefined;
  if (!q) {
    return Response.json({ error: 'Missing q parameter' }, { status: 400 });
  }

  // Try POI search first (ranks by popularity, better for landmarks)
  const poi = await searchPlace(q, city);
  if (poi?.location) {
    const [lng, lat] = poi.location.split(',').map(Number);
    return Response.json({ lng, lat }, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  }

  // Fallback to geocoding (better for street addresses)
  const geo = await geocode(q, city);
  if (geo?.location) {
    const [lng, lat] = geo.location.split(',').map(Number);
    return Response.json({ lng, lat }, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  }

  return Response.json({ error: 'Location not found' }, { status: 404 });
}
