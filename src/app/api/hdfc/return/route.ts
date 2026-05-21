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
    return NextResponse.redirect(redirectUrl, 303);
}
