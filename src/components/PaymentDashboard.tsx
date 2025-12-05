'use client';

import { useState, useEffect } from 'react';
import { getPayments, PaymentFilter } from '@/app/actions/payment';
import { Download, Filter } from 'lucide-react';

export default function PaymentDashboard() {
    const [filter, setFilter] = useState<PaymentFilter>('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, [filter, customStart, customEnd]);

    const fetchPayments = async () => {
        if (filter === 'custom' && (!customStart || !customEnd)) return;

        setLoading(true);
        try {
            const start = customStart ? new Date(customStart) : undefined;
            const end = customEnd ? new Date(customEnd) : undefined;
            const data = await getPayments(filter, start, end);
            setPayments(data);
        } catch (error) {
            console.error("Failed to fetch payments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (payments.length === 0) return;

        const headers = ['Receipt No', 'Date', 'Student Name', 'Admission No', 'Class', 'Fee Type', 'Method', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...payments.map(p => [
                p.receiptNo,
                new Date(p.date).toLocaleDateString(),
                `"${p.studentName}"`,
                p.admissionNo,
                p.className,
                p.feeType,
                p.method,
                p.amount
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `payments_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filters: { label: string, value: PaymentFilter }[] = [
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'Last 3 Days', value: 'last3days' },
        { label: 'Last 7 Days', value: 'last7days' },
        { label: 'Last Month', value: 'lastMonth' },
        { label: 'Custom', value: 'custom' },
    ];

    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={20} />
                    Payment Reports
                </h2>
                <button
                    onClick={handleExport}
                    className="btn btn-primary"
                    disabled={payments.length === 0}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {filters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`btn ${filter === f.value ? 'btn-primary' : ''}`}
                        style={{
                            border: filter === f.value ? 'none' : '1px solid var(--border)',
                            backgroundColor: filter === f.value ? 'var(--primary)' : 'transparent',
                            color: filter === f.value ? 'white' : 'var(--text-main)'
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {filter === 'custom' && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}
                    />
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '0.75rem' }}>Receipt No</th>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Student</th>
                            <th style={{ padding: '0.75rem' }}>Class</th>
                            <th style={{ padding: '0.75rem' }}>Type</th>
                            <th style={{ padding: '0.75rem' }}>Method</th>
                            <th style={{ padding: '0.75rem' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td>
                            </tr>
                        ) : payments.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No payments found for this period.</td>
                            </tr>
                        ) : (
                            payments.map(payment => (
                                <tr key={payment.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{payment.receiptNo}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{new Date(payment.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                                        <div>{payment.studentName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{payment.admissionNo}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{payment.className}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{payment.feeType}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{payment.method}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>₹{payment.amount.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
