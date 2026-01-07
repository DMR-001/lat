'use client';

import { useState, useEffect } from 'react';
import { getPayments, bulkMarkAsPaid, getPaymentStats } from '@/app/actions/salary';
import Link from 'next/link';
import { ArrowLeft, Check, Filter } from 'lucide-react';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const currentDate = new Date();
    const [filters, setFilters] = useState({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        status: 'PENDING'
    });

    const [paymentData, setPaymentData] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        referenceNo: '',
        remarks: ''
    });

    useEffect(() => {
        loadPayments();
        loadStats();
    }, [filters]);

    const loadPayments = async () => {
        const result = await getPayments(filters);
        if (result.success) setPayments(result.payments || []);
    };

    const loadStats = async () => {
        const result = await getPaymentStats(filters.month, filters.year);
        if (result.success) setStats(result.stats);
    };

    const handleBulkPay = async () => {
        if (selectedIds.length === 0) return;

        setLoading(true);
        const result = await bulkMarkAsPaid(selectedIds, {
            ...paymentData,
            paymentDate: new Date(paymentData.paymentDate)
        });

        if (result.success) {
            setSelectedIds([]);
            await loadPayments();
            await loadStats();
        }

        setLoading(false);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === payments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(payments.map(p => p.id));
        }
    };

    const selectedTotal = payments
        .filter(p => selectedIds.includes(p.id))
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <Link href="/management/salaries" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} />
                    Back to Salaries
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>Payment Processing</h1>
            </div>

            {/* Stats */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{stats.total.amount.toFixed(2)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{stats.total.count} payments</div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Paid</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>₹{stats.paid.amount.toFixed(2)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{stats.paid.count} payments</div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Pending</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>₹{stats.pending.amount.toFixed(2)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{stats.pending.count} payments</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <Filter size={20} />
                    <span style={{ fontWeight: '600' }}>Filters</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                        <label>Month</label>
                        <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}>
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Year</label>
                        <input
                            type="number"
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label>Status</label>
                        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                            <option value="">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Payment Form */}
            {selectedIds.length > 0 && (
                <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--primary-light)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>{selectedIds.length} payment(s) selected</strong> - Total: ₹{selectedTotal.toFixed(2)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label>Payment Date</label>
                            <input
                                type="date"
                                value={paymentData.paymentDate}
                                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Method</label>
                            <select
                                value={paymentData.paymentMethod}
                                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                            >
                                <option value="CASH">Cash</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="CHEQUE">Cheque</option>
                            </select>
                        </div>
                        <div>
                            <label>Reference No</label>
                            <input
                                type="text"
                                value={paymentData.referenceNo}
                                onChange={(e) => setPaymentData({ ...paymentData, referenceNo: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label>Remarks</label>
                            <input
                                type="text"
                                value={paymentData.remarks}
                                onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleBulkPay}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        <Check size={18} style={{ marginRight: '0.5rem' }} />
                        {loading ? 'Processing...' : 'Mark as Paid'}
                    </button>
                </div>
            )}

            {/* Payments Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === payments.length && payments.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Teacher</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Month</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Basic + Allowances</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Leaves</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Deduction</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Net Payout</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No payments found for selected filters
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                <tr key={payment.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(payment.id)}
                                            onChange={() => toggleSelect(payment.id)}
                                            disabled={payment.status === 'PAID'}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '600' }}>
                                        {payment.salary.teacher.firstName} {payment.salary.teacher.lastName}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {months[payment.month - 1]} {payment.year}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        ₹{payment.amount.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {payment.leaveDays > 0 ? (
                                            <span style={{ color: 'var(--error)', fontWeight: '500' }}>{payment.leaveDays} days</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)' }}>0</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--error)' }}>
                                        {payment.leaveDeduction > 0 ? `-₹${payment.leaveDeduction.toFixed(2)}` : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                        ₹{payment.finalAmount ? payment.finalAmount.toFixed(2) : payment.amount.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            backgroundColor: payment.status === 'PAID' ? 'var(--success)' : 'var(--warning)',
                                            color: 'white'
                                        }}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
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
