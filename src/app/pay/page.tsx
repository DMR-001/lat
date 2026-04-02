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
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionSuccess, setTransactionSuccess] = useState<any>(null);

    useEffect(() => { getBranchesPublic().then(setBranches); }, []);

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
            const initialInputs: Record<string, string> = {};
            data.fees.forEach((f: any) => { initialInputs[f.id] = ''; });
            setPaymentInputs(initialInputs);
            setStep('pay');
        } catch {
            alert('Error fetching fee details. Please try again.');
        } finally {
            setIsLoadingFees(false);
        }
    };

    const handleInputChange = (feeId: string, val: string) => {
        setPaymentInputs(prev => ({ ...prev, [feeId]: val }));
    };

    const getTotalPayAmount = () =>
        Object.values(paymentInputs).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    const handlePayment = async () => {
        if (getTotalPayAmount() <= 0) return;
        setIsProcessing(true);
        const payments = Object.entries(paymentInputs)
            .map(([feeId, val]) => ({ feeId, amount: parseFloat(val) || 0 }))
            .filter(p => p.amount > 0);
        await new Promise(r => setTimeout(r, 1500));
        try {
            const result = await processPublicPayment(selectedStudent.id, payments);
            setTransactionSuccess(result);
            setStep('success');
        } catch {
            alert('Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getInitials = (s: any) =>
        `${s?.firstName?.[0] ?? ''}${s?.lastName?.[0] ?? ''}`.toUpperCase();

    const stepIndex = { branch: 1, search: 2, select: 2, confirm: 3, pay: 4, success: 5 }[step];

    return (
        <>
            <style jsx global>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                body { background: #060b14; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

                .pr {
                    min-height: 100vh;
                    background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.15) 0%, transparent 70%),
                                linear-gradient(180deg, #060b14 0%, #0a1628 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 2.5rem 1rem 4rem;
                }

                /* â”€â”€ Header â”€â”€ */
                .ph { text-align: center; margin-bottom: 2.5rem; }
                .ph-logo { height: 48px; object-fit: contain; margin-bottom: 1rem; }
                .ph-title { font-size: 1.35rem; font-weight: 800; color: #f8fafc; letter-spacing: -0.02em; }
                .ph-sub { font-size: 0.82rem; color: #475569; margin-top: 0.3rem; }

                /* â”€â”€ Step pill â”€â”€ */
                .steps {
                    display: flex; align-items: center; justify-content: center;
                    gap: 0; margin-bottom: 2rem;
                }
                .step-pill {
                    display: flex; align-items: center; gap: 0.4rem;
                    padding: 0.35rem 0.85rem;
                    border-radius: 2rem;
                    font-size: 0.72rem; font-weight: 600;
                    color: #334155;
                    transition: all 0.3s;
                    white-space: nowrap;
                }
                .step-pill.done { color: #22c55e; }
                .step-pill.active { color: #f8fafc; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); }
                .step-num {
                    width: 20px; height: 20px; border-radius: 50%;
                    background: #1e293b; border: 1.5px solid #334155;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.65rem; font-weight: 700; color: #475569;
                    transition: all 0.3s; flex-shrink: 0;
                }
                .step-pill.active .step-num { background: #3b82f6; border-color: #3b82f6; color: white; }
                .step-pill.done .step-num { background: #22c55e; border-color: #22c55e; color: white; }
                .step-line { width: 24px; height: 1.5px; background: #1e293b; flex-shrink: 0; }
                .step-line.done { background: #22c55e; }

                /* â”€â”€ Card â”€â”€ */
                .pc {
                    width: 100%; max-width: 420px;
                    background: #0d1829;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 1.5rem;
                    box-shadow: 0 0 0 1px rgba(59,130,246,0.05), 0 32px 64px rgba(0,0,0,0.6);
                    overflow: hidden;
                }
                .pc-body { padding: 1.75rem 1.5rem 2rem; }

                /* â”€â”€ Section header â”€â”€ */
                .sec-head {
                    display: flex; align-items: flex-start; justify-content: space-between;
                    margin-bottom: 1.5rem;
                }
                .sec-title { font-size: 1.05rem; font-weight: 700; color: #f1f5f9; }
                .sec-sub { font-size: 0.78rem; color: #475569; margin-top: 0.2rem; }
                .back-btn {
                    font-size: 0.78rem; font-weight: 600; color: #3b82f6;
                    background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0;
                    margin-top: 0.15rem;
                }

                /* â”€â”€ Branch grid â”€â”€ */
                .bg { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
                @media (max-width: 360px) { .bg { grid-template-columns: 1fr; } }
                .bb {
                    background: #111827;
                    border: 1.5px solid #1e293b;
                    border-radius: 1rem;
                    padding: 1.1rem 0.875rem 1rem;
                    cursor: pointer; text-align: center;
                    transition: border-color 0.2s, transform 0.15s, background 0.2s;
                }
                .bb:hover { border-color: #3b82f6; background: rgba(59,130,246,0.07); transform: translateY(-1px); }
                .bb:active { transform: translateY(0); }
                .bb-code { font-size: 1.2rem; font-weight: 800; color: #60a5fa; letter-spacing: 0.04em; margin-bottom: 0.3rem; }
                .bb-name { font-size: 0.75rem; color: #64748b; line-height: 1.3; }

                /* â”€â”€ Field â”€â”€ */
                .fl { display: block; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; }
                .fw { position: relative; }
                .fi-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #334155; pointer-events: none; }
                .fi {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 3rem;
                    background: #111827;
                    border: 1.5px solid #1e293b;
                    border-radius: 0.875rem;
                    color: #f1f5f9;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    margin-bottom: 1rem;
                }
                .fi:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
                .fi::placeholder { color: #1e3a5f; }

                /* â”€â”€ Buttons â”€â”€ */
                .btn-blue {
                    width: 100%; padding: 0.9rem;
                    background: #2563eb;
                    color: white; border: none; border-radius: 0.875rem;
                    font-size: 0.925rem; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    transition: background 0.2s, transform 0.1s;
                    letter-spacing: 0.01em; margin-top: 0.25rem;
                }
                .btn-blue:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
                .btn-blue:active:not(:disabled) { transform: translateY(0); }
                .btn-blue:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

                .btn-green {
                    width: 100%; padding: 1rem;
                    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                    color: white; border: none; border-radius: 0.875rem;
                    font-size: 0.975rem; font-weight: 700;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem;
                    transition: opacity 0.2s, transform 0.1s;
                    letter-spacing: 0.01em; margin-bottom: 0.875rem;
                    box-shadow: 0 4px 20px rgba(16,185,129,0.25);
                }
                .btn-green:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
                .btn-green:active:not(:disabled) { transform: translateY(0); }
                .btn-green:disabled { opacity: 0.3; cursor: not-allowed; transform: none; box-shadow: none; }

                .btn-outline {
                    width: 100%; padding: 0.875rem;
                    background: transparent; color: #64748b;
                    border: 1.5px solid #1e293b; border-radius: 0.875rem;
                    font-size: 0.875rem; font-weight: 600;
                    cursor: pointer; transition: border-color 0.2s, color 0.2s;
                }
                .btn-outline:hover { border-color: #334155; color: #94a3b8; }

                /* â”€â”€ Alert â”€â”€ */
                .err {
                    background: rgba(127,29,29,0.3);
                    border: 1px solid rgba(239,68,68,0.3);
                    border-radius: 0.75rem;
                    padding: 0.7rem 1rem;
                    font-size: 0.8rem; color: #fca5a5;
                    margin-bottom: 1rem;
                    display: flex; align-items: center; gap: 0.5rem;
                }

                /* â”€â”€ Student card (select list) â”€â”€ */
                .sc {
                    background: #111827; border: 1.5px solid #1e293b; border-radius: 1rem;
                    padding: 1rem 1.1rem; margin-bottom: 0.625rem;
                    cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
                    transition: border-color 0.2s, background 0.2s;
                    width: 100%; text-align: left;
                }
                .sc:hover { border-color: #3b82f6; background: rgba(59,130,246,0.04); }
                .sc-avatar {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: linear-gradient(135deg, #1d4ed8, #7c3aed);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.8rem; font-weight: 800; color: white; flex-shrink: 0;
                    letter-spacing: 0.02em;
                }
                .sc-name { font-weight: 700; font-size: 0.9rem; color: #f1f5f9; }
                .sc-meta { font-size: 0.75rem; color: #475569; margin-top: 0.15rem; }

                /* â”€â”€ Confirm student card â”€â”€ */
                .confirm-card {
                    background: linear-gradient(135deg, rgba(37,99,235,0.12), rgba(124,58,237,0.08));
                    border: 1.5px solid rgba(59,130,246,0.2);
                    border-radius: 1.125rem;
                    padding: 1.5rem;
                    margin-bottom: 1.25rem;
                }
                .confirm-avatar {
                    width: 56px; height: 56px; border-radius: 50%;
                    background: linear-gradient(135deg, #1d4ed8, #7c3aed);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.1rem; font-weight: 800; color: white;
                    margin: 0 auto 1rem;
                    box-shadow: 0 4px 16px rgba(59,130,246,0.35);
                    letter-spacing: 0.02em;
                }
                .confirm-name { font-size: 1.1rem; font-weight: 800; color: #f8fafc; text-align: center; margin-bottom: 1rem; }
                .confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }
                .confirm-item {
                    background: rgba(0,0,0,0.25); border-radius: 0.625rem;
                    padding: 0.625rem 0.75rem;
                }
                .confirm-item-label { font-size: 0.65rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.2rem; }
                .confirm-item-value { font-size: 0.82rem; font-weight: 600; color: #cbd5e1; }
                .confirm-check {
                    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
                    font-size: 0.72rem; color: #22c55e; font-weight: 600;
                    margin-top: 0.875rem;
                }

                /* â”€â”€ Fee card â”€â”€ */
                .fc {
                    background: #111827; border: 1.5px solid #1e293b; border-radius: 1rem;
                    padding: 1rem 1.1rem; margin-bottom: 0.75rem;
                }
                .fc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.625rem; }
                .fc-type { font-weight: 700; color: #e2e8f0; font-size: 0.875rem; }
                .fc-due { font-size: 0.75rem; color: #475569; }
                .fc-due span { color: #94a3b8; font-weight: 600; }
                .fc-inp-wrap { position: relative; }
                .fc-inp {
                    width: 100%;
                    padding: 0.75rem 4rem 0.75rem 2.25rem;
                    background: #0d1829; border: 1.5px solid #1e293b;
                    border-radius: 0.75rem; color: #f1f5f9; font-size: 0.9rem; outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .fc-inp:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
                .fc-inp::placeholder { color: #1e3a5f; }
                .fc-sym { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #334155; font-size: 0.85rem; pointer-events: none; font-weight: 600; }
                .fc-full {
                    position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
                    background: rgba(37,99,235,0.15); border: 1px solid rgba(59,130,246,0.2);
                    border-radius: 0.375rem; color: #60a5fa; font-size: 0.68rem; font-weight: 800;
                    padding: 0.3rem 0.55rem; cursor: pointer; letter-spacing: 0.04em;
                    transition: background 0.2s, color 0.2s;
                }
                .fc-full:hover { background: #2563eb; color: white; border-color: #2563eb; }

                /* â”€â”€ Total bar â”€â”€ */
                .total-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 1.1rem 0 1.25rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    margin-top: 0.25rem;
                }
                .total-lbl { font-size: 0.8rem; color: #475569; font-weight: 600; }
                .total-val { font-size: 1.7rem; font-weight: 800; color: #60a5fa; }

                /* â”€â”€ Secure note â”€â”€ */
                .secure {
                    display: flex; align-items: center; justify-content: center; gap: 0.35rem;
                    font-size: 0.72rem; color: #334155; margin-top: 0.25rem;
                }

                /* â”€â”€ Outstanding box â”€â”€ */
                .outstanding-box {
                    background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.08));
                    border: 1px solid rgba(59,130,246,0.15);
                    border-radius: 1rem; padding: 1.1rem;
                    text-align: center; margin-bottom: 1.25rem;
                }
                .outstanding-lbl { font-size: 0.65rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem; }
                .outstanding-val { font-size: 2rem; font-weight: 800; color: #f8fafc; }

                /* â”€â”€ Success â”€â”€ */
                .success-wrap { text-align: center; padding: 0.5rem 0; }
                .success-ring {
                    width: 72px; height: 72px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%);
                    border: 2px solid rgba(34,197,94,0.3);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem; color: #22c55e;
                }
                .success-title { font-size: 1.25rem; font-weight: 800; color: #f8fafc; margin-bottom: 0.4rem; }
                .success-sub { font-size: 0.82rem; color: #475569; margin-bottom: 1.75rem; line-height: 1.5; }
                .btn-receipt {
                    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    width: 100%; padding: 0.875rem;
                    background: #2563eb; color: white; border-radius: 0.875rem;
                    text-decoration: none; font-weight: 700; font-size: 0.875rem;
                    margin-bottom: 0.625rem; transition: background 0.2s;
                }
                .btn-receipt:hover { background: #1d4ed8; }

                /* â”€â”€ Footer â”€â”€ */
                .pf { text-align: center; margin-top: 1.75rem; color: #1e293b; font-size: 0.75rem; }

                /* iOS zoom prevention */
                input, select, textarea { font-size: 16px !important; }

                /* ── Mobile ── */
                @media (max-width: 480px) {
                    .pr { padding: 1.25rem 0.75rem 3rem; }
                    .ph { margin-bottom: 1.5rem; }
                    .ph-logo { height: 40px; margin-bottom: 0.625rem; }
                    .ph-title { font-size: 1.15rem; }
                    .ph-sub { font-size: 0.78rem; }
                    .steps { margin-bottom: 1.25rem; }
                    .step-pill { font-size: 0.63rem; padding: 0.28rem 0.55rem; gap: 0.28rem; }
                    .step-num { width: 18px; height: 18px; font-size: 0.6rem; }
                    .step-line { width: 12px; }
                    .pc { border-radius: 1rem; }
                    .pc-body { padding: 1.25rem 1rem 1.5rem; }
                    .sec-title { font-size: 0.95rem; }
                    .sec-sub { font-size: 0.72rem; }
                    .bg { gap: 0.625rem; }
                    .bb { padding: 0.9rem 0.625rem 0.85rem; border-radius: 0.875rem; }
                    .bb-code { font-size: 1.05rem; }
                    .bb-name { font-size: 0.7rem; }
                    .fi { padding: 0.8rem 1rem 0.8rem 2.75rem; border-radius: 0.75rem; }
                    .btn-blue, .btn-green, .btn-outline { padding: 0.85rem; font-size: 0.875rem; border-radius: 0.75rem; }
                    .confirm-card { padding: 1.1rem 1rem; }
                    .confirm-avatar { width: 48px; height: 48px; font-size: 0.95rem; margin-bottom: 0.75rem; }
                    .confirm-name { font-size: 0.975rem; margin-bottom: 0.75rem; }
                    .confirm-grid { gap: 0.5rem; }
                    .confirm-item { padding: 0.5rem 0.625rem; }
                    .confirm-item-value { font-size: 0.78rem; }
                    .outstanding-box { padding: 0.875rem; }
                    .outstanding-val { font-size: 1.65rem; }
                    .fc { padding: 0.875rem; border-radius: 0.875rem; }
                    .fc-type { font-size: 0.82rem; }
                    .fc-inp { padding: 0.7rem 4rem 0.7rem 2rem; border-radius: 0.625rem; }
                    .total-row { padding: 0.875rem 0 1rem; }
                    .total-val { font-size: 1.45rem; }
                    .sc { padding: 0.8rem 0.875rem; border-radius: 0.875rem; }
                    .sc-avatar { width: 36px; height: 36px; font-size: 0.7rem; }
                    .sc-name { font-size: 0.85rem; }
                    .sc-meta { font-size: 0.7rem; }
                    .success-ring { width: 64px; height: 64px; }
                    .success-title { font-size: 1.1rem; }
                }

                @media (max-width: 360px) {
                    .bg { grid-template-columns: 1fr; }
                    .confirm-grid { grid-template-columns: 1fr; }
                    .step-pill span:not(.step-num) { display: none; }
                }
            `}</style>

            <div className="pr">
                {/* Header */}
                <div className="ph">
                    <img src="/sprout-logo.png" alt="Sprout School" className="ph-logo" />
                    <div className="ph-title">Fee Payment Portal</div>
                    <div className="ph-sub">Secure online payment for school fees</div>
                </div>

                {/* Step indicator */}
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

                        {/* â”€â”€ Branch â”€â”€ */}
                        {step === 'branch' && (
                            <div>
                                <div className="sec-head" style={{ alignItems: 'center' }}>
                                    <div>
                                        <div className="sec-title">Select Branch</div>
                                        <div className="sec-sub">Choose your ward's school branch</div>
                                    </div>
                                    <Building2 size={20} color="#334155" />
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
                                    <p style={{ textAlign: 'center', color: '#334155', padding: '1.5rem 0', fontSize: '0.85rem' }}>Loadingâ€¦</p>
                                )}
                            </div>
                        )}

                        {/* â”€â”€ Search â”€â”€ */}
                        {step === 'search' && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Find Student</div>
                                        <div className="sec-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
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
                                        <span>âš </span> No student found for this number. Please check and retry.
                                    </div>
                                )}

                                <button
                                    className="btn-blue"
                                    onClick={handleSearch}
                                    disabled={isSearching || phone.length < 10}
                                >
                                    {isSearching
                                        ? <><Loader2 size={17} className="animate-spin" /> Searchingâ€¦</>
                                        : <><Search size={17} /> Search</>
                                    }
                                </button>
                            </div>
                        )}

                        {/* â”€â”€ Select (multiple) â”€â”€ */}
                        {step === 'select' && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Select Student</div>
                                        <div className="sec-sub">{searchResults.length} students found for {phone}</div>
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
                                                {s.class?.name}{s.class?.section ? ` Â· ${s.class.section}` : ''} &nbsp;Â·&nbsp; Adm: {s.admissionNo}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color="#334155" style={{ flexShrink: 0 }} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* â”€â”€ Confirm student â”€â”€ */}
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
                                                {selectedStudent.class?.name ?? 'â€”'}{selectedStudent.class?.section ? ` (${selectedStudent.class.section})` : ''}
                                            </div>
                                        </div>
                                        <div className="confirm-item">
                                            <div className="confirm-item-label">Admission No</div>
                                            <div className="confirm-item-value">{selectedStudent.admissionNo ?? 'â€”'}</div>
                                        </div>
                                        <div className="confirm-item" style={{ gridColumn: '1 / -1' }}>
                                            <div className="confirm-item-label">Parent / Father</div>
                                            <div className="confirm-item-value">{selectedStudent.parentName ?? 'â€”'}</div>
                                        </div>
                                    </div>
                                    <div className="confirm-check">
                                        <ShieldCheck size={13} /> Verified from school records
                                    </div>
                                </div>

                                <button
                                    className="btn-blue"
                                    onClick={() => handleConfirmStudent(selectedStudent)}
                                    disabled={isLoadingFees}
                                >
                                    {isLoadingFees
                                        ? <><Loader2 size={17} className="animate-spin" /> Loading feesâ€¦</>
                                        : <>Proceed to Pay &nbsp;<ChevronRight size={16} /></>
                                    }
                                </button>
                            </div>
                        )}

                        {/* â”€â”€ Pay â”€â”€ */}
                        {step === 'pay' && feeDetails && (
                            <div>
                                <div className="sec-head">
                                    <div>
                                        <div className="sec-title">Fee Details</div>
                                        <div className="sec-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                                            {selectedStudent?.firstName} {selectedStudent?.lastName}
                                        </div>
                                    </div>
                                    <button className="back-btn" onClick={() => setStep('confirm')}>Back</button>
                                </div>

                                <div className="outstanding-box">
                                    <div className="outstanding-lbl">Total Outstanding</div>
                                    <div className="outstanding-val">â‚¹{feeDetails.totalDue.toLocaleString('en-IN')}</div>
                                </div>

                                {feeDetails.fees.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#475569', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                                        No outstanding fees â€” all clear! âœ“
                                    </p>
                                )}

                                {feeDetails.fees.map(fee => (
                                    <div key={fee.id} className="fc">
                                        <div className="fc-head">
                                            <span className="fc-type">{fee.type}</span>
                                            <span className="fc-due">Due <span>â‚¹{fee.due.toLocaleString('en-IN')}</span></span>
                                        </div>
                                        <div className="fc-inp-wrap">
                                            <span className="fc-sym">â‚¹</span>
                                            <input
                                                className="fc-inp"
                                                type="number"
                                                inputMode="decimal"
                                                placeholder={`Enter amount (max ${fee.due})`}
                                                value={paymentInputs[fee.id] || ''}
                                                onChange={e => handleInputChange(fee.id, e.target.value)}
                                            />
                                            <button className="fc-full" onClick={() => handleInputChange(fee.id, fee.due.toString())}>
                                                FULL
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="total-row">
                                    <span className="total-lbl">Paying Now</span>
                                    <span className="total-val">â‚¹{getTotalPayAmount().toLocaleString('en-IN')}</span>
                                </div>

                                <button
                                    className="btn-green"
                                    onClick={handlePayment}
                                    disabled={isProcessing || getTotalPayAmount() <= 0}
                                >
                                    {isProcessing
                                        ? <><Loader2 size={20} className="animate-spin" /> Processingâ€¦</>
                                        : <><CreditCard size={20} /> Pay Securely</>
                                    }
                                </button>
                                <div className="secure">
                                    <ShieldCheck size={13} />
                                    256-bit SSL encrypted &amp; secure
                                </div>
                            </div>
                        )}

                        {/* â”€â”€ Success â”€â”€ */}
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
                                    <Link
                                        key={p.id}
                                        href={`/api/receipts/${p.id}/download`}
                                        target="_blank"
                                        className="btn-receipt"
                                    >
                                        <Download size={17} />
                                        Receipt â€” {p.fee?.type || 'General'}
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
