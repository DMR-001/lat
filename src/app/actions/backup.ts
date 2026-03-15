'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

export async function createBackup(createdBy?: string) {
    try {
        await ensureBackupDir();

        // Fetch all data from all tables
        const [
            branches,
            academicYears,
            students,
            studentEnrollments,
            teachers,
            classes,
            fees,
            payments,
            feeStructures,
            attendance,
            teacherAttendance,
            teacherSalaries,
            salaryPayments,
            certificates,
            users,
            schoolSettings
        ] = await Promise.all([
            prisma.branch.findMany(),
            prisma.academicYear.findMany(),
            prisma.student.findMany(),
            prisma.studentEnrollment.findMany(),
            prisma.teacher.findMany(),
            prisma.class.findMany(),
            prisma.fee.findMany(),
            prisma.payment.findMany(),
            prisma.feeStructure.findMany(),
            prisma.attendance.findMany(),
            prisma.teacherAttendance.findMany(),
            prisma.teacherSalary.findMany(),
            prisma.salaryPayment.findMany(),
            prisma.certificate.findMany(),
            prisma.user.findMany({ select: { id: true, username: true, role: true, defaultBranchId: true, createdAt: true, updatedAt: true } }), // Exclude password
            prisma.schoolSettings.findMany()
        ]);

        const backupData = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            data: {
                branches,
                academicYears,
                students,
                studentEnrollments,
                teachers,
                classes,
                fees,
                payments,
                feeStructures,
                attendance,
                teacherAttendance,
                teacherSalaries,
                salaryPayments,
                certificates,
                users,
                schoolSettings
            },
            stats: {
                branches: branches.length,
                academicYears: academicYears.length,
                students: students.length,
                teachers: teachers.length,
                classes: classes.length,
                fees: fees.length,
                payments: payments.length,
                certificates: certificates.length
            }
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(BACKUP_DIR, filename);

        const jsonContent = JSON.stringify(backupData, null, 2);
        await fs.writeFile(filepath, jsonContent, 'utf-8');

        const stats = await fs.stat(filepath);

        // Save backup record
        await prisma.backup.create({
            data: {
                filename,
                size: stats.size,
                createdBy
            }
        });

        revalidatePath('/settings');
        return { 
            success: true, 
            filename,
            size: stats.size,
            stats: backupData.stats
        };
    } catch (error: any) {
        console.error('Backup error:', error);
        return { success: false, error: error.message };
    }
}

export async function getBackups() {
    try {
        const backups = await prisma.backup.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, backups };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function downloadBackup(filename: string) {
    try {
        const filepath = path.join(BACKUP_DIR, filename);
        const content = await fs.readFile(filepath, 'utf-8');
        return { success: true, content, filename };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBackup(id: string, filename: string) {
    try {
        // Delete file
        const filepath = path.join(BACKUP_DIR, filename);
        try {
            await fs.unlink(filepath);
        } catch {
            // File may already be deleted
        }

        // Delete record
        await prisma.backup.delete({ where: { id } });
        
        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function restoreBackup(jsonContent: string) {
    try {
        const backupData = JSON.parse(jsonContent);
        
        if (!backupData.version || !backupData.data) {
            return { success: false, error: 'Invalid backup file format' };
        }

        // Warning: This is a destructive operation
        // Delete all existing data and restore from backup
        // In production, you might want to be more careful here

        const { data } = backupData;

        // Use a transaction for atomic restore
        await prisma.$transaction(async (tx) => {
            // Clear existing data in reverse dependency order
            await tx.salaryPayment.deleteMany();
            await tx.teacherSalary.deleteMany();
            await tx.teacherAttendance.deleteMany();
            await tx.payment.deleteMany();
            await tx.fee.deleteMany();
            await tx.attendance.deleteMany();
            await tx.certificate.deleteMany();
            await tx.studentEnrollment.deleteMany();
            await tx.feeStructure.deleteMany();
            await tx.student.deleteMany();
            await tx.class.deleteMany();
            await tx.teacher.deleteMany();
            await tx.academicYear.deleteMany();
            await tx.branch.deleteMany();

            // Restore data in dependency order
            if (data.branches?.length) {
                await tx.branch.createMany({ data: data.branches });
            }
            if (data.academicYears?.length) {
                await tx.academicYear.createMany({ data: data.academicYears });
            }
            if (data.teachers?.length) {
                await tx.teacher.createMany({ data: data.teachers });
            }
            if (data.classes?.length) {
                await tx.class.createMany({ data: data.classes });
            }
            if (data.students?.length) {
                await tx.student.createMany({ data: data.students });
            }
            if (data.studentEnrollments?.length) {
                await tx.studentEnrollment.createMany({ data: data.studentEnrollments });
            }
            if (data.feeStructures?.length) {
                await tx.feeStructure.createMany({ data: data.feeStructures });
            }
            if (data.fees?.length) {
                await tx.fee.createMany({ data: data.fees });
            }
            if (data.payments?.length) {
                await tx.payment.createMany({ data: data.payments });
            }
            if (data.attendance?.length) {
                await tx.attendance.createMany({ data: data.attendance });
            }
            if (data.certificates?.length) {
                await tx.certificate.createMany({ data: data.certificates });
            }
            if (data.teacherAttendance?.length) {
                await tx.teacherAttendance.createMany({ data: data.teacherAttendance });
            }
            if (data.teacherSalaries?.length) {
                await tx.teacherSalary.createMany({ data: data.teacherSalaries });
            }
            if (data.salaryPayments?.length) {
                await tx.salaryPayment.createMany({ data: data.salaryPayments });
            }
            if (data.schoolSettings?.length) {
                await tx.schoolSettings.deleteMany();
                await tx.schoolSettings.createMany({ data: data.schoolSettings });
            }
        });

        revalidatePath('/');
        return { 
            success: true, 
            message: 'Backup restored successfully',
            stats: backupData.stats
        };
    } catch (error: any) {
        console.error('Restore error:', error);
        return { success: false, error: error.message };
    }
}
