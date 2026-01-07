'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function generateCertificate(
    studentId: string,
    type: 'BONAFIDE' | 'STUDY_CERTIFICATE' | 'TRANSFER_CERTIFICATE',
    purpose?: string,
    remarks?: string,
    issuedBy?: string
) {
    try {
        // Get active academic year
        const activeYear = await prisma.academicYear.findFirst({
            where: { isActive: true }
        });

        if (!activeYear) {
            return { success: false, error: 'No active academic year found' };
        }

        // Generate certificate number: SPR/TYPE/YEAR/NUMBER
        // Get certificate type abbreviation
        const typeAbbrev = type === 'BONAFIDE' ? 'BON' :
            type === 'STUDY_CERTIFICATE' ? 'SC' : 'TC';

        const currentYear = new Date().getFullYear();

        // Get last certificate of this type for sequential numbering
        const lastCert = await prisma.certificate.findFirst({
            where: { type },
            orderBy: { createdAt: 'desc' }
        });

        let sequentialNum = 1;
        if (lastCert?.certificateNo) {
            // Extract the last number from format SPR/TYPE/YEAR/NUMBER
            const parts = lastCert.certificateNo.split('/');
            if (parts.length === 4) {
                sequentialNum = (parseInt(parts[3]) || 0) + 1;
            }
        }

        const certificateNo = `SPR/${typeAbbrev}/${currentYear}/${String(sequentialNum).padStart(4, '0')}`;

        // Create certificate
        const certificate = await prisma.certificate.create({
            data: {
                certificateNo,
                type,
                studentId,
                academicYearId: activeYear.id,
                purpose: purpose || null,
                remarks: remarks || null,
                issuedBy: issuedBy || null,
            },
            include: {
                student: {
                    include: {
                        class: true
                    }
                },
                academicYear: true
            }
        });

        revalidatePath('/certificates');
        return { success: true, certificate };
    } catch (error: any) {
        console.error('Certificate generation error:', error);
        return { success: false, error: error.message };
    }
}

export async function getCertificates(filters?: {
    studentId?: string;
    type?: string;
    academicYearId?: string;
}) {
    try {
        const where: any = {};

        if (filters?.studentId) where.studentId = filters.studentId;
        if (filters?.type) where.type = filters.type;
        if (filters?.academicYearId) where.academicYearId = filters.academicYearId;

        const certificates = await prisma.certificate.findMany({
            where,
            include: {
                student: {
                    include: {
                        class: true
                    }
                },
                academicYear: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, certificates };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCertificateById(id: string) {
    try {
        const certificate = await prisma.certificate.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        class: true
                    }
                },
                academicYear: true
            }
        });

        if (!certificate) {
            return { success: false, error: 'Certificate not found' };
        }

        return { success: true, certificate };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
