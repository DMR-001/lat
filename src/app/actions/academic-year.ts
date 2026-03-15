'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Helper to get current branch from cookies
async function getCurrentBranchId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('selectedBranchId')?.value || null;
}

export async function createAcademicYear(
    name: string,
    startDate: Date,
    endDate: Date,
    setAsActive: boolean = false
) {
    try {
        const branchId = await getCurrentBranchId();

        // If setting as active, deactivate all others for this branch first
        if (setAsActive && branchId) {
            await prisma.academicYear.updateMany({
                where: { isActive: true, branchId },
                data: { isActive: false }
            });
        }

        const academicYear = await prisma.academicYear.create({
            data: {
                name,
                startDate,
                endDate,
                isActive: setAsActive,
                branchId
            }
        });

        revalidatePath('/academic-year');
        return { success: true, academicYear };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function setActiveYear(yearId: string) {
    try {
        const branchId = await getCurrentBranchId();

        // Deactivate all years for this branch
        if (branchId) {
            await prisma.academicYear.updateMany({
                where: { isActive: true, branchId },
                data: { isActive: false }
            });
        }

        // Activate selected year
        const academicYear = await prisma.academicYear.update({
            where: { id: yearId },
            data: { isActive: true }
        });

        revalidatePath('/academic-year');
        revalidatePath('/dashboard');
        return { success: true, academicYear };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function assignYearToBranch(yearId: string, branchId: string) {
    try {
        const academicYear = await prisma.academicYear.update({
            where: { id: yearId },
            data: { branchId }
        });

        revalidatePath('/academic-year');
        return { success: true, academicYear };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getActiveYear() {
    try {
        const branchId = await getCurrentBranchId();

        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true, ...(branchId ? { branchId } : {}) }
        });

        return { success: true, activeYear };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllAcademicYears() {
    try {
        const branchId = await getCurrentBranchId();

        const years = await prisma.academicYear.findMany({
            where: branchId ? { branchId } : {},
            orderBy: { startDate: 'desc' },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        fees: true,
                        certificates: true
                    }
                }
            }
        });

        return { success: true, years };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
