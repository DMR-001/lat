import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function getJuspay() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Juspay } = require('expresscheckout-nodejs') as { Juspay: new (cfg: object) => any };
    const baseUrl = process.env.HDFC_BASE_URL || 'https://smartgateway.hdfcuat.bank.in';
    return new Juspay({
        merchantId: process.env.HDFC_MERCHANT_ID,
        baseUrl,
        jweAuth: {
            keyId: process.env.HDFC_KEY_UUID,
            publicKey: process.env.HDFC_PUBLIC_KEY,
            privateKey: process.env.HDFC_PRIVATE_KEY,
        },
    });
}

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

        if (
            !process.env.HDFC_MERCHANT_ID ||
            !process.env.HDFC_KEY_UUID ||
            !process.env.HDFC_PUBLIC_KEY ||
            !process.env.HDFC_PRIVATE_KEY
        ) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        const juspay = getJuspay();
        const statusResponse = await juspay.order.status(orderId);

        return NextResponse.json({
            status: statusResponse.status,
            orderId: statusResponse.order_id,
            amount: statusResponse.amount,
        });
    } catch (error) {
        console.error('HDFC status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
