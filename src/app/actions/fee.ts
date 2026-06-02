'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { sendFeeCollectedSms } from '@/lib/sms';
import { logAction } from '@/lib/audit';

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

export async function assignMultipleFees(
    studentId: string,
    fees: { type: string; amount: number }[],
    dueDate: string
) {
    const academicYearId = await getCurrentAcademicYearId();

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { firstName: true, lastName: true, admissionNo: true }
    });

    if (!student) throw new Error('Student not found');

    const data = fees.map(f => ({
        studentId,
        type: f.type,
        amount: f.amount,
        originalAmount: f.amount,
        paidAmount: 0,
        dueDate: new Date(dueDate),
        status: 'PENDING',
        academicYearId: academicYearId ?? null,
    }));

    await prisma.fee.createMany({ data });

    const total = fees.reduce((s, f) => s + f.amount, 0);
    const types = fees.map(f => f.type).join(', ');
    await logAction('FEE_ASSIGNED', 'FEE',
        `Assigned ${fees.length} fee(s) [${types}] totalling ₹${total} to ${student.firstName} ${student.lastName} (${student.admissionNo})`,
        { studentId, studentName: `${student.firstName} ${student.lastName}`, admissionNo: student.admissionNo, fees, total, dueDate }
    );

    revalidatePath('/fees');
}

export async function assignFee(formData: FormData) {
    const studentId = formData.get('studentId') as string;
    const type = formData.get('type') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const dueDate = new Date(formData.get('dueDate') as string);
    const academicYearId = await getCurrentAcademicYearId();

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { firstName: true, lastName: true, admissionNo: true }
    });

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

    await logAction('FEE_ASSIGNED', 'FEE',
        `Assigned ${type} fee of ₹${amount} to ${student?.firstName} ${student?.lastName} (${student?.admissionNo})`,
        { studentId, studentName: `${student?.firstName} ${student?.lastName}`, admissionNo: student?.admissionNo, type, amount, dueDate }
    );

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

    // Send fee collected SMS to parent
    const student = await prisma.student.findUnique({
        where: { id: fee.studentId },
        select: { phone: true, admissionNo: true, firstName: true, lastName: true }
    });
    if (student?.phone) {
        const studentName = `${student.firstName} ${student.lastName}`;
        await sendFeeCollectedSms(student.phone, amount, studentName, receiptNo, branchId).catch(() => null);
    }

    await logAction('FEE_PAYMENT_RECORDED', 'FEE',
        `Collected ₹${amount} via ${method} for ${student?.firstName} ${student?.lastName} (${student?.admissionNo}) — Receipt ${receiptNo}`,
        { feeId, receiptNo, amount, method, feeType: fee.type, studentId: fee.studentId, admissionNo: student?.admissionNo, studentName: `${student?.firstName} ${student?.lastName}` }
    );

    revalidatePath('/fees');
    redirect('/fees');
}

export async function transferCredit(
    fromFeeId: string,
    toFeeId: string,
    amount: number,
    reason: string
) {
    if (amount <= 0) return { success: false, error: 'Amount must be greater than 0' };

    const [fromFee, toFee] = await Promise.all([
        prisma.fee.findUnique({ where: { id: fromFeeId }, include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, phone: true } } } }),
        prisma.fee.findUnique({ where: { id: toFeeId } })
    ]);

    if (!fromFee) return { success: false, error: 'Source fee not found' };
    if (!toFee) return { success: false, error: 'Destination fee not found' };
    if (fromFee.studentId !== toFee.studentId) return { success: false, error: 'Both fees must belong to the same student' };
    if (amount > fromFee.paidAmount) return { success: false, error: `Cannot transfer more than what is paid on source fee (₹${fromFee.paidAmount})` };

    const branchId = await getCurrentBranchId();
    const branchCode = await getBranchCode(branchId);
    const currentYear = new Date().getFullYear();

    const getFeeTypeShortForm = (type: string) => {
        const mapping: Record<string, string> = {
            'TRANSPORT': 'TRN', 'TUITION': 'TUI', 'ADMISSION': 'ADM', 'EXAM': 'EXM',
            'LATE': 'LAT', 'ANNUAL': 'ANN', 'BOOKS': 'BKS', 'UNIFORM': 'UNI',
            'APPLICATION': 'APP', 'REGISTRATION': 'REG'
        };
        return mapping[type.toUpperCase()] || type.substring(0, 3).toUpperCase();
    };

    const lastPayment = await prisma.payment.findFirst({
        where: branchId ? { branchId } : {},
        orderBy: { createdAt: 'desc' }
    });
    let nextNumber = 1;
    if (lastPayment?.receiptNo) {
        const match = lastPayment.receiptNo.match(/(\d+)$/);
        if (match) nextNumber = parseInt(match[1]) + 1;
    }
    const receiptNo = `${branchCode}/${getFeeTypeShortForm(toFee.type)}/${currentYear}/${nextNumber.toString().padStart(4, '0')}`;

    const newFromPaid = fromFee.paidAmount - amount;
    const newFromStatus = newFromPaid >= fromFee.amount ? 'PAID' : 'PENDING';
    const newToPaid = toFee.paidAmount + amount;
    const newToStatus = newToPaid >= toFee.amount ? 'PAID' : 'PENDING';

    await prisma.$transaction([
        // Reduce paidAmount on source fee
        prisma.fee.update({
            where: { id: fromFeeId },
            data: { paidAmount: newFromPaid, status: newFromStatus }
        }),
        // Add credit payment on destination fee
        prisma.payment.create({
            data: {
                feeId: toFeeId,
                amount,
                method: 'TRANSFER',
                receiptNo,
                branchId,
                date: new Date()
            }
        }),
        // Update destination fee paid amount
        prisma.fee.update({
            where: { id: toFeeId },
            data: { paidAmount: newToPaid, status: newToStatus }
        })
    ]);

    const student = fromFee.student;
    await logAction('FEE_TRANSFER', 'FEE',
        `Transferred ₹${amount} from ${fromFee.type} to ${toFee.type} for ${student.firstName} ${student.lastName} (${student.admissionNo})${reason ? ` — Reason: ${reason}` : ''}`,
        { fromFeeId, toFeeId, fromType: fromFee.type, toType: toFee.type, amount, reason, receiptNo, studentId: student.id }
    );

    revalidatePath('/fees');
    return { success: true, receiptNo };
}

export async function editFee(feeId: string, data: { amount: number; dueDate: string; type: string; reason: string }) {
    const fee = await prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) return { success: false, error: 'Fee not found' };
    if (data.amount < 0) return { success: false, error: 'Amount cannot be negative' };

    const newStatus = fee.paidAmount >= data.amount ? 'PAID' : fee.status === 'PAID' ? 'PENDING' : fee.status;
    const hadNoDiscount = fee.discountAmount === 0;

    const student = await prisma.student.findUnique({
        where: { id: fee.studentId },
        select: { firstName: true, lastName: true, admissionNo: true }
    });

    await prisma.fee.update({
        where: { id: feeId },
        data: {
            amount: data.amount,
            originalAmount: hadNoDiscount ? data.amount : fee.originalAmount,
            dueDate: new Date(data.dueDate),
            type: data.type,
            status: newStatus
        }
    });

    await logAction('FEE_EDITED', 'FEE',
        `Edited ${fee.type} fee for ${student?.firstName} ${student?.lastName} (${student?.admissionNo}): ₹${fee.amount}→₹${data.amount}, due ${fee.dueDate.toISOString().slice(0,10)}→${data.dueDate}${data.reason ? ` — Reason: ${data.reason}` : ''}`,
        { feeId, oldType: fee.type, newType: data.type, oldAmount: fee.amount, newAmount: data.amount, oldDueDate: fee.dueDate, newDueDate: data.dueDate, reason: data.reason, studentId: fee.studentId }
    );

    revalidatePath('/fees');
    return { success: true };
}

export async function deletePayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { fee: { include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } } } }
    });
    if (!payment) return { success: false, error: 'Payment not found' };

    await prisma.payment.delete({ where: { id: paymentId } });

    if (payment.feeId) {
        const agg = await prisma.payment.aggregate({
            where: { feeId: payment.feeId, status: 'SUCCESS' },
            _sum: { amount: true }
        });
        const newPaidAmount = agg._sum.amount ?? 0;
        const fee = await prisma.fee.findUnique({ where: { id: payment.feeId } });
        if (fee) {
            await prisma.fee.update({
                where: { id: payment.feeId },
                data: { paidAmount: newPaidAmount, status: newPaidAmount >= fee.amount ? 'PAID' : 'PENDING' }
            });
        }
    }

    await logAction('PAYMENT_DELETED', 'FEE',
        `Deleted payment ${payment.receiptNo} of ₹${payment.amount} for ${payment.fee?.student?.firstName} ${payment.fee?.student?.lastName} (${payment.fee?.student?.admissionNo})`,
        { paymentId, receiptNo: payment.receiptNo, amount: payment.amount, feeId: payment.feeId }
    );

    revalidatePath('/fees');
    return { success: true };
}

export async function editPayment(paymentId: string, data: { amount: number; method: string; reason: string }) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { fee: { include: { student: { select: { firstName: true, lastName: true, admissionNo: true } } } } }
    });
    if (!payment) return { success: false, error: 'Payment not found' };
    if (data.amount <= 0) return { success: false, error: 'Amount must be greater than 0' };

    await prisma.payment.update({ where: { id: paymentId }, data: { amount: data.amount, method: data.method } });

    if (payment.feeId) {
        const agg = await prisma.payment.aggregate({
            where: { feeId: payment.feeId, status: 'SUCCESS' },
            _sum: { amount: true }
        });
        const newPaidAmount = agg._sum.amount ?? 0;
        const fee = await prisma.fee.findUnique({ where: { id: payment.feeId } });
        if (fee) {
            await prisma.fee.update({
                where: { id: payment.feeId },
                data: { paidAmount: newPaidAmount, status: newPaidAmount >= fee.amount ? 'PAID' : 'PENDING' }
            });
        }
    }

    await logAction('PAYMENT_EDITED', 'FEE',
        `Edited payment ${payment.receiptNo}: ₹${payment.amount}→₹${data.amount}, method ${payment.method}→${data.method}${data.reason ? ` — Reason: ${data.reason}` : ''}`,
        { paymentId, receiptNo: payment.receiptNo, oldAmount: payment.amount, newAmount: data.amount, oldMethod: payment.method, newMethod: data.method, reason: data.reason }
    );

    revalidatePath('/fees');
    return { success: true };
}

export async function applyDiscount(feeId: string, discountAmount: number, discountReason: string) {
    const fee = await prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) return { success: false, error: 'Fee not found' };

    const base = fee.originalAmount > 0 ? fee.originalAmount : fee.amount;
    if (discountAmount < 0 || discountAmount > base) {
        return { success: false, error: 'Discount must be between 0 and the original fee amount' };
    }

    const newAmount = base - discountAmount;
    const newStatus = fee.paidAmount >= newAmount ? 'PAID' : fee.status === 'PAID' ? 'PENDING' : fee.status;

    const feeStudent = await prisma.student.findUnique({
        where: { id: fee.studentId },
        select: { firstName: true, lastName: true, admissionNo: true }
    });

    await prisma.fee.update({
        where: { id: feeId },
        data: {
            originalAmount: base,
            discountAmount,
            discountReason: discountReason || null,
            amount: newAmount,
            status: newStatus
        }
    });

    await logAction('FEE_DISCOUNT_APPLIED', 'FEE',
        `Applied ₹${discountAmount} discount on ${fee.type} fee for ${feeStudent?.firstName} ${feeStudent?.lastName} (${feeStudent?.admissionNo})${discountReason ? ` — Reason: ${discountReason}` : ''}`,
        { feeId, feeType: fee.type, originalAmount: base, discountAmount, newAmount, discountReason, studentId: fee.studentId, admissionNo: feeStudent?.admissionNo }
    );

    revalidatePath('/fees');
    return { success: true };
}
