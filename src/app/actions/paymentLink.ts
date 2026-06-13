'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function generatePaymentLink(studentId: string, amount: number, note: string) {
    if (!studentId) return { success: false, error: 'Student ID required' };
    if (!amount || amount <= 0) return { success: false, error: 'Enter a valid amount' };

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) return { success: false, error: 'Student not found' };

    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.paymentLink.create({
        data: { token, studentId, amount, note: note || null, expiresAt }
    });

    revalidatePath(`/students/${studentId}`);
    return { success: true, token };
}

export async function getPaymentLinksForStudent(studentId: string) {
    return prisma.paymentLink.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });
}
