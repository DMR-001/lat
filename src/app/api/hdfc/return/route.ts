import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Verify HMAC-SHA256 signature from HDFC SmartGateway
 * Signature is computed over: status|status_id|order_id
 */
function verifyHdfcSignature(body: Record<string, string>): boolean {
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
    const expectedSignature = crypto
        .createHmac(algorithm, responseKey)
        .update(signatureData)
        .digest('hex');

    const isValid = crypto.timingSafeEqual(
        Buffer.from(signature.toLowerCase()),
        Buffer.from(expectedSignature.toLowerCase())
    );

    if (!isValid) {
        console.error('[HDFC_RETURN] Signature verification FAILED', {
            orderId: order_id,
            status,
            receivedSignature: signature.substring(0, 20) + '...',
            expectedSignature: expectedSignature.substring(0, 20) + '...',
        });
    } else {
        console.log('[HDFC_RETURN] Signature verified successfully for order:', order_id);
    }

    return isValid;
}

// HDFC POSTs to this endpoint after payment (success, failure, or cancel).
// Returns an HTML page that performs top-level navigation (required for iframe/popup context).
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

    console.log('[HDFC_RETURN] Received callback:', {
        order_id: body.order_id,
        status: body.status,
        status_id: body.status_id,
    });

    // Verify signature to prevent tampering
    const signatureValid = verifyHdfcSignature(body);
    
    const params = new URLSearchParams();
    for (const key of ['order_id', 'status', 'signature', 'signature_algorithm', 'status_id']) {
        if (body[key]) params.set(key, body[key]);
    }
    
    // Add signature verification result to params (client will re-verify via status API)
    params.set('sig_valid', signatureValid ? '1' : '0');

    const redirectUrl = `${appUrl}/pay${params.toString() ? `?${params.toString()}` : ''}`;
    
    // Return HTML page that does top-level redirect (works in iframe/popup context)
    // Using both JavaScript and meta refresh for maximum compatibility
    const html = `<!DOCTYPE html>
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

    return new NextResponse(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
    });
}
