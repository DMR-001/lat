'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assignMultipleFees } from '@/app/actions/fee';
import { getClasses } from '@/app/actions/class';
import { getStudentsByClass } from '@/app/actions/student';
import { GraduationCap, User, ChevronRight, CheckCircle2, Loader2, X } from 'lucide-react';

const FEE_TYPES = [
    { type: 'REGISTRATION', label: 'Registration Fee' },
    { type: 'TUITION',      label: 'Tuition Fee' },
    { type: 'SPORTS',       label: 'Sports & Activity Fee' },
    { type: 'BOOKS',        label: 'Book Fee' },
    { type: 'UNIFORM',      label: 'Uniform & Bag Fee' },
    { type: 'TRANSPORT',    label: 'Transport Fee' },
];

type Step = 'class' | 'student' | 'fees';
type ClassItem = { id: string; name: string; section: string | null; _count: { students: number } };
type Student   = { id: string; firstName: string; lastName: string; admissionNo: string };

const inp: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.875rem', borderRadius: '0.5rem',
    border: '1.5px solid #e2e8f0', fontSize: '0.875rem', outline: 'none',
    background: '#f8fafc', boxSizing: 'border-box', color: '#0f172a',
};

export default function AssignFeeForm() {
    const router = useRouter();

    const [step, setStep]                   = useState<Step>('class');
    const [classes, setClasses]             = useState<ClassItem[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

    const [students, setStudents]           = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [amounts, setAmounts]             = useState<Record<string, string>>({});
    const [dueDate, setDueDate]             = useState('');
    const [isPending, setIsPending]         = useState(false);
    const [error, setError]                 = useState('');
    const [success, setSuccess]             = useState(false);

    // Load classes on mount
    useEffect(() => {
        getClasses().then(cls => { setClasses(cls); setLoadingClasses(false); });
    }, []);

    // Load students when class is picked
    const pickClass = async (cls: ClassItem) => {
        setSelectedClass(cls);
        setSelectedStudent(null);
        setStudentSearch('');
        setStep('student');
        setLoadingStudents(true);
        const res = await getStudentsByClass(cls.id);
        setStudents(res.success && res.students ? (res.students as Student[]) : []);
        setLoadingStudents(false);
    };

    const pickStudent = (s: Student) => {
        setSelectedStudent(s);
        setAmounts({});
        setDueDate('');
        setError('');
        setStep('fees');
    };

    const filteredStudents = students.filter(s => {
        const q = studentSearch.toLowerCase();
        return !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q);
    });

    const selectedFees = FEE_TYPES.filter(f => {
        const v = parseFloat(amounts[f.type] ?? '');
        return !isNaN(v) && v > 0;
    });
    const total = selectedFees.reduce((s, f) => s + parseFloat(amounts[f.type]), 0);

    const handleSubmit = async () => {
        setError('');
        if (!selectedStudent) return setError('No student selected.');
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
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Redirecting…</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Breadcrumb / step indicator ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                {/* Step 1 */}
                <button
                    onClick={() => { if (step !== 'class') { setStep('class'); setSelectedStudent(null); } }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: step !== 'class' ? 'pointer' : 'default', padding: 0, fontWeight: step === 'class' ? 700 : 500, color: step === 'class' ? '#2563eb' : '#64748b', fontSize: '0.82rem' }}
                >
                    <GraduationCap size={14} />
                    {selectedClass ? `${selectedClass.name}${selectedClass.section ? ` (${selectedClass.section})` : ''}` : 'Pick Class'}
                </button>

                {step !== 'class' && (
                    <>
                        <ChevronRight size={13} color="#cbd5e1" />
                        {/* Step 2 */}
                        <button
                            onClick={() => { if (step === 'fees') { setStep('student'); setSelectedStudent(null); } }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: step === 'fees' ? 'pointer' : 'default', padding: 0, fontWeight: step === 'student' ? 700 : 500, color: step === 'student' ? '#2563eb' : '#64748b', fontSize: '0.82rem' }}
                        >
                            <User size={14} />
                            {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Pick Student'}
                        </button>
                    </>
                )}

                {step === 'fees' && (
                    <>
                        <ChevronRight size={13} color="#cbd5e1" />
                        <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.82rem' }}>Assign Fees</span>
                    </>
                )}
            </div>

            {/* ── STEP 1: Class picker ── */}
            {step === 'class' && (
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <GraduationCap size={16} color="#2563eb" /> Select Class
                    </div>
                    {loadingClasses ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
                        </div>
                    ) : classes.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>No classes found.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.625rem' }}>
                            {classes.map(cls => (
                                <button
                                    key={cls.id}
                                    onClick={() => pickClass(cls)}
                                    style={{ padding: '0.875rem 1rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.625rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2563eb'; (e.currentTarget as HTMLElement).style.background = '#eff6ff'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                                >
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                                        {cls.name}{cls.section ? ` (${cls.section})` : ''}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                        {cls._count.students} student{cls._count.students !== 1 ? 's' : ''}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── STEP 2: Student picker ── */}
            {step === 'student' && (
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={16} color="#2563eb" /> Select Student
                        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                            {filteredStudents.length} of {students.length}
                        </span>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: '0.875rem' }}>
                        <input
                            type="text"
                            placeholder="Search by name or admission no…"
                            value={studentSearch}
                            onChange={e => setStudentSearch(e.target.value)}
                            style={{ ...inp, paddingRight: studentSearch ? '2rem' : '0.875rem' }}
                            autoFocus
                        />
                        {studentSearch && (
                            <button onClick={() => setStudentSearch('')} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 1, padding: 0 }}>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {loadingStudents ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
                            {students.length === 0 ? 'No students in this class.' : 'No match found.'}
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 340, overflowY: 'auto' }}>
                            {filteredStudents.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => pickStudent(s)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.875rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2563eb'; (e.currentTarget as HTMLElement).style.background = '#eff6ff'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                                >
                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                                        {s.firstName[0]}{s.lastName[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{s.firstName} {s.lastName}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.admissionNo}</div>
                                    </div>
                                    <ChevronRight size={15} color="#cbd5e1" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── STEP 3: Fee amounts ── */}
            {step === 'fees' && selectedStudent && (
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Selected student chip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.875rem', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '0.625rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                            {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1d4ed8' }}>{selectedStudent.firstName} {selectedStudent.lastName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#3b82f6' }}>{selectedStudent.admissionNo}</div>
                        </div>
                        <button onClick={() => setStep('student')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <X size={13} /> Change
                        </button>
                    </div>

                    {/* Fee amount grid */}
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151', marginBottom: '0.625rem' }}>
                            Fee Amounts <span style={{ fontWeight: 400, color: '#94a3b8' }}>(leave blank to skip)</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.625rem' }}>
                            {FEE_TYPES.map(f => {
                                const active = !isNaN(parseFloat(amounts[f.type] ?? '')) && parseFloat(amounts[f.type]) > 0;
                                return (
                                    <div key={f.type} style={{ background: active ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${active ? '#86efac' : '#e2e8f0'}`, borderRadius: '0.5rem', padding: '0.625rem', transition: 'all 0.12s' }}>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>{f.label}</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="0"
                                                value={amounts[f.type] ?? ''}
                                                onChange={e => setAmounts(prev => ({ ...prev, [f.type]: e.target.value }))}
                                                style={{ ...inp, paddingLeft: '1.5rem', background: 'white' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Due date */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#374151', marginBottom: '0.4rem' }}>Due Date</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inp, maxWidth: 220 }} />
                    </div>

                    {/* Summary */}
                    {selectedFees.length > 0 && (
                        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.875rem' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Summary</div>
                            {selectedFees.map(f => (
                                <div key={f.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155', marginBottom: '0.2rem' }}>
                                    <span>{f.label}</span>
                                    <span style={{ fontWeight: 600 }}>₹{parseFloat(amounts[f.type]).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', marginTop: '0.3rem' }}>
                                <span>Total</span>
                                <span style={{ color: '#2563eb' }}>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: '0.65rem 0.875rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
                        <button type="button" className="btn" style={{ border: '1px solid var(--border)' }} onClick={() => router.back()}>Cancel</button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending || selectedFees.length === 0 || !dueDate}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 140, justifyContent: 'center' }}
                        >
                            {isPending
                                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Assigning…</>
                                : `Assign ${selectedFees.length > 0 ? `${selectedFees.length} Fee${selectedFees.length > 1 ? 's' : ''}` : 'Fees'}`
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
