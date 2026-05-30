'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assignMultipleFees } from '@/app/actions/fee';
import { searchStudents } from '@/app/actions/student';
import { Search, X, CheckCircle2, Loader2 } from 'lucide-react';

const FEE_TYPES = [
    { type: 'REGISTRATION', label: 'Registration Fee' },
    { type: 'TUITION',      label: 'Tuition Fee' },
    { type: 'SPORTS',       label: 'Sports & Activity Fee' },
    { type: 'BOOKS',        label: 'Book Fee' },
    { type: 'UNIFORM',      label: 'Uniform & Bag Fee' },
    { type: 'TRANSPORT',    label: 'Transport Fee' },
];

type Student = { id: string; firstName: string; lastName: string; admissionNo: string };

const inputStyle = { width: '100%', padding: '0.65rem 0.875rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, background: '#f8fafc' };

export default function AssignFeeForm() {
    const router = useRouter();
    const [query, setQuery]                 = useState('');
    const [results, setResults]             = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isSearching, setIsSearching]     = useState(false);
    const [amounts, setAmounts]             = useState<Record<string, string>>({});
    const [dueDate, setDueDate]             = useState('');
    const [isPending, setIsPending]         = useState(false);
    const [error, setError]                 = useState('');
    const [success, setSuccess]             = useState(false);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (query.length >= 2) {
                setIsSearching(true);
                const s = await searchStudents(query);
                setResults(s);
                setIsSearching(false);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    const selectedFees = FEE_TYPES.filter(f => {
        const v = parseFloat(amounts[f.type] ?? '');
        return !isNaN(v) && v > 0;
    });
    const total = selectedFees.reduce((s, f) => s + parseFloat(amounts[f.type]), 0);

    const handleSubmit = async () => {
        setError('');
        if (!selectedStudent) return setError('Please select a student.');
        if (selectedFees.length === 0) return setError('Enter amount for at least one fee type.');
        if (!dueDate) return setError('Please select a due date.');

        setIsPending(true);
        try {
            await assignMultipleFees(
                selectedStudent.id,
                selectedFees.map(f => ({ type: f.type, amount: parseFloat(amounts[f.type]) })),
                dueDate
            );
            setSuccess(true);
            setTimeout(() => router.push('/fees'), 1200);
        } catch (e: any) {
            setError(e.message || 'Failed to assign fees');
            setIsPending(false);
        }
    };

    if (success) {
        return (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#16a34a' }}>Fees assigned successfully!</p>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Redirecting to fees page…</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Student search */}
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Student</label>
                {!selectedStudent ? (
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Search by name or admission no…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                        />
                        {isSearching && (
                            <Loader2 size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', animation: 'spin 1s linear infinite' }} />
                        )}
                        {results.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem', zIndex: 20, maxHeight: '220px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                                {results.map(s => (
                                    <div key={s.id} onClick={() => { setSelectedStudent(s); setQuery(''); setResults([]); }}
                                        style={{ padding: '0.7rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{s.firstName} {s.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.admissionNo}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '0.75rem 1rem', border: '1.5px solid #2563eb', borderRadius: '0.5rem', background: '#eff6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.9rem' }}>{selectedStudent.firstName} {selectedStudent.lastName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>{selectedStudent.admissionNo}</div>
                        </div>
                        <button type="button" onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            <X size={14} /> Change
                        </button>
                    </div>
                )}
            </div>

            {/* Fee amounts grid */}
            <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>
                    Fee Amounts <span style={{ fontWeight: 400, color: '#94a3b8' }}>(leave blank to skip)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {FEE_TYPES.map(f => (
                        <div key={f.type} style={{ background: amounts[f.type] && parseFloat(amounts[f.type]) > 0 ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${amounts[f.type] && parseFloat(amounts[f.type]) > 0 ? '#86efac' : '#e2e8f0'}`, borderRadius: '0.625rem', padding: '0.75rem', transition: 'all 0.12s' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>{f.label}</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="0"
                                    value={amounts[f.type] ?? ''}
                                    onChange={e => setAmounts(prev => ({ ...prev, [f.type]: e.target.value }))}
                                    style={{ ...inputStyle, paddingLeft: '1.6rem', background: 'white' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Due date */}
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, maxWidth: 240 }} />
            </div>

            {/* Total summary */}
            {selectedFees.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.625rem', padding: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Summary</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {selectedFees.map(f => (
                            <div key={f.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#334155' }}>
                                <span>{f.label}</span>
                                <span style={{ fontWeight: 600 }}>₹{parseFloat(amounts[f.type]).toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                            <span>Total</span>
                            <span style={{ color: '#2563eb' }}>₹{total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>
                    {error}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button type="button" className="btn" style={{ border: '1px solid var(--border)' }} onClick={() => router.back()}>Cancel</button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || !selectedStudent || selectedFees.length === 0 || !dueDate}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 140, justifyContent: 'center' }}
                >
                    {isPending ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Assigning…</> : `Assign ${selectedFees.length > 0 ? `${selectedFees.length} Fee${selectedFees.length > 1 ? 's' : ''}` : 'Fees'}`}
                </button>
            </div>
        </div>
    );
}
