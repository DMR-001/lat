'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function assignFee(formData: FormData) {
    const studentId = formData.get('studentId') as string;
    const type = formData.get('type') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dueDate = new Date(formData.get('dueDate') as string);

    await prisma.fee.create({
        data: {
            studentId,
            type,
            amount,
            paidAmount: 0,
            dueDate,
            status: 'PENDING'
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

    // Generate Receipt Number
    const lastPayment = await prisma.payment.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 1;
    if (lastPayment && lastPayment.receiptNo) {
        const lastNumber = parseInt(lastPayment.receiptNo.replace('REC', ''));
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    const receiptNo = `REC${nextNumber}`;

    await prisma.$transaction([
        prisma.payment.create({
            data: {
                feeId,
                amount,
                method,
                receiptNo,
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
