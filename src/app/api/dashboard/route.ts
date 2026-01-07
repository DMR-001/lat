import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch stats
        const totalStudents = await prisma.student.count();

        const totalFees = await prisma.fee.aggregate({
            _sum: { amount: true }
        });

        const totalPaid = await prisma.fee.aggregate({
            _sum: { paidAmount: true }
        });

        const pendingFees = (totalFees._sum.amount || 0) - (totalPaid._sum.paidAmount || 0);

        const certificatesThisMonth = await prisma.certificate.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });

        // Recent payments
        const recentPayments = await prisma.payment.findMany({
            take: 5,
            orderBy: { date: 'desc' },
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
