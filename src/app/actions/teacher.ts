'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addTeacher(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const subject = formData.get('subject') as string;

    await prisma.teacher.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            subject,
        },
    });

    revalidatePath('/teachers');
    redirect('/teachers');
}

export async function getTeachers() {
    try {
        const teachers = await prisma.teacher.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, teachers };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
