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
        const { amount, studentId } = await req.json();

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const paymentPageClientId = process.env.HDFC_PAYMENT_PAGE_CLIENT_ID;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pay.sproutschool.edu.in';

        if (!process.env.HDFC_MERCHANT_ID || !paymentPageClientId || !process.env.HDFC_KEY_UUID) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        const juspay = getJuspay();
        const orderId = `SPR${Date.now()}`; // alphanumeric only, <21 chars, non-sequential via timestamp
        const returnUrl = `${appUrl}/api/hdfc/return`;

        const sessionResponse = await juspay.orderSession.create({
            order_id: orderId,
            amount: amount,
            payment_page_client_id: paymentPageClientId,
            customer_id: studentId ? `cust_${studentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 45)}` : 'guest',
            action: 'paymentPage',
            return_url: returnUrl,
            currency: 'INR',
        });

        const paymentLink = sessionResponse.payment_links?.web;
        if (!paymentLink) {
            console.error('HDFC session — no payment link:', JSON.stringify(sessionResponse));
            return NextResponse.json({
                error: sessionResponse.error_message || sessionResponse.message || 'Failed to create payment session',
            }, { status: 502 });
        }

        return NextResponse.json({ orderId, paymentLink });
    } catch (error) {
        const isApiError = error instanceof APIError;
        const msg = isApiError ? (error as Error).message : (error instanceof Error ? error.message : String(error));
        console.error('HDFC session error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

