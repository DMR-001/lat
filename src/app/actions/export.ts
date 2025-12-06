'use server';

import prisma from '@/lib/prisma';

export async function getAllFeesByClass(classId: string) {
    const students = await prisma.student.findMany({
        where: {
            class: {
                id: classId
            }
        },
        include: {
            fees: true
        }
    });

    // Flatten the data for CSV
    const rows = students.flatMap(student =>
        student.fees.map(fee => ({
            admissionNo: student.admissionNo,
            studentName: `${student.firstName} ${student.lastName}`,
            feeType: fee.type,
            amount: fee.amount,
            paid: fee.paidAmount,
            due: fee.amount - fee.paidAmount,
            dueDate: fee.dueDate.toISOString().split('T')[0]
        }))
    );

    return rows;
}
