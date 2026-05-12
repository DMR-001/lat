import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Juspay, APIError } = require('expresscheckout-nodejs');

export const runtime = 'nodejs';

// Vercel's filesystem is read-only — silence the SDK's Winston file transport
// which tries to mkdir('logs') on every cold start.
Juspay.customLogger = Juspay.silentLogger;

function parsePem(val: string | undefined): string {
    return (val || '').replace(/\\n/g, '\n');
}

function getJuspay() {
    return new Juspay({
        merchantId: process.env.HDFC_MERCHANT_ID,
        baseUrl: process.env.HDFC_BASE_URL || 'https://smartgateway.hdfcuat.bank.in',
        jweAuth: {
            keyId: process.env.HDFC_KEY_UUID,
            publicKey: parsePem(process.env.HDFC_PUBLIC_KEY),
            privateKey: parsePem(process.env.HDFC_PRIVATE_KEY),
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

        if (!process.env.HDFC_MERCHANT_ID || !process.env.HDFC_KEY_UUID) {
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
        const isApiError = error instanceof APIError;
        const msg = isApiError ? (error as Error).message : (error instanceof Error ? error.message : String(error));
        console.error('HDFC status error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

