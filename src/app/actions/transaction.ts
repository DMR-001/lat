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

export type TransactionFilter = 'all' | 'success' | 'failed' | 'pending';

export async function getTransactions(filter: TransactionFilter = 'all'): Promise<TransactionRecord[]> {
    const results: TransactionRecord[] = [];
    
    // 1. Get Payment records (completed transactions - success, failed, cancelled)
    if (filter !== 'pending') {
        const paymentWhere: Record<string, unknown> = {};
        
        if (filter === 'success') {
            paymentWhere.status = 'SUCCESS';
        } else if (filter === 'failed') {
            paymentWhere.status = { in: ['FAILED', 'CANCELLED'] };
        }

        const payments = await prisma.payment.findMany({
            where: paymentWhere,
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

        for (const p of payments) {
            let studentInfo = p.fee?.student ? {
                name: `${p.fee.student.firstName} ${p.fee.student.lastName}`,
                admissionNo: p.fee.student.admissionNo,
                class: `${p.fee.student.class.name}${p.fee.student.class.section ? ' - ' + p.fee.student.class.section : ''}`
            } : null;

            // For failed/cancelled payments without student info, check PendingPayment
            if (!studentInfo && p.hdfcOrderId && (p.status === 'FAILED' || p.status === 'CANCELLED')) {
                try {
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
                    // Ignore errors
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
    }

    // 2. Get PendingPayment records that don't have a corresponding Payment record (initiated but not completed)
    if (filter === 'all' || filter === 'pending') {
        try {
            // Get all order IDs that already have Payment records
            const processedOrderIds = await prisma.payment.findMany({
                where: { hdfcOrderId: { not: null } },
                select: { hdfcOrderId: true }
            });
            const processedSet = new Set(processedOrderIds.map(p => p.hdfcOrderId));

            // Get pending payments that weren't processed
            const pendingPayments = await prisma.pendingPayment.findMany({
                where: {
                    status: { in: ['PENDING', 'EXPIRED'] }
                },
                orderBy: { createdAt: 'desc' }
            });

            for (const pp of pendingPayments) {
                // Skip if already has a Payment record
                if (processedSet.has(pp.orderId)) continue;

                let studentInfo = null;
                try {
                    const student = await prisma.student.findUnique({
                        where: { id: pp.studentId },
                        include: { class: true }
                    });
                    if (student && student.class) {
                        studentInfo = {
                            name: `${student.firstName} ${student.lastName}`,
                            admissionNo: student.admissionNo,
                            class: `${student.class.name}${student.class.section ? ' - ' + student.class.section : ''}`
                        };
                    }
                } catch {
                    // Ignore
                }

                results.push({
                    id: pp.id,
                    receiptNo: null,
                    amount: pp.amount,
                    date: pp.createdAt.toISOString(),
                    method: 'ONLINE',
                    status: pp.status === 'EXPIRED' ? 'EXPIRED' : 'INITIATED',
                    hdfcStatus: pp.status,
                    hdfcOrderId: pp.orderId,
                    createdAt: pp.createdAt.toISOString(),
                    updatedAt: pp.updatedAt.toISOString(),
                    student: studentInfo,
                    feeType: null,
                    branchName: null
                });
            }
        } catch {
            // PendingPayment table might not exist
        }
    }

    // Sort by createdAt desc
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

    // Count pending/initiated transactions
    let pending = 0;
    try {
        // Get order IDs that have Payment records
        const processedOrderIds = await prisma.payment.findMany({
            where: { hdfcOrderId: { not: null } },
            select: { hdfcOrderId: true }
        });
        const processedSet = new Set(processedOrderIds.map(p => p.hdfcOrderId));

        // Count PendingPayments not in Payment table
        const pendingPayments = await prisma.pendingPayment.findMany({
            where: { status: { in: ['PENDING', 'EXPIRED'] } },
            select: { orderId: true }
        });
        pending = pendingPayments.filter(pp => !processedSet.has(pp.orderId)).length;
    } catch {
        // Ignore if table doesn't exist
    }

    return {
        total: total + pending,
        success,
        failed,
        pending,
        successAmount: successAmount._sum.amount || 0
    };
}
