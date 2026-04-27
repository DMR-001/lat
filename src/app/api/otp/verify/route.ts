import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const phone: string = (body.phone ?? '').toString().trim().replace(/\D/g, '');
        const otp: string = (body.otp ?? '').toString().trim();

        if (phone.length !== 10 || otp.length !== 6) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const record = await prisma.otpRecord.findFirst({
            where: {
                phone,
                verified: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!record) {
            return NextResponse.json({ error: 'OTP expired or not found. Please request a new OTP.' }, { status: 400 });
        }

        // Increment attempts
        await prisma.otpRecord.update({
            where: { id: record.id },
            data: { attempts: { increment: 1 } },
        });

        if (record.attempts + 1 >= 3 && record.otp !== otp) {
            // Expire after 3 failed attempts
            await prisma.otpRecord.update({
                where: { id: record.id },
                data: { expiresAt: new Date(0) },
            });
            return NextResponse.json(
                { error: 'Too many incorrect attempts. Please request a new OTP.' },
                { status: 400 }
            );
        }

        if (record.otp !== otp) {
            const remaining = 3 - (record.attempts + 1);
            return NextResponse.json(
                { error: `Incorrect OTP. ${remaining} attempt(s) remaining.` },
                { status: 400 }
            );
        }

        // Mark as verified
        await prisma.otpRecord.update({
            where: { id: record.id },
            data: { verified: true },
        });

        // Issue a short-lived token (phone + expiry, base64 encoded)
        // This is passed back to the search action to authorize results
        const tokenPayload = { phone, exp: Date.now() + 15 * 60 * 1000 }; // 15 min window
        const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

        return NextResponse.json({ success: true, token });
    } catch (err: any) {
        console.error('[OTP Verify]', err);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
