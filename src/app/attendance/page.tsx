import prisma from '@/lib/prisma';
import AttendanceClient from './AttendanceClient';

export default async function AttendancePage() {
    const classes = await prisma.class.findMany({
        include: {
            students: {
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
