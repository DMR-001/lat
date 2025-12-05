import prisma from '@/lib/prisma';
import Link from 'next/link';
import { CreditCard, ArrowLeft } from 'lucide-react';

export default async function StudentFeesPage({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = await params;
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            fees: {
                orderBy: { dueDate: 'asc' }
            }
        }
    });

    if (!student) return <div>Student not found</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/fees/collect" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Fees for {student.firstName} {student.lastName}</h1>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
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
                        {student.fees.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No fees assigned to this student.
                                </td>
                            </tr>
                        ) : (
                            student.fees.map((fee) => (
                                <tr key={fee.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{fee.type}</td>
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
                                            <Link href={`/fees/${fee.id}/pay`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CreditCard size={16} />
                                                Pay
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
