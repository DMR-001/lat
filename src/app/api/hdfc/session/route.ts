import { NextRequest, NextResponse } from 'next/server';

function parsePem(val: string | undefined): string {
    return (val || '').replace(/\\n/g, '\n');
}

function getJuspay() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Juspay } = require('expresscheckout-nodejs') as { Juspay: new (cfg: object) => any };
    const baseUrl = process.env.HDFC_BASE_URL || 'https://smartgateway.hdfcuat.bank.in';
    return new Juspay({
        merchantId: process.env.HDFC_MERCHANT_ID,
        baseUrl,
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

        const merchantId = process.env.HDFC_MERCHANT_ID;
        const paymentPageClientId = process.env.HDFC_PAYMENT_PAGE_CLIENT_ID;

        if (
            !merchantId ||
            !paymentPageClientId ||
            !process.env.HDFC_KEY_UUID ||
            !process.env.HDFC_PUBLIC_KEY ||
            !process.env.HDFC_PRIVATE_KEY
        ) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        const juspay = getJuspay();
        const orderId = `order_${Date.now()}`;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const returnUrl = `${appUrl}/pay`;

        const sessionResponse = await juspay.orderSession.create({
            order_id: orderId,
            amount: amount,
            payment_page_client_id: paymentPageClientId,
            customer_id: studentId || 'guest',
            action: 'paymentPage',
            return_url: returnUrl,
            currency: 'INR',
        });

        if (sessionResponse.status !== 'NEW') {
            console.error('HDFC session unexpected status:', sessionResponse.status);
            return NextResponse.json({ error: 'Failed to create payment session' }, { status: 502 });
        }

        return NextResponse.json({
            orderId,
            paymentLink: sessionResponse.paymentLinks?.web,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('HDFC session error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
