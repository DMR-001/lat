'use server';

import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

export type PaymentFilter = 'today' | 'yesterday' | 'last3days' | 'last7days' | 'lastMonth' | 'custom';

export async function getPayments(filter: PaymentFilter, customStart?: Date, customEnd?: Date) {
    let startDate = new Date();
    let endDate = new Date();

    const today = new Date();

    switch (filter) {
        case 'today':
            startDate = startOfDay(today);
            endDate = endOfDay(today);
            break;
        case 'yesterday':
            const yesterday = subDays(today, 1);
            startDate = startOfDay(yesterday);
            endDate = endOfDay(yesterday);
            break;
        case 'last3days':
            startDate = startOfDay(subDays(today, 2)); // Today + 2 previous days
            endDate = endOfDay(today);
            break;
        case 'last7days':
            startDate = startOfDay(subDays(today, 6));
            endDate = endOfDay(today);
            break;
        case 'lastMonth':
            // Assuming "Last Month" means the previous calendar month
            const lastMonthDate = subDays(startOfMonth(today), 1);
            startDate = startOfMonth(lastMonthDate);
            endDate = endOfMonth(lastMonthDate);
            break;
        case 'custom':
            if (customStart && customEnd) {
                startDate = startOfDay(customStart);
                endDate = endOfDay(customEnd);
            }
            break;
    }

    const payments = await prisma.payment.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            fee: {
                include: {
                    student: {
                        include: {
                            class: true
                        }
                    }
                }
            }
        },
        orderBy: {
            date: 'desc'
        }
    });

    // Flatten data for easier consumption in UI and CSV
    return payments.map(p => ({
        id: p.id,
        receiptNo: p.receiptNo,
        date: p.date,
        amount: p.amount,
        method: p.method,
        studentName: `${p.fee.student.firstName} ${p.fee.student.lastName}`,
        admissionNo: p.fee.student.admissionNo,
        className: p.fee.student.class.name,
        grade: p.fee.student.class.grade,
        feeType: p.fee.type
    }));
}
