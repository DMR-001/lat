'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    await prisma.student.delete({
        where: { id }
    });

    revalidatePath('/students');
    redirect('/students');
}
