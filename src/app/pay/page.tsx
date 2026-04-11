'use client';

import { useState, useEffect } from 'react';
import { searchStudentsByPhonePublic, getBranchesPublic, getStudentFeesPublic, processPublicPayment } from '@/app/actions/public';
import { Search, CreditCard, Check, Loader2, Download, Phone, ChevronRight, Building2, User, GraduationCap, UserCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PublicPaymentPage() {
    // step: 'branch' | 'search' | 'select' | 'confirm' | 'pay' | 'success'
    const [step, setStep] = useState<'branch' | 'search' | 'select' | 'confirm' | 'pay' | 'success'>('branch');
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionSuccess, setTransactionSuccess] = useState<any>(null);
    const [payError, setPayError] = useState('');

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
            } else if (results.length === 1) {
                setSelectedStudent(results[0]);
                setStep('confirm');
            } else {
                setStep('select');
            }
        } catch {
            setNoResult(true);
        } finally {
            setIsSearching(false);
        }
    };

    const handleConfirmStudent = async (student: any) => {
        setSelectedStudent(student);
        setIsLoadingFees(true);
        try {
            const data = await getStudentFeesPublic(student.id);
            setFeeDetails(data);
            setSelectedInstallments({});
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
        const perInst = total / n;
        return Array.from({ length: n }, (_, i) => {
            const instStart = i * perInst;
            const instEnd = i === n - 1 ? total : (i + 1) * perInst;
            const faceValue = instEnd - instStart;
            const paidTowardThis = Math.max(0, Math.min((fee.paidAmount ?? 0) - instStart, faceValue));
            const due = faceValue - paidTowardThis;
            return {
                index: i,
                label: n === 1 ? 'Full Fee' : `Installment ${i + 1} of ${n}`,
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
            .reduce((sum, inst) => sum + inst.due, 0);
    };

    const handleInstallmentToggle = (feeId: string, instIndex: number) => {
        setSelectedInstallments(prev => {
            const current = prev[feeId] || [];
            const updated = current.includes(instIndex)
                ? current.filter(i => i !== instIndex)
                : [...current, instIndex];
            return { ...prev, [feeId]: updated };
        });
    };

    const handleSelectAll = (fee: any) => {
        const insts = getInstallmentsForFee(fee);
        const unpaid = insts.filter(i => !i.isPaid).map(i => i.index);
        const current = selectedInstallments[fee.id] || [];
        const allSelected = unpaid.every(i => current.includes(i));
        setSelectedInstallments(prev => ({ ...prev, [fee.id]: allSelected ? [] : unpaid }));
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

    const stepIndex = { branch: 1, search: 2, select: 2, confirm: 3, pay: 4, success: 5 }[step];

    const Rs = '\u20B9';

    return (
        <>
            <style jsx global>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }

                .pr {
                    min-height: 100vh;
                    background: #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 2rem 1rem 4rem;
                }

                /* Header */
                .ph { text-align: center; margin-bottom: 2rem; }
                .ph-logo { height: 48px; object-fit: contain; margin-bottom: 0.75rem; }
                .ph-title { font-size: 1.3rem; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
                .ph-sub { font-size: 0.82rem; color: #64748b; margin-top: 0.25rem; }

                /* Step indicator */
                .steps { display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
                .step-pill {
                    display: flex; align-items: center; gap: 0.4rem;
                    padding: 0.3rem 0.75rem; border-radius: 2rem;
                    font-size: 0.72rem; font-weight: 600; color: #94a3b8;
                    white-space: nowrap; transition: all 0.2s;
                }
                .step-pill.active { color: #1d4ed8; background: #eff6ff; }
                .step-pill.done { color: #16a34a; }
                .step-num {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: #e2e8f0; border: 1.5px solid #cbd5e1;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.62rem; font-weight: 700; color: #94a3b8;
                    flex-shrink: 0; transition: all 0.2s;
                }
                .step-pill.active .step-num { background: #2563eb; border-color: #2563eb; color: white; }
                .step-pill.done .step-num { background: #16a34a; border-color: #16a34a; color: white; }
                .step-line { width: 20px; height: 1.5px; background: #e2e8f0; flex-shrink: 0; }
                .step-line.done { background: #16a34a; }

                /* Card */
                .pc {
                    width: 100%; max-width: 420px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 1.25rem;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
                }
                .pc-body { padding: 1.75rem 1.5rem 2rem; }

                /* Section header */
                .sec-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
                .sec-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; }
                .sec-sub { font-size: 0.78rem; color: #64748b; margin-top: 0.2rem; }
                .back-btn { font-size: 0.78rem; font-weight: 600; color: #2563eb; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; margin-top: 0.15rem; }
                .back-btn:hover { color: #1d4ed8; }

                /* Branch grid */
                .bg { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                .bb {
                    background: #f8fafc; border: 1.5px solid #e2e8f0;
                    border-radius: 0.875rem; padding: 1.1rem 0.75rem 1rem;
                    cursor: pointer; text-align: center;
                    transition: border-color 0.18s, background 0.18s, transform 0.12s;
                }
                .bb:hover { border-color: #2563eb; background: #eff6ff; transform: translateY(-1px); }
                .bb:active { transform: translateY(0); }
                .bb-code { font-size: 1.15rem; font-weight: 800; color: #1d4ed8; letter-spacing: 0.03em; margin-bottom: 0.25rem; }
                .bb-name { font-size: 0.73rem; color: #64748b; line-height: 1.3; }

                /* Field */
                .fl { display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.4rem; }
                .fw { position: relative; }
                .fi-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
                .fi {
                    width: 100%; padding: 0.8rem 1rem 0.8rem 2.75rem;
                    background: #f8fafc; border: 1.5px solid #e2e8f0;
                    border-radius: 0.75rem; color: #0f172a; font-size: 1rem;
                    outline: none; margin-bottom: 0.875rem;
                    transition: border-color 0.18s, box-shadow 0.18s;
                }
                .fi:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
                .fi::placeholder { color: #cbd5e1; }

                /* Buttons */
                .btn-blue {
                    width: 100%; padding: 0.875rem;
                    background: #2563eb; color: white; border: none; border-radius: 0.75rem;
                    font-size: 0.925rem; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    transition: background 0.18s, transform 0.1s; margin-top: 0.25rem;
                }
                .btn-blue:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
                .btn-blue:active:not(:disabled) { transform: translateY(0); }
                .btn-blue:disabled { background: #93c5fd; cursor: not-allowed; transform: none; }

                .btn-green {
                    width: 100%; padding: 0.975rem;
                    background: #16a34a; color: white; border: none; border-radius: 0.875rem;
                    font-size: 1rem; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem;
                    transition: background 0.18s, transform 0.1s; margin-bottom: 0.875rem;
                    box-shadow: 0 4px 16px rgba(22,163,74,0.2);
                }
                .btn-green:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
                .btn-green:active:not(:disabled) { transform: translateY(0); }
                .btn-green:disabled { background: #86efac; cursor: not-allowed; transform: none; box-shadow: none; }

                .btn-outline {
                    width: 100%; padding: 0.875rem;
                    background: transparent; color: #64748b;
                    border: 1.5px solid #e2e8f0; border-radius: 0.875rem;
                    font-size: 0.875rem; font-weight: 600; cursor: pointer;
                    transition: border-color 0.18s, color 0.18s;
                }
                .btn-outline:hover { border-color: #2563eb; color: #2563eb; }

                /* Alert */
                .err {
                    background: #fef2f2; border: 1.5px solid #fecaca;
                    border-radius: 0.75rem; padding: 0.7rem 1rem;
                    font-size: 0.8rem; color: #dc2626; margin-bottom: 0.875rem;
                    display: flex; align-items: center; gap: 0.5rem;
                }

                /* Student list card */
                .sc {
                    background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 0.875rem;
                    padding: 0.875rem 1rem; margin-bottom: 0.625rem;
                    cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
                    width: 100%; text-align: left; transition: border-color 0.18s, background 0.18s;
                }
                .sc:hover { border-color: #2563eb; background: #eff6ff; }
                .sc-avatar {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: linear-gradient(135deg, #2563eb, #7c3aed);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.8rem; font-weight: 800; color: white; flex-shrink: 0;
                }
                .sc-name { font-weight: 700; font-size: 0.9rem; color: #0f172a; }
                .sc-meta { font-size: 0.74rem; color: #64748b; margin-top: 0.15rem; }

                /* Confirm card */
                .confirm-card {
                    background: #f8fafc; border: 1.5px solid #e2e8f0;
                    border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.25rem;
                }
                .confirm-avatar {
                    width: 56px; height: 56px; border-radius: 50%;
                    background: linear-gradient(135deg, #2563eb, #7c3aed);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.1rem; font-weight: 800; color: white;
                    margin: 0 auto 0.875rem;
                    box-shadow: 0 4px 12px rgba(37,99,235,0.25);
                }
                .confirm-name { font-size: 1.1rem; font-weight: 800; color: #0f172a; text-align: center; margin-bottom: 1rem; }
                .confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }
                .confirm-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.625rem; padding: 0.625rem 0.75rem; }
                .confirm-item-label { font-size: 0.64rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.2rem; }
                .confirm-item-value { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
                .confirm-check {
                    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
                    font-size: 0.72rem; color: #16a34a; font-weight: 600; margin-top: 0.875rem;
                }

                /* Fee card */
                .fc { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 0.875rem; padding: 1rem; margin-bottom: 0.75rem; }
                .fc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
                .fc-type { font-weight: 700; color: #0f172a; font-size: 0.875rem; }
                .fc-due { font-size: 0.75rem; color: #94a3b8; }
                .fc-due span { color: #475569; font-weight: 600; }

                /* Installment rows */
                .inst-row {
                    display: flex; align-items: center; gap: 0.75rem;
                    padding: 0.6rem 0.75rem; border-radius: 0.625rem;
                    margin-bottom: 0.375rem; cursor: pointer;
                    transition: background 0.15s;
                    border: 1.5px solid transparent;
                }
                .inst-row.selectable { background: #fff; border-color: #e2e8f0; }
                .inst-row.selectable:hover { border-color: #2563eb; background: #eff6ff; }
                .inst-row.selected { background: #eff6ff; border-color: #2563eb; }
                .inst-row.paid-row { background: #f0fdf4; border-color: #bbf7d0; cursor: default; opacity: 0.8; }
                .inst-cb {
                    width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0;
                    border: 2px solid #cbd5e1; background: #fff; display: flex; align-items: center;
                    justify-content: center; transition: all 0.15s;
                }
                .inst-row.selected .inst-cb { background: #2563eb; border-color: #2563eb; }
                .inst-row.paid-row .inst-cb { background: #16a34a; border-color: #16a34a; }
                .inst-label { flex: 1; font-size: 0.82rem; font-weight: 600; color: #1e293b; }
                .inst-amt { font-size: 0.82rem; font-weight: 700; color: #475569; }
                .inst-row.selected .inst-amt { color: #1d4ed8; }
                .inst-row.paid-row .inst-amt { color: #15803d; }
                .inst-badge {
                    font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
                    padding: 0.15rem 0.45rem; border-radius: 0.25rem;
                }
                .badge-paid { background: #dcfce7; color: #15803d; }
                .fc-actions { display: flex; justify-content: flex-end; margin-top: 0.5rem; }
                .fc-selectall {
                    font-size: 0.7rem; font-weight: 800; color: #2563eb;
                    background: none; border: none; cursor: pointer; letter-spacing: 0.03em;
                    padding: 0.2rem 0.4rem; border-radius: 0.3rem;
                    transition: background 0.15s;
                }
                .fc-selectall:hover { background: #eff6ff; }

                /* Total */
                .total-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 1rem 0 1.25rem; border-top: 1.5px solid #f1f5f9; margin-top: 0.25rem;
                }
                .total-lbl { font-size: 0.82rem; color: #64748b; font-weight: 600; }
                .total-val { font-size: 1.65rem; font-weight: 800; color: #0f172a; }

                /* Secure */
                .secure { display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.72rem; color: #94a3b8; }

                /* Outstanding box */
                .outstanding-box {
                    background: #0f172a; border-radius: 0.875rem; padding: 1rem;
                    text-align: center; margin-bottom: 1.25rem;
                }
                .outstanding-lbl { font-size: 0.63rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem; }
                .outstanding-val { font-size: 2rem; font-weight: 800; color: #f8fafc; }

                /* Success */
                .success-wrap { text-align: center; padding: 0.5rem 0; }
                .success-ring {
                    width: 72px; height: 72px; border-radius: 50%;
                    background: #f0fdf4; border: 2px solid #86efac;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem; color: #16a34a;
                }
                .success-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.4rem; }
                .success-sub { font-size: 0.82rem; color: #64748b; margin-bottom: 1.75rem; line-height: 1.6; }
                .btn-receipt {
                    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    width: 100%; padding: 0.875rem;
                    background: #2563eb; color: white; border-radius: 0.875rem;
                    text-decoration: none; font-weight: 700; font-size: 0.875rem;
                    margin-bottom: 0.625rem; transition: background 0.18s;
                }
                .btn-receipt:hover { background: #1d4ed8; }

                /* Footer */
                .pf { text-align: center; margin-top: 1.75rem; color: #cbd5e1; font-size: 0.75rem; }

                /* iOS zoom prevention */
                input, select, textarea { font-size: 16px !important; }

                /* Mobile */
                @media (max-width: 480px) {
                    .pr { padding: 1.25rem 0.875rem 3rem; }
                    .ph { margin-bottom: 1.5rem; }
                    .ph-logo { height: 42px; }
                    .ph-title { font-size: 1.15rem; }
                    .steps { margin-bottom: 1.25rem; }
                    .step-pill { font-size: 0.65rem; padding: 0.28rem 0.6rem; gap: 0.28rem; }
                    .step-num { width: 18px; height: 18px; font-size: 0.58rem; }
                    .step-line { width: 12px; }
                    .pc { border-radius: 1rem; }
                    .pc-body { padding: 1.25rem 1.1rem 1.5rem; }
                    .bb { padding: 0.875rem 0.625rem; }
                    .bb-code { font-size: 1rem; }
                    .confirm-card { padding: 1.1rem; }
                    .confirm-avatar { width: 48px; height: 48px; font-size: 0.95rem; }
                    .confirm-name { font-size: 0.975rem; }
                    .outstanding-val { font-size: 1.7rem; }
                    .total-val { font-size: 1.45rem; }
                    .btn-blue, .btn-green { padding: 0.875rem; font-size: 0.9rem; }
                }
                @media (max-width: 360px) {
                    .bg { grid-template-columns: 1fr; }
                    .confirm-grid { grid-template-columns: 1fr; }
                    .step-pill > span:last-child { display: none; }
                }

            `}</style>

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

                <div className="pc">
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

                <div className="pf">&copy; {new Date().getFullYear()} Sprout School &middot; All rights reserved</div>
            </div>
        </>
    );
}
