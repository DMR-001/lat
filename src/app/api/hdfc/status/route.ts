import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { orderId, signature, signatureAlgorithm } = await req.json();

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Verify HMAC signature from HDFC return URL if provided
        if (signature && signatureAlgorithm === 'HMAC-SHA256') {
            const responseKey = process.env.HDFC_RESPONSE_KEY;
            if (responseKey) {
                const expected = crypto
                    .createHmac('sha256', responseKey)
                    .update(orderId)
                    .digest('base64');
                if (expected !== decodeURIComponent(signature)) {
                    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
                }
            }
        }

        const merchantId = process.env.HDFC_MERCHANT_ID;
        const apiKey = process.env.HDFC_API_KEY;
        const baseUrl = process.env.HDFC_BASE_URL || 'https://smartgateway.hdfcuat.bank.in';

        if (!merchantId || !apiKey) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');

        const response = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'x-merchantid': merchantId,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('HDFC status failed:', data);
            return NextResponse.json({ error: data.error_message || 'Failed to fetch order status' }, { status: 502 });
        }

        return NextResponse.json({
            status: data.status,
            orderId: data.order_id,
            amount: data.amount,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('HDFC status error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

