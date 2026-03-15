'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Helper to get current academic year from cookies
async function getCurrentAcademicYearId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('selectedAcademicYearId')?.value || null;
}

// Helper to get current branch from cookies
async function getCurrentBranchId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('selectedBranchId')?.value || null;
}

// Helper to get branch code
async function getBranchCode(branchId: string | null): Promise<string> {
    if (!branchId) return 'SPR';
    const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { code: true }
    });
    return branch?.code || 'SPR';
}

export async function assignFee(formData: FormData) {
    const studentId = formData.get('studentId') as string;
    const type = formData.get('type') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dueDate = new Date(formData.get('dueDate') as string);
    const academicYearId = await getCurrentAcademicYearId();

    await prisma.fee.create({
        data: {
            studentId,
            type,
            amount,
            paidAmount: 0,
            dueDate,
            status: 'PENDING',
            academicYearId
        }
    });

    revalidatePath('/fees');
    redirect('/fees');
}

export async function recordPayment(formData: FormData) {
    const feeId = formData.get('feeId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const method = formData.get('method') as string;

    const fee = await prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) throw new Error('Fee not found');

    const newPaidAmount = fee.paidAmount + amount;
    const newStatus = newPaidAmount >= fee.amount ? 'PAID' : 'PENDING';

    // Get branch info for receipt number
    const branchId = await getCurrentBranchId();
    const branchCode = await getBranchCode(branchId);

    // Generate Receipt Number with branch code
    const lastPayment = await prisma.payment.findFirst({
        where: branchId ? { branchId } : {},
        orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 1;
    if (lastPayment && lastPayment.receiptNo) {
        // Try to extract number from the end of the string
        const match = lastPayment.receiptNo.match(/(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    const currentYear = new Date().getFullYear();

    // Helper to get short form of fee type
    const getFeeTypeShortForm = (type: string) => {
        const upperType = type.toUpperCase();
        const mapping: Record<string, string> = {
            'TRANSPORT': 'TRN',
            'TUITION': 'TUI',
            'ADMISSION': 'ADM',
            'EXAM': 'EXM',
            'LATE': 'LAT',
            'ANNUAL': 'ANN',
            'BOOKS': 'BKS',
            'UNIFORM': 'UNI',
            'APPLICATION': 'APP',
            'REGISTRATION': 'REG'
        };
        return mapping[upperType] || upperType.substring(0, 3);
    };

    const shortType = getFeeTypeShortForm(fee.type);

    // Pad number with leading zeros, e.g., 0001
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    const receiptNo = `${branchCode}/${shortType}/${currentYear}/${paddedNumber}`;

    await prisma.$transaction([
        prisma.payment.create({
            data: {
                feeId,
                amount,
                method,
                receiptNo,
                branchId,
                date: new Date()
            }
        }),
        prisma.fee.update({
            where: { id: feeId },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus
            }
        })
    ]);

    revalidatePath('/fees');
    redirect('/fees');
}
