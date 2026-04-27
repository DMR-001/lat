'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, CheckCircle, Clock, AlertCircle, Receipt, User, Phone, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

// ---- helpers ----
const Rs = '₹';
function fmt(n: number) { return n.toLocaleString('en-IN', { maximumFractionDigits: 2 }); }

function getInstallments(fee: any) {
    const isTuition = fee.type === 'TUITION';
    const n = isTuition ? Math.max(1, fee.feeStructure?.installments || 1) : 1;
    const total = fee.amount;
    const per = total / n;
    return Array.from({ length: n }, (_, i) => {
        const start = i * per;
        const end = i === n - 1 ? total : (i + 1) * per;
        const face = end - start;
        const paid = Math.max(0, Math.min((fee.paidAmount ?? 0) - start, face));
        const due = face - paid;
        return {
            index: i,
            label: n === 1 ? 'Full Payment' : `Installment ${i + 1} of ${n}`,
            face,
            paid,
            due,
            isPaid: due <= 0.01,
        };
    });
}

// ---- component ----
export default function CollectFeeStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = use(params);

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // payment modal state
    const [payFee, setPayFee] = useState<any>(null);
    const [payInstallments, setPayInstallments] = useState<number[]>([]);
    const [payMethod, setPayMethod] = useState('CASH');
    const [paying, setPaying] = useState(false);
    const [payResult, setPayResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const payingRef = useRef(false); // synchronous guard against double-submit

    // expanded history rows
    const [historyOpen, setHistoryOpen] = useState(false);

    async function load() {
        setLoading(true);
        const res = await fetch(`/api/fees/student/${studentId}`);
        const data = await res.json();
        setStudent(data);
        setLoading(false);
    }

    useEffect(() => { load(); }, [studentId]);

    function openPayModal(fee: any) {
        const insts = getInstallments(fee);
        setPayFee(fee);
        // pre-select first unpaid installment
        const first = insts.find(i => !i.isPaid);
        setPayInstallments(first ? [first.index] : []);
        setPayMethod('CASH');
        setPayResult(null);
    }

    function toggleInstallment(fee: any, idx: number) {
        const insts = getInstallments(fee);
        setPayInstallments(prev => {
            if (prev.includes(idx)) return prev.filter(i => i !== idx);
            return [...prev, idx];
        });
    }

    function getPayAmount() {
        if (!payFee) return 0;
        const insts = getInstallments(payFee);
        return insts.filter(i => payInstallments.includes(i.index) && !i.isPaid).reduce((s, i) => s + i.due, 0);
    }

    async function submitPayment() {
        const amount = getPayAmount();
        if (amount <= 0 || !payFee) return;
        if (payingRef.current) return; // block double-click synchronously
        payingRef.current = true;
        setPaying(true);
        setPayResult(null);
        const res = await fetch('/api/fees/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feeId: payFee.id, amount, method: payMethod }),
        });
        const data = await res.json();
        if (data.success) {
            setPayResult({ ok: true, msg: `Payment recorded. Receipt: ${data.receiptNo}` });
            await load();
            setTimeout(() => setPayFee(null), 1500);
        } else {
            setPayResult({ ok: false, msg: data.error || 'Payment failed' });
        }
        setPaying(false);
        payingRef.current = false;
    }

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
        </div>
    );

    if (!student) return <div style={{ padding: '2rem' }}>Student not found.</div>;

    const pendingFees = (student.fees || []).filter((f: any) => f.status !== 'PAID');
    const paidFees = (student.fees || []).filter((f: any) => f.status === 'PAID');
    const totalDue = (student.fees || []).reduce((s: number, f: any) => s + Math.max(0, f.amount - f.paidAmount), 0);
    const totalPaid = (student.fees || []).reduce((s: number, f: any) => s + f.paidAmount, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900 }}>
            {/* Back */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link href="/fees/collect" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>
                    <ArrowLeft size={18} /> Back to Search
                </Link>
            </div>

            {/* Student card */}
            <div className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                    {student.firstName?.[0]}{student.lastName?.[0]}
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '0.75rem 1.5rem' }}>
                    <InfoItem icon={<User size={14} />} label="Name" value={`${student.firstName} ${student.lastName}`} />
                    <InfoItem icon={<GraduationCap size={14} />} label="Class" value={`${student.class?.name ?? '-'}${student.class?.section ? ` (${student.class.section})` : ''}`} />
                    <InfoItem icon={null} label="Admission No" value={student.admissionNo ?? '-'} />
                    <InfoItem icon={<Phone size={14} />} label="Parent" value={student.parentName ?? '-'} />
                    <InfoItem icon={<Phone size={14} />} label="Phone" value={student.phone ?? '-'} />
                </div>
                {/* Summary chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 140 }}>
                    <SummaryChip label="Total Paid" value={`${Rs}${fmt(totalPaid)}`} color="var(--success)" />
                    <SummaryChip label="Total Due" value={`${Rs}${fmt(totalDue)}`} color={totalDue > 0 ? 'var(--error)' : 'var(--success)'} />
                </div>
            </div>

            {/* Pending fees */}
            <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} color="var(--warning)" /> Pending Fees ({pendingFees.length})
                </h2>
                {pendingFees.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                        All fees are paid! 🎉
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pendingFees.map((fee: any) => (
                            <FeeCard key={fee.id} fee={fee} onPay={() => openPayModal(fee)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Payment history */}
            {student.payments && student.payments.length > 0 && (
                <div>
                    <button
                        onClick={() => setHistoryOpen(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', padding: 0 }}
                    >
                        <Receipt size={16} color="var(--success)" />
                        Payment History ({student.payments.length})
                        {historyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {historyOpen && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Receipt No</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Fee Type</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Method</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.payments.map((p: any) => (
                                        <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.receiptNo}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{p.fee?.type ?? '-'}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{ padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.72rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                                                    {p.method}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>{Rs}{fmt(p.amount)}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <Link href={`/api/receipts/${p.id}/download`} target="_blank" style={{ color: 'var(--primary)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}>
                                                    Receipt
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Paid fees (collapsed) */}
            {paidFees.length > 0 && (
                <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="var(--success)" /> Paid Fees ({paidFees.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {paidFees.map((fee: any) => (
                            <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                <span style={{ fontWeight: 600 }}>{fee.type}</span>
                                <span style={{ color: 'var(--success)', fontWeight: 700 }}>{Rs}{fmt(fee.amount)} — Paid</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {payFee && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Collect Payment</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>{payFee.type} — {student.firstName} {student.lastName}</div>
                            </div>
                            <button onClick={() => setPayFee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94a3b8', lineHeight: 1 }}>×</button>
                        </div>

                        {/* Installment selector */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Select Installments</div>
                            {getInstallments(payFee).map(inst => (
                                <div
                                    key={inst.index}
                                    onClick={() => !inst.isPaid && toggleInstallment(payFee, inst.index)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.6rem 0.75rem', borderRadius: '0.5rem', marginBottom: '0.375rem',
                                        cursor: inst.isPaid ? 'default' : 'pointer',
                                        border: '1.5px solid',
                                        borderColor: inst.isPaid ? '#bbf7d0' : payInstallments.includes(inst.index) ? '#2563eb' : '#e2e8f0',
                                        background: inst.isPaid ? '#f0fdf4' : payInstallments.includes(inst.index) ? '#eff6ff' : '#f8fafc',
                                        opacity: inst.isPaid ? 0.8 : 1,
                                    }}
                                >
                                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: '2px solid', borderColor: inst.isPaid ? '#16a34a' : payInstallments.includes(inst.index) ? '#2563eb' : '#cbd5e1', background: (inst.isPaid || payInstallments.includes(inst.index)) ? (inst.isPaid ? '#16a34a' : '#2563eb') : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {(inst.isPaid || payInstallments.includes(inst.index)) && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                                    </div>
                                    <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{inst.label}</span>
                                    {inst.isPaid
                                        ? <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '0.25rem' }}>PAID</span>
                                        : <span style={{ fontSize: '0.85rem', fontWeight: 700, color: payInstallments.includes(inst.index) ? '#1d4ed8' : '#475569' }}>{Rs}{fmt(inst.due)}</span>
                                    }
                                </div>
                            ))}
                        </div>

                        {/* Method */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Payment Method</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['CASH', 'UPI', 'CARD', 'ONLINE'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setPayMethod(m)}
                                        style={{ padding: '0.4rem 0.9rem', borderRadius: '0.375rem', border: '1.5px solid', borderColor: payMethod === m ? '#2563eb' : '#e2e8f0', background: payMethod === m ? '#eff6ff' : '#f8fafc', color: payMethod === m ? '#1d4ed8' : '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderTop: '1.5px solid #f1f5f9', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 600, color: '#64748b' }}>Paying Now</span>
                            <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a' }}>{Rs}{fmt(getPayAmount())}</span>
                        </div>

                        {payResult && (
                            <div style={{ marginBottom: '0.875rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: payResult.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${payResult.ok ? '#bbf7d0' : '#fecaca'}`, color: payResult.ok ? '#15803d' : '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
                                {payResult.msg}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setPayFee(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Cancel
                            </button>
                            <button
                                onClick={submitPayment}
                                disabled={paying || getPayAmount() <= 0}
                                style={{ flex: 2, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: paying || getPayAmount() <= 0 ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, cursor: paying || getPayAmount() <= 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
                            >
                                {paying ? 'Processing...' : `Collect ${Rs}${fmt(getPayAmount())}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FeeCard({ fee, onPay }: { fee: any; onPay: () => void }) {
    const insts = getInstallments(fee);
    const hasMultiple = insts.length > 1;
    const due = fee.amount - fee.paidAmount;
    const hasDiscount = fee.discountAmount > 0;

    return (
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hasMultiple ? '0.75rem' : 0, flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{fee.type}</span>
                    {hasDiscount && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                            -{Rs}{fmt(fee.discountAmount)} discount
                        </span>
                    )}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Due: {new Date(fee.dueDate).toLocaleDateString('en-IN')}
                        {hasMultiple && ` · ${insts.filter(i => !i.isPaid).length} installment(s) pending`}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Outstanding</div>
                        <div style={{ fontWeight: 800, color: 'var(--error)', fontSize: '1rem' }}>{Rs}{fmt(due)}</div>
                    </div>
                    <button
                        onClick={onPay}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--primary, #2563eb)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                        <CreditCard size={15} /> Collect
                    </button>
                </div>
            </div>

            {/* Installment progress for tuition */}
            {hasMultiple && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {insts.map(inst => (
                        <div key={inst.index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', borderRadius: '0.375rem', background: inst.isPaid ? '#f0fdf4' : '#fafafa', border: `1px solid ${inst.isPaid ? '#bbf7d0' : '#f1f5f9'}`, fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600, color: inst.isPaid ? '#15803d' : '#475569' }}>{inst.label}</span>
                            {inst.isPaid
                                ? <span style={{ color: '#15803d', fontWeight: 700 }}>✓ Paid</span>
                                : <span style={{ color: 'var(--error)', fontWeight: 700 }}>{Rs}{fmt(inst.due)} due</span>
                            }
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {icon}{label}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{value}</div>
        </div>
    );
}

function SummaryChip({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            <div style={{ fontWeight: 800, fontSize: '0.975rem', color }}>{value}</div>
        </div>
    );
}

