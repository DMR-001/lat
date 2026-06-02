'use client';

import { useState, useEffect } from 'react';
import { transferCredit } from '@/app/actions/fee';
import Link from 'next/link';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const Rs = '₹';
function fmt(n: number) { return n.toLocaleString('en-IN', { maximumFractionDigits: 2 }); }

export default function TransferCreditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [fee, setFee] = useState<any>(null);
    const [allFees, setAllFees] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);

    const [toId, setToId] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/fees/${id}`);
            if (!res.ok) { setFetching(false); return; }
            const data = await res.json();
            setFee(data);

            const sRes = await fetch(`/api/fees/student/${data.studentId}`);
            const sData = await sRes.json();
            setAllFees((sData?.fees || []).filter((f: any) => f.id !== id));
            setFetching(false);
        })();
    }, [id]);

    const maxTransfer = fee?.paidAmount ?? 0;
    const amtNum = parseFloat(amount) || 0;
    const selectedDest = allFees.find(f => f.id === toId) ?? null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!toId) { setError('Select a destination fee'); return; }
        if (amtNum <= 0) { setError('Enter a valid amount'); return; }
        if (amtNum > maxTransfer) { setError(`Cannot exceed paid amount (${Rs}${fmt(maxTransfer)})`); return; }
        setSaving(true);
        setError('');
        const result = await transferCredit(id, toId, amtNum, reason);
        if (result.success) {
            router.push('/fees');
        } else {
            setError(result.error || 'Transfer failed');
            setSaving(false);
        }
    }

    if (fetching) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading...</div>;
    if (!fee) return (
        <div style={{ padding: '2rem' }}>
            <p style={{ color: 'red' }}>Fee not found.</p>
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
                    <ArrowRightLeft size={26} color="#c2410c" /> Transfer Credit
                </h1>
            </div>

            {/* Student info */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--background)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Student</span><p style={{ fontWeight: 600, margin: '0.2rem 0 0' }}>{fee.student?.firstName} {fee.student?.lastName}</p></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Admission No</span><p style={{ fontWeight: 600, margin: '0.2rem 0 0' }}>{fee.student?.admissionNo}</p></div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Class</span><p style={{ fontWeight: 600, margin: '0.2rem 0 0' }}>{fee.student?.class?.name || '—'}</p></div>
                </div>
            </div>

            {/* Source fee */}
            <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>From (Source)</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{fee.type}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <span>Total: <strong>₹{fmt(fee.amount)}</strong></span>
                    <span>Paid: <strong style={{ color: '#16a34a' }}>₹{fmt(fee.paidAmount)}</strong></span>
                    <span>Available: <strong style={{ color: '#c2410c' }}>₹{fmt(maxTransfer)}</strong></span>
                </div>
            </div>

            {maxTransfer <= 0 ? (
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No paid amount available to transfer on this fee.
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>To (Destination Fee) *</label>
                        <select value={toId} onChange={e => { setToId(e.target.value); setError(''); }} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.9rem', background: 'white' }}>
                            <option value="">— Select fee —</option>
                            {allFees.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.type} — ₹{fmt(f.amount)} total, ₹{fmt(Math.max(0, f.amount - f.paidAmount))} due
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Amount to Transfer (₹) *</label>
                        <input
                            type="number" value={amount} onChange={e => setAmount(e.target.value)}
                            min="1" max={maxTransfer} step="0.01" required
                            placeholder={`Max: ₹${fmt(maxTransfer)}`}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Reason</label>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Parent returned uniform set, credit to tuition..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>

                    {/* Preview */}
                    {toId && amtNum > 0 && amtNum <= maxTransfer && selectedDest && (
                        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '0.625rem', padding: '1rem 1.25rem' }}>
                            <div style={{ fontWeight: 700, color: '#15803d', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Preview</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem' }}>
                                <span style={{ color: '#64748b' }}>{fee.type} paid becomes</span>
                                <strong>₹{fmt(fee.paidAmount - amtNum)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: '#64748b' }}>{selectedDest.type} paid becomes</span>
                                <strong style={{ color: '#15803d' }}>₹{fmt(selectedDest.paidAmount + amtNum)}</strong>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: '0.875rem 1rem', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Link href="/fees" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Cancel</Link>
                        <button type="submit" disabled={saving} className="btn" style={{ padding: '0.75rem 1.5rem', background: saving ? '#fdba74' : '#ea580c', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                            {saving ? 'Transferring...' : `Transfer ₹${fmt(amtNum)}`}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
