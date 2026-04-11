import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = await params;

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            class: { select: { name: true, section: true } },
            fees: {
                orderBy: { dueDate: 'asc' },
                include: {
                    feeStructure: { select: { installments: true } },
                    payments: { orderBy: { date: 'desc' } }
                }
            }
        }
    });

    if (!student) return NextResponse.json(null, { status: 404 });

    // Flatten all payments across all fees, tagged with fee type
    const payments = student.fees
        .flatMap(f => f.payments.map(p => ({ ...p, fee: { type: f.type } })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ ...student, payments });
}
