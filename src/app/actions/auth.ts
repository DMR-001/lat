'use server';

import prisma from '@/lib/prisma';
import { login, logout } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';

export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const headerStore = await headers();
    const hostname = headerStore.get('host') || '';

    // On the payroll subdomain, check teacher login first (by email or employeeId)
    if (hostname.startsWith('payroll.')) {
        const teacher = await prisma.teacher.findFirst({
            where: {
                OR: [
                    { email: username },
                    { employeeId: username }
                ]
            }
        });

        if (teacher && teacher.portalPassword) {
            const isValid = await bcrypt.compare(password, teacher.portalPassword);
            if (isValid) {
                await login({
                    id: teacher.id,
                    username: teacher.email,
                    role: 'TEACHER',
                    teacherId: teacher.id,
                    teacherName: `${teacher.firstName} ${teacher.lastName}`
                });
                redirect('/payslip');
            }
            // If password wrong, fall through to generic error below
            return { error: 'Invalid username or password' };
        }
    }

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

    // Block non-MANAGEMENT users from logging in on the payroll subdomain
    if (hostname.startsWith('payroll.') && user.role !== 'MANAGEMENT') {
        return { error: 'Access denied. This portal is for payroll staff only.' };
    }

    await login({ id: user.id, username: user.username, role: user.role, defaultBranchId: user.defaultBranchId });

    // Set branch cookie immediately so all pages load with the correct branch on first visit
    const cookieStore = await cookies();
    const cookieOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 365
    };

    if (user.defaultBranchId) {
        // User is restricted to a specific branch — set it
        cookieStore.set('selectedBranchId', user.defaultBranchId, cookieOpts);

        // Set the active academic year for this branch
        const activeYear = await prisma.academicYear.findFirst({
            where: { branchId: user.defaultBranchId, isActive: true }
        }) ?? await prisma.academicYear.findFirst({
            where: { branchId: user.defaultBranchId },
            orderBy: { startDate: 'desc' }
        });
        if (activeYear) {
            cookieStore.set('selectedAcademicYearId', activeYear.id, cookieOpts);
        } else {
            cookieStore.delete('selectedAcademicYearId');
        }
    } else {
        // Super-admin / no branch restriction — clear stale branch cookies so
        // getSelectedBranchAndYear picks the correct first branch fresh
        cookieStore.delete('selectedBranchId');
        cookieStore.delete('selectedAcademicYearId');
    }

    redirect('/');
}

export async function logoutAction() {
    // Clear branch/year cookies so the next login starts with a clean slate
    const cookieStore = await cookies();
    cookieStore.delete('selectedBranchId');
    cookieStore.delete('selectedAcademicYearId');
    await logout();
    redirect('/login');
}
