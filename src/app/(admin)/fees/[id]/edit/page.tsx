'use client';

import { useState, useEffect } from 'react';
import { editFee } from '@/app/actions/fee';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const FEE_TYPES = ['REGISTRATION', 'TUITION', 'SPORTS', 'BOOKS', 'UNIFORM', 'TRANSPORT', 'ADMISSION', 'EXAM', 'LATE', 'ANNUAL', 'APPLICATION'];

async function getFeeDetails(id: string) {
    const res = await fetch(`/api/fees/${id}`);
    if (!res.ok) return null;
    return res.json();
}

export default function EditFeePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [fee, setFee] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [type, setType] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        (async () => {
            const data = await getFeeDetails(id);
            if (data) {
                setFee(data);
                setAmount(String(data.amount));
                setDueDate(new Date(data.dueDate).toISOString().slice(0, 10));
                setType(data.type);
            }
            setFetching(false);
        })();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await editFee(id, { amount: parseFloat(amount), dueDate, type, reason });
        if (result.success) {
            router.push('/fees');
        } else {
            setError(result.error || 'Failed to save changes');
            setLoading(false);
        }
    };

    if (fetching) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>;
    if (!fee) return (
        <div style={{ padding: '2rem' }}>
            <p style={{ color: 'red' }}>Fee record not found.</p>
            <Link href="/fees" className="btn btn-secondary">Back to Fees</Link>
        </div>
    );

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/fees" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} /> Back to Fees
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Pencil size={26} /> Edit Fee
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
                        <span style={{ color: 'var(--text-secondary)' }}>Paid So Far</span>
                        <p style={{ fontWeight: '600', margin: '0.2rem 0 0', color: 'var(--success)' }}>₹{fee.paidAmount.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Fee Type <span style={{ color: 'red' }}>*</span>
                    </label>
                    <select
                        value={type}
                        onChange={e => setType(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9rem', background: 'white' }}
                    >
                        {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Fee Amount (₹) <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="input"
                        min="0"
                        step="0.01"
                        required
                        style={{ width: '100%' }}
                    />
                    {parseFloat(amount) < fee.paidAmount && (
                        <p style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '0.4rem' }}>
                            Warning: new amount is less than amount already paid (₹{fee.paidAmount.toFixed(2)}). Fee status will be updated to PAID.
                        </p>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Due Date <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="input"
                        required
                        style={{ width: '100%' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Reason for Edit
                    </label>
                    <input
                        type="text"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="input"
                        placeholder="e.g., Correction, Management decision..."
                        style={{ width: '100%' }}
                    />
                </div>

                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                    <Link href="/fees" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
