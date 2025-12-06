import prisma from '@/lib/prisma';
import Link from 'next/link';
import { CreditCard, CheckCircle, AlertCircle, Download } from 'lucide-react';

export default async function FeesPage() {
    const fees = await prisma.fee.findMany({
        include: {
            student: true
        },
        orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const collectedThisMonth = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
            date: {
                gte: startOfMonth,
                lte: endOfMonth
            }
        }
    });

    const pendingFees = await prisma.fee.findMany({
        where: { status: { not: 'PAID' } }
    });

    const totalPending = pendingFees.reduce((acc, fee) => acc + (fee.amount - fee.paidAmount), 0);

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

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Student</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Type</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Amount</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Paid</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Due</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Due Date</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No fee records found. Assign fees to students to get started.
                                </td>
                            </tr>
                        ) : (
                            fees.map((fee) => (
                                <tr key={fee.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{fee.student.firstName} {fee.student.lastName}</td>
                                    <td style={{ padding: '1rem' }}>{fee.type}</td>
                                    <td style={{ padding: '1rem' }}>₹{fee.amount.toFixed(2)}</td>
                                    <td style={{ padding: '1rem', color: 'var(--success)' }}>₹{fee.paidAmount.toFixed(2)}</td>
                                    <td style={{ padding: '1rem', color: 'var(--error)' }}>₹{(fee.amount - fee.paidAmount).toFixed(2)}</td>
                                    <td style={{ padding: '1rem' }}>{fee.dueDate.toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.75rem',
                                            backgroundColor: fee.status === 'PAID' ? 'var(--success)' : 'var(--warning)',
                                            color: 'white'
                                        }}>
                                            {fee.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {fee.status !== 'PAID' && (
                                            <Link href={`/fees/${fee.id}/pay`} style={{ color: 'var(--primary)', fontWeight: '500' }}>
                                                Record Payment
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
