import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { amount, studentId } = await req.json();

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const merchantId = process.env.HDFC_MERCHANT_ID;
        const apiKey = process.env.HDFC_API_KEY;
        const paymentPageClientId = process.env.HDFC_PAYMENT_PAGE_CLIENT_ID;
        const baseUrl = process.env.HDFC_BASE_URL || 'https://smartgateway.hdfcuat.bank.in';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        if (!merchantId || !apiKey || !paymentPageClientId) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');
        const orderId = `order_${Date.now()}`;
        const returnUrl = `${appUrl}/pay`;

        const response = await fetch(`${baseUrl}/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
                'x-merchantid': merchantId,
            },
            body: JSON.stringify({
                order_id: orderId,
                amount: amount,
                payment_page_client_id: paymentPageClientId,
                customer_id: studentId || 'guest',
                action: 'paymentPage',
                return_url: returnUrl,
                currency: 'INR',
            }),
        });

        const data = await response.json();

        if (!response.ok || data.status !== 'NEW') {
            console.error('HDFC session failed:', data);
            return NextResponse.json({ error: data.error_message || data.message || 'Failed to create payment session' }, { status: 502 });
        }

        return NextResponse.json({
            orderId,
            paymentLink: data.payment_links?.web,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('HDFC session error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

