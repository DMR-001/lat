import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export type AuditCategory = 'FEE' | 'SALARY' | 'STUDENT' | 'ADMIN' | 'FEE_STRUCTURE';

export async function logAction(
    action: string,
    category: AuditCategory,
    description: string,
    meta?: Record<string, unknown>
) {
    try {
        const session = await getSession();
        const cookieStore = await cookies();
        const branchId = cookieStore.get('selectedBranchId')?.value || null;

        await prisma.auditLog.create({
            data: {
                performedBy: session?.user?.username ?? 'unknown',
                userId: session?.user?.id ?? null,
                action,
                category,
                description,
                meta: meta ? (meta as any) : undefined,
                branchId
            }
        });
    } catch {
        // Audit logging must never crash the main action
    }
}
