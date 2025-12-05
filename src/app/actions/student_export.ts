'use server';

import prisma from '@/lib/prisma';

export async function getStudentsByClass(grade: string) {
    const students = await prisma.student.findMany({
        where: {
            class: {
                grade: grade
            }
        },
        include: {
            class: true
        },
        orderBy: {
            firstName: 'asc'
        }
    });

    // Flatten the data for CSV
    const rows = students.map(student => ({
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        dob: student.dob.toISOString().split('T')[0],
        className: student.class.name,
        grade: student.class.grade,
        parentName: student.parentName || '',
        phone: student.phone || '',
        email: student.email || '',
        address: student.address || ''
    }));

    return rows;
}
