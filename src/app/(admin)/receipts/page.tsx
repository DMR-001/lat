import prisma from '@/lib/prisma';
import Link from 'next/link';
import Search from '@/components/Search';
import { Printer } from 'lucide-react';
import { getFilterContext } from '@/lib/filter-context';

import { Payment, Fee, Student } from '@prisma/client';

type PaymentWithDetails = Payment & {
    fee: Fee & {
        student: Student;
    };
};

export default async function ReceiptsPage({ searchParams }: { searchParams: Promise<{ query?: string, filter?: string, date?: string }> }) {
    const { query, filter, date } = await searchParams;
    const { branchId } = await getFilterContext();

    let where: any = {};

    // Filter by branch
    if (branchId) {
        where.fee = { student: { branchId } };
    }

    if (query) {
        where = {
            ...where,
            OR: [
                {
                    fee: {
                        student: {
                            ...(branchId ? { branchId } : {}),
                            OR: [
                                { admissionNo: { contains: query, mode: 'insensitive' } },
                                { firstName: { contains: query, mode: 'insensitive' } },
                                { lastName: { contains: query, mode: 'insensitive' } },
                                { phone: { contains: query, mode: 'insensitive' } },
                            ]
                        }
                    }
                },
                { receiptNo: { contains: query, mode: 'insensitive' }, ...(branchId ? { fee: { student: { branchId } } } : {}) }
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
                <table>
                    <thead>
                        <tr>
                            <th>Receipt No</th>
                            <th>Date</th>
                            <th>Student</th>
                            <th>Fee Type</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem' }}>
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.82rem' }}>{payment.receiptNo}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{payment.date.toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{payment.fee.student.firstName} {payment.fee.student.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                            {payment.fee.student.admissionNo} &middot; {payment.fee.student.class?.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                                            {payment.fee.type}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: '700', color: 'var(--success)' }}>₹{payment.amount.toFixed(2)}</td>
                                    <td>
                                        <span className={`badge badge-${payment.method.toLowerCase()}`}>
                                            {payment.method}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/receipts/${payment.id}`} target="_blank" className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                                            <Printer size={14} />
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
