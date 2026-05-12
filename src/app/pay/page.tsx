'use client';

import { useState, useEffect, useRef } from 'react';
import { searchStudentsByPhonePublic, getBranchesPublic, getStudentFeesPublic, processPublicPayment } from '@/app/actions/public';
import { Search, CreditCard, Check, Loader2, Download, Phone, ChevronRight, Building2, ShieldCheck, XCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import './pay.css';

const FEE_LABELS: Record<string, string> = {
    TUITION: 'Tuition Fee',
    REGISTRATION: 'Registration Fee',
    TRANSPORT: 'Transport Fee',
    SPORTS: 'Sports Fee',
    BOOKS: 'Books & Stationery',
    UNIFORM: 'Uniform Fee',
    EXAM: 'Exam Fee',
    MISCELLANEOUS: 'Miscellaneous',
};
const feeLabel = (type: string) => FEE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function PublicPaymentPage() {
    // step: 'branch' | 'search' | 'otp' | 'select' | 'confirm' | 'pay' | 'success'
    const [step, setStep] = useState<'branch' | 'search' | 'otp' | 'select' | 'confirm' | 'pay' | 'success' | 'verifying' | 'failed'>('branch');
    const [failedMessage, setFailedMessage] = useState('');
    const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);

    const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string; code: string } | null>(null);
    const [phone, setPhone] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [noResult, setNoResult] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isLoadingFees, setIsLoadingFees] = useState(false);
    const [feeDetails, setFeeDetails] = useState<{ fees: any[]; totalDue: number } | null>(null);

    const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
    const [selectedInstallments, setSelectedInstallments] = useState<Record<string, number[]>>({});
    const [customAmounts, setCustomAmounts] = useState<Record<string, Record<number, string>>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionSuccess, setTransactionSuccess] = useState<any>(null);
    const [payError, setPayError] = useState('');

    // OTP state
    const [otpValue, setOtpValue] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleOtpBoxChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const chars = otpValue.split('');
        chars[index] = digit;
        const next = chars.join('');
        setOtpValue(next);
        setOtpError('');
        if (digit && index < 5) otpRefs.current[index + 1]?.focus();
        if (next.length === 6 && next.replace(/\s/g,'').length === 6) handleVerifyOtpValue(next);
    };

    const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (otpValue[index]) {
                const chars = otpValue.split('');
                chars[index] = '';
                setOtpValue(chars.join(''));
            } else if (index > 0) {
                otpRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            otpRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpBoxPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtpValue(pasted);
            setOtpError('');
            otpRefs.current[5]?.focus();
            handleVerifyOtpValue(pasted);
        }
        e.preventDefault();
    };

    useEffect(() => { getBranchesPublic().then(setBranches); }, []);

    // Detect return from HDFC payment page
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const returnOrderId = params.get('order_id');
        const returnStatus = params.get('status');
        // Clean the URL so a reload doesn't re-trigger
        if (returnOrderId || returnStatus) {
            window.history.replaceState({}, '', '/pay');
        }
        if (!returnOrderId) {
            // HDFC returned without an order_id — user cancelled or session expired
            if (returnStatus || window.location.search.includes('status')) {
                setFailedMessage('Payment was cancelled. You can try again below.');
                setStep('failed');
            }
            return;
        }
        const signature = params.get('signature') ?? undefined;
        const signatureAlgorithm = params.get('signature_algorithm') ?? undefined;
        handleHdfcReturn(returnOrderId, signature, signatureAlgorithm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBranchSelect = (branch: { id: string; name: string; code: string }) => {
        setSelectedBranch(branch);
        setPhone('');
        setSearchResults([]);
        setNoResult(false);
        setStep('search');
    };

    const handleSearch = async () => {
        if (!selectedBranch || phone.trim().length < 10) return;
        setIsSearching(true);
        setNoResult(false);
        try {
            const results = await searchStudentsByPhonePublic(selectedBranch.id, phone.trim());
            setSearchResults(results);
            if (results.length === 0) {
                setNoResult(true);
            } else {
                // Go to OTP step before revealing student info
                setOtpValue('');
                setOtpError('');
                setOtpSent(false);
                setStep('otp');
            }
        } catch {
            setNoResult(true);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        setOtpError('');
        try {
            const res = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setOtpError(data.error || 'Failed to send OTP');
            } else {
                setOtpSent(true);
                // Start 60s resend cooldown
                setOtpResendCooldown(60);
                const timer = setInterval(() => {
                    setOtpResendCooldown(prev => {
                        if (prev <= 1) { clearInterval(timer); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            }
        } catch {
            setOtpError('Failed to send OTP. Please try again.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtpValue = async (otp: string) => {
        if (otp.length !== 6) return;
        setIsVerifyingOtp(true);
        setOtpError('');
        try {
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                setOtpError(data.error || 'Incorrect OTP');
            } else {
                setOtpToken(data.token);
                if (searchResults.length === 1) {
                    setSelectedStudent(searchResults[0]);
                    setStep('confirm');
                } else {
                    setStep('select');
                }
            }
        } catch {
            setOtpError('Verification failed. Please try again.');
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleVerifyOtp = () => handleVerifyOtpValue(otpValue);

    const handleConfirmStudent = async (student: any) => {
        setSelectedStudent(student);
        setIsLoadingFees(true);
        try {
            const data = await getStudentFeesPublic(student.id);
            setFeeDetails(data);
            setSelectedInstallments({});
            setCustomAmounts({});
            setPaymentInputs({});
            setStep('pay');
        } catch {
            setPayError('Error fetching fee details. Please try again.');
        } finally {
            setIsLoadingFees(false);
        }
    };

    // --- Installment helpers ---
    const getInstallmentsForFee = (fee: any) => {
        // Only TUITION fees are split into installments; all other fee types are a single full payment
        const isTuition = fee.type === 'TUITION';
        const n = isTuition ? Math.max(1, fee.feeStructure?.installments || 1) : 1;
        const total = fee.amount;
        const base = Math.round(total / n);
        // Last installment absorbs rounding remainder so the sum is always exact
        const faceValues = Array.from({ length: n }, (_, i) =>
            i === n - 1 ? total - base * (n - 1) : base
        );
        let remaining = fee.paidAmount ?? 0;
        return faceValues.map((faceValue, i) => {
            const paidTowardThis = Math.min(remaining, faceValue);
            remaining -= paidTowardThis;
            const due = faceValue - paidTowardThis;
            return {
                index: i,
                label: n === 1 ? 'Full Fee' : `Term ${i + 1}`,  
                faceValue,
                paid: paidTowardThis,
                due,
                isPaid: due <= 0.01,
            };
        });
    };

    const getInstallmentPayAmount = (fee: any): number => {
        const insts = getInstallmentsForFee(fee);
        const selected = selectedInstallments[fee.id] || [];
        return insts
            .filter(inst => selected.includes(inst.index) && !inst.isPaid)
            .reduce((sum, inst) => {
                const customStr = customAmounts[fee.id]?.[inst.index];
                const custom = parseFloat(customStr ?? '');
                const amt = (!isNaN(custom) && custom >= 1 && custom <= inst.due) ? custom : inst.due;
                return sum + amt;
            }, 0);
    };

    const handleInstallmentToggle = (feeId: string, instIndex: number) => {
        const current = selectedInstallments[feeId] || [];
        const isRemoving = current.includes(instIndex);
        setSelectedInstallments(prev => {
            const curr = prev[feeId] || [];
            const updated = curr.includes(instIndex) ? curr.filter(i => i !== instIndex) : [...curr, instIndex];
            return { ...prev, [feeId]: updated };
        });
        if (!isRemoving && feeDetails) {
            const fee = feeDetails.fees.find(f => f.id === feeId);
            if (fee) {
                const inst = getInstallmentsForFee(fee).find(i => i.index === instIndex);
                if (inst) {
                    setCustomAmounts(prev => ({
                        ...prev,
                        [feeId]: { ...(prev[feeId] || {}), [instIndex]: String(Math.round(inst.due)) }
                    }));
                }
            }
        } else {
            setCustomAmounts(prev => {
                const fc = { ...(prev[feeId] || {}) };
                delete fc[instIndex];
                return { ...prev, [feeId]: fc };
            });
        }
    };

    const handleSelectAll = (fee: any) => {
        const insts = getInstallmentsForFee(fee);
        const unpaid = insts.filter(i => !i.isPaid);
        const current = selectedInstallments[fee.id] || [];
        const allSelected = unpaid.every(i => current.includes(i.index));
        setSelectedInstallments(prev => ({ ...prev, [fee.id]: allSelected ? [] : unpaid.map(i => i.index) }));
        if (!allSelected) {
            const newCustoms: Record<number, string> = {};
            unpaid.forEach(i => { newCustoms[i.index] = String(Math.round(i.due)); });
            setCustomAmounts(prev => ({ ...prev, [fee.id]: newCustoms }));
        } else {
            setCustomAmounts(prev => ({ ...prev, [fee.id]: {} }));
        }
    };
    // --- end installment helpers ---

    const handleInputChange = (feeId: string, val: string) => {
        setPaymentInputs(prev => ({ ...prev, [feeId]: val }));
    };

    const getTotalPayAmount = () => {
        if (!feeDetails) return 0;
        return feeDetails.fees.reduce((sum, fee) => sum + getInstallmentPayAmount(fee), 0);
    };

    const handleHdfcReturn = async (orderId: string, signature?: string, signatureAlgorithm?: string) => {
        setStep('verifying');
        setIsProcessing(true);
        try {
            // 1. Retrieve pending payment context stored before redirect
            const raw = localStorage.getItem(`hdfc_pending_${orderId}`);
            if (!raw) {
                setFailedMessage(`Payment session not found. Please contact the school office with Order ID: ${orderId}`);
                setStep('failed');
                setIsProcessing(false);
                return;
            }
            const { studentId, payments } = JSON.parse(raw) as { studentId: string; payments: { feeId: string; amount: number }[] };

            // 2. Server-to-server order status check — retry up to 4x if still PENDING
            // (HDFC redirects before their status API reflects CHARGED)
            const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
            let status = '';
            for (let attempt = 0; attempt < 5; attempt++) {
                if (attempt > 0) await sleep(2000);
                const statusRes = await fetch('/api/hdfc/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId }),
                });
                ({ status } = await statusRes.json());
                if (status !== 'PENDING' && status !== 'PENDING_VBV') break;
            }

            if (status !== 'CHARGED') {
                const msg = status === 'CANCELLED' || status === 'CANCEL'
                    ? 'Payment was cancelled. You can try again below.'
                    : status === 'AUTHORIZATION_FAILED' || status === 'AUTHENTICATION_FAILED'
                        ? 'Payment was not authorised by your bank. Please try again.'
                        : status === 'PENDING' || status === 'PENDING_VBV'
                            ? 'Payment is still processing. Please wait a moment and check back, or contact the school office.'
                            : `Payment ${status?.toLowerCase?.() || 'failed'}. Please try again or contact the school office.`;
                setFailedMessage(msg);
                setStep('failed');
                setIsProcessing(false);
                return;
            }

            // 3. Record payment in database
            const result = await processPublicPayment(studentId, payments, orderId);
            localStorage.removeItem(`hdfc_pending_${orderId}`);
            setTransactionSuccess(result);
            setStep('success');
        } catch {
            setFailedMessage('Something went wrong verifying your payment. Please contact the school office.');
            setStep('failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async () => {
        const total = getTotalPayAmount();
        if (total <= 0) return;
        setIsProcessing(true);
        setPayError('');

        const payments = feeDetails!.fees
            .map(fee => ({ feeId: fee.id, amount: getInstallmentPayAmount(fee) }))
            .filter(p => p.amount > 0.01);

        try {
            // 1. Create HDFC order session on the server
            const sessionRes = await fetch('/api/hdfc/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, studentId: selectedStudent?.id }),
            });

            if (!sessionRes.ok) throw new Error('Failed to create payment session');

            const { orderId, paymentLink } = await sessionRes.json();

            if (!paymentLink) throw new Error('No payment link returned');

            // 2. Store pending context in localStorage before leaving the page
            localStorage.setItem(`hdfc_pending_${orderId}`, JSON.stringify({
                studentId: selectedStudent!.id,
                payments,
            }));

            // 3. Redirect to HDFC payment page
            window.location.href = paymentLink;
        } catch {
            setPayError('Could not initiate payment. Please try again.');
            setIsProcessing(false);
        }
    };

    const getInitials = (s: any) =>
        `${s?.firstName?.[0] ?? ''}${s?.lastName?.[0] ?? ''}`.toUpperCase();

    const stepIndex = { branch: 1, search: 2, otp: 2, select: 3, confirm: 3, pay: 4, success: 5, verifying: 5, failed: 5 }[step];

    const Rs = '\u20B9';

    return (
            <div className="pr">
                <div className="ph">
                    <img src="/sprout-logo.png" alt="Sprout School" className="ph-logo" />
                    <div className="ph-title">Fee Payment Portal</div>
                    <div className="ph-sub">Secure online payment for school fees</div>
                </div>

                <div className="steps">
                    {['Branch', 'Search', 'Student', 'Pay'].map((label, i) => {
                        const s = i + 1;
                        const active = stepIndex === s;
                        const done = stepIndex > s;
                        return (
                            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                                {i > 0 && <div className={`step-line${done ? ' done' : ''}`} />}
                                <div className={`step-pill${done ? ' done' : active ? ' active' : ''}`}>
                                    <span className="step-num">
                                        {done ? <Check size={10} strokeWidth={3} /> : s}
                                    </span>
                                    {label}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={`pc${(step === 'confirm' || step === 'pay') ? ' pc-wide' : ''}`}>
                    <div className="pc-body">

                        {/* Branch */}
                        {step === 'branch' && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Select Branch</div>
                                        <div className="sec-sub">Choose your ward&apos;s school branch</div>
                                    </div>
                                    <Building2 size={20} color="#a5b4fc" />
                                </div>
                                <div className="bg">
                                    {branches.map(b => (
                                        <button key={b.id} className="bb" onClick={() => handleBranchSelect(b)}>
                                            <div className="bb-icon"><Building2 size={28} strokeWidth={1.5} /></div>
                                            <div className="bb-name">{b.name}</div>
                                            <div className="bb-code">{b.code}</div>
                                        </button>
                                    ))}
                                </div>
                                {branches.length === 0 && (
                                    <div className="branch-skeleton">
                                        {[1,2].map(i => <div key={i} className="branch-skel-item" />)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Search */}
                        {step === 'search' && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Find Student</div>
                                        <div className="sec-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                                            {selectedBranch?.name}
                                        </div>
                                    </div>
                                    <button className="back-btn" onClick={() => setStep('branch')}>Change Branch</button>
                                </div>
                                <label className="fl">Parent / Guardian Mobile</label>
                                <div className="fw">
                                    <span className="fi-icon"><Phone size={16} /></span>
                                    <input
                                        className="fi"
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="Enter 10-digit mobile number"
                                        value={phone}
                                        onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setNoResult(false); }}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                {noResult && (
                                    <div className="err">
                                        No student found for this number. Please check and retry.
                                    </div>
                                )}
                                <button className="btn-blue" onClick={handleSearch} disabled={isSearching || phone.length < 10}>
                                    {isSearching
                                        ? <><Loader2 size={17} className="spin" /> Searching...</>
                                        : <><Search size={17} /> Search Student</>
                                    }
                                </button>
                            </div>
                        )}

                        {/* OTP Verification */}
                        {step === 'otp' && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Verify Mobile</div>
                                        <div className="sec-sub">Enter OTP sent to +91 {phone}</div>
                                    </div>
                                    <button className="back-btn" onClick={() => { setStep('search'); setOtpSent(false); setOtpValue(''); setOtpError(''); }}>Back</button>
                                </div>

                                {!otpSent ? (
                                    <>
                                        <p className="otp-hint">
                                            For your security, we&apos;ll send a 6-digit OTP to the registered mobile number.
                                        </p>
                                        {otpError && <div className="err">{otpError}</div>}
                                        <button className="btn-blue" onClick={handleSendOtp} disabled={isSendingOtp}>
                                            {isSendingOtp
                                                ? <><Loader2 size={17} className="spin" /> Sending OTP...</>
                                                : <><Phone size={17} /> Send OTP</>
                                            }
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="otp-hint">
                                            OTP sent to <strong>+91 {phone}</strong>. Valid for 10 minutes.
                                        </p>
                                        <div className="otp-boxes" onPaste={handleOtpBoxPaste}>
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <input
                                                    key={i}
                                                    ref={el => { otpRefs.current[i] = el; }}
                                                    className={`otp-box${otpValue[i] ? ' otp-filled' : ''}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={otpValue[i] || ''}
                                                    onChange={e => handleOtpBoxChange(i, e.target.value)}
                                                    onKeyDown={e => handleOtpBoxKeyDown(i, e)}
                                                    autoFocus={i === 0}
                                                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                                    disabled={isVerifyingOtp}
                                                />
                                            ))}
                                        </div>
                                        {otpError && <div className="err">{otpError}</div>}
                                        <button className="btn-blue" onClick={handleVerifyOtp} disabled={isVerifyingOtp || otpValue.length !== 6}>
                                            {isVerifyingOtp
                                                ? <><Loader2 size={17} className="spin" /> Verifying...</>
                                                : <><ShieldCheck size={17} /> Verify OTP</>
                                            }
                                        </button>
                                        <div className="resend-row" style={{ marginTop: '0.75rem' }}>
                                            <button
                                                className="resend-btn"
                                                disabled={otpResendCooldown > 0 || isSendingOtp}
                                                onClick={handleSendOtp}
                                            >
                                                {otpResendCooldown > 0
                                                    ? `Resend OTP in ${otpResendCooldown}s`
                                                    : 'Resend OTP'
                                                }
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Select (multiple results) */}
                        {step === 'select' && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Select Student</div>
                                        <div className="sec-sub">{searchResults.length} students found</div>
                                    </div>
                                    <button className="back-btn" onClick={() => setStep('search')}>Back</button>
                                </div>
                                {searchResults.map(s => (
                                    <button
                                        key={s.id} className="sc"
                                        onClick={() => { setSelectedStudent(s); setStep('confirm'); }}
                                        disabled={isLoadingFees}
                                    >
                                        <div className="sc-avatar">{getInitials(s)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="sc-name">{s.firstName} {s.lastName}</div>
                                            <div className="sc-meta">
                                                {s.class?.name}{s.class?.section ? ` (${s.class.section})` : ''} &bull; Adm: {s.admissionNo}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Confirm student */}
                        {step === 'confirm' && selectedStudent && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Confirm Student</div>
                                        <div className="sec-sub">Please verify the details below</div>
                                    </div>
                                    <button className="back-btn" onClick={() => setStep(searchResults.length > 1 ? 'select' : 'search')}>Back</button>
                                </div>
                                <div className="confirm-card">
                                    <div className="confirm-avatar">{getInitials(selectedStudent)}</div>
                                    <div className="confirm-name">{selectedStudent.firstName} {selectedStudent.lastName}</div>
                                    <div className="confirm-grid">
                                        <div className="confirm-item">
                                            <div className="confirm-item-label">Class</div>
                                            <div className="confirm-item-value">
                                                {selectedStudent.class?.name ?? '-'}{selectedStudent.class?.section ? ` (${selectedStudent.class.section})` : ''}
                                            </div>
                                        </div>
                                        <div className="confirm-item">
                                            <div className="confirm-item-label">Admission No</div>
                                            <div className="confirm-item-value">{selectedStudent.admissionNo ?? '-'}</div>
                                        </div>
                                        <div className="confirm-item" style={{ gridColumn: '1 / -1' }}>
                                            <div className="confirm-item-label">Parent / Father</div>
                                            <div className="confirm-item-value">{selectedStudent.parentName ?? '-'}</div>
                                        </div>
                                    </div>
                                    <div className="confirm-check">
                                        <ShieldCheck size={13} /> Verified from school records
                                    </div>
                                </div>
                                <button className="btn-blue" onClick={() => handleConfirmStudent(selectedStudent)} disabled={isLoadingFees}>
                                    {isLoadingFees
                                        ? <><Loader2 size={17} className="spin" /> Loading fees...</>
                                        : <>Proceed to Pay <ChevronRight size={16} /></>
                                    }
                                </button>
                            </div>
                        )}

                        {/* Pay */}
                        {step === 'pay' && feeDetails && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Fee Details</div>
                                        <div className="sec-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                                            {selectedStudent?.firstName} {selectedStudent?.lastName}
                                        </div>
                                    </div>
                                    <button className="back-btn" onClick={() => setStep('confirm')}>Back</button>
                                </div>

                                <div className="outstanding-box">
                                    <div className="outstanding-lbl">Total Outstanding</div>
                                    <div className="outstanding-val">{Rs}{feeDetails.totalDue.toLocaleString('en-IN')}</div>
                                    <div className="outstanding-sub">Select fees below to pay now</div>
                                </div>

                                {feeDetails.fees.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                                        No outstanding fees. All clear!
                                    </p>
                                )}

                                <div className="fees-grid">
                                {feeDetails.fees.map(fee => {
                                    const insts = getInstallmentsForFee(fee);
                                    const selectedSet = selectedInstallments[fee.id] || [];
                                    const allUnpaidSelected = insts.filter(i => !i.isPaid).length > 0 &&
                                        insts.filter(i => !i.isPaid).every(i => selectedSet.includes(i.index));
                                    const feePayAmt = getInstallmentPayAmount(fee);
                                    return (
                                        <div key={fee.id} className="fc">
                                            <div className="fc-head">
                                                <span className="fc-type">{feeLabel(fee.type)}</span>
                                                <span className="fc-due">{Rs}{fee.due.toLocaleString('en-IN')} due</span>
                                            </div>

                                            {insts.map(inst => (
                                                <div
                                                    key={inst.index}
                                                    className={`inst-row ${
                                                        inst.isPaid ? 'paid-row' :
                                                        selectedSet.includes(inst.index) ? 'selected' : 'selectable'
                                                    }`}
                                                    onClick={() => !inst.isPaid && handleInstallmentToggle(fee.id, inst.index)}
                                                >
                                                    <div className="inst-cb">
                                                        {(inst.isPaid || selectedSet.includes(inst.index)) && (
                                                            <Check size={11} strokeWidth={3} color="white" />
                                                        )}
                                                    </div>
                                                    <span className="inst-label">{inst.label}</span>
                                                    {inst.isPaid ? (
                                                        <span className="inst-badge badge-paid">Paid</span>
                                                    ) : selectedSet.includes(inst.index) ? (
                                                        <input
                                                            className="inst-custom-input"
                                                            type="number"
                                                            min={1}
                                                            max={inst.due}
                                                            value={customAmounts[fee.id]?.[inst.index] ?? String(Math.round(inst.due))}
                                                            onClick={e => e.stopPropagation()}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setCustomAmounts(prev => ({
                                                                    ...prev,
                                                                    [fee.id]: { ...(prev[fee.id] || {}), [inst.index]: val }
                                                                }));
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="inst-amt">{Rs}{inst.due.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                                    )}
                                                </div>
                                            ))}

                                            <div className="fc-actions">
                                                {insts.some(i => !i.isPaid) && (
                                                    <button className="fc-selectall" onClick={() => handleSelectAll(fee)}>
                                                        {allUnpaidSelected ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })}
                                </div>{/* end fees-grid */}

                                <div className="total-row">
                                    <span className="total-lbl">Paying Now</span>
                                    <span className="total-val">{Rs}{getTotalPayAmount().toLocaleString('en-IN')}</span>
                                </div>

                                {getTotalPayAmount() <= 0 && feeDetails.fees.length > 0 && (
                                    <p className="pay-hint">Select at least one fee above to continue</p>
                                )}
                                <button className="btn-green" onClick={handlePayment} disabled={isProcessing || getTotalPayAmount() <= 0}>
                                    {isProcessing
                                        ? <><Loader2 size={20} className="spin" /> Processing...</>
                                        : <><CreditCard size={20} /> Pay {getTotalPayAmount() > 0 ? `₹${getTotalPayAmount().toLocaleString('en-IN')}` : 'Securely'}</>
                                    }
                                </button>
                                {payError && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        padding: '0.9rem 1rem',
                                        backgroundColor: '#fef2f2',
                                        border: '1.5px solid #ef4444',
                                        borderRadius: '0.75rem',
                                        color: '#b91c1c',
                                        fontSize: '0.85rem',
                                        lineHeight: '1.5',
                                        display: 'flex',
                                        gap: '0.5rem',
                                        alignItems: 'flex-start',
                                    }}>
                                        <span style={{ fontWeight: '700', flexShrink: 0 }}>⚠</span>
                                        {payError}
                                        <button onClick={() => setPayError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontWeight: '700', fontSize: '1rem' }} aria-label="Dismiss">×</button>
                                    </div>
                                )}
                                <div className="secure">
                                    <ShieldCheck size={13} />
                                    256-bit SSL encrypted &amp; secure
                                </div>
                            </div>
                        )}

                        {/* Verifying HDFC return */}
                        {step === 'verifying' && (
                            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                                <Loader2 size={40} className="spin" style={{ color: '#1d4ed8', margin: '0 auto' }} />
                                <div style={{ marginTop: '1.25rem', color: '#475569', fontSize: '1rem', fontWeight: 500 }}>Verifying your payment…</div>
                                <div style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.825rem' }}>Please wait, do not close this tab.</div>
                            </div>
                        )}

                        {/* Failed / Cancelled */}
                        {step === 'failed' && (
                            <div className="success-wrap">
                                <div className="failed-ring">
                                    <XCircle size={36} strokeWidth={1.75} />
                                </div>
                                <div className="success-title" style={{ color: '#0f172a' }}>Payment Unsuccessful</div>
                                <div className="success-sub">{failedMessage}</div>
                                <button
                                    className="btn-blue"
                                    style={{ marginBottom: '0.625rem' }}
                                    onClick={() => { setStep('branch'); setPhone(''); setSearchResults([]); setSelectedBranch(null); setNoResult(false); setFailedMessage(''); }}
                                >
                                    <RotateCcw size={16} /> Try Again
                                </button>
                            </div>
                        )}

                        {/* Success */}
                        {step === 'success' && (
                            <div className="success-wrap">
                                <div className="success-ring">
                                    <Check size={38} strokeWidth={2.5} />
                                </div>
                                {transactionSuccess && (
                                    <>
                                        <div className="success-amount">
                                            {Rs}{transactionSuccess.payments.reduce((s: number, p: any) => s + p.amount, 0).toLocaleString('en-IN')}
                                        </div>
                                        <div className="success-amount-lbl">Amount Paid</div>
                                    </>
                                )}
                                <div className="success-title">Payment Successful!</div>
                                <div className="success-sub">
                                    Thank you! Your payment has been recorded.<br />
                                    Download your receipt(s) below.
                                </div>
                                {transactionSuccess?.payments.map((p: any) => (
                                    <Link key={p.id} href={`/api/receipts/${p.id}/download`} target="_blank" className="btn-receipt">
                                        <Download size={17} />
                                        Download Receipt — {feeLabel(p.fee?.type || 'General')}
                                    </Link>
                                ))}
                                <button
                                    className="btn-outline"
                                    style={{ marginTop: '0.625rem' }}
                                    onClick={() => { setStep('branch'); setPhone(''); setSearchResults([]); setSelectedBranch(null); setNoResult(false); setTransactionSuccess(null); }}
                                >
                                    Make Another Payment
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                <div className="pf">
                    <div className="pf-name">SPROUT EDUCATIONAL SOCIETY</div>
                    <div>#14-218/5, Raghavanagar Colony, Meerpet, Hyderabad &nbsp;&middot;&nbsp; info@sproutschool.edu.in</div>
                    <div>&copy; {new Date().getFullYear()} Sprout School &middot; All rights reserved</div>
                </div>
            </div>
    );
}
