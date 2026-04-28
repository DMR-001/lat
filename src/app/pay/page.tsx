'use client';

import { useState, useEffect } from 'react';
import { searchStudentsByPhonePublic, getBranchesPublic, getStudentFeesPublic, processPublicPayment } from '@/app/actions/public';
import { Search, CreditCard, Check, Loader2, Download, Phone, ChevronRight, Building2, User, GraduationCap, UserCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import './pay.css';

export default function PublicPaymentPage() {
    // step: 'branch' | 'search' | 'otp' | 'select' | 'confirm' | 'pay' | 'success'
    const [step, setStep] = useState<'branch' | 'search' | 'otp' | 'select' | 'confirm' | 'pay' | 'success'>('branch');
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

    useEffect(() => { getBranchesPublic().then(setBranches); }, []);

    // Load Razorpay checkout script once on mount
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
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

    const handleVerifyOtp = async () => {
        if (otpValue.length !== 6) return;
        setIsVerifyingOtp(true);
        setOtpError('');
        try {
            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), otp: otpValue }),
            });
            const data = await res.json();
            if (!res.ok) {
                setOtpError(data.error || 'Incorrect OTP');
            } else {
                setOtpToken(data.token);
                // Proceed with already-fetched results
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

    const handlePayment = async () => {
        const total = getTotalPayAmount();
        if (total <= 0) return;
        setIsProcessing(true);

        const payments = feeDetails!.fees
            .map(fee => ({ feeId: fee.id, amount: getInstallmentPayAmount(fee) }))
            .filter(p => p.amount > 0.01);

        try {
            // 1. Create Razorpay order on the server
            const orderRes = await fetch('/api/razorpay/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total }),
            });

            if (!orderRes.ok) throw new Error('Failed to create payment order');

            const { orderId, amount: orderAmount, currency } = await orderRes.json();

            // 2. Open Razorpay checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderAmount,
                currency,
                name: 'Sprout School',
                description: 'Fee Payment',
                image: '/sprout-logo.png',
                order_id: orderId,
                prefill: {
                    name: selectedStudent?.parentName || `${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
                    contact: selectedStudent?.phone || '',
                },
                theme: { color: '#2563eb' },
                handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                    try {
                        // 3. Verify payment signature on the server
                        const verifyRes = await fetch('/api/razorpay/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        const { verified } = await verifyRes.json();

                        if (!verified) {
                            setPayError('Payment verification failed. Please contact the school office.');
                            setIsProcessing(false);
                            return;
                        }

                        // 4. Record the payment in the database
                        const result = await processPublicPayment(selectedStudent.id, payments);
                        setTransactionSuccess(result);
                        setStep('success');
                    } catch {
                        setPayError('Payment was captured but recording failed. Please contact the school office with your Razorpay ID: ' + response.razorpay_payment_id);
                    } finally {
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: () => { setIsProcessing(false); },
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', () => {
                setPayError('Payment failed. Please try again.');
                setIsProcessing(false);
            });
            rzp.open();
        } catch {
            setPayError('Could not initiate payment. Please try again.');
            setIsProcessing(false);
        }
    };

    const getInitials = (s: any) =>
        `${s?.firstName?.[0] ?? ''}${s?.lastName?.[0] ?? ''}`.toUpperCase();

    const stepIndex = { branch: 1, search: 2, otp: 2, select: 3, confirm: 3, pay: 4, success: 5 }[step];

    const Rs = '\u20B9';

    return (
            <div className="pr">
                <div className="ph">
                    <img src="/sprout-logo.png" alt="Sprout School" className="ph-logo" style={{ height: '48px', width: 'auto', maxWidth: '180px', objectFit: 'contain', display: 'block', margin: '0 auto 0.75rem' }} />
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
                                <div className="sec-head" style={{ alignItems: 'center' }}>
                                    <div>
                                        <div className="sec-title">Select Branch</div>
                                        <div className="sec-sub">Choose your ward&apos;s school branch</div>
                                    </div>
                                    <Building2 size={20} color="#94a3b8" />
                                </div>
                                <div className="bg">
                                    {branches.map(b => (
                                        <button key={b.id} className="bb" onClick={() => handleBranchSelect(b)}>
                                            <div className="bb-code">{b.code}</div>
                                            <div className="bb-name">{b.name}</div>
                                        </button>
                                    ))}
                                </div>
                                {branches.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem 0', fontSize: '0.85rem' }}>Loading...</p>
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
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
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
                                        ? <><Loader2 size={17} className="animate-spin" /> Searching...</>
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
                                                ? <><Loader2 size={17} className="animate-spin" /> Sending OTP...</>
                                                : <><Phone size={17} /> Send OTP</>
                                            }
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="otp-hint">
                                            OTP sent to <strong>+91 {phone}</strong>. Valid for 10 minutes.
                                        </p>
                                        <input
                                            className="otp-input"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="------"
                                            value={otpValue}
                                            onChange={e => { setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && otpValue.length === 6 && handleVerifyOtp()}
                                            autoFocus
                                        />
                                        {otpError && <div className="err">{otpError}</div>}
                                        <button className="btn-blue" onClick={handleVerifyOtp} disabled={isVerifyingOtp || otpValue.length !== 6}>
                                            {isVerifyingOtp
                                                ? <><Loader2 size={17} className="animate-spin" /> Verifying...</>
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
                                        ? <><Loader2 size={17} className="animate-spin" /> Loading fees...</>
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
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                                            {selectedStudent?.firstName} {selectedStudent?.lastName}
                                        </div>
                                    </div>
                                    <button className="back-btn" onClick={() => setStep('confirm')}>Back</button>
                                </div>

                                <div className="outstanding-box">
                                    <div className="outstanding-lbl">Total Outstanding</div>
                                    <div className="outstanding-val">{Rs}{feeDetails.totalDue.toLocaleString('en-IN')}</div>
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
                                    const hasDiscount = fee.discountAmount > 0;
                                    return (
                                        <div key={fee.id} className="fc">
                                            <div className="fc-head">
                                                <div>
                                                    <span className="fc-type">{fee.type}</span>
                                                    {hasDiscount && (
                                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', marginLeft: '0.4rem' }}>
                                                            -{Rs}{fee.discountAmount.toLocaleString('en-IN')} off
                                                        </span>
                                                    )}
                                                </div>
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

                                            {feePayAmt > 0 && (
                                                <div style={{ marginTop: '0.25rem', textAlign: 'right', fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 700 }}>
                                                    Paying: {Rs}{feePayAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                </div>{/* end fees-grid */}

                                <div className="total-row">
                                    <span className="total-lbl">Paying Now</span>
                                    <span className="total-val">{Rs}{getTotalPayAmount().toLocaleString('en-IN')}</span>
                                </div>

                                <button className="btn-green" onClick={handlePayment} disabled={isProcessing || getTotalPayAmount() <= 0}>
                                    {isProcessing
                                        ? <><Loader2 size={20} className="animate-spin" /> Processing...</>
                                        : <><CreditCard size={20} /> Pay Securely</>
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

                        {/* Success */}
                        {step === 'success' && (
                            <div className="success-wrap">
                                <div className="success-ring">
                                    <Check size={36} strokeWidth={2.5} />
                                </div>
                                <div className="success-title">Payment Successful</div>
                                <div className="success-sub">
                                    Your payment has been recorded.<br />Download your receipt(s) below.
                                </div>
                                {transactionSuccess?.payments.map((p: any) => (
                                    <Link key={p.id} href={`/api/receipts/${p.id}/download`} target="_blank" className="btn-receipt">
                                        <Download size={17} />
                                        Receipt &mdash; {p.fee?.type || 'General'}
                                    </Link>
                                ))}
                                <button
                                    className="btn-outline"
                                    style={{ marginTop: '0.5rem' }}
                                    onClick={() => { setStep('branch'); setPhone(''); setSearchResults([]); setSelectedBranch(null); setNoResult(false); }}
                                >
                                    Make Another Payment
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                <div className="pf">
                    <div style={{ marginBottom: '0.35rem', fontWeight: 600, color: '#111827' }}>SPROUT EDUCATIONAL SOCIETY</div>
                    <div style={{ marginBottom: '0.35rem' }}>Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad &nbsp;&middot;&nbsp; info@sproutschool.edu.in</div>
                    <div>&copy; {new Date().getFullYear()} Sprout School &middot; All rights reserved</div>
                </div>
            </div>
    );
}
