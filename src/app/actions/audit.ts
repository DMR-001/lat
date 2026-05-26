'use server';

import prisma from '@/lib/prisma';

export type AuditLogRecord = {
    id: string;
    performedBy: string;
    action: string;
    category: string;
    description: string;
    meta: Record<string, unknown> | null;
    branchId: string | null;
    createdAt: string;
};

export type AuditFilter = {
    category?: string;
    performedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
};

export async function getAuditLogs(filter?: AuditFilter): Promise<AuditLogRecord[]> {
    const where: any = {};

    if (filter?.category && filter.category !== 'all') {
        where.category = filter.category;
    }
    if (filter?.performedBy) {
        where.performedBy = { contains: filter.performedBy, mode: 'insensitive' };
    }
    if (filter?.dateFrom || filter?.dateTo) {
        where.createdAt = {};
        if (filter.dateFrom) where.createdAt.gte = new Date(filter.dateFrom);
        if (filter.dateTo) {
            const end = new Date(filter.dateTo);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }
    if (filter?.search) {
        where.OR = [
            { description: { contains: filter.search, mode: 'insensitive' } },
            { action: { contains: filter.search, mode: 'insensitive' } },
            { performedBy: { contains: filter.search, mode: 'insensitive' } },
        ];
    }

    const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 500,
    });

    return logs.map((l) => ({
        id: l.id,
        performedBy: l.performedBy,
        action: l.action,
        category: l.category,
        description: l.description,
        meta: l.meta as Record<string, unknown> | null,
        branchId: l.branchId,
        createdAt: l.createdAt.toISOString(),
    }));
}

export async function getAuditStats() {
    const [total, today, byCategory] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({
            where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
        }),
        prisma.auditLog.groupBy({
            by: ['category'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        })
    ]);

    return { total, today, byCategory };
}
