'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Helper to get current branch from cookies
async function getCurrentBranchId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('selectedBranchId')?.value || null;
}

export async function createFeeStructure(data: {
    name: string;
    classId?: string;
    academicYearId?: string;
    registrationFee: number;
    tuitionFee: number;
    sportsFee: number;
    booksFee: number;
    uniformFee: number;
    transportFee: number;
    installments: number;
    lateFeePerDay: number;
}) {
    try {
        const branchId = await getCurrentBranchId();
        const totalFee = data.registrationFee + data.tuitionFee + data.sportsFee +
            data.booksFee + data.uniformFee + data.transportFee;

        const feeStructure = await prisma.feeStructure.create({
            data: {
                ...data,
                totalFee,
                classId: data.classId || null,
                academicYearId: data.academicYearId || null,
                branchId
            },
            include: {
                class: true,
                academicYear: true
            }
        });

        // Auto-assign fees to all students in the class
        if (data.classId) {
            const students = await prisma.student.findMany({
                where: {
                    classId: data.classId,
                    ...(branchId ? { branchId } : {})
                },
                select: { id: true }
            });

            // Determine due date: use academic year end date if available, else 3 months from now
            let dueDate: Date;
            if (data.academicYearId) {
                const ay = await prisma.academicYear.findUnique({
                    where: { id: data.academicYearId },
                    select: { endDate: true }
                });
                dueDate = ay?.endDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            } else {
                dueDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            }

            if (students.length > 0) {
                const components: { type: string; amount: number }[] = [
                    { type: 'REGISTRATION', amount: data.registrationFee },
                    { type: 'TUITION',      amount: data.tuitionFee },
                    { type: 'SPORTS',       amount: data.sportsFee },
                    { type: 'BOOKS',        amount: data.booksFee },
                    { type: 'UNIFORM',      amount: data.uniformFee },
                    { type: 'TRANSPORT',    amount: data.transportFee },
                ].filter(c => c.amount > 0);

                for (const comp of components) {
                    await prisma.fee.createMany({
                        data: students.map((s) => ({
                            studentId: s.id,
                            feeStructureId: feeStructure.id,
                            academicYearId: data.academicYearId || null,
                            type: comp.type,
                            amount: comp.amount,
                            originalAmount: comp.amount,
                            paidAmount: 0,
                            dueDate,
                            status: 'PENDING'
                        })),
                        skipDuplicates: false
                    });
                }
            }
        }

        revalidatePath('/fee-structure');
        revalidatePath('/fees');
        return { success: true, feeStructure, studentsAssigned: data.classId ? true : false };
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
        const branchId = await getCurrentBranchId();
        const where: any = {};

        if (branchId) where.branchId = branchId;
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
    registrationFee?: number;
    tuitionFee?: number;
    sportsFee?: number;
    booksFee?: number;
    uniformFee?: number;
    transportFee?: number;
    installments?: number;
    lateFeePerDay?: number;
    isActive?: boolean;
}) {
    try {
        const existing = await prisma.feeStructure.findUnique({ where: { id } });
        if (!existing) {
            return { success: false, error: 'Fee structure not found' };
        }

        const totalFee = (data.registrationFee ?? existing.registrationFee) +
            (data.tuitionFee ?? existing.tuitionFee) +
            (data.sportsFee ?? existing.sportsFee) +
            (data.booksFee ?? existing.booksFee) +
            (data.uniformFee ?? existing.uniformFee) +
            (data.transportFee ?? existing.transportFee);

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

        // Sync all pending fees that were auto-assigned from this structure
        // Each fee type gets its own updated component amount (not the total)
        const typeAmountMap: Record<string, number> = {
            REGISTRATION: data.registrationFee ?? existing.registrationFee,
            TUITION:      data.tuitionFee      ?? existing.tuitionFee,
            SPORTS:       data.sportsFee       ?? existing.sportsFee,
            BOOKS:        data.booksFee        ?? existing.booksFee,
            UNIFORM:      data.uniformFee      ?? existing.uniformFee,
            TRANSPORT:    data.transportFee    ?? existing.transportFee,
        };

        const linkedFees = await prisma.fee.findMany({
            where: { feeStructureId: id, status: { not: 'PAID' } },
            select: { id: true, type: true, discountAmount: true }
        });

        if (linkedFees.length > 0) {
            await Promise.all(
                linkedFees.map((f) => {
                    const newAmount = typeAmountMap[f.type] ?? f.discountAmount ?? 0;
                    return prisma.fee.update({
                        where: { id: f.id },
                        data: {
                            originalAmount: newAmount,
                            amount: Math.max(0, newAmount - (f.discountAmount ?? 0))
                        }
                    });
                })
            );
        }

        revalidatePath('/fee-structure');
        revalidatePath('/fees');
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
