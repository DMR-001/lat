'use client';

import { useState, useEffect } from 'react';
import { generateMonthlyPayments, getActiveSalariesForGenerate } from '@/app/actions/salary';
import Link from 'next/link';
import { ArrowLeft, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

type TeacherRow = {
    salaryId: string;
    teacherId: string;
    teacherName: string;
    employeeId: string | null;
    netSalary: number;
    basicSalary: number;
};

type Override = { extraLeaveDays: string; extraDeduction: string; note: string };

const inp: React.CSSProperties = {
    padding: '0.45rem 0.6rem', border: '1.5px solid #e2e8f0', borderRadius: '0.375rem',
    fontSize: '0.82rem', width: '100%', boxSizing: 'border-box', background: 'white'
};

export default function GeneratePaymentsPage() {
    const router = useRouter();
    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());

    const [step, setStep] = useState<'setup' | 'review'>('setup');
    const [teachers, setTeachers] = useState<TeacherRow[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [overrides, setOverrides] = useState<Record<string, Override>>({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function loadTeachers() {
        setLoadingTeachers(true);
        const data = await getActiveSalariesForGenerate();
        setTeachers(data);
        const init: Record<string, Override> = {};
        data.forEach(t => { init[t.teacherId] = { extraLeaveDays: '', extraDeduction: '', note: '' }; });
        setOverrides(init);
        setLoadingTeachers(false);
        setStep('review');
    }

    function setField(teacherId: string, field: keyof Override, value: string) {
        setOverrides(prev => ({ ...prev, [teacherId]: { ...prev[teacherId], [field]: value } }));
    }

    function previewFinal(t: TeacherRow) {
        const o = overrides[t.teacherId];
        const extraDays = parseFloat(o?.extraLeaveDays || '0') || 0;
        const extraAmt = parseFloat(o?.extraDeduction || '0') || 0;
        const perDay = t.basicSalary / 30;
        return Math.max(0, t.netSalary - extraDays * perDay - extraAmt);
    }

    async function handleGenerate() {
        setLoading(true);
        setError('');
        setSuccess('');

        const overridesParsed: Record<string, { extraLeaveDays: number; extraDeduction: number; note: string }> = {};
        for (const [tid, o] of Object.entries(overrides)) {
            const el = parseFloat(o.extraLeaveDays) || 0;
            const ed = parseFloat(o.extraDeduction) || 0;
            if (el > 0 || ed > 0 || o.note) {
                overridesParsed[tid] = { extraLeaveDays: el, extraDeduction: ed, note: o.note };
            }
        }

        const result = await generateMonthlyPayments(month, year, overridesParsed);
        if (result.success) {
            setSuccess(`Generated ${result.count} payslip(s) for ${MONTHS[month]} ${year}`);
            setTimeout(() => router.push('/management/salaries/payments'), 1500);
        } else {
            setError(result.error || 'Failed to generate payments');
        }
        setLoading(false);
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <Link href="/management/salaries" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} /> Back to Salaries
                </Link>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Generate Monthly Payslips</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.875rem' }}>
                    Select month, add any manual deductions, then generate
                </p>
            </div>

            {/* Step 1 — Month/Year */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} color="var(--primary)" />
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pay Period</span>
                    </div>
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ ...inp, width: 140 }}>
                        {MONTHS.slice(1).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} min="2020" max="2100" style={{ ...inp, width: 90 }} />
                    {step === 'setup' && (
                        <button onClick={loadTeachers} disabled={loadingTeachers} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {loadingTeachers ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</> : <>Next <ChevronRight size={15} /></>}
                        </button>
                    )}
                </div>
            </div>

            {/* Step 2 — Teacher deductions table */}
            {step === 'review' && (
                <>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                            Review & Add Deductions — {MONTHS[month]} {year}
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teacher</th>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Salary</th>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontWeight: 700, color: '#dc2626', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extra Leave Days</th>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'center', fontWeight: 700, color: '#dc2626', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extra Deduction (₹)</th>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note</th>
                                    <th style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Payout</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.map(t => {
                                    const final = previewFinal(t);
                                    const hasDeduction = (parseFloat(overrides[t.teacherId]?.extraLeaveDays || '0') || 0) > 0
                                        || (parseFloat(overrides[t.teacherId]?.extraDeduction || '0') || 0) > 0;
                                    return (
                                        <tr key={t.teacherId} style={{ borderTop: '1px solid #f1f5f9', background: hasDeduction ? '#fef9f0' : 'white' }}>
                                            <td style={{ padding: '0.65rem 1rem' }}>
                                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.teacherName}</div>
                                                {t.employeeId && <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ID: {t.employeeId}</div>}
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                                ₹{t.netSalary.toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem' }}>
                                                <input
                                                    type="number" min="0" step="0.5"
                                                    value={overrides[t.teacherId]?.extraLeaveDays ?? ''}
                                                    onChange={e => setField(t.teacherId, 'extraLeaveDays', e.target.value)}
                                                    placeholder="0"
                                                    style={{ ...inp, textAlign: 'center', maxWidth: 80, margin: '0 auto', display: 'block' }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem' }}>
                                                <input
                                                    type="number" min="0" step="1"
                                                    value={overrides[t.teacherId]?.extraDeduction ?? ''}
                                                    onChange={e => setField(t.teacherId, 'extraDeduction', e.target.value)}
                                                    placeholder="0"
                                                    style={{ ...inp, textAlign: 'center', maxWidth: 100, margin: '0 auto', display: 'block' }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem' }}>
                                                <input
                                                    type="text"
                                                    value={overrides[t.teacherId]?.note ?? ''}
                                                    onChange={e => setField(t.teacherId, 'note', e.target.value)}
                                                    placeholder="e.g., LOP, advance..."
                                                    style={{ ...inp, minWidth: 150 }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: final < t.netSalary ? '#dc2626' : '#16a34a' }}>
                                                ₹{final.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.82rem', marginBottom: '1.25rem', color: '#92400e' }}>
                        <strong>Note:</strong> Leave deductions from attendance records will also be auto-applied. These are <em>additional</em> manual deductions only. Payslips already generated for this month will be skipped.
                    </div>

                    {error && <div style={{ padding: '0.875rem 1rem', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', marginBottom: '1rem' }}>{error}</div>}
                    {success && <div style={{ padding: '0.875rem 1rem', background: '#dcfce7', border: '1px solid #22c55e', borderRadius: '0.5rem', color: '#15803d', marginBottom: '1rem' }}>{success}</div>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button onClick={() => setStep('setup')} className="btn" style={{ border: '1px solid var(--border)' }}>Back</button>
                        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary" style={{ minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            {loading
                                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                                : `Generate ${teachers.length} Payslip${teachers.length !== 1 ? 's' : ''} for ${MONTHS[month]} ${year}`
                            }
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
