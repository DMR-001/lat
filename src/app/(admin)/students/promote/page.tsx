'use client';

import { useState, useEffect } from 'react';
import { promoteStudents, getStudentsByClass } from '@/app/actions/student';
import { getAllAcademicYears } from '@/app/actions/academic-year';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PromoteStudentsPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [sourceClassId, setSourceClassId] = useState('');
    const [targetClassId, setTargetClassId] = useState('');
    const [targetYearId, setTargetYearId] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Load classes
        const classesRes = await fetch('/api/classes');
        const classesData = await classesRes.json();
        setClasses(classesData);

        // Load academic years
        const yearsResult = await getAllAcademicYears();
        if (yearsResult.success) {
            setAcademicYears(yearsResult.years || []);
            // Set next year as default if available
            const activeYear = yearsResult.years?.find((y: any) => y.isActive);
            const nextYear = yearsResult.years?.find((y: any) =>
                new Date(y.startDate) > new Date(activeYear?.endDate || new Date())
            );
            if (nextYear) {
                setTargetYearId(nextYear.id);
            }
        }
    };

    const handleSourceClassChange = async (classId: string) => {
        setSourceClassId(classId);
        setSelectedStudents([]);

        if (classId) {
            const result = await getStudentsByClass(classId);
            if (result.success) {
                setStudents(result.students || []);
                // Select all by default
                setSelectedStudents((result.students || []).map((s: any) => s.id));
            }
        } else {
            setStudents([]);
        }
    };

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handlePromote = async () => {
        if (!targetClassId || !targetYearId || selectedStudents.length === 0) {
            setError('Please select target class, academic year, and at least one student');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const result = await promoteStudents(selectedStudents, targetClassId, targetYearId);

        setLoading(false);

        if (result.success) {
            setSuccess(result.message || 'Students promoted successfully!');
            setTimeout(() => {
                router.push('/students');
            }, 2000);
        } else {
            setError(result.error || 'Failed to promote students');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/students" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    <ArrowLeft size={20} />
                    Back to Students
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
                    Promote Students
                </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Source Class */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>From Class</h3>
                    <select
                        value={sourceClassId}
                        onChange={(e) => handleSourceClassChange(e.target.value)}
                        className="input"
                        style={{ width: '100%' }}
                    >
                        <option value="">Select Source Class</option>
                        {classes.map((cls: any) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} {cls.section ? `(${cls.section})` : ''}
                            </option>
                        ))}
                    </select>

                    {students.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.25rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {students.length}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Students
                            </div>
                        </div>
                    )}
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={32} style={{ color: 'var(--primary)' }} />
                </div>

                {/* Target Class */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: '600' }}>To Class</h3>
                    <select
                        value={targetClassId}
                        onChange={(e) => setTargetClassId(e.target.value)}
                        className="input"
                        style={{ width: '100%', marginBottom: '1rem' }}
                    >
                        <option value="">Select Target Class</option>
                        {classes.map((cls: any) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} {cls.section ? `(${cls.section})` : ''}
                            </option>
                        ))}
                    </select>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                        Academic Year
                    </label>
                    <select
                        value={targetYearId}
                        onChange={(e) => setTargetYearId(e.target.value)}
                        className="input"
                        style={{ width: '100%' }}
                    >
                        <option value="">Select Academic Year</option>
                        {academicYears.map((year: any) => (
                            <option key={year.id} value={year.id}>
                                {year.name} {year.isActive ? '(Active)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Student List */}
            {students.length > 0 && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: '600' }}>
                            Select Students ({selectedStudents.length} of {students.length} selected)
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setSelectedStudents(students.map(s => s.id))}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setSelectedStudents([])}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
                        {students.map((student: any) => (
                            <label
                                key={student.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    backgroundColor: selectedStudents.includes(student.id) ? 'var(--primary-light)' : 'transparent'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => toggleStudent(student.id)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '500' }}>
                                        {student.firstName} {student.lastName}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {student.admissionNo}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Error/Success Messages */}
            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ padding: '1rem', backgroundColor: '#dcfce7', border: '1px solid #22c55e', borderRadius: '0.5rem', color: '#15803d', marginBottom: '1rem' }}>
                    {success}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Link href="/students" className="btn btn-secondary">
                    Cancel
                </Link>
                <button
                    onClick={handlePromote}
                    disabled={loading || selectedStudents.length === 0 || !targetClassId || !targetYearId}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Users size={18} />
                    {loading ? 'Promoting...' : `Promote ${selectedStudents.length} Students`}
                </button>
            </div>
        </div>
    );
}
