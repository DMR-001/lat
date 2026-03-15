import prisma from '@/lib/prisma';
import ManagementClient from './ManagementClient';

export default async function ManagementPage() {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        include: { defaultBranch: true },
        orderBy: { createdAt: 'desc' }
    });

    const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });

    return (
        <ManagementClient 
            admins={admins.map(a => ({
                id: a.id,
                username: a.username,
                createdAt: a.createdAt.toISOString(),
                defaultBranch: a.defaultBranch ? { name: a.defaultBranch.name } : null
            }))} 
            branches={branches.map(b => ({ id: b.id, name: b.name }))}
        />
    );
}
