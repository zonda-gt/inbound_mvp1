import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, SESSION_COOKIE } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_COOKIE.maxAge,
    path: '/',
  });
  return response;
}
