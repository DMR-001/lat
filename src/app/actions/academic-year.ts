'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createAcademicYear(
    name: string,
    startDate: Date,
    endDate: Date,
    setAsActive: boolean = false
) {
    try {
        // If setting as active, deactivate all others first
        if (setAsActive) {
            await prisma.academicYear.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }

        const academicYear = await prisma.academicYear.create({
            data: {
                name,
                startDate,
                endDate,
                isActive: setAsActive
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
        // Deactivate all years
        await prisma.academicYear.updateMany({
            where: { isActive: true },
            data: { isActive: false }
        });

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

export async function getActiveYear() {
    try {
        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true }
        });

        return { success: true, activeYear };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAllAcademicYears() {
    try {
        const years = await prisma.academicYear.findMany({
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
