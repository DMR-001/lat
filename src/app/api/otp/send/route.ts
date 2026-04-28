import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOtpSms } from '@/lib/sms';

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const phone: string = (body.phone ?? '').toString().trim().replace(/\D/g, '');

        if (phone.length !== 10) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        // Demo phone bypass — for Razorpay/reviewer testing only
        const demoPhone = (process.env.DEMO_PHONE ?? '').replace(/\D/g, '');
        if (demoPhone && phone === demoPhone) {
            // Save a static OTP of 123456 valid for 1 hour, skip SMS
            await prisma.otpRecord.updateMany({ where: { phone, verified: false }, data: { expiresAt: new Date(0) } });
            await prisma.otpRecord.create({ data: { phone, otp: '123456', expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
            return NextResponse.json({ success: true, smsSent: false, demo: true });
        }

        // Rate-limit: max 3 OTPs per phone in last 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentOtps = await prisma.otpRecord.count({
            where: {
                phone,
                createdAt: { gte: tenMinutesAgo },
            },
        });

        if (recentOtps >= 3) {
            return NextResponse.json(
                { error: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
                { status: 429 }
            );
        }

        // Invalidate any existing unverified OTPs for this phone
        await prisma.otpRecord.updateMany({
            where: { phone, verified: false },
            data: { expiresAt: new Date(0) }, // expire them immediately
        });

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.otpRecord.create({
            data: { phone, otp, expiresAt },
        });

        const smsSent = await sendOtpSms(phone, otp);

        return NextResponse.json({
            success: true,
            smsSent,
            // In development, return OTP for testing (remove in production)
            ...(process.env.NODE_ENV === 'development' ? { otp } : {}),
        });
    } catch (err: any) {
        console.error('[OTP Send]', err);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
