'use client';

import { useState, useEffect } from 'react';
import { getClasses } from '@/app/actions/class';
import { searchStudentsPublic, getStudentFeesPublic, processPublicPayment } from '@/app/actions/public';
import { Search, User, CreditCard, Check, Loader2, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PublicPaymentPage() {
    const [step, setStep] = useState(1);
    const [classes, setClasses] = useState<{ id: string; name: string; section?: string | null }[]>([]);

    // Step 1: Search
    const [selectedClassId, setSelectedClassId] = useState('');
    const [searchName, setSearchName] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Step 2: Select Student
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isLoadingFees, setIsLoadingFees] = useState(false);
    const [feeDetails, setFeeDetails] = useState<{ fees: any[], totalDue: number } | null>(null);

    // Step 3: Payment
    // const [payAmount, setPayAmount] = useState(''); // REPLACED by split payments
    const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({}); // feeId -> amount string
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionSuccess, setTransactionSuccess] = useState<any>(null);

    useEffect(() => {
        getClasses().then(setClasses);
    }, []);

    const handleSearch = async () => {
        if (!selectedClassId || !searchName || searchName.length < 3) return;
        setIsSearching(true);
        try {
            const results = await searchStudentsPublic(selectedClassId, searchName);
            setSearchResults(results);
            if (results.length > 0) {
                setStep(2);
            } else {
                alert('No students found. Please try again.');
            }
        } catch (error) {
            alert('Error searching students.');
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

            // Initialize payment inputs
            const initialInputs: Record<string, string> = {};
            // data.fees.forEach((f: any) => {
            //     initialInputs[f.id] = f.due.toString();
            // });
            // Let's default to empty or 0, requiring user to select? 
            // Better UX: Default to paying partial for all? 
            // Or let them check which ones to pay. 
            // For now, let's pre-fill nothing, but allow easy "Pay Full" button later?
            // Actually, requirements say "ask user... for which type fee paying".
            // Let's initialize with 0.
            data.fees.forEach((f: any) => {
                initialInputs[f.id] = '';
            });

            setPaymentInputs(initialInputs);
            setStep(3);
        } catch (error) {
            alert('Error fetching fees.');
        } finally {
            setIsLoadingFees(false);
        }
    };

    const handleInputChange = (feeId: string, val: string) => {
        setPaymentInputs(prev => ({ ...prev, [feeId]: val }));
    };

    const getTotalPayAmount = () => {
        return Object.values(paymentInputs).reduce((sum, val) => {
            const num = parseFloat(val) || 0;
            return sum + num;
        }, 0);
    };

    const handlePayment = async () => {
        const total = getTotalPayAmount();
        if (total <= 0) return;

        setIsProcessing(true);

        // Prepare payload
        const payments = Object.entries(paymentInputs)
            .map(([feeId, val]) => ({ feeId, amount: parseFloat(val) || 0 }))
            .filter(p => p.amount > 0);

        // Simulating Payment Gateway Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const result = await processPublicPayment(selectedStudent.id, payments);
            setTransactionSuccess(result);
            setStep(4);
        } catch (error) {
            alert('Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem 1rem' }}>
            {/* Header */}
            <div style={{ maxWidth: '600px', margin: '0 auto 2rem', textAlign: 'center' }}>
                <img src="/sprout-logo.png" alt="Sprout School" style={{ height: '60px', margin: '0 auto 1rem', objectFit: 'contain' }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Fee Payment Portal</h1>
                <p style={{ color: '#6b7280' }}>Securely pay your child's school fees online</p>
            </div>

            <div style={{ maxWidth: '480px', margin: '0 auto', backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>

                {/* Progress Indicators */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} style={{
                            flex: 1,
                            height: '4px',
                            backgroundColor: step >= s ? '#4f46e5' : '#e5e7eb',
                            transition: 'background-color 0.3s'
                        }} />
                    ))}
                </div>

                <div style={{ padding: '2rem' }}>

                    {/* Step 1: Search */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '48px', height: '48px', backgroundColor: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#4f46e5' }}>
                                    <Search size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Find Student</h2>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Select class and enter student name</p>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Class</label>
                                <select
                                    className="input"
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', outline: 'none' }}
                                >
                                    <option value="">Select a class</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>Student Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter at least 3 letters"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', outline: 'none' }}
                                />
                            </div>

                            <button
                                onClick={handleSearch}
                                disabled={isSearching || !selectedClassId || searchName.length < 3}
                                style={{ width: '100%', padding: '0.875rem', backgroundColor: '#4f46e5', color: 'white', borderRadius: '0.5rem', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'Search Student'}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Select */}
                    {step === 2 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Select Student</h2>
                                <button onClick={() => setStep(1)} style={{ color: '#4f46e5', fontSize: '0.875rem', fontWeight: '500' }}>Change Search</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {searchResults.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => handleSelectStudent(student)}
                                        disabled={isLoadingFees}
                                        style={{
                                            textAlign: 'left',
                                            padding: '1rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.75rem',
                                            backgroundColor: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        className="hover:border-blue-500 hover:bg-slate-50"
                                    >
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#111827' }}>{student.firstName} {student.lastName}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Adm: {student.admissionNo} • Father: {student.parentName}</div>
                                        </div>
                                        <ArrowRight size={18} color="#9ca3af" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment */}
                    {step === 3 && feeDetails && (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Outstanding Due</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937' }}>₹{feeDetails.totalDue.toFixed(2)}</div>
                                <div style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem', backgroundColor: '#f3f4f6', display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                                    {selectedStudent.firstName} {selectedStudent.lastName}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Select Fees to Pay:</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {feeDetails.fees.map(fee => (
                                    <div key={fee.id} style={{
                                        backgroundColor: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.5rem',
                                        padding: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '600', color: '#374151' }}>{fee.type}</span>
                                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Due: ₹{fee.due}</span>
                                        </div>

                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: '500' }}>₹</span>
                                            <input
                                                type="number"
                                                placeholder={`Enter amount (Max ${fee.due})`}
                                                value={paymentInputs[fee.id] || ''}
                                                onChange={(e) => handleInputChange(fee.id, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    paddingLeft: '2rem',
                                                    borderRadius: '0.5rem',
                                                    border: '1px solid #d1d5db',
                                                    outline: 'none'
                                                }}
                                            />
                                            <button
                                                onClick={() => handleInputChange(fee.id, fee.due.toString())}
                                                style={{
                                                    position: 'absolute',
                                                    right: '0.5rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: '0.75rem',
                                                    color: '#4f46e5',
                                                    fontWeight: '500',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Full
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: '600', color: '#111827' }}>Total Paying Now</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>₹{getTotalPayAmount().toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing || getTotalPayAmount() <= 0}
                                    style={{ width: '100%', padding: '1rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.5rem', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            Pay Securely
                                        </>
                                    )}
                                </button>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
                                You will be redirected to the secure payment gateway.
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ width: '64px', height: '64px', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#10b981' }}>
                                <Check size={32} strokeWidth={3} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Payment Successful!</h2>
                            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Thank you. Your transactions have been completed.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {transactionSuccess?.payments.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        href={`/api/receipts/${p.id}/download`}
                                        target="_blank"
                                        style={{ width: '100%', padding: '0.875rem', backgroundColor: '#4f46e5', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <Download size={20} />
                                        Download PDF Receipt ({p.fee?.type || 'General'})
                                    </Link>
                                ))}

                                <button
                                    onClick={() => { setStep(1); setSearchName(''); setSelectedClassId(''); }}
                                    style={{ width: '100%', padding: '0.875rem', backgroundColor: 'white', color: '#374151', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Make Another Payment
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                &copy; {new Date().getFullYear()} Sprout School. All rights reserved.
            </div>
        </div>
    );
}
