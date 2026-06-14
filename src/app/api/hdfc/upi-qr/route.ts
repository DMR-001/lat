import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Juspay, APIError } = require('expresscheckout-nodejs');

export const runtime = 'nodejs';
export const maxDuration = 30;

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
        const { studentId, feeId, amount } = await req.json();

        if (!studentId || !feeId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        if (!process.env.HDFC_MERCHANT_ID || !process.env.HDFC_KEY_UUID) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        // Verify fee belongs to student and amount is within due
        const fee = await prisma.fee.findUnique({
            where: { id: feeId },
            include: { payments: true }
        });
        if (!fee || fee.studentId !== studentId) {
            return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
        }
        const paid = fee.payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
        const due = Math.max(0, fee.amount - paid);
        if (due <= 0) {
            return NextResponse.json({ error: 'Fee is already paid' }, { status: 400 });
        }
        const authorizedAmount = Math.min(amount, due);

        const juspay = getJuspay();
        const orderId = `SPRQR${Date.now()}`;

        // Create order session with UPI QR
        const sessionResponse = await juspay.orderSession.create({
            order_id: orderId,
            amount: authorizedAmount,
            payment_page_client_id: process.env.HDFC_PAYMENT_PAGE_CLIENT_ID,
            customer_id: `cust${studentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 46)}`,
            action: 'paymentPage',
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pay.sproutschool.edu.in'}/api/hdfc/return`,
            currency: 'INR',
            payment_filter: { payment_method_type: ['UPI'] },
        });

        // HDFC returns a payment page URL — open it in a popup, poll status in background
        const paymentLink = sessionResponse.payment_links?.web;
        if (!paymentLink) {
            console.error('[UPI_QR] No payment link in response:', JSON.stringify(sessionResponse));
            return NextResponse.json({ error: 'Failed to create UPI payment session.' }, { status: 502 });
        }

        // Store context for status polling + auto-record
        await prisma.pendingPayment.create({
            data: {
                orderId,
                nonce: null,
                studentId,
                payments: JSON.stringify([{ feeId, amount: authorizedAmount }]),
                amount: authorizedAmount,
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            }
        });

        console.log('[UPI_QR] Created UPI order', orderId, 'amount', authorizedAmount);
        return NextResponse.json({ orderId, paymentLink, amount: authorizedAmount });

    } catch (error) {
        const isApiError = error instanceof APIError;
        const msg = isApiError ? (error as Error).message : (error instanceof Error ? error.message : String(error));
        console.error('[UPI_QR] Error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
