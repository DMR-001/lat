'use client';

import { useState } from 'react';
import { createAcademicYear } from '@/app/actions/academic-year';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewAcademicYearPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [setAsActive, setSetAsActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await createAcademicYear(
            name,
            new Date(startDate),
            new Date(endDate),
            setAsActive
        );

        setLoading(false);

        if (result.success) {
            router.push('/academic-year');
        } else {
            setError(result.error || 'Failed to create academic year');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/academic-year" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    <ArrowLeft size={20} />
                    Back
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>
                    Create New Academic Year
                </h1>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Year Name */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Academic Year Name <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., 2025-26"
                            className="input"
                            style={{ width: '100%' }}
                            required
                        />
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Format: YYYY-YY (e.g., 2025-26)
                        </p>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Start Date <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input"
                            style={{ width: '100%' }}
                            required
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            End Date <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input"
                            style={{ width: '100%' }}
                            required
                        />
                    </div>

                    {/* Set as Active */}
                    <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--background)',
                        borderRadius: '0.25rem',
                        border: '1px solid var(--border)'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={setAsActive}
                                onChange={(e) => setSetAsActive(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <div>
                                <div style={{ fontWeight: '500' }}>Set as Active Academic Year</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    This will be used for new enrollments, fees, and certificates
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #ef4444',
                            borderRadius: '0.5rem',
                            color: '#b91c1c'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Link href="/academic-year" className="btn btn-secondary">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Calendar size={18} />
                            {loading ? 'Creating...' : 'Create Academic Year'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
