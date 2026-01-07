'use client';

import { useState } from 'react';
import { generateMonthlyPayments } from '@/app/actions/salary';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GeneratePaymentsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const currentDate = new Date();
    const [month, setMonth] = useState(currentDate.getMonth() + 1);
    const [year, setYear] = useState(currentDate.getFullYear());

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        const result = await generateMonthlyPayments(month, year);

        if (result.success) {
            setSuccess(`Successfully generated ${result.count} payment(s) for ${months[month - 1]} ${year}`);
            setTimeout(() => router.push('/management/salaries/payments'), 2000);
        } else {
            setError(result.error || 'Failed to generate payments');
        }

        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/management/salaries" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} />
                    Back to Salaries
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>Generate Monthly Payments</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Generate salary payments for all active teachers for a specific month
                </p>
            </div>

            <div className="card" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem' }}>
                        <Calendar size={24} style={{ color: 'var(--primary)' }} />
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Select Month & Year</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Payments will be created for all teachers with active salary structures
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label>Month <span style={{ color: 'red' }}>*</span></label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Year <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                min="2020"
                                max="2100"
                            />
                        </div>
                    </div>

                    <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                        <strong>Note:</strong> If payments already exist for this month, they will be skipped automatically.
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c' }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', border: '1px solid #22c55e', borderRadius: '0.5rem', color: '#15803d' }}>
                            {success}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Link href="/management/salaries" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                            Cancel
                        </Link>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 1.5rem' }}
                        >
                            {loading ? 'Generating...' : `Generate Payments for ${months[month - 1]} ${year}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
