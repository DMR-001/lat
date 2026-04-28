import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { sendFeeCollectedSms } from '@/lib/sms';

async function getBranchId() {
    const cookieStore = await cookies();
    return cookieStore.get('selectedBranchId')?.value || null;
}

async function getBranchCode(branchId: string | null): Promise<string> {
    if (!branchId) return 'SPR';
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { code: true } });
    return branch?.code || 'SPR';
}

const feeTypeShortForm = (type: string) => {
    const map: Record<string, string> = {
        TRANSPORT: 'TRN', TUITION: 'TUI', ADMISSION: 'ADM', EXAM: 'EXM',
        LATE: 'LAT', ANNUAL: 'ANN', BOOKS: 'BKS', UNIFORM: 'UNI',
        APPLICATION: 'APP', REGISTRATION: 'REG', OTHER: 'OTH',
    };
    return map[type.toUpperCase()] ?? type.substring(0, 3).toUpperCase();
};

export async function POST(req: NextRequest) {
    try {
        const { feeId, amount, method } = await req.json();

        if (!feeId || !amount || amount <= 0 || !method) {
            return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
        }

        const fee = await prisma.fee.findUnique({ where: { id: feeId } });
        if (!fee) return NextResponse.json({ success: false, error: 'Fee not found' }, { status: 404 });

        const branchId = await getBranchId();
        const branchCode = await getBranchCode(branchId);

        // Generate receipt number
        const lastPayment = await prisma.payment.findFirst({
            where: branchId ? { branchId } : {},
            orderBy: { createdAt: 'desc' }
        });
        let nextNum = 1;
        if (lastPayment?.receiptNo) {
            const m = lastPayment.receiptNo.match(/(\d+)$/);
            if (m) nextNum = parseInt(m[1]) + 1;
        }
        const receiptNo = `${branchCode}/${feeTypeShortForm(fee.type)}/${new Date().getFullYear()}/${nextNum.toString().padStart(4, '0')}`;

        const newPaidAmount = fee.paidAmount + amount;
        const newStatus = newPaidAmount >= fee.amount ? 'PAID' : 'PENDING';

        const [payment] = await prisma.$transaction([
            prisma.payment.create({
                data: { feeId, amount, method, receiptNo, branchId, date: new Date() }
            }),
            prisma.fee.update({
                where: { id: feeId },
                data: { paidAmount: newPaidAmount, status: newStatus }
            })
        ]);

        // Send fee collected SMS to parent
        const student = await prisma.student.findUnique({
            where: { id: fee.studentId },
            select: { phone: true, firstName: true, lastName: true },
        });
        if (student?.phone) {
            const studentName = `${student.firstName} ${student.lastName}`;
            await sendFeeCollectedSms(student.phone, amount, studentName, payment.receiptNo, branchId).catch(() => null);
        }

        return NextResponse.json({ success: true, receiptNo: payment.receiptNo, paymentId: payment.id });
    } catch (err: any) {
        // Unique constraint violation = duplicate submission
        if (err.code === 'P2002') {
            return NextResponse.json({ success: false, error: 'Duplicate payment detected. Please refresh.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
