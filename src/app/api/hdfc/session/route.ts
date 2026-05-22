import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
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
        const { studentId, payments, nonce } = await req.json();

        if (!studentId || typeof studentId !== 'string') {
            return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
        }
        if (!Array.isArray(payments) || payments.length === 0) {
            return NextResponse.json({ error: 'No payments specified' }, { status: 400 });
        }
        if (!nonce || typeof nonce !== 'string' || nonce.length < 16) {
            return NextResponse.json({ error: 'Missing or invalid nonce' }, { status: 400 });
        }

        // Reject replayed requests — nonce must never have been used before
        const existingNonce = await prisma.pendingPayment.findUnique({ where: { nonce } });
        if (existingNonce) {
            console.error('[HDFC_SESSION] Replayed nonce rejected:', nonce);
            return NextResponse.json({ error: 'Request already processed' }, { status: 409 });
        }

        // ── AUTHORITATIVE AMOUNT: re-fetch from DB, never trust client ──────────
        const feeIds = payments.map((p: { feeId: string }) => p.feeId);
        const fees = await prisma.fee.findMany({
            where: { id: { in: feeIds }, studentId },
            include: { payments: true },
        });
        if (fees.length === 0) {
            return NextResponse.json({ error: 'No valid fees found' }, { status: 400 });
        }

        // Build authoritative payment list: cap each item at the actual due amount
        const verifiedPayments: { feeId: string; amount: number }[] = [];
        for (const item of payments as { feeId: string; amount: number }[]) {
            const fee = fees.find(f => f.id === item.feeId);
            if (!fee) continue;
            const paid = fee.payments.reduce((s, p) => s + p.amount, 0);
            const due = Math.max(0, fee.amount - paid);
            if (due <= 0) continue;
            // Cap at due — client cannot inflate or spoof amount
            const authorizedAmount = Math.min(item.amount, due);
            if (authorizedAmount <= 0) continue;
            verifiedPayments.push({ feeId: item.feeId, amount: authorizedAmount });
        }

        if (verifiedPayments.length === 0) {
            return NextResponse.json({ error: 'All selected fees are already paid' }, { status: 400 });
        }

        const serverAmount = verifiedPayments.reduce((s, p) => s + p.amount, 0);
        // ─────────────────────────────────────────────────────────────────────────

        const paymentPageClientId = process.env.HDFC_PAYMENT_PAGE_CLIENT_ID;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pay.sproutschool.edu.in';

        if (!process.env.HDFC_MERCHANT_ID || !paymentPageClientId || !process.env.HDFC_KEY_UUID) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        const juspay = getJuspay();
        const orderId = `SPR${Date.now()}`;
        const returnUrl = `${appUrl}/api/hdfc/return`;

        const sessionResponse = await juspay.orderSession.create({
            order_id: orderId,
            amount: serverAmount,
            payment_page_client_id: paymentPageClientId,
            customer_id: `cust${studentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 46)}`,
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

        // Store authoritative payment context server-side — client never holds amounts
        await prisma.pendingPayment.create({
            data: {
                orderId,
                nonce,
                studentId,
                payments: JSON.stringify(verifiedPayments),
                amount: serverAmount,
                status: 'PENDING',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            },
        });

        console.log('[HDFC_SESSION] Created order', orderId, 'amount', serverAmount, 'fees', feeIds);
        return NextResponse.json({ orderId, paymentLink });
    } catch (error) {
        const isApiError = error instanceof APIError;
        const msg = isApiError ? (error as Error).message : (error instanceof Error ? error.message : String(error));
        console.error('HDFC session error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

