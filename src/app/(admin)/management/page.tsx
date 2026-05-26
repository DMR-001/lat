import prisma from '@/lib/prisma';
import ManagementClient from './ManagementClient';

export default async function ManagementPage() {
    const [admins, branches, teachers] = await Promise.all([
        prisma.user.findMany({
            where: { role: 'ADMIN' },
            include: { defaultBranch: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        }),
        prisma.teacher.findMany({
            orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
                portalPassword: true,
                branch: { select: { name: true } }
            }
        })
    ]);

    return (
        <ManagementClient
            admins={admins.map(a => ({
                id: a.id,
                username: a.username,
                createdAt: a.createdAt.toISOString(),
                defaultBranch: a.defaultBranch ? { name: a.defaultBranch.name } : null
            }))}
            branches={branches.map(b => ({ id: b.id, name: b.name }))}
            teachers={teachers.map(t => ({
                id: t.id,
                firstName: t.firstName,
                lastName: t.lastName,
                email: t.email,
                employeeId: t.employeeId,
                hasPortalAccess: !!t.portalPassword,
                branchName: t.branch?.name ?? null
            }))}
        />
    );
}
