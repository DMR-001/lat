'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendFeeCollectedSms } from '@/lib/sms';

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

export async function searchStudentsByPhonePublic(branchId: string, phone: string) {
    if (!branchId || !phone || phone.length < 10) return [];

    const students = await prisma.student.findMany({
        where: {
            branchId,
            OR: [
                { phone:  { contains: phone.trim() } },
                { phone2: { contains: phone.trim() } },
            ],
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            parentName: true,
            phone: true,
            phone2: true,
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

export async function getBranchesPublic() {
    const branches = await prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' }
    });
    return branches;
}

export async function getStudentFeesPublic(studentId: string) {
    const expenses = await prisma.fee.findMany({
        where: {
            studentId,
        },
        include: {
            payments: true,
            feeStructure: {
                select: { installments: true, name: true }
            }
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

export async function processPublicPayment(studentId: string, payments: { feeId: string; amount: number }[], hdfcOrderId?: string) {
    // Duplicate order guard — if this HDFC order was already recorded, return existing payments
    if (hdfcOrderId) {
        const existing = await prisma.payment.findFirst({
            where: { hdfcOrderId },
            include: { fee: { select: { type: true } } }
        });
        if (existing) {
            const all = await prisma.payment.findMany({
                where: { hdfcOrderId },
                include: { fee: { select: { type: true } } }
            });
            return { success: true, payments: all };
        }
    }

    // 1. Validate student exists
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            class: {
                include: {
                    branch: true
                }
            }
        },
    });

    if (!student) throw new Error('Student not found');

    // Get branch info from student's class
    const branchId = student.class?.branchId || null;
    const branchCode = student.class?.branch?.code || 'SPR';

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
                'REGISTRATION': 'REG',
                'SPORTS': 'SPT',
                'BOOKS': 'BKS',
                'UNIFORM': 'UNI',
                'ADMISSION': 'ADM',
                'LATE': 'LAT',
                'ANNUAL': 'ANN',
                'APPLICATION': 'APP',
            };
            return mapping[upperType] || upperType.substring(0, 3);
        };
        const shortType = getFeeTypeShortForm(fee.type);

        // 2. Get Sequence — only look at real PL receipts, not FAILED-* entries
        const currentYear = new Date().getFullYear();
        const lastPayment = await prisma.payment.findFirst({
            where: { receiptNo: { startsWith: `${branchCode}/PL/` } },
            orderBy: { createdAt: 'desc' },
        });

        let nextNumber = 1;
        if (lastPayment?.receiptNo) {
            const match = lastPayment.receiptNo.match(/\/(\d+)$/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        const paddedNumber = nextNumber.toString().padStart(4, '0');
        const receiptNo = `${branchCode}/PL/${shortType}/${currentYear}/${paddedNumber}`;

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
                    method: 'ONLINE',
                    status: 'SUCCESS',
                    hdfcStatus: 'CHARGED',
                    feeId: fee.id,
                    receiptNo: receiptNo,
                    branchId: branchId,
                    hdfcOrderId: hdfcOrderId || null,
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

    // Send fee collected SMS to primary phone only
    const totalPaid = paymentsCreated.reduce((sum, p) => sum + p.amount, 0);
    if (student.phone && totalPaid > 0) {
        const receiptNos = paymentsCreated.map(p => p.receiptNo).join(', ');
        const studentName = `${student.firstName} ${student.lastName}`;
        await sendFeeCollectedSms(student.phone, totalPaid, studentName, receiptNos, branchId).catch(() => null);
    }

    return { success: true, payments: paymentsCreated };
}

// Records failed/cancelled HDFC transactions — required for HDFC security audit
export async function recordFailedPayment(
    hdfcOrderId: string,
    hdfcStatus: string,
    amount: number,
    studentId?: string
) {
    const receiptNo = `FAILED-${hdfcOrderId}`;
    
    // Don't double-record - check both hdfcOrderId and receiptNo
    const existing = await prisma.payment.findFirst({ 
        where: { 
            OR: [
                { hdfcOrderId },
                { receiptNo }
            ]
        } 
    });
    if (existing) {
        console.log('[recordFailedPayment] Already recorded:', hdfcOrderId);
        return;
    }

    // Try to get details from PendingPayment if not provided
    let finalAmount = amount;
    let finalStudentId = studentId;
    
    if (!finalAmount || !finalStudentId) {
        try {
            const pending = await prisma.pendingPayment.findUnique({
                where: { orderId: hdfcOrderId }
            });
            if (pending) {
                finalAmount = finalAmount || pending.amount;
                finalStudentId = finalStudentId || pending.studentId;
            }
        } catch {
            // Ignore - use what we have
        }
    }

    let branchId: string | null = null;
    if (finalStudentId) {
        try {
            const student = await prisma.student.findUnique({
                where: { id: finalStudentId },
                include: { class: { include: { branch: true } } }
            });
            branchId = student?.class?.branchId || null;
        } catch {
            // Ignore
        }
    }

    try {
        await prisma.payment.create({
            data: {
                amount: finalAmount || 0,
                date: new Date(),
                method: 'ONLINE',
                status: hdfcStatus === 'CANCELLED' || hdfcStatus === 'CANCEL' ? 'CANCELLED' : 'FAILED',
                hdfcStatus,
                feeId: null,
                receiptNo,
                branchId,
                hdfcOrderId,
            }
        });
        
        console.log('[recordFailedPayment] Recorded:', { orderId: hdfcOrderId, status: hdfcStatus });
    } catch (error: any) {
        // Handle unique constraint violation gracefully (race condition)
        if (error?.code === 'P2002') {
            console.log('[recordFailedPayment] Already exists (race condition):', hdfcOrderId);
            return;
        }
        throw error;
    }
}

// Get pending payment context from server-side backup (fallback for localStorage)
export async function getPendingPayment(orderId: string) {
    if (!orderId) return null;
    
    try {
        const pending = await prisma.pendingPayment.findUnique({
            where: { orderId },
        });

        if (!pending || pending.status !== 'PENDING') {
            return null;
        }

        // Check if expired
        if (new Date() > pending.expiresAt) {
            await prisma.pendingPayment.update({
                where: { orderId },
                data: { status: 'EXPIRED' },
            });
            return null;
        }

        return {
            studentId: pending.studentId,
            payments: JSON.parse(pending.payments) as { feeId: string; amount: number }[],
            amount: pending.amount,
        };
    } catch (error: unknown) {
        // Table might not exist if migration hasn't run - this is non-fatal
        const errMsg = error instanceof Error ? error.message : String(error);
        if (!errMsg.includes('does not exist') && !errMsg.includes('PendingPayment')) {
            console.error('[getPendingPayment] Error:', errMsg);
        }
        return null;
    }
}

// Mark pending payment as completed
export async function completePendingPayment(orderId: string) {
    if (!orderId) return;
    
    try {
        await prisma.pendingPayment.update({
            where: { orderId },
            data: { status: 'COMPLETED' },
        });
    } catch {
        // Ignore errors - record not found
    }
}

// Mark pending payment as failed
export async function failPendingPayment(orderId: string) {
    if (!orderId) return;
    
    try {
        await prisma.pendingPayment.update({
            where: { orderId },
            data: { status: 'FAILED' },
        });
    } catch {
        // Ignore errors - record not found
    }
}

// Check if order was already processed (to prevent duplicate processing)
export async function getExistingPayment(hdfcOrderId: string) {
    if (!hdfcOrderId) return null;
    
    try {
        const payment = await prisma.payment.findFirst({
            where: { hdfcOrderId },
            include: {
                fee: {
                    include: {
                        student: {
                            include: { class: true }
                        }
                    }
                }
            }
        });
        
        if (!payment) return null;
        
        return {
            status: payment.status, // SUCCESS, FAILED, CANCELLED
            hdfcStatus: payment.hdfcStatus,
            amount: payment.amount,
            receiptNo: payment.receiptNo,
            student: payment.fee?.student ? {
                name: `${payment.fee.student.firstName} ${payment.fee.student.lastName}`,
                class: payment.fee.student.class?.name || ''
            } : null
        };
    } catch {
        return null;
    }
}
