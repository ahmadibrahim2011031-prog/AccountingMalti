import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/pages/login', '/pages/register', '/pages/landing'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/logo.jpeg')
  ) {
    return NextResponse.next();
  }

  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  if (isLocal) {
    if (pathname === '/') {
      url.pathname = '/pages/login';
      return NextResponse.redirect(url);
    }

    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    if (isPublic) return NextResponse.next();

    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
        url.pathname = '/pages/login';
        return NextResponse.redirect(url);
      }
    } catch {
      url.pathname = '/pages/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!favicon.ico|uploads/).*)'],
};
