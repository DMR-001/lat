'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function getBranches() {
    try {
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return { success: true, branches };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createBranch(data: {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
}) {
    try {
        const branch = await prisma.branch.create({
            data: {
                name: data.name,
                code: data.code.toUpperCase(),
                address: data.address,
                phone: data.phone,
                email: data.email
            }
        });
        revalidatePath('/settings');
        return { success: true, branch };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateBranch(id: string, data: {
    name?: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
}) {
    try {
        const branch = await prisma.branch.update({
            where: { id },
            data
        });
        revalidatePath('/settings');
        return { success: true, branch };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBranch(id: string) {
    try {
        await prisma.branch.delete({ where: { id } });
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Session-based branch and year selection
export async function setSelectedBranch(branchId: string) {
    const cookieStore = await cookies();
    cookieStore.set('selectedBranchId', branchId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
    });
    return { success: true };
}

export async function setSelectedAcademicYear(yearId: string) {
    const cookieStore = await cookies();
    cookieStore.set('selectedAcademicYearId', yearId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
    });
    return { success: true };
}

export async function getSelectedBranchAndYear() {
    try {
        const cookieStore = await cookies();
        const selectedBranchId = cookieStore.get('selectedBranchId')?.value;
        const selectedAcademicYearId = cookieStore.get('selectedAcademicYearId')?.value;

        // Get branches
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        // Check if selected branch still exists, if not use first available
        let currentBranchId = selectedBranchId;
        const branchExists = branches.find((b: { id: string }) => b.id === selectedBranchId);
        if (!branchExists && branches.length > 0) {
            currentBranchId = branches[0].id;
            // Update cookie with valid branch
            if (currentBranchId) {
                cookieStore.set('selectedBranchId', currentBranchId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 365
                });
            }
        }

        // Get academic years for the selected branch (or all if no branch)
        const academicYears = await prisma.academicYear.findMany({
            where: currentBranchId ? { branchId: currentBranchId } : {},
            orderBy: { startDate: 'desc' }
        });

        // Check if selected year still exists and belongs to current branch
        let currentYearId = selectedAcademicYearId;
        const yearExists = academicYears.find((y: { id: string }) => y.id === selectedAcademicYearId);
        if (!yearExists && academicYears.length > 0) {
            // Use active year or first available
            const activeYear = academicYears.find((y: { isActive: boolean }) => y.isActive);
            currentYearId = activeYear?.id || academicYears[0]?.id || '';
            // Update cookie with valid year
            if (currentYearId) {
                cookieStore.set('selectedAcademicYearId', currentYearId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 365
                });
            }
        }

        return {
            success: true,
            branches,
            academicYears,
            selectedBranchId: currentBranchId || '',
            selectedAcademicYearId: currentYearId || ''
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
