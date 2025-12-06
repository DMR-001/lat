import prisma from '@/lib/prisma';
import Link from 'next/link';
import Search from '@/components/Search';
import { Printer } from 'lucide-react';

import { Payment, Fee, Student } from '@prisma/client';

type PaymentWithDetails = Payment & {
    fee: Fee & {
        student: Student;
    };
};

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<{ query?: string, filter?: string, date?: string }> }) {
    const { query, filter, date } = await searchParams;

    let where: any = {};

    if (query) {
        where = {
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
        };
    } else {
        // Date Filtering Logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tonight = new Date(today);
        tonight.setHours(23, 59, 59, 999);

        if (filter === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayEnd = new Date(yesterday);
            yesterdayEnd.setHours(23, 59, 59, 999);
            where.date = { gte: yesterday, lte: yesterdayEnd };
        } else if (date) {
            const customDate = new Date(date);
            const customDateEnd = new Date(customDate);
            customDateEnd.setHours(23, 59, 59, 999);
            where.date = { gte: customDate, lte: customDateEnd };
        } else {
            // Default to Today if no specific filter
            where.date = { gte: today, lte: tonight };
        }
    }

    const payments = await prisma.payment.findMany({
        where,
        include: {
            fee: {
                include: {
                    student: {
                        include: {
                            class: true
                        }
                    }
                }
            }
        },
        orderBy: { date: 'desc' }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Receipts & Transactions</h1>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Search placeholder="Search by Receipt No, Admission No, Name, or Phone..." />

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Filter:</span>
                    <Link href="/receipts" className={`btn ${!filter && !date && !query ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Today</Link>
                    <Link href="/receipts?filter=yesterday" className={`btn ${filter === 'yesterday' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Yesterday</Link>
                    <form action="" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="date"
                            name="date"
                            defaultValue={date || ''}
                            style={{
                                padding: '0.35rem 0.8rem',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--border)',
                                fontSize: '0.875rem',
                                color: 'var(--text-main)',
                                fontFamily: 'inherit',
                                outline: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'var(--input-bg, white)'
                            }}
                        />
                        <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Go</button>
                    </form>
                </div>
            </div>

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
                                    No transactions found.
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
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {payment.fee.student.class?.name} {payment.fee.student.class?.section ? `(${payment.fee.student.class.section})` : ''}
                                        </div>
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
        </div>
    );
}
