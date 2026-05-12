import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// HDFC POSTs to this endpoint after payment (success, failure, or cancel).
// Next.js pages only handle GET, so we convert the POST body into a GET redirect.
export async function POST(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pay.sproutschool.edu.in';

    let body: Record<string, string> = {};
    try {
        const text = await req.text();
        for (const [k, v] of new URLSearchParams(text)) {
            body[k] = v;
        }
    } catch {
        // ignore parse errors — still redirect
    }

    const params = new URLSearchParams();
    for (const key of ['order_id', 'status', 'signature', 'signature_algorithm', 'status_id']) {
        if (body[key]) params.set(key, body[key]);
    }

    const redirectUrl = `${appUrl}/pay${params.toString() ? `?${params.toString()}` : ''}`;
    return NextResponse.redirect(redirectUrl, 303);
}
