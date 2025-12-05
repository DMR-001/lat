'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function markAttendance(formData: FormData) {
    const date = new Date(formData.get('date') as string);
    const studentIds = formData.getAll('studentId') as string[];

    // This is a simplified bulk update. In a real app, you'd handle status per student.
    // Here we assume checked = PRESENT, unchecked (not in list) = ABSENT
    // But HTML forms don't send unchecked checkboxes.
    // So we'll just record "PRESENT" for the IDs we get.

    // First, clear existing attendance for this date/class if needed, or just upsert.
    // For simplicity, we'll iterate and create.

    for (const studentId of studentIds) {
        await prisma.attendance.create({
            data: {
                date,
                studentId,
                status: 'PRESENT',
            },
        });
    }

    revalidatePath('/attendance');
}
