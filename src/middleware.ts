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
    }

    // Subdomain routing: payroll.sproutschool.co.in -> /management
    if (hostname.startsWith('payroll.')) {
        // Allow public assets and API
        if (path.startsWith('/_next') || path.startsWith('/static') || path === '/favicon.ico' || path.startsWith('/api/')) {
            return NextResponse.next();
        }

        // Rewrite root to /management
        if (path === '/') {
            return NextResponse.rewrite(new URL('/management', request.url));
        }

        // Ensure users stay within management
        if (!path.startsWith('/management') && !path.startsWith('/login') && !path.startsWith('/api')) {
            return NextResponse.redirect(new URL('/management', request.url));
        }
    }

    // Subdomain routing: admin.sproutschool.co.in -> default (but / goes to dashboard)
    if (hostname.startsWith('admin.') && path === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Public paths
    const publicPaths = ['/', '/about', '/gallery', '/academics', '/contact', '/login', '/pay', '/website.css'];
    if (publicPaths.includes(path) || path.startsWith('/receipts/') || path.startsWith('/api/receipts/')) {
        if (session && path === '/login') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
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
