'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function addAdmin(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'ADMIN'
            }
        });
        revalidatePath('/management');
    } catch (error) {
        console.error('Failed to create admin:', error);
        // Handle error (e.g., unique constraint violation)
    }
}
