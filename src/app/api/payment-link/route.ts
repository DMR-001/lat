import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const link = await prisma.paymentLink.findUnique({ where: { token } });
    const studentData = link ? await prisma.student.findUnique({
        where: { id: link.studentId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            parentName: true,
            branchId: true,
            class: { select: { name: true, section: true } },
            branch: { select: { id: true, name: true, code: true } },
        }
    }) : null;

    if (!link) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    if (link.used) return NextResponse.json({ error: 'This payment link has already been used' }, { status: 410 });
    if (new Date() > link.expiresAt) return NextResponse.json({ error: 'This payment link has expired' }, { status: 410 });

    return NextResponse.json({
        studentId: link.studentId,
        amount: link.amount,
        note: link.note,
        expiresAt: link.expiresAt,
        student: studentData,
    });
}
