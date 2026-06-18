import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    const path = request.nextUrl.pathname;
    const hostname = request.headers.get('host') || '';

    // Subdomain routing: pay.sproutschool.edu.in -> /pay
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

    // Subdomain routing: payroll.sproutschool.edu.in -> /management
    if (hostname.startsWith('payroll.')) {
        // Allow public assets and API
        if (path.startsWith('/_next') || path.startsWith('/static') || path === '/favicon.ico' || path.startsWith('/api/')) {
            return NextResponse.next();
        }

        // Enforce role-based access on payroll domain:
        // MANAGEMENT → /management/* only
        // TEACHER    → /payslip only
        // anything else → clear session, back to login
        if (session && path !== '/login') {
            const payrollPayload = await decrypt(session);
            const role = payrollPayload?.user?.role;

            if (!payrollPayload || (role !== 'MANAGEMENT' && role !== 'TEACHER')) {
                const res = NextResponse.redirect(new URL('/login', request.url));
                res.cookies.delete('session');
                return res;
            }

            // Teacher can only access /payslip
            if (role === 'TEACHER' && !path.startsWith('/payslip')) {
                return NextResponse.redirect(new URL('/payslip', request.url));
            }

            // Management cannot access /payslip
            if (role === 'MANAGEMENT' && path.startsWith('/payslip')) {
                return NextResponse.redirect(new URL('/management', request.url));
            }
        }

        // Rewrite root based on role
        if (path === '/') {
            if (session) {
                const payrollPayload = await decrypt(session);
                const role = payrollPayload?.user?.role;
                if (role === 'TEACHER') {
                    return NextResponse.redirect(new URL('/payslip', request.url));
                }
            }
            return NextResponse.rewrite(new URL('/management', request.url));
        }

        // Ensure non-teacher, non-login paths stay within management
        if (!path.startsWith('/management') && !path.startsWith('/payslip') && !path.startsWith('/login') && !path.startsWith('/api')) {
            return NextResponse.redirect(new URL('/management', request.url));
        }
    }

    // Subdomain routing: admin.sproutschool.edu.in -> default (but / goes to dashboard)
    if (hostname.startsWith('admin.') && path === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Public paths
    const publicPaths = ['/', '/about', '/gallery', '/academics', '/contact', '/login', '/pay', '/website.css'];
    if (publicPaths.includes(path) || path.startsWith('/receipts/') || path.startsWith('/api/receipts/')) {
        if (session && path === '/login') {
            const loginPayload = await decrypt(session).catch(() => null);
            if (loginPayload?.user?.role === 'TEACHER') {
                return NextResponse.redirect(new URL('/payslip', request.url));
            }
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
    // Admins can access /management/transactions only; full /management requires MANAGEMENT role
    if (path.startsWith('/management')) {
        const role = payload.user.role;
        if (role === 'MANAGEMENT') {
            // full access
        } else if (role === 'ADMIN' && path.startsWith('/management/transactions')) {
            // admin can view transactions
        } else {
            return NextResponse.redirect(new URL('/', request.url));
        }
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
