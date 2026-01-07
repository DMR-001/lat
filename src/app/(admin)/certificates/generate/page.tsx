'use client';

import { useState, useEffect } from 'react';
import { generateCertificate } from '@/app/actions/certificate';
import { searchStudents } from '@/app/actions/student';
import { getActiveYear } from '@/app/actions/academic-year';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GenerateCertificatePage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [certificateType, setCertificateType] = useState<'BONAFIDE' | 'STUDY_CERTIFICATE'>('BONAFIDE');
    const [purpose, setPurpose] = useState('');
    const [remarks, setRemarks] = useState('');
    const [issuedBy, setIssuedBy] = useState('Principal');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            const results = await searchStudents(query);
            setStudents(results);
        } else {
            setStudents([]);
        }
    };

    const handleGenerate = async () => {
        if (!selectedStudent) {
            setError('Please select a student');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const result = await generateCertificate(
            selectedStudent.id,
            certificateType,
            purpose || undefined,
            remarks || undefined,
            issuedBy || undefined
        );

        setLoading(false);

        if (result.success && result.certificate) {
            setSuccess(`Certificate ${result.certificate.certificateNo} generated successfully!`);
            setTimeout(() => {
                router.push(`/certificates/${result.certificate.id}`);
            }, 1500);
        } else {
            setError(result.error || 'Failed to generate certificate');
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/certificates" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} />
                    Back to Certificates
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Generate Certificate</h1>
            </div>

            <div className="card" style={{ padding: '2.5rem' }}>
                {/* Student Search */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Search Student <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by name, admission number, or phone..."
                        className="input"
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                    />

                    {students.length > 0 && !selectedStudent && (
                        <div style={{
                            marginTop: '0.5rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            maxHeight: '250px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            {students.map((student) => (
                                <div
                                    key={student.id}
                                    onClick={() => {
                                        setSelectedStudent(student);
                                        setStudents([]);
                                        setSearchQuery(`${student.firstName} ${student.lastName} (${student.admissionNo})`);
                                    }}
                                    style={{
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border)',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{student.firstName} {student.lastName}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {student.admissionNo} • Class: {student.class?.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedStudent && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, var(--primary-light) 0%, #e0f2fe 100%)',
                            borderRadius: '0.5rem',
                            border: '2px solid var(--primary)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                        {selectedStudent.firstName} {selectedStudent.lastName}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {selectedStudent.admissionNo} • Class: {selectedStudent.class?.name}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        setSearchQuery('');
                                    }}
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '2rem 0' }}></div>

                {/* Certificate Type */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Certificate Type <span style={{ color: 'red' }}>*</span>
                    </label>
                    <select
                        value={certificateType}
                        onChange={(e) => setCertificateType(e.target.value as any)}
                        className="input"
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                    >
                        <option value="BONAFIDE">Bonafide Certificate</option>
                        <option value="STUDY_CERTIFICATE">Study Certificate</option>
                    </select>
                </div>

                {/* Purpose (for Bonafide) */}
                {certificateType === 'BONAFIDE' && (
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            Purpose <span style={{ fontSize: '0.875rem', fontWeight: '400', color: 'var(--text-secondary)' }}>(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="e.g., Bank Account, Passport Application"
                            className="input"
                            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                        />
                    </div>
                )}

                {/* Remarks */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Remarks <span style={{ fontSize: '0.875rem', fontWeight: '400', color: 'var(--text-secondary)' }}>(Optional)</span>
                    </label>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Any additional notes..."
                        className="input"
                        rows={3}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                    />
                </div>

                {/* Issued By */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Issued By <span style={{ fontSize: '0.875rem', fontWeight: '400', color: 'var(--text-secondary)' }}>(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={issuedBy}
                        onChange={(e) => setIssuedBy(e.target.value)}
                        placeholder="Principal/Staff name"
                        className="input"
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                    />
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #ef4444',
                        borderRadius: '0.5rem',
                        color: '#b91c1c',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#dcfce7',
                        border: '1px solid #22c55e',
                        borderRadius: '0.5rem',
                        color: '#15803d',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem'
                    }}>
                        {success}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
                    <Link href="/certificates" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
                        Cancel
                    </Link>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !selectedStudent}
                        className="btn btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.95rem'
                        }}
                    >
                        <FileText size={18} />
                        {loading ? 'Generating...' : 'Generate Certificate'}
                    </button>
                </div>
            </div>
        </div>
    );
}
