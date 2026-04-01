import prisma from '@/lib/prisma';
import AttendanceClient from './AttendanceClient';
import { getFilterContext } from '@/lib/filter-context';

export default async function AttendancePage() {
    const { branchId } = await getFilterContext();
    
    const classes = await prisma.class.findMany({
        where: branchId ? { branchId } : {},
        include: {
            students: {
                where: branchId ? { branchId } : {},
                orderBy: { lastName: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Attendance</h1>
            <AttendanceClient classes={classes} />
        </div>
    );
}
