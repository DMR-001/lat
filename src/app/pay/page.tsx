'use client';

import { useState, useEffect, useRef } from 'react';
import { searchStudentsByPhonePublic, getBranchesPublic, getStudentFeesPublic, processPublicPayment, recordFailedPayment, getPendingPayment, completePendingPayment, failPendingPayment, getExistingPayment } from '@/app/actions/public';
import { Search, CreditCard, Check, Loader2, Download, Phone, ChevronRight, Building2, ShieldCheck, XCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import './pay.css';

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

    const [payAmount, setPayAmount] = useState('');
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
    const [otpSendCount, setOtpSendCount] = useState(0); // tracks total sends (initial + resends)
    const MAX_OTP_SENDS = 3;

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

    // Handle payment link token (?token=xxx) — skip branch/search/OTP steps
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) return;
        // Don't clear the token from URL yet — wait until we've loaded
        (async () => {
            setIsLoadingFees(true);
            try {
                const res = await fetch(`/api/payment-link?token=${encodeURIComponent(token)}`);
                const data = await res.json();
                if (!res.ok) {
                    window.history.replaceState({}, '', '/pay');
                    setFailedMessage(data.error || 'Invalid or expired payment link.');
                    setStep('failed');
                    return;
                }
                window.history.replaceState({}, '', '/pay');
                // Pre-fill student and amount — skip OTP
                setSelectedStudent(data.student);
                const feeData = await getStudentFeesPublic(data.studentId);
                setFeeDetails(feeData);
                // Use link amount if provided and valid, else fall back to total due
                const linkAmt = data.amount > 0 ? data.amount : feeData.totalDue;
                setPayAmount(String(Math.round(Math.min(linkAmt, feeData.totalDue > 0 ? feeData.totalDue : linkAmt))));
                setStep('pay');
            } catch {
                window.history.replaceState({}, '', '/pay');
                setFailedMessage('Failed to load payment link. Please try again.');
                setStep('failed');
            } finally {
                setIsLoadingFees(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Detect return from HDFC payment page
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const returnOrderId = params.get('order_id');
        const returnStatus = (params.get('status') || '').toUpperCase();

        const returnError = params.get('error');

        if (!returnOrderId && !returnStatus && !returnError) return; // normal page load

        // Tampered callback rejected by return route
        if (returnError === 'invalid_signature') {
            window.history.replaceState({}, '', '/pay');
            setFailedMessage('Payment response validation failed. Please contact the school office with Order ID: ' + (returnOrderId || 'unknown'));
            setStep('failed');
            return;
        }

        // Clean URL immediately so reload doesn't re-trigger
        window.history.replaceState({}, '', '/pay');

        // Statuses that mean "definitely not paid" — resolve instantly, no polling
        const FAILED_STATUSES = new Set([
            'CANCELLED', 'CANCEL',
            'AUTHORIZATION_FAILED', 'AUTHENTICATION_FAILED',
            'AUTHORIZING',   // cancelled/timed-out during auth phase — redirect means it won't complete
            'FAILED', 'FAILURE',
            'JUSPAY_DECLINED', 'DECLINED',
            'PENDING',       // timed out on bank side
            'PENDING_VBV',
        ]);

        if (!returnOrderId) {
            // Returned without order_id — session expired or hard cancel
            setFailedMessage('Payment was cancelled. You can try again below.');
            setStep('failed');
            return;
        }

        if (FAILED_STATUSES.has(returnStatus)) {
            // Record the failed/cancelled payment for audit trail
            recordFailedPayment(returnOrderId, returnStatus, 0).catch(() => null);
            failPendingPayment(returnOrderId).catch(() => null);
            
            const msg =
                returnStatus === 'CANCELLED' || returnStatus === 'CANCEL' || returnStatus === 'AUTHORIZING'
                    ? 'Payment was cancelled. You can try again below.'
                    : returnStatus === 'AUTHORIZATION_FAILED' || returnStatus === 'AUTHENTICATION_FAILED' || returnStatus === 'DECLINED' || returnStatus === 'JUSPAY_DECLINED'
                        ? 'Payment was declined by your bank. Please try again.'
                        : returnStatus === 'PENDING' || returnStatus === 'PENDING_VBV'
                            ? 'Payment timed out. Please check with your bank and contact the school office if amount was debited.'
                            : 'Payment failed. Please try again.';
            setFailedMessage(msg);
            setStep('failed');
            return;
        }

        // Only poll when status is CHARGED or unknown — needs server verification
        handleHdfcReturn(returnOrderId);
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
        if (otpSendCount >= MAX_OTP_SENDS) return;
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
                if (res.status === 429) {
                    setOtpSendCount(MAX_OTP_SENDS); // lock immediately on rate-limit
                    setOtpError('Maximum OTP attempts reached. Please wait 10 minutes before trying again.');
                } else {
                    setOtpError(data.error || 'Failed to send OTP');
                }
            } else {
                const newCount = otpSendCount + 1;
                setOtpSendCount(newCount);
                setOtpSent(true);
                // 2-minute cooldown between resends
                setOtpResendCooldown(120);
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
            setPayAmount(String(Math.round(data.totalDue)));
            setStep('pay');
        } catch {
            setPayError('Error fetching fee details. Please try again.');
        } finally {
            setIsLoadingFees(false);
        }
    };

    const getTotalPayAmount = () => parseFloat(payAmount) || 0;

    const handleHdfcReturn = async (orderId: string) => {
        setStep('verifying');
        setIsProcessing(true);
        try {
            // 0. Check if this order was already processed (prevent duplicate processing)
            const existingPayment = await getExistingPayment(orderId);
            if (existingPayment) {
                console.log('[HDFC_RETURN] Order already processed:', orderId, existingPayment.status);
                if (existingPayment.status === 'SUCCESS') {
                    // Already successful - show success
                    setTransactionSuccess({ success: true, payments: [existingPayment] });
                    setStep('success');
                } else {
                    // Already recorded as failed/cancelled
                    setFailedMessage(`This payment was already processed as ${existingPayment.status.toLowerCase()}. Order ID: ${orderId}`);
                    setStep('failed');
                }
                setIsProcessing(false);
                return;
            }

            // 1. Retrieve pending payment context — try localStorage first, then server-side backup
            let studentId: string;
            let payments: { feeId: string; amount: number }[];
            
            const raw = localStorage.getItem(`hdfc_pending_${orderId}`);
            if (raw) {
                const parsed = JSON.parse(raw) as { studentId: string; payments: { feeId: string; amount: number }[] };
                studentId = parsed.studentId;
                payments = parsed.payments;
            } else {
                // Fallback to server-side backup
                console.log('[HDFC_RETURN] localStorage empty, trying server-side backup for:', orderId);
                const serverData = await getPendingPayment(orderId);
                if (!serverData) {
                    setFailedMessage(`Payment session not found. Please contact the school office with Order ID: ${orderId}`);
                    setStep('failed');
                    setIsProcessing(false);
                    return;
                }
                studentId = serverData.studentId;
                payments = serverData.payments;
            }

            // 2. Poll HDFC until we get a definitive status — never decide on PENDING.
            // Timeout after 2 minutes to avoid waiting forever.
            const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
            const PENDING_STATUSES = new Set(['PENDING', 'PENDING_VBV', 'AUTHORIZING']);
            const ERROR_STATUSES = new Set(['ERROR', 'FETCH_ERROR', 'INVALID_RESPONSE']);
            const deadline = Date.now() + 2 * 60 * 1000;
            let status = '';
            let statusError = '';
            let statusData: { status?: string; amount?: number; error?: string } = {};

            while (true) {
                try {
                    const statusRes = await fetch('/api/hdfc/status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId }),
                    });

                    statusData = await statusRes.json();
                    status = statusData.status || '';
                    statusError = statusData.error || '';
                    
                    // If we got an error status, retry a few times before giving up
                    if (ERROR_STATUSES.has(status)) {
                        console.warn('[HDFC_RETURN] Status API error, will retry:', statusError);
                        if (Date.now() >= deadline) break;
                        await sleep(5000);
                        continue;
                    }
                    
                    if (!PENDING_STATUSES.has(status)) break;
                    if (Date.now() >= deadline) break;
                    await sleep(3000);
                } catch (fetchError) {
                    console.error('[HDFC_RETURN] Status fetch failed:', fetchError);
                    if (Date.now() >= deadline) break;
                    await sleep(5000);
                }
            }

            if (status !== 'CHARGED') {
                // Store failed/cancelled transaction in DB for HDFC audit compliance
                const totalAmt = payments.reduce((s, p) => s + p.amount, 0);
                recordFailedPayment(orderId, status || 'UNKNOWN', totalAmt, studentId).catch(() => null);
                failPendingPayment(orderId).catch(() => null);

                const msg = status === 'CANCELLED' || status === 'CANCEL'
                    ? 'Payment was cancelled. You can try again below.'
                    : status === 'AUTHORIZATION_FAILED' || status === 'AUTHENTICATION_FAILED'
                        ? 'Payment was not authorised by your bank. Please try again.'
                        : status === 'PENDING' || status === 'PENDING_VBV'
                            ? 'Payment is still processing. Please wait a moment and check back, or contact the school office.'
                            : ERROR_STATUSES.has(status)
                                ? `Could not verify payment status. Please contact the school office with Order ID: ${orderId}`
                                : `Payment ${status?.toLowerCase?.() || 'failed'}. Please try again or contact the school office.`;
                setFailedMessage(msg);
                setStep('failed');
                setIsProcessing(false);
                return;
            }

            // 3. Cross-validate: HDFC charged amount must match server-stored amount
            const serverContext = await getPendingPayment(orderId);
            const hdfcAmount = statusData.amount ?? 0;
            if (serverContext && Math.abs(hdfcAmount - serverContext.amount) > 1) {
                console.error('[HDFC_RETURN] Amount mismatch — HDFC:', hdfcAmount, 'Server:', serverContext.amount);
                recordFailedPayment(orderId, 'AMOUNT_MISMATCH', hdfcAmount, studentId).catch(() => null);
                setFailedMessage('Payment amount mismatch detected. Please contact the school office with Order ID: ' + orderId);
                setStep('failed');
                setIsProcessing(false);
                return;
            }

            // 4. Record payment in database using server-authoritative amounts
            const authorizedPayments = serverContext?.payments ?? payments;
            const result = await processPublicPayment(studentId, authorizedPayments, orderId);
            localStorage.removeItem(`hdfc_pending_${orderId}`);
            completePendingPayment(orderId).catch(() => null);
            setTransactionSuccess(result);
            setStep('success');
        } catch (error) {
            console.error('[HDFC_RETURN] Error processing payment:', error);
            // Record the failed payment for audit trail
            recordFailedPayment(orderId, 'PROCESSING_ERROR', 0).catch(() => null);
            failPendingPayment(orderId).catch(() => null);
            setFailedMessage(`Something went wrong verifying your payment. Please contact the school office with Order ID: ${orderId}`);
            setStep('failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async () => {
        const total = getTotalPayAmount();
        if (total <= 0 || !feeDetails) return;
        setIsProcessing(true);
        setPayError('');

        // Distribute the entered amount across pending fees in order
        let remaining = total;
        const payments: { feeId: string; amount: number }[] = [];
        for (const fee of feeDetails.fees) {
            if (remaining <= 0) break;
            const due = fee.amount - fee.paidAmount;
            if (due <= 0) continue;
            const paying = Math.min(remaining, due);
            payments.push({ feeId: fee.id, amount: paying });
            remaining -= paying;
        }

        try {
            // 1. Create HDFC order session — server calculates authoritative amount from DB
            // Nonce is a one-time token to prevent request replay attacks
            const nonce = Array.from(crypto.getRandomValues(new Uint8Array(24)))
                .map(b => b.toString(16).padStart(2, '0')).join('');

            const sessionRes = await fetch('/api/hdfc/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent?.id,
                    payments: payments.map(p => ({ feeId: p.feeId, amount: p.amount })),
                    nonce,
                }),
            });

            if (!sessionRes.ok) throw new Error('Failed to create payment session');

            const { orderId, paymentLink } = await sessionRes.json();

            if (!paymentLink) throw new Error('No payment link returned');

            // 2. Store pending context in localStorage before leaving the page (primary)
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

                        {/* Token loading */}
                        {step === 'branch' && isLoadingFees && (
                            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                                <Loader2 size={36} className="spin" style={{ color: '#2563eb', margin: '0 auto' }} />
                                <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Loading payment details...</div>
                            </div>
                        )}

                        {/* Branch */}
                        {step === 'branch' && !isLoadingFees && (
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
                                    <button className="back-btn" onClick={() => { setStep('search'); setOtpSent(false); setOtpValue(''); setOtpError(''); setOtpSendCount(0); setOtpResendCooldown(0); }}>Back</button>
                                </div>

                                {!otpSent ? (
                                    <>
                                        <p className="otp-hint">
                                            For your security, we&apos;ll send a 6-digit OTP to the registered mobile number.
                                        </p>
                                        {otpError && <div className="err">{otpError}</div>}
                                        <button className="btn-blue" onClick={handleSendOtp} disabled={isSendingOtp || otpSendCount >= MAX_OTP_SENDS}>
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
                                            {otpSendCount >= MAX_OTP_SENDS ? (
                                                <span className="resend-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    Maximum resends reached. Please wait 10 minutes.
                                                </span>
                                            ) : (
                                                <button
                                                    className="resend-btn"
                                                    disabled={otpResendCooldown > 0 || isSendingOtp}
                                                    onClick={handleSendOtp}
                                                >
                                                    {isSendingOtp
                                                        ? 'Sending...'
                                                        : otpResendCooldown > 0
                                                            ? `Resend OTP in ${otpResendCooldown}s`
                                                            : `Resend OTP (${MAX_OTP_SENDS - otpSendCount} left)`
                                                    }
                                                </button>
                                            )}
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
                                        <div className="sec-title">Pay Fee</div>
                                        <div className="sec-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                                            {selectedStudent?.firstName} {selectedStudent?.lastName}
                                        </div>
                                    </div>
                                    <button className="back-btn" onClick={() => setStep('confirm')}>Back</button>
                                </div>

                                {feeDetails.totalDue <= 0 ? (
                                    <p style={{ textAlign: 'center', color: '#16a34a', padding: '2rem 0', fontSize: '1rem', fontWeight: 700 }}>
                                        No outstanding fees. All clear!
                                    </p>
                                ) : (
                                    <>
                                        <div className="outstanding-box">
                                            <div className="outstanding-lbl">Total Outstanding</div>
                                            <div className="outstanding-val">{Rs}{feeDetails.totalDue.toLocaleString('en-IN')}</div>
                                        </div>

                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Amount to Pay (₹)
                                            </label>
                                            <input
                                                type="number"
                                                value={payAmount}
                                                onChange={e => setPayAmount(e.target.value)}
                                                min="1"
                                                max={feeDetails.totalDue}
                                                step="1"
                                                style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #6366f1', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', boxSizing: 'border-box', outline: 'none' }}
                                            />
                                            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
                                                You can pay partial or full amount
                                            </p>
                                        </div>

                                        <div className="total-row">
                                            <span className="total-lbl">Paying Now</span>
                                            <span className="total-val">{Rs}{getTotalPayAmount().toLocaleString('en-IN')}</span>
                                        </div>

                                        <button className="btn-green" onClick={handlePayment} disabled={isProcessing || getTotalPayAmount() <= 0}>
                                            {isProcessing
                                                ? <><Loader2 size={20} className="spin" /> Processing...</>
                                                : <><CreditCard size={20} /> Pay {getTotalPayAmount() > 0 ? `₹${getTotalPayAmount().toLocaleString('en-IN')}` : 'Securely'}</>
                                            }
                                        </button>

                                        {payError && (
                                            <div style={{ marginTop: '0.75rem', padding: '0.9rem 1rem', backgroundColor: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: '0.75rem', color: '#b91c1c', fontSize: '0.85rem', lineHeight: '1.5', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                                <span style={{ fontWeight: '700', flexShrink: 0 }}>⚠</span>
                                                {payError}
                                                <button onClick={() => setPayError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontWeight: '700', fontSize: '1rem' }} aria-label="Dismiss">×</button>
                                            </div>
                                        )}
                                        <div className="secure">
                                            <ShieldCheck size={13} />
                                            256-bit SSL encrypted &amp; secure
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Verifying HDFC return */}
                        {step === 'verifying' && (
                            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                                <Loader2 size={40} className="spin" style={{ color: '#1d4ed8', margin: '0 auto' }} />
                                <div style={{ marginTop: '1.25rem', color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>Confirming your payment…</div>
                                <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.825rem' }}>Waiting for bank confirmation. Please do not close this tab.</div>
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
                                {transactionSuccess?.payments.map((p: any, i: number) => (
                                    <Link key={p.id} href={`/api/receipts/${p.id}/download`} target="_blank" className="btn-receipt">
                                        <Download size={17} />
                                        Download Receipt{transactionSuccess.payments.length > 1 ? ` ${i + 1}` : ''}
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
