import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();

    // Get the hostname from the request headers
    const hostname = req.headers.get('host') || '';

    // Identify if this is the main domains/local dev, or a tenant subdomain
    const isMainDomain =
        hostname === 'neqtra.com' ||
        hostname === 'www.neqtra.com' ||
        hostname.startsWith('localhost:');

    // If the user visits the exact root path '/' on a tenant subdomain
    if (!isMainDomain && url.pathname === '/') {
        // Automatically redirect them to the login page
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all request paths except for the ones starting with:
        // - api (API routes)
        // - _next/static (static files)
        // - _next/image (image optimization files)
        // - favicon.ico, images, etc.
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.webp|.*\\.svg|.*\\.jpg).*)',
    ],
};
