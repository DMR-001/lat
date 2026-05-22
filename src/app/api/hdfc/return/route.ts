import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Verify HMAC-SHA256 signature per HDFC SmartGateway docs:
 * 1. Take all params except 'signature' and 'signature_algorithm'
 * 2. Percent-encode each key and value
 * 3. Sort by encoded key (ASCII order)
 * 4. Join as key=value&key=value...
 * 5. Percent-encode the entire joined string
 * 6. HMAC-SHA256 using the Response Key
 * 7. Percent-encode the hash
 * 8. Compare against signature (after percent-decoding it once)
 */
function verifyHdfcSignature(body: Record<string, string>): boolean | null {
    try {
        const responseKey = process.env.HDFC_RESPONSE_KEY;
        if (!responseKey) {
            console.warn('[HDFC_RETURN] HDFC_RESPONSE_KEY not set — skipping signature check');
            return null;
        }

        const { signature, signature_algorithm, ...rest } = body;
        if (!signature) return null;

        const algorithm = signature_algorithm === 'HMAC-SHA512' ? 'sha512' : 'sha256';

        // Step 2+3: percent-encode keys and values, sort by encoded key
        const encoded = Object.entries(rest)
            .map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v ?? '')] as [string, string])
            .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);

        // Step 4: join as key=value&...
        const joined = encoded.map(([k, v]) => `${k}=${v}`).join('&');

        // Step 5: percent-encode the joined string
        const toSign = encodeURIComponent(joined);

        // Step 6: HMAC using raw response key string
        const hash = crypto.createHmac(algorithm, responseKey).update(toSign).digest('base64');

        // Step 7: percent-encode the hash
        const expectedSig = encodeURIComponent(hash);

        // Step 8: percent-decode the received signature once, then compare
        const receivedDecoded = decodeURIComponent(signature);

        console.log('[HDFC_RETURN] Signature check:', {
            orderId: rest.order_id,
            toSign: toSign.slice(0, 40) + '...',
            expected: expectedSig.slice(0, 10) + '...',
            received: receivedDecoded.slice(0, 10) + '...',
        });

        // Use constant-time comparison on the percent-encoded forms
        const exp = Buffer.from(expectedSig);
        const rec = Buffer.from(encodeURIComponent(receivedDecoded));
        if (exp.length !== rec.length) {
            console.warn('[HDFC_RETURN] Signature length mismatch:', exp.length, 'vs', rec.length);
            return false;
        }

        const isValid = crypto.timingSafeEqual(exp, rec);
        if (isValid) {
            console.log('[HDFC_RETURN] Signature verified for order:', rest.order_id);
        } else {
            console.warn('[HDFC_RETURN] Signature mismatch for order:', rest.order_id);
        }
        return isValid;
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

        const sigResult = verifyHdfcSignature(body);
        if (sigResult === true) {
            console.log('[HDFC_RETURN] Signature verified for order:', body.order_id);
        } else {
            // Log mismatch — status API is the authoritative gate while we confirm key format
            console.warn('[HDFC_RETURN] Signature unverified for order:', body.order_id, '— falling through to status API');
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
