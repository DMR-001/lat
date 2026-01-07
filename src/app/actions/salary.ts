'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Create or update salary structure
export async function createSalaryStructure(data: {
    teacherId: string;
    basicSalary: number;
    allowances: number;
    deductions: number;
    effectiveFrom: Date;
}) {
    try {
        // Deactivate previous salary structures for this teacher
        await prisma.teacherSalary.updateMany({
            where: { teacherId: data.teacherId, isActive: true },
            data: { isActive: false, effectiveTo: new Date() }
        });

        const netSalary = data.basicSalary + data.allowances - data.deductions;

        const salary = await prisma.teacherSalary.create({
            data: {
                ...data,
                netSalary,
                isActive: true
            },
            include: {
                teacher: true
            }
        });

        revalidatePath('/management/salaries');
        return { success: true, salary };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Get all active salary structures
export async function getActiveSalaries() {
    try {
        const salaries = await prisma.teacherSalary.findMany({
            where: { isActive: true },
            include: {
                teacher: true,
                payments: {
                    where: { status: 'PENDING' },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, salaries };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Get salary by teacher ID
export async function getSalaryByTeacherId(teacherId: string) {
    try {
        const salary = await prisma.teacherSalary.findFirst({
            where: { teacherId, isActive: true },
            include: {
                teacher: true,
                payments: {
                    orderBy: [{ year: 'desc' }, { month: 'desc' }]
                }
            }
        });

        return { success: true, salary };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Generate monthly payments for all active teachers
export async function generateMonthlyPayments(month: number, year: number) {
    try {
        const activeSalaries = await prisma.teacherSalary.findMany({
            where: { isActive: true },
            include: { teacher: true }
        });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        const daysInMonth = endDate.getDate();

        const payments = [];
        for (const salary of activeSalaries) {
            // Check if payment already exists
            const existing = await prisma.salaryPayment.findUnique({
                where: {
                    salaryId_month_year: {
                        salaryId: salary.id,
                        month,
                        year
                    }
                }
            });

            if (!existing) {
                // FETCH SETTINGS
                const settings = await prisma.schoolSettings.findFirst();
                const penaltyCount = settings?.latePenaltyCount || 3;

                // Calculate leave deductions
                const leaves = await prisma.teacherAttendance.count({
                    where: {
                        teacherId: salary.teacherId,
                        date: {
                            gte: startDate,
                            lte: endDate
                        },
                        status: { in: ['ABSENT', 'UNPAID_LEAVE'] }
                    }
                });

                // Calculate Late Marks
                const lateMarks = await prisma.teacherAttendance.count({
                    where: {
                        teacherId: salary.teacherId,
                        date: {
                            gte: startDate,
                            lte: endDate
                        },
                        isLate: true
                    }
                });

                const penaltyDays = Math.floor(lateMarks / penaltyCount);
                const totalDeductionDays = leaves + penaltyDays;

                const perDaySalary = salary.basicSalary / 30; // Standard 30 days calculation
                const leaveDeduction = totalDeductionDays * perDaySalary;

                // Calculate final amount
                // Net Salary = (Basic + Allowances - Deductions) - Leave Deduction
                // Note: salary.netSalary already includes fixed deductions
                const finalAmount = Math.max(0, salary.netSalary - leaveDeduction);

                const payment = await prisma.salaryPayment.create({
                    data: {
                        salaryId: salary.id,
                        month,
                        year,
                        amount: salary.netSalary,
                        leaveDays: totalDeductionDays, // Includes late penalty days
                        leaveDeduction: leaveDeduction,
                        finalAmount: finalAmount,
                        status: 'PENDING',
                        remarks: penaltyDays > 0 ? `Includes ${penaltyDays} day(s) deduction for ${lateMarks} late marks` : undefined
                    },
                    include: {
                        salary: {
                            include: { teacher: true }
                        }
                    }
                });
                payments.push(payment);
            }
        }

        revalidatePath('/management/salaries/payments');
        return { success: true, payments, count: payments.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Get payments with filters
export async function getPayments(filters?: {
    month?: number;
    year?: number;
    status?: string;
    teacherId?: string;
}) {
    try {
        const where: any = {};

        if (filters?.month) where.month = filters.month;
        if (filters?.year) where.year = filters.year;
        if (filters?.status) where.status = filters.status;
        if (filters?.teacherId) {
            where.salary = { teacherId: filters.teacherId };
        }

        const payments = await prisma.salaryPayment.findMany({
            where,
            include: {
                salary: {
                    include: { teacher: true }
                }
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }]
        });

        return { success: true, payments };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Mark payment as paid
export async function markPaymentAsPaid(
    paymentId: string,
    data: {
        paymentDate: Date;
        paymentMethod: string;
        referenceNo?: string;
        remarks?: string;
    }
) {
    try {
        const payment = await prisma.salaryPayment.update({
            where: { id: paymentId },
            data: {
                ...data,
                status: 'PAID'
            },
            include: {
                salary: {
                    include: { teacher: true }
                }
            }
        });

        revalidatePath('/management/salaries/payments');
        return { success: true, payment };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Bulk mark as paid
export async function bulkMarkAsPaid(
    paymentIds: string[],
    data: {
        paymentDate: Date;
        paymentMethod: string;
        referenceNo?: string;
        remarks?: string;
    }
) {
    try {
        const result = await prisma.salaryPayment.updateMany({
            where: { id: { in: paymentIds } },
            data: {
                ...data,
                status: 'PAID'
            }
        });

        revalidatePath('/management/salaries/payments');
        return { success: true, count: result.count };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Get payment statistics
export async function getPaymentStats(month?: number, year?: number) {
    try {
        const where: any = {};
        if (month) where.month = month;
        if (year) where.year = year;

        const [total, paid, pending] = await Promise.all([
            prisma.salaryPayment.aggregate({
                where,
                _sum: { amount: true },
                _count: true
            }),
            prisma.salaryPayment.aggregate({
                where: { ...where, status: 'PAID' },
                _sum: { amount: true },
                _count: true
            }),
            prisma.salaryPayment.aggregate({
                where: { ...where, status: 'PENDING' },
                _sum: { amount: true },
                _count: true
            })
        ]);

        return {
            success: true,
            stats: {
                total: { amount: total._sum.amount || 0, count: total._count },
                paid: { amount: paid._sum.amount || 0, count: paid._count },
                pending: { amount: pending._sum.amount || 0, count: pending._count }
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
