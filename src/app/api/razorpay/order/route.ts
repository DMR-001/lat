import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { amount } = await req.json();

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100), // convert to paise
                currency: 'INR',
                receipt: `rcpt_${Date.now()}`,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Razorpay order creation failed:', err);
            return NextResponse.json({ error: 'Failed to create payment order' }, { status: 502 });
        }

        const order = await response.json();
        return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
        console.error('Razorpay order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
