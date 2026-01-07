'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createFeeStructure(data: {
    name: string;
    classId?: string;
    academicYearId?: string;
    tuitionFee: number;
    transportFee: number;
    booksFee: number;
    uniformFee: number;
    examFee: number;
    otherFee: number;
    installments: number;
    lateFeePerDay: number;
}) {
    try {
        const totalFee = data.tuitionFee + data.transportFee + data.booksFee +
            data.uniformFee + data.examFee + data.otherFee;

        const feeStructure = await prisma.feeStructure.create({
            data: {
                ...data,
                totalFee,
                classId: data.classId || null,
                academicYearId: data.academicYearId || null
            },
            include: {
                class: true,
                academicYear: true
            }
        });

        revalidatePath('/fee-structure');
        return { success: true, feeStructure };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getFeeStructures(filters?: {
    classId?: string;
    academicYearId?: string;
    isActive?: boolean;
}) {
    try {
        const where: any = {};

        if (filters?.classId) where.classId = filters.classId;
        if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;

        const feeStructures = await prisma.feeStructure.findMany({
            where,
            include: {
                class: true,
                academicYear: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, feeStructures };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getFeeStructureById(id: string) {
    try {
        const feeStructure = await prisma.feeStructure.findUnique({
            where: { id },
            include: {
                class: true,
                academicYear: true
            }
        });

        if (!feeStructure) {
            return { success: false, error: 'Fee structure not found' };
        }

        return { success: true, feeStructure };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateFeeStructure(id: string, data: {
    name?: string;
    tuitionFee?: number;
    transportFee?: number;
    booksFee?: number;
    uniformFee?: number;
    examFee?: number;
    otherFee?: number;
    installments?: number;
    lateFeePerDay?: number;
    isActive?: boolean;
}) {
    try {
        const existing = await prisma.feeStructure.findUnique({ where: { id } });
        if (!existing) {
            return { success: false, error: 'Fee structure not found' };
        }

        const totalFee = (data.tuitionFee ?? existing.tuitionFee) +
            (data.transportFee ?? existing.transportFee) +
            (data.booksFee ?? existing.booksFee) +
            (data.uniformFee ?? existing.uniformFee) +
            (data.examFee ?? existing.examFee) +
            (data.otherFee ?? existing.otherFee);

        const feeStructure = await prisma.feeStructure.update({
            where: { id },
            data: {
                ...data,
                totalFee
            },
            include: {
                class: true,
                academicYear: true
            }
        });

        revalidatePath('/fee-structure');
        return { success: true, feeStructure };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteFeeStructure(id: string) {
    try {
        await prisma.feeStructure.delete({ where: { id } });
        revalidatePath('/fee-structure');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
