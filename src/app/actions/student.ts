'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Papa from 'papaparse';

type ImportResult = {
    success: boolean;
    message?: string;
    error?: string;
    count?: number;
};

function parseDate(dateString: string | undefined): Date {
    if (!dateString) return new Date();

    // Try standard Date constructor
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;

    // Try DD/MM/YYYY or DD-MM-YYYY (e.g. 25-12-2023)
    const parts = dateString.split(/[-/]/);
    if (parts.length === 3) {
        // Assume DD-MM-YYYY
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }
    }

    return new Date(); // Fallback to now
}

export async function importStudents(prevState: any, formData: FormData): Promise<ImportResult> {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file uploaded' };
        }

        const text = await file.text();
        const { data, errors } = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
        });

        if (errors.length > 0) {
            return { success: false, error: `CSV Parsing Error: ${errors[0].message}` };
        }

        let count = 0;
        const rows = data as any[];

        for (const row of rows) {
            if (!row.fullName || !row.className) continue; // Skip invalid rows

            // Parse fullName into firstName and lastName
            const nameParts = row.fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // 1. Find or Create Class
            let classRecord = await prisma.class.findFirst({
                where: { name: { equals: row.className, mode: 'insensitive' } }
            });

            if (!classRecord) {
                // If creating a class during import, what about section?
                // For now, we assume the CSV className is the Name. Section is null.
                classRecord = await prisma.class.create({
                    data: {
                        name: row.className,
                        section: null
                    }
                });
            }

            // 2. Generate Admission Number (or use provided)
            let admissionNo = row.admissionNo;
            if (!admissionNo) {
                const lastStudent = await prisma.student.findFirst({ orderBy: { createdAt: 'desc' } });
                const lastNum = lastStudent?.admissionNo ? parseInt(lastStudent.admissionNo.replace('SPR', '')) || 0 : 0;
                admissionNo = `SPR${lastNum + 1 + count}`;
            }

            // 3. Create Student
            const existing = await prisma.student.findUnique({ where: { admissionNo } });
            if (!existing) {
                const student = await prisma.student.create({
                    data: {
                        firstName,
                        lastName,
                        admissionNo,
                        dob: parseDate(row.dob),
                        gender: row.gender || 'Not Specified',
                        address: row.address || null,
                        phone: row.phone,
                        parentName: row.parentName,
                        classId: classRecord.id,
                        email: row.email
                    }
                });

                // 3.5. Create Enrollment Record (for active academic year)
                const activeYear = await prisma.academicYear.findFirst({
                    where: { isActive: true }
                });

                if (activeYear) {
                    await prisma.studentEnrollment.create({
                        data: {
                            studentId: student.id,
                            classId: classRecord.id,
                            academicYearId: activeYear.id,
                            status: 'ACTIVE'
                        }
                    });
                }

                // 4. Create Fee Record (if provided)
                if (row.feeAmount && !isNaN(parseFloat(row.feeAmount))) {
                    const amount = parseFloat(row.feeAmount);
                    const paidAmount = row.feePaid ? parseFloat(row.feePaid) : 0;
                    const status = paidAmount >= amount ? 'PAID' : 'PENDING';

                    const fee = await prisma.fee.create({
                        data: {
                            studentId: student.id,
                            amount: amount,
                            paidAmount: paidAmount,
                            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                            type: 'TUITION',
                            status: status,
                            academicYearId: activeYear?.id
                        }
                    });

                    // 5. Create Payment Record (if paid amount > 0)
                    if (paidAmount > 0) {
                        const currentYear = new Date().getFullYear();
                        const receiptNo = `SPR/MIG/${currentYear}/${admissionNo}`; // MIG for Migration

                        const existingPayment = await prisma.payment.findUnique({ where: { receiptNo } });

                        if (!existingPayment) {
                            await prisma.payment.create({
                                data: {
                                    feeId: fee.id,
                                    amount: paidAmount,
                                    method: 'CASH',
                                    receiptNo: receiptNo,
                                    date: new Date()
                                }
                            });
                        }
                    }
                }
                count++;
            }
        }

        revalidatePath('/students');
        return { success: true, message: 'Import completed successfully', count };

    } catch (error: any) {
        console.error('Import Error:', error);
        return { success: false, error: error.message || 'Failed to import students' };
    }
}

export async function addStudent(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const dob = new Date(formData.get('dob') as string);
    const gender = formData.get('gender') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const parentName = formData.get('parentName') as string;

    const classId = formData.get('classId') as string;

    // Ensure classId is provided
    if (!classId) {
        throw new Error("Class ID is required");
    }

    // Generate Admission Number
    const lastStudent = await prisma.student.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    let nextNumber = 1;
    if (lastStudent && lastStudent.admissionNo) {
        const lastNumber = parseInt(lastStudent.admissionNo.replace('SPR', ''));
        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    const admissionNo = `SPR${nextNumber}`;

    await prisma.student.create({
        data: {
            firstName,
            lastName,
            email: email || null,
            admissionNo,
            dob,
            gender,
            address,
            phone,
            parentName,
            classId,
        },
    });

    revalidatePath('/students');
    redirect('/students');
}

export async function updateStudent(formData: FormData) {
    const id = formData.get('id') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const dob = new Date(formData.get('dob') as string);
    const gender = formData.get('gender') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const parentName = formData.get('parentName') as string;
    const classId = formData.get('classId') as string;

    await prisma.student.update({
        where: { id },
        data: {
            firstName,
            lastName,
            email: email || null,
            dob,
            gender,
            address,
            phone,
            parentName,
            classId,
        },
    });

    revalidatePath(`/students/${id}`);
    revalidatePath('/students');
    redirect(`/students/${id}`);
}

export async function deleteStudent(id: string) {
    await prisma.$transaction(async (tx) => {
        // 1. Get all fees for the student to delete their payments first
        const fees = await tx.fee.findMany({
            where: { studentId: id },
            select: { id: true }
        });

        const feeIds = fees.map(f => f.id);

        // 2. Delete payments associated with those fees
        if (feeIds.length > 0) {
            await tx.payment.deleteMany({
                where: { feeId: { in: feeIds } }
            });

            // 3. Delete the fees
            await tx.fee.deleteMany({
                where: { studentId: id } // or { id: { in: feeIds } }
            });
        }

        // 4. Delete attendance records
        await tx.attendance.deleteMany({
            where: { studentId: id }
        });

        // 5. Delete the student
        await tx.student.delete({
            where: { id }
        });
    });

    revalidatePath('/students');
    redirect('/students');
}

export async function searchStudents(query: string) {
    if (!query || query.length < 2) return [];

    const students = await prisma.student.findMany({
        where: {
            OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { admissionNo: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } }
            ]
        },
        take: 10,
        orderBy: { firstName: 'asc' }
    });

    return students;
}

// Student Promotion Functions
export async function promoteStudents(
    studentIds: string[],
    targetClassId: string,
    academicYearId: string
) {
    try {
        // Update each student's class
        await prisma.student.updateMany({
            where: { id: { in: studentIds } },
            data: { classId: targetClassId }
        });

        // Create enrollment records for the new academic year
        const enrollmentData = studentIds.map(studentId => ({
            studentId,
            classId: targetClassId,
            academicYearId,
            status: 'ACTIVE'
        }));

        await prisma.studentEnrollment.createMany({
            data: enrollmentData,
            skipDuplicates: true
        });

        // Mark previous year enrollments as PROMOTED
        await prisma.studentEnrollment.updateMany({
            where: {
                studentId: { in: studentIds },
                academicYearId: { not: academicYearId },
                status: 'ACTIVE'
            },
            data: { status: 'PROMOTED' }
        });

        revalidatePath('/students');
        revalidatePath('/students/promote');

        return {
            success: true,
            message: `Successfully promoted ${studentIds.length} students`
        };
    } catch (error: any) {
        console.error('Promotion error:', error);
        return { success: false, error: error.message };
    }
}

export async function getStudentsByClass(classId: string) {
    try {
        const students = await prisma.student.findMany({
            where: { classId },
            include: {
                class: true
            },
            orderBy: { firstName: 'asc' }
        });

        return { success: true, students };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
