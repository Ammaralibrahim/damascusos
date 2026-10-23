import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE = 'dw_session';
const PUBLIC = ['/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // المسارات العامة
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;

  // تحقّق من وجود الكوكي ومن طول السر (≥32) قبل الاعتماد عليه
  if (!token || !secret || secret.length < 32) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\.).*)'],
};