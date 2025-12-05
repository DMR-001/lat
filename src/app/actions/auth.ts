'use server';

import prisma from '@/lib/prisma';
import { login, logout } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        return { error: 'Invalid username or password' };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        return { error: 'Invalid username or password' };
    }

    await login({ id: user.id, username: user.username, role: user.role });
    redirect('/');
}

export async function logoutAction() {
    await logout();
    redirect('/login');
}
