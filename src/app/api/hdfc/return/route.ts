import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Verify HMAC-SHA256 signature from HDFC SmartGateway.
 * Returns true if verified, false if tampered, null if key not configured or signature absent.
 * The return URL signature is a secondary hint — the server-to-server Status API
 * call in /api/hdfc/status is the authoritative security gate.
 */
function verifyHdfcSignature(body: Record<string, string>): boolean | null {
    try {
        const responseKey = process.env.HDFC_RESPONSE_KEY;
        if (!responseKey) {
            console.warn('[HDFC_RETURN] HDFC_RESPONSE_KEY not set — skipping signature check');
            return null;
        }

        const { status, status_id, order_id, signature, signature_algorithm } = body;
        if (!signature || !order_id) return null;

        const algorithm = signature_algorithm === 'HMAC-SHA512' ? 'sha512' : 'sha256';
        const received = decodeURIComponent(signature);

        // Try all known HDFC signing formats
        const candidates = [
            order_id,                                      // just order_id
            `${status}|${order_id}`,                       // status|order_id
            `${status}|${status_id || ''}|${order_id}`,   // status|status_id|order_id
        ];

        for (const data of candidates) {
            const expected = crypto.createHmac(algorithm, responseKey).update(data).digest('base64');
            if (received.length === expected.length) {
                const match = crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
                if (match) {
                    console.log('[HDFC_RETURN] Signature verified for order:', order_id, '| format:', data);
                    return true;
                }
            }
        }

        // None matched — log for debugging but do NOT block (status API will verify)
        console.warn('[HDFC_RETURN] Signature mismatch for order:', order_id,
            '| received:', received.slice(0, 10) + '...');
        return false;
    } catch (error) {
        console.error('[HDFC_RETURN] Signature check error:', error);
        return null;
    }
}

// HDFC POSTs to this endpoint after payment (success, failure, or cancel).
// Returns an HTML page that performs top-level navigation (required for iframe/popup context).
export async function POST(req: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pay.sproutschool.edu.in';

    // Helper to generate redirect HTML
    const generateRedirectHtml = (redirectUrl: string) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0;url=${redirectUrl}">
    <title>Redirecting...</title>
    <style>
        body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .loader { text-align: center; }
        .spinner { width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <p>Processing payment, please wait...</p>
    </div>
    <script>
        // Top-level navigation to break out of iframe/popup
        if (window.top) {
            window.top.location.href = "${redirectUrl}";
        } else {
            window.location.href = "${redirectUrl}";
        }
    </script>
</body>
</html>`;

    try {
        let body: Record<string, string> = {};
        try {
            const text = await req.text();
            for (const [k, v] of new URLSearchParams(text)) {
                body[k] = v;
            }
        } catch {
            // ignore parse errors — still redirect
        }

        console.log('[HDFC_RETURN] Received callback:', {
            order_id: body.order_id,
            status: body.status,
            status_id: body.status_id,
        });

        // Verify HMAC signature
        // Only hard-reject if we have a key AND the signature is present but wrong (tampered).
        // If key is absent or signature format is unknown, fall through to status API verification.
        const sigResult = verifyHdfcSignature(body);
        if (sigResult === false) {
            console.error('[HDFC_RETURN] Rejecting callback — signature tampered for order:', body.order_id);
            const failUrl = `${appUrl}/pay?error=invalid_signature&order_id=${encodeURIComponent(body.order_id || '')}`;
            return new NextResponse(generateRedirectHtml(failUrl), {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
            });
        }

        const params = new URLSearchParams();
        for (const key of ['order_id', 'status', 'signature', 'signature_algorithm', 'status_id']) {
            if (body[key]) params.set(key, body[key]);
        }

        const redirectUrl = `${appUrl}/pay${params.toString() ? `?${params.toString()}` : ''}`;
        
        return new NextResponse(generateRedirectHtml(redirectUrl), {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error('[HDFC_RETURN] Unexpected error:', error);
        // Even on error, redirect to pay page (user can retry)
        const fallbackUrl = `${appUrl}/pay?error=callback_failed`;
        return new NextResponse(generateRedirectHtml(fallbackUrl), {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    }
}
