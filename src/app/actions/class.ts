'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getClasses() {
    return await prisma.class.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { students: true } } }
    });
}

export async function addClass(formData: FormData) {
    const name = formData.get('name') as string;
    const section = formData.get('section') as string;

    await prisma.class.create({
        data: {
            name,
            section: section || null
        }
    });

    revalidatePath('/settings');
}

export async function deleteClass(id: string) {
    // Safety check: Ensure no students are in the class
    const studentCount = await prisma.student.count({
        where: { classId: id }
    });

    if (studentCount > 0) {
        throw new Error(`Cannot delete class. It has ${studentCount} students.`);
    }

    await prisma.class.delete({
        where: { id }
    });

    revalidatePath('/settings');
}
