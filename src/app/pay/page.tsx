'use client';

import { useState, useEffect } from 'react';
import { searchStudentsByPhonePublic, getBranchesPublic, getStudentFeesPublic, processPublicPayment } from '@/app/actions/public';
import { Search, CreditCard, Check, Loader2, Download, ArrowRight, MapPin, Phone, ChevronRight, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function PublicPaymentPage() {
    // step: 'branch' | 'search' | 'select' | 'pay' | 'success'
    const [step, setStep] = useState<'branch' | 'search' | 'select' | 'pay' | 'success'>('branch');
    const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);

    const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string; code: string } | null>(null);
    const [phone, setPhone] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isLoadingFees, setIsLoadingFees] = useState(false);
    const [feeDetails, setFeeDetails] = useState<{ fees: any[]; totalDue: number } | null>(null);

    const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionSuccess, setTransactionSuccess] = useState<any>(null);

    useEffect(() => {
        getBranchesPublic().then(setBranches);
    }, []);

    const handleBranchSelect = (branch: { id: string; name: string; code: string }) => {
        setSelectedBranch(branch);
        setPhone('');
        setSearchResults([]);
        setStep('search');
    };

    const handleSearch = async () => {
        if (!selectedBranch || phone.trim().length < 10) return;
        setIsSearching(true);
        try {
            const results = await searchStudentsByPhonePublic(selectedBranch.id, phone.trim());
            setSearchResults(results);
            if (results.length === 0) {
                // keep on search page and show inline error
            } else if (results.length === 1) {
                await handleSelectStudent(results[0]);
            } else {
                setStep('select');
            }
        } catch {
            // error handled below
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectStudent = async (student: any) => {
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
        const total = getTotalPayAmount();
        if (total <= 0) return;
        setIsProcessing(true);
        const payments = Object.entries(paymentInputs)
            .map(([feeId, val]) => ({ feeId, amount: parseFloat(val) || 0 }))
            .filter(p => p.amount > 0);
        await new Promise(resolve => setTimeout(resolve, 1500));
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

    const stepIndex = { branch: 1, search: 2, select: 2, pay: 3, success: 4 }[step];

    return (
        <>
            <style jsx global>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #0f172a; }
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
