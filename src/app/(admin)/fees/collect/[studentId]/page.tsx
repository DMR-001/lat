'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Receipt, User, Phone, GraduationCap, Download, Pencil, Trash2, ArrowRightLeft, QrCode, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Toast from '@/components/Toast';
import { editPayment, deletePayment, transferCredit } from '@/app/actions/fee';

const Rs = '₹';
function fmt(n: number) { return n.toLocaleString('en-IN', { maximumFractionDigits: 2 }); }

// ── Transfer Modal ──────────────────────────────────────────────────────────
function TransferModal({ sourceFee, allFees, onClose, onSuccess }: {
    sourceFee: any;
    allFees: any[];
    onClose: () => void;
    onSuccess: (msg: string) => void;
}) {
    const [amount, setAmount] = useState('');
    const [toId, setToId] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const destOptions = allFees.filter(f => f.id !== sourceFee.id);
    const maxTransfer = sourceFee.paidAmount;
    const selectedDest = destOptions.find(f => f.id === toId) ?? null;
    const amtNum = parseFloat(amount) || 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!toId) { setError('Select a destination fee'); return; }
        if (amtNum <= 0) { setError('Enter a valid amount'); return; }
        setSaving(true);
        setError('');
        const result = await transferCredit(sourceFee.id, toId, amtNum, reason);
        if (result.success) {
            onSuccess(`${Rs}${fmt(amtNum)} transferred. Receipt: ${result.receiptNo}`);
        } else {
            setError(result.error || 'Transfer failed');
            setSaving(false);
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ArrowRightLeft size={17} color="#c2410c" /> Transfer Credit
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>Move paid amount from one fee to another</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94a3b8', lineHeight: 1 }}>×</button>
                </div>

                <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '0.625rem', padding: '0.875rem 1rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>From (Source)</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Fee</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Total: {Rs}{fmt(sourceFee.amount)} &nbsp;·&nbsp; Paid: <span style={{ color: '#16a34a', fontWeight: 700 }}>{Rs}{fmt(sourceFee.paidAmount)}</span> &nbsp;·&nbsp; Available: <span style={{ color: '#c2410c', fontWeight: 700 }}>{Rs}{fmt(maxTransfer)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>To (Destination Fee) *</div>
                        <select value={toId} onChange={e => { setToId(e.target.value); setError(''); }} required style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', background: 'white' }}>
                            <option value="">— Select fee —</option>
                            {destOptions.map(f => (
                                <option key={f.id} value={f.id}>
                                    Fee — {Rs}{fmt(f.amount)} total, {Rs}{fmt(Math.max(0, f.amount - f.paidAmount))} due
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Amount to Transfer (₹) *</div>
                        <input
                            type="number" value={amount} onChange={e => setAmount(e.target.value)}
                            min="1" max={maxTransfer} step="0.01" required
                            placeholder={`Max: ${Rs}${fmt(maxTransfer)}`}
                            style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                        />
                        {amtNum > maxTransfer && (
                            <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.3rem', fontWeight: 600 }}>Exceeds available paid amount ({Rs}{fmt(maxTransfer)})</p>
                        )}
                    </div>

                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Reason</div>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Partial refund, credit transfer..." style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                    </div>

                    {toId && amtNum > 0 && amtNum <= maxTransfer && selectedDest && (
                        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '0.625rem', padding: '0.875rem 1rem', fontSize: '0.82rem' }}>
                            <div style={{ fontWeight: 700, color: '#15803d', marginBottom: '0.5rem' }}>Preview</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ color: '#64748b' }}>Source paid becomes</span>
                                <span style={{ fontWeight: 700 }}>{Rs}{fmt(sourceFee.paidAmount - amtNum)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Destination paid becomes</span>
                                <span style={{ fontWeight: 700, color: '#15803d' }}>{Rs}{fmt(selectedDest.paidAmount + amtNum)}</span>
                            </div>
                        </div>
                    )}

                    {error && <div style={{ padding: '0.6rem 0.875rem', borderRadius: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>{error}</div>}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                        <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.7rem', borderRadius: '0.5rem', border: 'none', background: saving ? '#fdba74' : '#ea580c', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                            {saving ? 'Transferring...' : `Transfer ${Rs}${fmt(amtNum)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── UPI Payment Modal (popup-based) ──────────────────────────────────────────
function UpiQrModal({ fee, studentId, onClose, onSuccess }: {
    fee: any;
    studentId: string;
    onClose: () => void;
    onSuccess: (msg: string) => void;
}) {
    const due = fee.amount - fee.paidAmount;
    const [payAmt, setPayAmt] = useState(String(Math.round(due)));
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'waiting' | 'success' | 'failed'>('idle');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const popupRef = useRef<Window | null>(null);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
        };
    }, []);

    async function openUpiPayment() {
        const amt = parseFloat(payAmt);
        if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
        if (amt > due) { setError(`Amount cannot exceed outstanding ₹${fmt(due)}`); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/hdfc/upi-qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, feeId: fee.id, amount: amt }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Failed to create payment'); setLoading(false); return; }

            // Open HDFC payment page in popup — parent stays on collect page
            const popup = window.open(data.paymentLink, 'upi_payment', 'width=1100,height=750,top=50,left=100');
            popupRef.current = popup;
            setOrderId(data.orderId);
            setStatus('waiting');
            setLoading(false);
            startPolling(data.orderId, data.amount);
        } catch {
            setError('Failed to initiate UPI payment. Please try again.');
            setLoading(false);
        }
    }

    function startPolling(oid: string, confirmedAmt: number) {
        const deadline = Date.now() + 15 * 60 * 1000;
        pollRef.current = setInterval(async () => {
            if (Date.now() > deadline) {
                clearInterval(pollRef.current!);
                setStatus('failed');
                return;
            }
            try {
                const res = await fetch('/api/hdfc/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: oid }),
                });
                const data = await res.json();
                if (data.status === 'CHARGED') {
                    clearInterval(pollRef.current!);
                    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
                    setStatus('success');
                    const recordRes = await fetch('/api/fees/collect', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ feeId: fee.id, amount: confirmedAmt, method: 'UPI', hdfcOrderId: oid }),
                    });
                    const recordData = await recordRes.json();
                    onSuccess(recordData.success
                        ? `Payment of ₹${confirmedAmt.toLocaleString('en-IN')} confirmed. Receipt: ${recordData.receiptNo}`
                        : `Payment confirmed. Order: ${oid}`
                    );
                } else if (['FAILED', 'CANCELLED', 'AUTHORIZATION_FAILED', 'AUTHENTICATION_FAILED'].includes(data.status)) {
                    clearInterval(pollRef.current!);
                    setStatus('failed');
                }
            } catch { /* keep polling on network error */ }
        }, 3000);
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <QrCode size={18} color="#6366f1" /> Pay Here
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94a3b8', lineHeight: 1 }}>×</button>
                </div>

                {status === 'idle' && (
                    <>
                        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={payAmt}
                                onChange={e => setPayAmt(e.target.value)}
                                min="1"
                                max={due}
                                step="1"
                                style={{ width: '100%', padding: '0.7rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, boxSizing: 'border-box', outline: 'none' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Outstanding: ₹{fmt(due)}</p>
                        </div>
                        {error && (
                            <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                                {error}
                            </div>
                        )}
                        <button onClick={openUpiPayment} disabled={loading} style={{ width: '100%', padding: '0.85rem', borderRadius: '0.625rem', border: 'none', background: loading ? '#c4b5fd' : '#6366f1', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Opening...</> : <><QrCode size={18} /> Pay Here</>}
                        </button>
                        <button onClick={onClose} style={{ marginTop: '0.75rem', width: '100%', padding: '0.7rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                            Cancel
                        </button>
                    </>
                )}

                {status === 'waiting' && (
                    <div style={{ padding: '1rem 0' }}>
                        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#6366f1', margin: '0 auto' }} />
                        <div style={{ marginTop: '1rem', fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Waiting for payment...</div>
                        <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.35rem' }}>Auto-confirms once payment is done</div>
                        <button onClick={onClose} style={{ marginTop: '1.5rem', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>
                            Cancel
                        </button>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ padding: '1rem 0' }}>
                        <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto' }} />
                        <div style={{ marginTop: '0.75rem', fontWeight: 700, color: '#166534', fontSize: '1rem' }}>Payment Confirmed!</div>
                        <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.25rem' }}>Recording receipt...</div>
                    </div>
                )}

                {status === 'failed' && (
                    <div style={{ padding: '1rem 0' }}>
                        <XCircle size={48} color="#dc2626" style={{ margin: '0 auto' }} />
                        <div style={{ marginTop: '0.75rem', fontWeight: 700, color: '#dc2626', fontSize: '1rem' }}>Payment Failed or Cancelled</div>
                        <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.25rem' }}>Please try again.</div>
                        <button onClick={() => { setStatus('idle'); setOrderId(''); }} style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CollectFeeStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
    const { studentId } = use(params);

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // collect modal
    const [payFee, setPayFee] = useState<any>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState('CASH');
    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);
    const payingRef = useRef(false);

    // edit payment modal
    const [editPmt, setEditPmt] = useState<any>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editMethod, setEditMethod] = useState('CASH');
    const [editReason, setEditReason] = useState('');
    const [editError, setEditError] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    // delete confirmation
    const [deletePmt, setDeletePmt] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    // transfer modal
    const [transferFee, setTransferFee] = useState<any>(null);

    // UPI QR modal
    const [upiQrFee, setUpiQrFee] = useState<any>(null);

    const [toast, setToast] = useState<string | null>(null);

    async function load(silent = false) {
        if (!silent) setLoading(true);
        const res = await fetch(`/api/fees/student/${studentId}`);
        const data = await res.json();
        setStudent(data);
        if (!silent) setLoading(false);
    }

    useEffect(() => { load(); }, [studentId]);

    function openPayModal(fee: any) {
        const due = fee.amount - fee.paidAmount;
        setPayFee(fee);
        setPayAmount(String(Math.round(due)));
        setPayMethod('CASH');
        setPayError(null);
    }

    async function submitPayment() {
        const amount = parseFloat(payAmount);
        if (!amount || amount <= 0 || !payFee || payingRef.current) return;
        payingRef.current = true;
        setPaying(true);
        setPayError(null);
        const feeId = payFee.id;
        const res = await fetch('/api/fees/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feeId, amount, method: payMethod }),
        });
        const data = await res.json();
        if (data.success) {
            setPayFee(null);
            await load(true);
            setToast(`Payment collected. Receipt: ${data.receiptNo}`);
        } else {
            setPayError(data.error || 'Payment failed');
        }
        setPaying(false);
        payingRef.current = false;
    }

    function openEditPayment(p: any) {
        setEditPmt(p);
        setEditAmount(String(p.amount));
        setEditMethod(p.method);
        setEditReason('');
        setEditError('');
    }

    async function submitEditPayment(e: React.FormEvent) {
        e.preventDefault();
        if (!editPmt) return;
        const pmtId = editPmt.id;
        setEditSaving(true);
        setEditError('');
        const result = await editPayment(pmtId, { amount: parseFloat(editAmount), method: editMethod, reason: editReason });
        if (result.success) {
            setEditPmt(null);
            await load(true);
            setToast('Payment updated successfully');
        } else {
            setEditError(result.error || 'Failed to update payment');
        }
        setEditSaving(false);
    }

    async function confirmDeletePayment() {
        if (!deletePmt) return;
        const pmtId = deletePmt.id;
        setDeleting(true);
        const result = await deletePayment(pmtId);
        if (result.success) {
            setDeletePmt(null);
            await load(true);
            setToast('Payment deleted successfully');
        }
        setDeleting(false);
    }

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
        </div>
    );

    if (!student) return <div style={{ padding: '2rem' }}>Student not found.</div>;

    const pendingFees = (student.fees || []).filter((f: any) => f.status !== 'PAID');
    const paidFees   = (student.fees || []).filter((f: any) => f.status === 'PAID');
    const totalDue   = (student.fees || []).reduce((s: number, f: any) => s + Math.max(0, f.amount - f.paidAmount), 0);
    const totalPaid  = (student.fees || []).reduce((s: number, f: any) => s + f.paidAmount, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200 }}>
            {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}

            <div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 140 }}>
                    <SummaryChip label="Total Paid" value={`${Rs}${fmt(totalPaid)}`} color="var(--success)" />
                    <SummaryChip label="Total Due" value={`${Rs}${fmt(totalDue)}`} color={totalDue > 0 ? 'var(--error)' : 'var(--success)'} />
                </div>
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0, alignItems: 'start' }}>

                {/* LEFT — Fees */}
                <div style={{ paddingRight: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Pending */}
                    <div>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} color="var(--warning)" /> Pending Fees ({pendingFees.length})
                        </h2>
                        {pendingFees.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>All fees are paid!</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {pendingFees.map((fee: any) => {
                                    const due = fee.amount - fee.paidAmount;
                                    return (
                                        <div key={fee.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                                                    {Rs}{fmt(fee.amount)}
                                                    {fee.paidAmount > 0 && (
                                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                                                            ({Rs}{fmt(fee.paidAmount)} paid)
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                                    Due: {new Date(fee.dueDate).toLocaleDateString('en-IN')}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ textAlign: 'right', marginRight: '0.25rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Outstanding</div>
                                                    <div style={{ fontWeight: 800, color: 'var(--error)', fontSize: '1rem' }}>{Rs}{fmt(due)}</div>
                                                </div>
                                                {fee.paidAmount > 0 && (
                                                    <button onClick={() => setTransferFee(fee)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.7rem', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '0.5rem', color: '#c2410c', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                                                        <ArrowRightLeft size={13} /> Transfer
                                                    </button>
                                                )}
                                                <button onClick={() => setUpiQrFee(fee)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.75rem', background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: '0.5rem', color: '#6d28d9', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                    <QrCode size={14} /> Pay Here
                                                </button>
                                                <button onClick={() => openPayModal(fee)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--primary, #2563eb)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                                                    <CreditCard size={15} /> Collect
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Paid */}
                    {paidFees.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={16} color="var(--success)" /> Paid Fees ({paidFees.length})
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {paidFees.map((fee: any) => (
                                    <div key={fee.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                        <div>
                                            <span style={{ fontWeight: 700, color: '#166534' }}>{Rs}{fmt(fee.amount)}</span>
                                            <span style={{ marginLeft: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>— Paid</span>
                                        </div>
                                        <button onClick={() => setTransferFee(fee)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '0.375rem', color: '#c2410c', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
                                            <ArrowRightLeft size={12} /> Transfer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ background: 'var(--border)', width: '1px', alignSelf: 'stretch', minHeight: 200 }} />

                {/* RIGHT — Payment History */}
                <div style={{ paddingLeft: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Receipt size={16} color="var(--success)" /> Payment History ({student.payments?.length ?? 0})
                        </h2>
                        {student.payments?.length > 0 && (
                            <Link href={`/api/receipts/combined/${studentId}/download`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: '#2563eb', color: 'white', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
                                <Download size={13} /> Combined Receipt
                            </Link>
                        )}
                    </div>
                    {(!student.payments || student.payments.length === 0) ? (
                        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem', fontSize: '0.875rem' }}>
                            No payments recorded yet.
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                                    <tr>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Receipt No</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'left' }}>Method</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.payments.map((p: any) => (
                                        <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.receiptNo}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{ padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.72rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}>{p.method}</span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>{Rs}{fmt(p.amount)}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <Link href={`/api/receipts/${p.id}/download`} target="_blank" style={{ color: 'var(--primary)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}>Receipt</Link>
                                                    <button onClick={() => openEditPayment(p)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '0.1rem', display: 'flex', alignItems: 'center' }}>
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button onClick={() => setDeletePmt(p)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.1rem', display: 'flex', alignItems: 'center' }}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Collect Modal */}
            {payFee && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Collect Payment</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>{student.firstName} {student.lastName}</div>
                            </div>
                            <button onClick={() => { setPayFee(null); setPayError(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94a3b8', lineHeight: 1 }}>×</button>
                        </div>

                        {/* Fee summary */}
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ color: '#64748b' }}>Total Fee</span>
                                <span style={{ fontWeight: 600 }}>{Rs}{fmt(payFee.amount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ color: '#64748b' }}>Paid So Far</span>
                                <span style={{ fontWeight: 600, color: '#16a34a' }}>{Rs}{fmt(payFee.paidAmount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Outstanding</span>
                                <span style={{ fontWeight: 800, color: '#dc2626' }}>{Rs}{fmt(payFee.amount - payFee.paidAmount)}</span>
                            </div>
                        </div>

                        {/* Amount */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Amount Paying (₹)</div>
                            <input
                                type="number"
                                value={payAmount}
                                onChange={e => setPayAmount(e.target.value)}
                                min="1"
                                max={payFee.amount - payFee.paidAmount}
                                step="1"
                                autoFocus
                                style={{ width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #2563eb', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a', boxSizing: 'border-box', outline: 'none' }}
                            />
                        </div>

                        {/* Method */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Payment Method</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['CASH', 'UPI', 'CARD', 'ONLINE'].map(m => (
                                    <button key={m} onClick={() => setPayMethod(m)} style={{ padding: '0.4rem 0.9rem', borderRadius: '0.375rem', border: '1.5px solid', borderColor: payMethod === m ? '#2563eb' : '#e2e8f0', background: payMethod === m ? '#eff6ff' : '#f8fafc', color: payMethod === m ? '#1d4ed8' : '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {payError && (
                            <div style={{ marginBottom: '0.875rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>{payError}</div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => { setPayFee(null); setPayError(null); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                            <button onClick={submitPayment} disabled={paying || !parseFloat(payAmount) || parseFloat(payAmount) <= 0} style={{ flex: 2, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: paying ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                                {paying ? 'Processing...' : `Collect ${Rs}${fmt(parseFloat(payAmount) || 0)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Payment Modal */}
            {editPmt && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Pencil size={16} color="#7c3aed" /> Edit Payment</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>Receipt: {editPmt.receiptNo}</div>
                            </div>
                            <button onClick={() => setEditPmt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94a3b8', lineHeight: 1 }}>×</button>
                        </div>
                        <form onSubmit={submitEditPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Amount (₹)</div>
                                <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} min="0.01" step="0.01" required style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Payment Method</div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {['CASH', 'UPI', 'CARD', 'ONLINE'].map(m => (
                                        <button key={m} type="button" onClick={() => setEditMethod(m)} style={{ padding: '0.35rem 0.8rem', borderRadius: '0.375rem', border: '1.5px solid', borderColor: editMethod === m ? '#7c3aed' : '#e2e8f0', background: editMethod === m ? '#f5f3ff' : '#f8fafc', color: editMethod === m ? '#7c3aed' : '#475569', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>{m}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Reason for Edit</div>
                                <input type="text" value={editReason} onChange={e => setEditReason(e.target.value)} placeholder="e.g., Correction, wrong amount entered..." style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
                            </div>
                            {editError && <div style={{ padding: '0.6rem 0.875rem', borderRadius: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>{editError}</div>}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setEditPmt(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                                <button type="submit" disabled={editSaving} style={{ flex: 2, padding: '0.7rem', borderRadius: '0.5rem', border: 'none', background: editSaving ? '#c4b5fd' : '#7c3aed', color: '#fff', fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                                    {editSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deletePmt && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626' }}>
                            <Trash2 size={18} /> Delete Payment
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.25rem' }}>Are you sure you want to delete this payment?</p>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                            <div><strong>Receipt:</strong> {deletePmt.receiptNo}</div>
                            <div><strong>Amount:</strong> {Rs}{fmt(deletePmt.amount)}</div>
                            <div><strong>Method:</strong> {deletePmt.method}</div>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: '1.25rem', fontWeight: 600 }}>This will update the fee balance accordingly. This cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeletePmt(null)} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                            <button onClick={confirmDeletePayment} disabled={deleting} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: 'none', background: deleting ? '#fca5a5' : '#dc2626', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPI QR Modal */}
            {upiQrFee && (
                <UpiQrModal
                    fee={upiQrFee}
                    studentId={studentId}
                    onClose={() => setUpiQrFee(null)}
                    onSuccess={async (msg) => {
                        setUpiQrFee(null);
                        await load(true);
                        setToast(msg);
                    }}
                />
            )}

            {/* Transfer Modal */}
            {transferFee && (
                <TransferModal
                    sourceFee={transferFee}
                    allFees={student.fees || []}
                    onClose={() => setTransferFee(null)}
                    onSuccess={async (msg) => {
                        setTransferFee(null);
                        await load(true);
                        setToast(msg);
                    }}
                />
            )}
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>{icon}{label}</div>
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
