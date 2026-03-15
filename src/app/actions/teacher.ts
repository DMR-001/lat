'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Helper to get current branch from cookies
async function getCurrentBranchId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('selectedBranchId')?.value || null;
}

export async function addTeacher(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const subject = formData.get('subject') as string;

    const branchId = await getCurrentBranchId();

    await prisma.teacher.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            subject,
            branchId,
        },
    });

    revalidatePath('/teachers');
    redirect('/teachers');
}

export async function getTeachers() {
    try {
        const cookieStore = await cookies();
        const branchId = cookieStore.get('selectedBranchId')?.value;

        const teachers = await prisma.teacher.findMany({
            where: branchId ? { branchId } : {},
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, teachers };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
