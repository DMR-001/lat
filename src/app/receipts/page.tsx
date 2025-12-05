import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Search, Printer } from 'lucide-react';

import { Payment, Fee, Student } from '@prisma/client';

type PaymentWithDetails = Payment & {
    fee: Fee & {
        student: Student;
    };
};

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const { query } = await searchParams;

    let payments: PaymentWithDetails[] = [];
    if (query) {
        payments = await prisma.payment.findMany({
            where: {
                OR: [
                    {
                        fee: {
                            student: {
                                OR: [
                                    { admissionNo: { contains: query, mode: 'insensitive' } },
                                    { firstName: { contains: query, mode: 'insensitive' } },
                                    { lastName: { contains: query, mode: 'insensitive' } },
                                    { phone: { contains: query, mode: 'insensitive' } },
                                ]
                            }
                        }
                    },
                    { receiptNo: { contains: query, mode: 'insensitive' } }
                ]
            },
            include: {
                fee: {
                    include: {
                        student: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Receipts & Transactions</h1>

            <div className="card">
                <form style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            name="query"
                            defaultValue={query}
                            placeholder="Search by Receipt No, Admission No, Name, or Phone..."
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Search</button>
                </form>
            </div>

            {query && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Receipt No</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Date</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Student</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Fee Type</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Amount</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Method</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No transactions found for "{query}".
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{payment.receiptNo}</td>
                                        <td style={{ padding: '1rem' }}>{payment.date.toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500' }}>{payment.fee.student.firstName} {payment.fee.student.lastName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{payment.fee.student.admissionNo}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{payment.fee.type}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{payment.amount.toFixed(2)}</td>
                                        <td style={{ padding: '1rem' }}>{payment.method}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link href={`/receipts/${payment.id}`} target="_blank" className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', gap: '0.25rem' }}>
                                                <Printer size={16} />
                                                Print
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
