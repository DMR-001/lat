'use server';

import prisma from '@/lib/prisma';

export type TransactionRecord = {
    id: string;
    receiptNo: string | null;
    amount: number;
    date: string;
    method: string;
    status: string;
    hdfcStatus: string | null;
    hdfcOrderId: string | null;
    createdAt: string;
    updatedAt: string;
    student: {
        name: string;
        admissionNo: string;
        class: string;
    } | null;
    feeType: string | null;
    branchName: string | null;
};

export type TransactionFilter = 'all' | 'success' | 'failed';

export async function getTransactions(filter: TransactionFilter = 'all'): Promise<TransactionRecord[]> {
    const whereClause: Record<string, unknown> = {};
    
    if (filter === 'success') {
        whereClause.status = 'SUCCESS';
    } else if (filter === 'failed') {
        whereClause.status = { in: ['FAILED', 'CANCELLED'] };
    }

    const payments = await prisma.payment.findMany({
        where: whereClause,
        include: {
            fee: {
                include: {
                    student: {
                        include: {
                            class: true
                        }
                    }
                }
            },
            branch: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // For failed payments without fee info, try to get student from PendingPayment
    const results: TransactionRecord[] = [];
    
    for (const p of payments) {
        let studentInfo = p.fee?.student ? {
            name: `${p.fee.student.firstName} ${p.fee.student.lastName}`,
            admissionNo: p.fee.student.admissionNo,
            class: `${p.fee.student.class.name}${p.fee.student.class.section ? ' - ' + p.fee.student.class.section : ''}`
        } : null;

        // For failed/cancelled payments without student info, check PendingPayment
        if (!studentInfo && p.hdfcOrderId && (p.status === 'FAILED' || p.status === 'CANCELLED')) {
            try {
                // @ts-ignore - PendingPayment table may not exist yet
                const pending = await prisma.pendingPayment.findUnique({
                    where: { orderId: p.hdfcOrderId }
                });
                if (pending?.studentId) {
                    const student = await prisma.student.findUnique({
                        where: { id: pending.studentId },
                        include: { class: true }
                    });
                    if (student && student.class) {
                        studentInfo = {
                            name: `${student.firstName} ${student.lastName}`,
                            admissionNo: student.admissionNo,
                            class: `${student.class.name}${student.class.section ? ' - ' + student.class.section : ''}`
                        };
                    }
                }
            } catch {
                // Ignore - table might not exist or other error, keep null
            }
        }

        results.push({
            id: p.id,
            receiptNo: p.receiptNo,
            amount: p.amount,
            date: p.date.toISOString(),
            method: p.method,
            status: p.status,
            hdfcStatus: p.hdfcStatus,
            hdfcOrderId: p.hdfcOrderId,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            student: studentInfo,
            feeType: p.fee?.type || null,
            branchName: p.branch?.name || null
        });
    }

    return results;
}

export async function getTransactionStats() {
    const [total, success, failed] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'SUCCESS' } }),
        prisma.payment.count({ where: { status: { in: ['FAILED', 'CANCELLED'] } } })
    ]);

    const successAmount = await prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
    });

    return {
        total,
        success,
        failed,
        successAmount: successAmount._sum.amount || 0
    };
}
