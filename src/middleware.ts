import { NextRequest, NextResponse } from 'next/server';

const APP_HOST = 'app.hellochina.chat';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // On app.hellochina.chat, rewrite root to /v2
  if (host === APP_HOST || host.startsWith(APP_HOST + ':')) {
    const { pathname } = request.nextUrl;

    // If already on /v2, let it through
    if (pathname.startsWith('/v2')) {
      return NextResponse.next();
    }

    // Let API routes, static files, and attraction pages pass through
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/attractions/') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Rewrite root (/) to /v2
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/v2';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
