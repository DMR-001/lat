'use client';

import { useState, useEffect } from 'react';
import { assignFee } from '@/app/actions/fee';
import { searchStudents } from '@/app/actions/student';
import { Search } from 'lucide-react';

type Student = {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
};

export default function AssignFeeForm() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setIsSearching(true);
                const students = await searchStudents(query);
                setResults(students);
                setIsSearching(false);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setQuery('');
        setResults([]);
    };

    return (
        <form action={assignFee} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Student</label>

                {!selectedStudent ? (
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="Search by name or admission no..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                            />
                        </div>

                        {results.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid var(--border)',
                                borderRadius: '0.5rem',
                                marginTop: '0.5rem',
                                zIndex: 10,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                {results.map(student => (
                                    <div
                                        key={student.id}
                                        onClick={() => handleSelectStudent(student)}
                                        style={{
                                            padding: '0.75rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--border)',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ fontWeight: '500' }}>{student.firstName} {student.lastName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.admissionNo}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {isSearching && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Searching...</p>}
                    </div>
                ) : (
                    <div style={{
                        padding: '0.75rem',
                        border: '1px solid var(--primary)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--primary-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{selectedStudent.firstName} {selectedStudent.lastName}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>{selectedStudent.admissionNo}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedStudent(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Change
                        </button>
                        <input type="hidden" name="studentId" value={selectedStudent.id} />
                    </div>
                )}
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Fee Type</label>
                <select name="type" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                    <option value="TUITION">Tuition Fee</option>
                    <option value="TRANSPORT">Transport Fee</option>
                    <option value="ADMISSION">Admission Fee</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Amount</label>
                    <input type="number" name="amount" step="0.01" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Due Date</label>
                    <input type="date" name="dueDate" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ border: '1px solid var(--border)' }} onClick={() => window.history.back()}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!selectedStudent}>Assign Fee</button>
            </div>
        </form>
    );
}
