'use client';

import { useState } from 'react';
import { generatePaymentLink } from '@/app/actions/paymentLink';
import { Link2, Copy, Check, X } from 'lucide-react';

export default function GeneratePaymentLink({ studentId, totalDue }: { studentId: string; totalDue: number }) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(totalDue > 0 ? String(Math.round(totalDue)) : '');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pay.sproutschool.edu.in';

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
        setLoading(true);
        setError('');
        const result = await generatePaymentLink(studentId, amt, note);
        if (result.success && result.token) {
            setGeneratedUrl(`${appUrl}/pay?token=${result.token}`);
        } else {
            setError(result.error || 'Failed to generate link');
        }
        setLoading(false);
    }

    function handleCopy() {
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleClose() {
        setOpen(false);
        setGeneratedUrl('');
        setError('');
        setAmount(totalDue > 0 ? String(Math.round(totalDue)) : '');
        setNote('');
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
                <Link2 size={16} /> Generate Payment Link
            </button>

            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Link2 size={18} color="#2563eb" /> Generate Payment Link
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                                    Share with parent to pay online
                                </div>
                            </div>
                            <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94a3b8', lineHeight: 1 }}>
                                <X size={18} />
                            </button>
                        </div>

                        {!generatedUrl ? (
                            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                                        Amount (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        min="1"
                                        step="1"
                                        required
                                        autoFocus
                                        style={{ width: '100%', padding: '0.7rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, boxSizing: 'border-box', outline: 'none' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
                                        Note <span style={{ fontWeight: 400, color: '#94a3b8' }}>(shown to parent)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="e.g., Term 2 Fee, Transport Fee..."
                                        style={{ width: '100%', padding: '0.7rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#0369a1' }}>
                                    Link expires in 7 days. Parent can pay partial or full amount.
                                </div>

                                {error && (
                                    <div style={{ padding: '0.6rem 0.875rem', borderRadius: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="button" onClick={handleClose} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading} style={{ flex: 2, padding: '0.7rem', borderRadius: '0.5rem', border: 'none', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                        {loading ? 'Generating...' : <><Link2 size={15} /> Generate Link</>}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '0.625rem', padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>Payment Link Ready</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#166534' }}>₹{parseFloat(amount).toLocaleString('en-IN')}</div>
                                    {note && <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.2rem' }}>{note}</div>}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        readOnly
                                        value={generatedUrl}
                                        style={{ flex: 1, padding: '0.6rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#475569', background: '#f8fafc', outline: 'none', fontFamily: 'monospace' }}
                                        onClick={e => (e.target as HTMLInputElement).select()}
                                    />
                                    <button
                                        onClick={handleCopy}
                                        style={{ padding: '0.6rem 0.875rem', borderRadius: '0.5rem', border: '1.5px solid', borderColor: copied ? '#86efac' : '#e2e8f0', background: copied ? '#f0fdf4' : '#f8fafc', color: copied ? '#16a34a' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                    >
                                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                                    </button>
                                </div>

                                <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                                    Send this link via WhatsApp or SMS to the parent. Expires in 7 days.
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button onClick={handleClose} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                                        Close
                                    </button>
                                    <button
                                        onClick={() => { setGeneratedUrl(''); setAmount(totalDue > 0 ? String(Math.round(totalDue)) : ''); setNote(''); }}
                                        style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
                                    >
                                        New Link
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
