'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Get attendance for a specific date
export async function getTeacherAttendance(date: Date) {
    try {
        // Normalize date to start of day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await prisma.teacherAttendance.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: { teacher: true }
        });

        // Get all active teachers
        const teachers = await prisma.teacher.findMany({
            orderBy: { firstName: 'asc' }
        });

        // Map attendance to teachers
        const result = teachers.map(teacher => {
            const record = attendance.find(a => a.teacherId === teacher.id);
            return {
                teacher,
                status: record?.status || null,
                remarks: record?.remarks || '',
                id: record?.id
            };
        });

        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Mark attendance
export async function markTeacherAttendance(data: {
    teacherId: string;
    date: Date;
    status: string;
    remarks?: string;
}) {
    try {
        // Normalize date
        const attendanceDate = new Date(data.date);
        attendanceDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

        const record = await prisma.teacherAttendance.upsert({
            where: {
                teacherId_date: {
                    teacherId: data.teacherId,
                    date: attendanceDate
                }
            },
            update: {
                status: data.status,
                remarks: data.remarks
            },
            create: {
                teacherId: data.teacherId,
                date: attendanceDate,
                status: data.status,
                remarks: data.remarks
            }
        });

        revalidatePath('/management/attendance');
        return { success: true, record };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Bulk mark attendance
export async function bulkMarkTeacherAttendance(date: Date, records: any[]) {
    try {
        const attendanceDate = new Date(date);
        attendanceDate.setHours(12, 0, 0, 0);

        const promises = records.map(record =>
            prisma.teacherAttendance.upsert({
                where: {
                    teacherId_date: {
                        teacherId: record.teacherId,
                        date: attendanceDate
                    }
                },
                update: {
                    status: record.status,
                    remarks: record.remarks
                },
                create: {
                    teacherId: record.teacherId,
                    date: attendanceDate,
                    status: record.status,
                    remarks: record.remarks
                }
            })
        );

        await Promise.all(promises);

        revalidatePath('/management/attendance');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
