'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function addAdmin(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const defaultBranchId = formData.get('defaultBranchId') as string;

    if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
        where: { username }
    });

    if (existingUser) {
        return { success: false, error: 'Username already exists. Please choose a different username.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'ADMIN',
                defaultBranchId: defaultBranchId || null
            }
        });
        revalidatePath('/management');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to create admin:', error);
        return { success: false, error: error.message || 'Failed to create admin' };
    }
}

export async function deleteAdmin(id: string) {
    try {
        await prisma.user.delete({
            where: { id }
        });
        revalidatePath('/management');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete admin:', error);
        return { success: false, error: error.message };
    }
}
