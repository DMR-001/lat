import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ verified: false, error: 'Missing parameters' }, { status: 400 });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return NextResponse.json({ verified: false, error: 'Gateway not configured' }, { status: 500 });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ verified: false }, { status: 400 });
        }

        return NextResponse.json({ verified: true });
    } catch (error) {
        console.error('Razorpay verify error:', error);
        return NextResponse.json({ verified: false, error: 'Internal server error' }, { status: 500 });
    }
}
