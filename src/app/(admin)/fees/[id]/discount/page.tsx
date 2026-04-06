'use client';

import { useState, useEffect } from 'react';
import { applyDiscount } from '@/app/actions/fee';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

async function getFeeDetails(id: string) {
    const res = await fetch(`/api/fees/${id}`);
    if (!res.ok) return null;
    return res.json();
}

export default function DiscountPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [fee, setFee] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountReason, setDiscountReason] = useState('');

    useEffect(() => {
        loadFee();
    }, [id]);

    const loadFee = async () => {
        setFetching(true);
        const data = await getFeeDetails(id);
        if (data) {
            setFee(data);
            setDiscountAmount(data.discountAmount ?? 0);
            setDiscountReason(data.discountReason ?? '');
        }
        setFetching(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await applyDiscount(id, discountAmount, discountReason);
        if (result.success) {
            router.push('/fees');
        } else {
            setError(result.error || 'Failed to apply discount');
            setLoading(false);
        }
    };

    if (fetching) {
        return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>;
    }

    if (!fee) {
        return (
            <div style={{ padding: '2rem' }}>
                <p style={{ color: 'red' }}>Fee record not found.</p>
                <Link href="/fees" className="btn btn-secondary">Back to Fees</Link>
            </div>
        );
    }

    const base = fee.originalAmount > 0 ? fee.originalAmount : fee.amount;
    const previewAmount = Math.max(0, base - discountAmount);

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/fees" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} />
                    Back to Fees
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={28} /> Apply Discount
                </h1>
            </div>

            {/* Student & Fee Info */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--background)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Student</span>
                        <p style={{ fontWeight: '600', margin: '0.2rem 0 0' }}>{fee.student?.firstName} {fee.student?.lastName}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Admission No</span>
                        <p style={{ fontWeight: '600', margin: '0.2rem 0 0' }}>{fee.student?.admissionNo}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Class</span>
                        <p style={{ fontWeight: '600', margin: '0.2rem 0 0' }}>{fee.student?.class?.name || '—'}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Fee Type</span>
                        <p style={{ fontWeight: '600', margin: '0.2rem 0 0' }}>{fee.type}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Original Amount</span>
                        <p style={{ fontWeight: '600', margin: '0.2rem 0 0' }}>₹{base.toFixed(2)}</p>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Already Paid</span>
                        <p style={{ fontWeight: '600', margin: '0.2rem 0 0', color: 'var(--success)' }}>₹{fee.paidAmount.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Discount Amount (₹) <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="input"
                        min="0"
                        max={base}
                        step="0.01"
                        required
                        style={{ width: '100%' }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        Max discount: ₹{base.toFixed(2)}
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Reason for Discount
                    </label>
                    <input
                        type="text"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="input"
                        placeholder="e.g., Sibling discount, Merit scholarship, Economic hardship"
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Live Preview */}
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', border: '2px solid var(--primary)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        <span>Original Fee</span>
                        <span>₹{base.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--error)' }}>
                        <span>Discount</span>
                        <span>- ₹{discountAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.5rem 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.1rem' }}>
                        <span>Fee After Discount</span>
                        <span style={{ color: 'var(--primary)' }}>₹{previewAmount.toFixed(2)}</span>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Link href="/fees" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        {loading ? 'Applying...' : 'Apply Discount'}
                    </button>
                </div>
            </form>
        </div>
    );
}
