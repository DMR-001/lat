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

                /* ── Header ── */
                .ph { text-align: center; margin-bottom: 2.5rem; }
                .ph-logo { height: 48px; object-fit: contain; margin-bottom: 1rem; }
                .ph-title { font-size: 1.35rem; font-weight: 800; color: #f8fafc; letter-spacing: -0.02em; }
                .ph-sub { font-size: 0.82rem; color: #475569; margin-top: 0.3rem; }

                /* ── Step pill ── */
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

                /* ── Card ── */
                .pc {
                    width: 100%; max-width: 420px;
                    background: #0d1829;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 1.5rem;
                    box-shadow: 0 0 0 1px rgba(59,130,246,0.05), 0 32px 64px rgba(0,0,0,0.6);
                    overflow: hidden;
                }
                .pc-body { padding: 1.75rem 1.5rem 2rem; }

                /* ── Section header ── */
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

                /* ── Branch grid ── */
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

                /* ── Field ── */
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

                /* ── Buttons ── */
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

                /* ── Alert ── */
                .err {
                    background: rgba(127,29,29,0.3);
                    border: 1px solid rgba(239,68,68,0.3);
                    border-radius: 0.75rem;
                    padding: 0.7rem 1rem;
                    font-size: 0.8rem; color: #fca5a5;
                    margin-bottom: 1rem;
                    display: flex; align-items: center; gap: 0.5rem;
                }

                /* ── Student card (select list) ── */
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

                /* ── Confirm student card ── */
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

                /* ── Fee card ── */
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

                /* ── Total bar ── */
                .total-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 1.1rem 0 1.25rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    margin-top: 0.25rem;
                }
                .total-lbl { font-size: 0.8rem; color: #475569; font-weight: 600; }
                .total-val { font-size: 1.7rem; font-weight: 800; color: #60a5fa; }

                /* ── Secure note ── */
                .secure {
                    display: flex; align-items: center; justify-content: center; gap: 0.35rem;
                    font-size: 0.72rem; color: #334155; margin-top: 0.25rem;
                }

                /* ── Outstanding box ── */
                .outstanding-box {
                    background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.08));
                    border: 1px solid rgba(59,130,246,0.15);
                    border-radius: 1rem; padding: 1.1rem;
                    text-align: center; margin-bottom: 1.25rem;
                }
                .outstanding-lbl { font-size: 0.65rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem; }
                .outstanding-val { font-size: 2rem; font-weight: 800; color: #f8fafc; }

                /* ── Success ── */
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

                /* ── Footer ── */
                .pf { text-align: center; margin-top: 1.75rem; color: #1e293b; font-size: 0.75rem; }

                /* iOS zoom prevention */
                input, select, textarea { font-size: 16px !important; }
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

                        {/* ── Branch ── */}
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
                                    <p style={{ textAlign: 'center', color: '#334155', padding: '1.5rem 0', fontSize: '0.85rem' }}>Loading…</p>
                                )}
                            </div>
                        )}

                        {/* ── Search ── */}
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
                                        <span>⚠</span> No student found for this number. Please check and retry.
                                    </div>
                                )}

                                <button
                                    className="btn-blue"
                                    onClick={handleSearch}
                                    disabled={isSearching || phone.length < 10}
                                >
                                    {isSearching
                                        ? <><Loader2 size={17} className="animate-spin" /> Searching…</>
                                        : <><Search size={17} /> Search</>
                                    }
                                </button>
                            </div>
                        )}

                        {/* ── Select (multiple) ── */}
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
                                                {s.class?.name}{s.class?.section ? ` · ${s.class.section}` : ''} &nbsp;·&nbsp; Adm: {s.admissionNo}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color="#334155" style={{ flexShrink: 0 }} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── Confirm student ── */}
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
                                                {selectedStudent.class?.name ?? '—'}{selectedStudent.class?.section ? ` (${selectedStudent.class.section})` : ''}
                                            </div>
                                        </div>
                                        <div className="confirm-item">
                                            <div className="confirm-item-label">Admission No</div>
                                            <div className="confirm-item-value">{selectedStudent.admissionNo ?? '—'}</div>
                                        </div>
                                        <div className="confirm-item" style={{ gridColumn: '1 / -1' }}>
                                            <div className="confirm-item-label">Parent / Father</div>
                                            <div className="confirm-item-value">{selectedStudent.parentName ?? '—'}</div>
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
                                        ? <><Loader2 size={17} className="animate-spin" /> Loading fees…</>
                                        : <>Proceed to Pay &nbsp;<ChevronRight size={16} /></>
                                    }
                                </button>
                            </div>
                        )}

                        {/* ── Pay ── */}
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
                                    <div className="outstanding-val">₹{feeDetails.totalDue.toLocaleString('en-IN')}</div>
                                </div>

                                {feeDetails.fees.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#475569', padding: '1.5rem 0', fontSize: '0.875rem' }}>
                                        No outstanding fees — all clear! ✓
                                    </p>
                                )}

                                {feeDetails.fees.map(fee => (
                                    <div key={fee.id} className="fc">
                                        <div className="fc-head">
                                            <span className="fc-type">{fee.type}</span>
                                            <span className="fc-due">Due <span>₹{fee.due.toLocaleString('en-IN')}</span></span>
                                        </div>
                                        <div className="fc-inp-wrap">
                                            <span className="fc-sym">₹</span>
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
                                    <span className="total-val">₹{getTotalPayAmount().toLocaleString('en-IN')}</span>
                                </div>

                                <button
                                    className="btn-green"
                                    onClick={handlePayment}
                                    disabled={isProcessing || getTotalPayAmount() <= 0}
                                >
                                    {isProcessing
                                        ? <><Loader2 size={20} className="animate-spin" /> Processing…</>
                                        : <><CreditCard size={20} /> Pay Securely</>
                                    }
                                </button>
                                <div className="secure">
                                    <ShieldCheck size={13} />
                                    256-bit SSL encrypted &amp; secure
                                </div>
                            </div>
                        )}

                        {/* ── Success ── */}
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
                                        Receipt — {p.fee?.type || 'General'}
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

                <div className="pf">&copy; {new Date().getFullYear()} Sprout School · All rights reserved</div>
            </div>
        </>
    );
}
                .pay-root {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2744 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 2rem 1rem 3rem;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                .pay-header { text-align: center; margin-bottom: 2rem; }
                .pay-logo { height: 52px; object-fit: contain; margin-bottom: 0.75rem; }
                .pay-title { font-size: 1.4rem; font-weight: 700; color: #f1f5f9; letter-spacing: -0.01em; }
                .pay-subtitle { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }

                .pay-card {
                    width: 100%;
                    max-width: 440px;
                    background: #1e293b;
                    border-radius: 1.25rem;
                    border: 1px solid #334155;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                }
                .pay-progress {
                    display: flex;
                    gap: 4px;
                    padding: 1rem 1.25rem 0;
                }
                .pay-progress-bar {
                    height: 3px;
                    flex: 1;
                    border-radius: 2px;
                    background: #334155;
                    transition: background 0.4s;
                }
                .pay-progress-bar.active { background: #3b82f6; }
                .pay-body { padding: 1.75rem 1.5rem; }

                .step-icon {
                    width: 52px; height: 52px;
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                }
                .step-title { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; text-align: center; margin-bottom: 0.3rem; }
                .step-desc { font-size: 0.8rem; color: #64748b; text-align: center; margin-bottom: 1.75rem; }

                .branch-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }
                @media (max-width: 380px) {
                    .branch-grid { grid-template-columns: 1fr; }
                }
                .branch-btn {
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 0.875rem;
                    padding: 1rem 0.75rem;
                    cursor: pointer;
                    text-align: center;
                    transition: border-color 0.2s, background 0.2s;
                    color: #e2e8f0;
                }
                .branch-btn:hover { border-color: #3b82f6; background: #1e3a5f; }
                .branch-code {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #3b82f6;
                    margin-bottom: 0.3rem;
                    letter-spacing: 0.05em;
                }
                .branch-name { font-size: 0.78rem; color: #94a3b8; }

                .field-label {
                    display: block;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    margin-bottom: 0.5rem;
                }
                .field-input {
                    width: 100%;
                    padding: 0.8rem 1rem 0.8rem 2.75rem;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 0.75rem;
                    color: #f1f5f9;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .field-input:focus { border-color: #3b82f6; }
                .field-input::placeholder { color: #475569; }
                .field-wrap { position: relative; margin-bottom: 1.25rem; }
                .field-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #475569; pointer-events: none; }

                .btn-primary {
                    width: 100%;
                    padding: 0.9rem;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 0.75rem;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: background 0.2s, opacity 0.2s;
                    letter-spacing: 0.01em;
                }
                .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
                .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

                .btn-ghost {
                    background: none;
                    border: none;
                    color: #3b82f6;
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0;
                }

                .student-card {
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 0.875rem;
                    padding: 0.9rem 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.75rem;
                    transition: border-color 0.2s;
                    margin-bottom: 0.625rem;
                }
                .student-card:hover { border-color: #3b82f6; }
                .student-name { font-weight: 600; font-size: 0.95rem; color: #f1f5f9; }
                .student-meta { font-size: 0.78rem; color: #64748b; margin-top: 0.2rem; }

                .fee-card {
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 0.875rem;
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                }
                .fee-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.625rem;
                }
                .fee-type { font-weight: 600; color: #e2e8f0; font-size: 0.9rem; }
                .fee-due { font-size: 0.8rem; color: #64748b; }
                .fee-input-wrap { position: relative; }
                .fee-input {
                    width: 100%;
                    padding: 0.65rem 3.5rem 0.65rem 2rem;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 0.625rem;
                    color: #f1f5f9;
                    font-size: 0.9rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .fee-input:focus { border-color: #3b82f6; }
                .fee-input::placeholder { color: #475569; }
                .fee-rupee { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #475569; font-size: 0.85rem; pointer-events: none; }
                .fee-full-btn {
                    position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
                    background: #1e3a5f; border: none; border-radius: 0.375rem;
                    color: #3b82f6; font-size: 0.72rem; font-weight: 700;
                    padding: 0.25rem 0.5rem; cursor: pointer; letter-spacing: 0.02em;
                    transition: background 0.2s;
                }
                .fee-full-btn:hover { background: #2563eb; color: white; }

                .total-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 0;
                    border-top: 1px solid #334155;
                    margin-top: 0.5rem;
                }
                .total-label { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
                .total-amount { font-size: 1.6rem; font-weight: 800; color: #3b82f6; }

                .btn-pay {
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #059669, #10b981);
                    color: white;
                    border: none;
                    border-radius: 0.875rem;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: opacity 0.2s;
                    letter-spacing: 0.01em;
                    margin-bottom: 0.75rem;
                }
                .btn-pay:hover:not(:disabled) { opacity: 0.9; }
                .btn-pay:disabled { opacity: 0.4; cursor: not-allowed; }

                .secure-note { font-size: 0.72rem; color: #475569; text-align: center; }

                .success-icon {
                    width: 68px; height: 68px;
                    background: #052e16;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                    color: #22c55e;
                }
                .success-title { font-size: 1.3rem; font-weight: 700; color: #f1f5f9; text-align: center; margin-bottom: 0.4rem; }
                .success-sub { font-size: 0.85rem; color: #64748b; text-align: center; margin-bottom: 1.75rem; }

                .btn-receipt {
                    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    width: 100%;
                    padding: 0.875rem;
                    background: #2563eb;
                    color: white;
                    border-radius: 0.75rem;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 0.625rem;
                    transition: background 0.2s;
                }
                .btn-receipt:hover { background: #1d4ed8; }

                .btn-outline {
                    width: 100%;
                    padding: 0.875rem;
                    background: transparent;
                    color: #94a3b8;
                    border: 1px solid #334155;
                    border-radius: 0.75rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: border-color 0.2s;
                }
                .btn-outline:hover { border-color: #64748b; color: #f1f5f9; }

                .chip {
                    display: inline-flex; align-items: center; gap: 0.35rem;
                    background: #0f172a; border: 1px solid #334155;
                    border-radius: 2rem; padding: 0.3rem 0.75rem;
                    font-size: 0.78rem; color: #94a3b8;
                    margin-top: 0.75rem;
                }
                .chip-dot { width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; }

                .error-msg {
                    background: #450a0a;
                    border: 1px solid #7f1d1d;
                    border-radius: 0.625rem;
                    padding: 0.65rem 0.875rem;
                    font-size: 0.8rem;
                    color: #fca5a5;
                    margin-bottom: 1rem;
                }

                .pay-footer { text-align: center; margin-top: 1.5rem; color: #374151; font-size: 0.78rem; }
                .pay-footer a { color: #475569; text-decoration: none; }

                /* Prevent iOS input zoom */
                input, select, textarea { font-size: 16px !important; }
            `}</style>

            <div className="pay-root">
                <div className="pay-header">
                    <img src="/sprout-logo.png" alt="Sprout School" className="pay-logo" />
                    <div className="pay-title">Fee Payment Portal</div>
                    <div className="pay-subtitle">Secure online payment for school fees</div>
                </div>

                <div className="pay-card">
                    {/* Progress */}
                    <div className="pay-progress">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`pay-progress-bar${stepIndex >= s ? ' active' : ''}`} />
                        ))}
                    </div>

                    <div className="pay-body">

                        {/* ── Branch Selection ── */}
                        {step === 'branch' && (
                            <div>
                                <div className="step-icon" style={{ background: '#1e3a5f' }}>
                                    <Building2 size={24} color="#3b82f6" />
                                </div>
                                <div className="step-title">Select Branch</div>
                                <div className="step-desc">Choose your ward's school branch</div>

                                <div className="branch-grid">
                                    {branches.map(b => (
                                        <button key={b.id} className="branch-btn" onClick={() => handleBranchSelect(b)}>
                                            <div className="branch-code">{b.code}</div>
                                            <div className="branch-name">{b.name}</div>
                                        </button>
                                    ))}
                                </div>
                                {branches.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Loading branches...</p>
                                )}
                            </div>
                        )}

                        {/* ── Phone Search ── */}
                        {step === 'search' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div className="step-title" style={{ textAlign: 'left', margin: 0 }}>Find Student</div>
                                        <div className="chip">
                                            <span className="chip-dot" />
                                            {selectedBranch?.name}
                                        </div>
                                    </div>
                                    <button className="btn-ghost" onClick={() => setStep('branch')}>Change</button>
                                </div>

                                <div>
                                    <label className="field-label">Parent / Guardian Phone</label>
                                    <div className="field-wrap">
                                        <span className="field-icon"><Phone size={16} /></span>
                                        <input
                                            className="field-input"
                                            type="tel"
                                            inputMode="numeric"
                                            placeholder="Enter 10-digit mobile number"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                </div>

                                {searchResults.length === 0 && phone.length === 10 && !isSearching && (
                                    <div className="error-msg">No students found for this number. Please check and try again.</div>
                                )}

                                <button
                                    className="btn-primary"
                                    onClick={handleSearch}
                                    disabled={isSearching || phone.length < 10}
                                >
                                    {isSearching
                                        ? <><Loader2 size={18} className="animate-spin" /> Searching...</>
                                        : <><Search size={18} /> Search Student</>
                                    }
                                </button>
                            </div>
                        )}

                        {/* ── Select Student (multiple results) ── */}
                        {step === 'select' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <div className="step-title" style={{ textAlign: 'left', margin: 0 }}>Select Student</div>
                                    <button className="btn-ghost" onClick={() => setStep('search')}>Back</button>
                                </div>
                                {searchResults.map(s => (
                                    <button
                                        key={s.id}
                                        className="student-card"
                                        onClick={() => handleSelectStudent(s)}
                                        disabled={isLoadingFees}
                                        style={{ width: '100%', textAlign: 'left' }}
                                    >
                                        <div>
                                            <div className="student-name">{s.firstName} {s.lastName}</div>
                                            <div className="student-meta">
                                                Adm: {s.admissionNo} &nbsp;•&nbsp; {s.class?.name}{s.class?.section ? ` (${s.class.section})` : ''}
                                            </div>
                                        </div>
                                        {isLoadingFees
                                            ? <Loader2 size={16} color="#3b82f6" className="animate-spin" />
                                            : <ChevronRight size={18} color="#475569" />
                                        }
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── Payment ── */}
                        {step === 'pay' && feeDetails && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div className="step-title" style={{ textAlign: 'left', margin: 0 }}>Fee Details</div>
                                        <div className="chip">
                                            <span className="chip-dot" />
                                            {selectedStudent?.firstName} {selectedStudent?.lastName}
                                        </div>
                                    </div>
                                    <button className="btn-ghost" onClick={() => setStep('search')}>Back</button>
                                </div>

                                <div style={{ background: '#0f172a', borderRadius: '0.875rem', padding: '1rem', marginBottom: '1.25rem', textAlign: 'center', border: '1px solid #1e3a5f' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Total Outstanding</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f1f5f9' }}>₹{feeDetails.totalDue.toFixed(0)}</div>
                                </div>

                                {feeDetails.fees.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#64748b', padding: '1rem 0' }}>No outstanding fees.</p>
                                )}

                                {feeDetails.fees.map(fee => (
                                    <div key={fee.id} className="fee-card">
                                        <div className="fee-header">
                                            <span className="fee-type">{fee.type}</span>
                                            <span className="fee-due">Due: ₹{fee.due}</span>
                                        </div>
                                        <div className="fee-input-wrap">
                                            <span className="fee-rupee">₹</span>
                                            <input
                                                className="fee-input"
                                                type="number"
                                                inputMode="decimal"
                                                placeholder={`0 – ${fee.due}`}
                                                value={paymentInputs[fee.id] || ''}
                                                onChange={e => handleInputChange(fee.id, e.target.value)}
                                            />
                                            <button className="fee-full-btn" onClick={() => handleInputChange(fee.id, fee.due.toString())}>
                                                FULL
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="total-bar">
                                    <span className="total-label">Paying Now</span>
                                    <span className="total-amount">₹{getTotalPayAmount().toFixed(0)}</span>
                                </div>

                                <button
                                    className="btn-pay"
                                    onClick={handlePayment}
                                    disabled={isProcessing || getTotalPayAmount() <= 0}
                                >
                                    {isProcessing
                                        ? <><Loader2 size={20} className="animate-spin" /> Processing...</>
                                        : <><CreditCard size={20} /> Pay Securely</>
                                    }
                                </button>
                                <div className="secure-note">🔒 Secured with 256-bit SSL encryption</div>
                            </div>
                        )}

                        {/* ── Success ── */}
                        {step === 'success' && (
                            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                                <div className="success-icon">
                                    <Check size={34} strokeWidth={3} />
                                </div>
                                <div className="success-title">Payment Successful</div>
                                <div className="success-sub">Your transaction is complete. Download your receipt below.</div>

                                {transactionSuccess?.payments.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        href={`/api/receipts/${p.id}/download`}
                                        target="_blank"
                                        className="btn-receipt"
                                    >
                                        <Download size={18} />
                                        Receipt – {p.fee?.type || 'General'}
                                    </Link>
                                ))}

                                <button
                                    className="btn-outline"
                                    onClick={() => { setStep('branch'); setPhone(''); setSearchResults([]); setSelectedBranch(null); }}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    Make Another Payment
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                <div className="pay-footer">
                    &copy; {new Date().getFullYear()} Sprout School &nbsp;·&nbsp; All rights reserved
                </div>
            </div>
        </>
    );
}
