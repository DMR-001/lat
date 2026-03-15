import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        // Get filter context from cookies
        const cookieStore = await cookies();
        const branchId = cookieStore.get('selectedBranchId')?.value;
        const academicYearId = cookieStore.get('selectedAcademicYearId')?.value;

        // Build filters
        const studentFilter = branchId ? { branchId } : {};
        const feeFilter: any = {};
        if (academicYearId) feeFilter.academicYearId = academicYearId;
        if (branchId) feeFilter.student = { branchId };

        // Fetch stats with filters
        const totalStudents = await prisma.student.count({
            where: studentFilter
        });

        const totalFees = await prisma.fee.aggregate({
            _sum: { amount: true },
            where: feeFilter
        });

        const totalPaid = await prisma.fee.aggregate({
            _sum: { paidAmount: true },
            where: feeFilter
        });

        const pendingFees = (totalFees._sum.amount || 0) - (totalPaid._sum.paidAmount || 0);

        const certFilter: any = {
            createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
        };
        if (academicYearId) certFilter.academicYearId = academicYearId;
        if (branchId) certFilter.student = { branchId };

        const certificatesThisMonth = await prisma.certificate.count({
            where: certFilter
        });

        // Recent payments with filters
        const paymentFilter: any = {};
        if (branchId) paymentFilter.fee = { student: { branchId } };
        if (academicYearId) paymentFilter.fee = { ...paymentFilter.fee, academicYearId };

        const recentPayments = await prisma.payment.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            where: paymentFilter,
            include: {
                fee: {
                    include: {
                        student: true
                    }
                }
            }
        });

        return NextResponse.json({
            stats: {
                totalStudents,
                feesCollected: totalPaid._sum.paidAmount || 0,
                pendingFees,
                certificatesThisMonth
            },
            recentPayments
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
