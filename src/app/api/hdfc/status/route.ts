import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Juspay, APIError } = require('expresscheckout-nodejs');

export const runtime = 'nodejs';
export const maxDuration = 30;

// Vercel's filesystem is read-only — silence the SDK's Winston file transport
// which tries to mkdir('logs') on every cold start.
Juspay.customLogger = Juspay.silentLogger;
Juspay.DEFAULT_REQUEST_TIMEOUT = 25000;

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
        const { orderId } = await req.json();

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json({ error: 'Missing orderId', status: 'ERROR' }, { status: 400 });
        }

        if (!process.env.HDFC_MERCHANT_ID || !process.env.HDFC_KEY_UUID) {
            console.error('[HDFC_STATUS] Payment gateway not configured');
            return NextResponse.json({ error: 'Payment gateway not configured', status: 'ERROR' }, { status: 500 });
        }

        const juspay = getJuspay();
        
        let statusResponse;
        try {
            statusResponse = await juspay.order.status(orderId);
        } catch (sdkError) {
            console.error('[HDFC_STATUS] SDK error fetching status:', sdkError);
            // Return a specific error status that the client can handle
            return NextResponse.json({ 
                error: 'Failed to fetch payment status from gateway',
                status: 'FETCH_ERROR',
                orderId 
            }, { status: 502 });
        }

        console.log('[HDFC_STATUS_API_RESPONSE]', JSON.stringify({
            order_id: statusResponse.order_id,
            status: statusResponse.status,
            amount: statusResponse.amount,
        }));

        // Validate that we got a status back
        if (!statusResponse || !statusResponse.status) {
            console.error('[HDFC_STATUS] Invalid response from HDFC:', statusResponse);
            return NextResponse.json({ 
                error: 'Invalid response from payment gateway',
                status: 'INVALID_RESPONSE',
                orderId 
            }, { status: 502 });
        }

        return NextResponse.json({
            status: statusResponse.status,
            orderId: statusResponse.order_id,
            amount: statusResponse.amount,
        });
    } catch (error) {
        const isApiError = error instanceof APIError;
        const msg = isApiError ? (error as Error).message : (error instanceof Error ? error.message : String(error));
        console.error('[HDFC_STATUS] Error:', msg);
        return NextResponse.json({ error: msg, status: 'ERROR' }, { status: 500 });
    }
}

