import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    const path = request.nextUrl.pathname;
    const hostname = request.headers.get('host') || '';

    // Subdomain routing: pay.sproutschool.co.in -> /pay
    if (hostname.startsWith('pay.')) {
        // Allow public assets and API
        if (path.startsWith('/_next') || path.startsWith('/static') || path === '/favicon.ico' || path.startsWith('/api/')) {
            return NextResponse.next();
        }

        // Rewrite root to /pay
        if (path === '/') {
            return NextResponse.rewrite(new URL('/pay', request.url));
        }

        // If they try to access other admin pages via pay subdomain, we might want to allow it or block it. 
        // For simplicity, let's just let the normal flow handle it, but the rewrite above handles the homepage.
    }

    // Public paths
    // Allow /receipts/ so parents can view/download their receipt after paying
    // Also allow /api/receipts/ for direct PDF download
    if (path === '/login' || path === '/pay' || path.startsWith('/receipts/') || path.startsWith('/api/receipts/')) {
        if (session && path === '/login') {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // Protected paths
    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify session
    const payload = await decrypt(session);
    if (!payload) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based access
    if (path.startsWith('/management') && payload.user.role !== 'MANAGEMENT') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)',
    ],
};
