'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendFeeReminderSms, sendNoticeSms, sendBulkSms } from '@/lib/sms';

// ─── Fee Reminder ────────────────────────────────────────────

export async function sendFeeReminders(studentIds: string[]) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    const sentBy = session.user?.id ?? null;

    // Fetch students with outstanding fees
    const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            phone: true,
            parentName: true,
            branchId: true,
            fees: {
                where: { status: { not: 'PAID' } },
                select: { amount: true, paidAmount: true },
            },
        },
    });

    const results: Array<{ studentId: string; name: string; success: boolean; reason?: string }> = [];

    for (const student of students) {
        if (!student.phone) {
            results.push({ studentId: student.id, name: `${student.firstName} ${student.lastName}`, success: false, reason: 'No phone' });
            continue;
        }

        const totalDue = student.fees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
        if (totalDue <= 0) {
            results.push({ studentId: student.id, name: `${student.firstName} ${student.lastName}`, success: false, reason: 'No dues' });
            continue;
        }

        const ok = await sendFeeReminderSms(
            student.phone,
            student.parentName ?? 'Parent',
            totalDue,
            `${student.firstName} ${student.lastName}`,
            student.admissionNo,
            student.branchId ?? null,
            sentBy
        );

        results.push({ studentId: student.id, name: `${student.firstName} ${student.lastName}`, success: ok });
    }

    return results;
}

// ─── Bulk Fee Reminders (filtered) ───────────────────────────

export async function sendBulkFeeReminders(filters: {
    branchId?: string;
    classId?: string;
    overdueOnly?: boolean;
}) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    const sentBy = session.user?.id ?? null;

    const students = await prisma.student.findMany({
        where: {
            ...(filters.branchId ? { branchId: filters.branchId } : {}),
            ...(filters.classId ? { classId: filters.classId } : {}),
            phone: { not: null },
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            phone: true,
            parentName: true,
            branchId: true,
            fees: {
                where: {
                    status: { not: 'PAID' },
                    ...(filters.overdueOnly ? { dueDate: { lt: new Date() } } : {}),
                },
                select: { amount: true, paidAmount: true },
            },
        },
    });

    const eligible = students.filter(s => s.phone && s.fees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0) > 0);

    const recipients = eligible.map(s => {
        const totalDue = s.fees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
        return {
            phone: s.phone!,
            message: `Dear ${s.parentName ?? 'Parent'}, fee of Rs.${totalDue.toLocaleString('en-IN')} is pending for ${s.firstName} ${s.lastName} (Adm: ${s.admissionNo}). Please pay at the earliest. - Sprout School`,
        };
    });

    if (recipients.length === 0) return { sent: 0, failed: 0, total: 0 };

    const templateId = process.env.SMS_TEMPLATE_FEE_REMINDER ?? '';
    const { sent, failed } = await sendBulkSms(recipients, templateId, 'FEE_REMINDER', 'SERVICE_IMPLICIT', filters.branchId ?? null, sentBy);

    return { sent, failed, total: recipients.length };
}

// ─── Broadcast Notice ────────────────────────────────────────

export async function sendBroadcastNotice(noticeText: string, filters: {
    branchId?: string;
    classId?: string;
}) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');
    const sentBy = session.user?.id ?? null;

    if (!noticeText.trim()) throw new Error('Notice text is required');

    const students = await prisma.student.findMany({
        where: {
            ...(filters.branchId ? { branchId: filters.branchId } : {}),
            ...(filters.classId ? { classId: filters.classId } : {}),
            phone: { not: null },
        },
        select: { phone: true, branchId: true },
    });

    const uniquePhones = [...new Set(students.map(s => s.phone!).filter(Boolean))];

    if (uniquePhones.length === 0) return { sent: 0, failed: 0, total: 0 };

    const recipients = uniquePhones.map(phone => ({
        phone,
        message: `Dear Parent, ${noticeText} - Sprout School`,
    }));

    const templateId = process.env.SMS_TEMPLATE_NOTICE ?? '';
    const { sent, failed } = await sendBulkSms(recipients, templateId, 'NOTICE', 'SERVICE_IMPLICIT', filters.branchId ?? null, sentBy);

    return { sent, failed, total: uniquePhones.length };
}

// ─── Get Students with Pending Fees (for UI table) ───────────

export async function getStudentsWithPendingFees(filters: {
    branchId?: string;
    classId?: string;
    overdueOnly?: boolean;
    search?: string;
}) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const students = await prisma.student.findMany({
        where: {
            ...(filters.branchId ? { branchId: filters.branchId } : {}),
            ...(filters.classId ? { classId: filters.classId } : {}),
            phone: { not: null },
            ...(filters.search ? {
                OR: [
                    { firstName: { contains: filters.search, mode: 'insensitive' } },
                    { lastName: { contains: filters.search, mode: 'insensitive' } },
                    { admissionNo: { contains: filters.search, mode: 'insensitive' } },
                    { phone: { contains: filters.search } },
                ],
            } : {}),
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            phone: true,
            parentName: true,
            branchId: true,
            class: { select: { name: true, section: true } },
            fees: {
                where: {
                    status: { not: 'PAID' },
                    ...(filters.overdueOnly ? { dueDate: { lt: new Date() } } : {}),
                },
                select: { amount: true, paidAmount: true, dueDate: true },
            },
        },
        orderBy: [{ class: { name: 'asc' } }, { firstName: 'asc' }],
    });

    return students
        .map(s => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            admissionNo: s.admissionNo,
            phone: s.phone!,
            parentName: s.parentName ?? '-',
            className: s.class ? `${s.class.name}${s.class.section ? ` (${s.class.section})` : ''}` : '-',
            totalDue: s.fees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0),
            hasOverdue: s.fees.some(f => new Date(f.dueDate) < new Date()),
        }))
        .filter(s => s.totalDue > 0);
}

// ─── Get SMS Logs (for history tab) ──────────────────────────

export async function getSmsLogs(page = 1, pageSize = 50, typeFilter?: string) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const where = typeFilter && typeFilter !== 'ALL' ? { type: typeFilter } : {};

    const [logs, total] = await Promise.all([
        prisma.smsLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.smsLog.count({ where }),
    ]);

    return { logs, total, pages: Math.ceil(total / pageSize) };
}

// ─── Get Branches & Classes for filters ──────────────────────

export async function getBranchesAndClasses() {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const { getFilterContext } = await import('@/lib/filter-context');
    const { branchId } = await getFilterContext();

    const [branches, classes] = await Promise.all([
        prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } }),
        prisma.class.findMany({
            where: branchId ? { branchId } : {},
            select: { id: true, name: true, section: true },
            orderBy: [{ name: 'asc' }, { section: 'asc' }],
        }),
    ]);

    return { branches, classes, branchId };
}
