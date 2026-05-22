import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Verify HMAC-SHA256 signature from HDFC SmartGateway
 * HDFC sends signature in Base64 format
 * Signature is computed over: status|status_id|order_id
 */
function verifyHdfcSignature(body: Record<string, string>): boolean {
    try {
        const responseKey = process.env.HDFC_RESPONSE_KEY;
        if (!responseKey) {
            console.warn('[HDFC_RETURN] No HDFC_RESPONSE_KEY configured - skipping signature verification');
            return true; // Skip verification if key not configured (for backward compatibility)
        }

        const { status, status_id, order_id, signature, signature_algorithm } = body;
        
        if (!signature || !status || !order_id) {
            console.error('[HDFC_RETURN] Missing required fields for signature verification');
            return false;
        }

        // HDFC uses pipe-separated values: status|status_id|order_id
        const signatureData = `${status}|${status_id || ''}|${order_id}`;
        
        const algorithm = signature_algorithm === 'HMAC-SHA512' ? 'sha512' : 'sha256';
        
        // Generate expected signature in Base64 (HDFC uses Base64)
        const expectedSignatureBase64 = crypto
            .createHmac(algorithm, responseKey)
            .update(signatureData)
            .digest('base64');

        // URL decode the received signature (it may be URL encoded)
        const decodedSignature = decodeURIComponent(signature);
        
        console.log('[HDFC_RETURN] Signature verification:', {
            orderId: order_id,
            signatureData,
            receivedLength: decodedSignature.length,
            expectedLength: expectedSignatureBase64.length,
        });

        // Compare signatures
        const receivedSig = decodedSignature;
        const expectedSig = expectedSignatureBase64;
        
        // Check length first (timingSafeEqual throws if lengths differ)
        if (receivedSig.length !== expectedSig.length) {
            console.error('[HDFC_RETURN] Signature length mismatch — rejecting', {
                orderId: order_id,
                receivedLength: receivedSig.length,
                expectedLength: expectedSig.length,
            });
            return false;
        }

        const isValid = crypto.timingSafeEqual(
            Buffer.from(receivedSig),
            Buffer.from(expectedSig)
        );

        if (!isValid) {
            console.error('[HDFC_RETURN] Signature verification FAILED', {
                orderId: order_id,
                status,
            });
        } else {
            console.log('[HDFC_RETURN] Signature verified successfully for order:', order_id);
        }

        return isValid;
    } catch (error) {
        console.error('[HDFC_RETURN] Signature verification error:', error);
        return false;
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

        // Verify HMAC signature — reject tampered callbacks
        const signatureValid = verifyHdfcSignature(body);
        if (!signatureValid) {
            console.error('[HDFC_RETURN] Rejecting callback — invalid signature for order:', body.order_id);
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
