import prisma from '@/lib/prisma';
import Link from 'next/link';
import { CreditCard, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { getFilterContext } from '@/lib/filter-context';
import FeesTreeView from './FeesTreeView';

export default async function FeesPage() {
    const { branchId, academicYearId } = await getFilterContext();

    const feeWhere: any = {};
    if (academicYearId) feeWhere.academicYearId = academicYearId;
    if (branchId) feeWhere.student = { branchId };

    const fees = await prisma.fee.findMany({
        where: feeWhere,
        include: {
            student: {
                include: { class: true }
            }
        },
        orderBy: { dueDate: 'asc' }
    });

    // Stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const paymentWhere: any = { date: { gte: startOfMonth, lte: endOfMonth } };
    if (branchId) paymentWhere.fee = { student: { branchId } };
    if (academicYearId) paymentWhere.fee = { ...paymentWhere.fee, academicYearId };

    const collectedThisMonth = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: paymentWhere
    });

    const pendingFees = await prisma.fee.findMany({
        where: { status: { not: 'PAID' }, ...feeWhere }
    });
    const totalPending = pendingFees.reduce((acc, fee) => acc + (fee.amount - fee.paidAmount), 0);

    // Group fees by student
    const groupMap = new Map<string, { student: any; fees: any[] }>();
    for (const fee of fees) {
        const sid = fee.student.id;
        if (!groupMap.has(sid)) groupMap.set(sid, { student: fee.student, fees: [] });
        groupMap.get(sid)!.fees.push({
            id: fee.id,
            type: fee.type,
            amount: fee.amount,
            originalAmount: fee.originalAmount,
            discountAmount: fee.discountAmount,
            discountReason: fee.discountReason,
            paidAmount: fee.paidAmount,
            dueDate: fee.dueDate.toISOString(),
            status: fee.status,
        });
    }
    const studentGroups = Array.from(groupMap.values());

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Fees Management</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/fees/export" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={20} />
                        Export
                    </Link>
                    <Link href="/fees/assign" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CreditCard size={20} />
                        Assign Fee
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--success)', color: 'white' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Collected This Month</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{(collectedThisMonth._sum.amount || 0).toFixed(2)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--warning)', color: 'white' }}>
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pending Fees</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{totalPending.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <FeesTreeView studentGroups={studentGroups} />
        </div>
    );
}
