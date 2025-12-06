'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function searchStudentsPublic(classId: string, nameQuery: string) {
    if (!classId || !nameQuery || nameQuery.length < 3) return [];

    const students = await prisma.student.findMany({
        where: {
            classId: classId,
            OR: [
                { firstName: { contains: nameQuery, mode: 'insensitive' } },
                { lastName: { contains: nameQuery, mode: 'insensitive' } },
            ]
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            parentName: true,
            class: {
                select: {
                    name: true,
                    section: true
                }
            }
        },
        take: 10
    });

    return students;
}

export async function getStudentFeesPublic(studentId: string) {
    const expenses = await prisma.fee.findMany({
        where: {
            studentId,
        },
        include: {
            payments: true
        }
    });

    // Calculate due amount
    const fees = expenses.map(fee => {
        const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
        const due = fee.amount - totalPaid;
        return {
            ...fee,
            paid: totalPaid,
            due
        };
    }).filter(f => f.due > 0); // Only return fees with outstanding balance

    const totalDue = fees.reduce((sum, f) => sum + f.due, 0);

    return { fees, totalDue };
}

export async function processPublicPayment(studentId: string, payments: { feeId: string; amount: number }[]) {
    // 1. Validate student exists
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true }
    });

    if (!student) throw new Error('Student not found');

    const paymentsCreated = [];

    // Process each payment item specifically
    for (const paymentItem of payments) {
        if (paymentItem.amount <= 0) continue;

        const fee = await prisma.fee.findUnique({
            where: { id: paymentItem.feeId },
            include: { payments: true }
        });

        if (!fee) continue;

        // Generate Receipt Number: SPR/PL/SHORT_TYPE/NUMBER
        // 1. Determine Short Type
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

        // 2. Get Sequence
        const lastPayment = await prisma.payment.findFirst({
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
        const paddedNumber = nextNumber.toString().padStart(3, '0');
        const receiptNo = `SPR/PL/${shortType}/${paddedNumber}`;

        const newPaidAmount = fee.paidAmount + paymentItem.amount;
        // Allow for small floating point discrepancies or overpayment logic if desired,
        // but strictly status depends on if paid >= due.
        const isFullyPaid = newPaidAmount >= fee.amount - 0.01; // tolerance
        const newStatus = isFullyPaid ? 'PAID' : 'PENDING';

        const [payment] = await prisma.$transaction([
            prisma.payment.create({
                data: {
                    amount: paymentItem.amount,
                    date: new Date(),
                    method: 'ONLINE', // Generic for public portal
                    feeId: fee.id,
                    receiptNo: receiptNo
                }
            }),
            prisma.fee.update({
                where: { id: fee.id },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus
                }
            })
        ]);

        paymentsCreated.push({
            ...payment,
            fee: { type: fee.type }
        });
    }

    revalidatePath('/fees');
    revalidatePath(`/students/${studentId}`);

    return { success: true, payments: paymentsCreated };
}
