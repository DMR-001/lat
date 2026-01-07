'use client';

import { useState, useEffect } from 'react';
import { createSalaryStructure } from '@/app/actions/salary';
import { getTeachers } from '@/app/actions/teacher';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewSalaryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [teachers, setTeachers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        teacherId: '',
        basicSalary: 0,
        allowances: 0,
        deductions: 0,
        effectiveFrom: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        const result = await getTeachers();
        if (result.success) setTeachers(result.teachers || []);
    };

    const netSalary = formData.basicSalary + formData.allowances - formData.deductions;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await createSalaryStructure({
            ...formData,
            effectiveFrom: new Date(formData.effectiveFrom)
        });

        if (result.success) {
            router.push('/management/salaries');
        } else {
            setError(result.error || 'Failed to create salary structure');
        }

        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/management/salaries" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} />
                    Back to Salaries
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>Add Salary Structure</h1>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <label>Select Teacher <span style={{ color: 'red' }}>*</span></label>
                        <select
                            value={formData.teacherId}
                            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                            required
                        >
                            <option value="">Choose a teacher...</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.firstName} {teacher.lastName} - {teacher.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label>Basic Salary <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="number"
                                value={formData.basicSalary}
                                onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label>Allowances (HRA, DA, etc.)</label>
                            <input
                                type="number"
                                value={formData.allowances}
                                onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label>Deductions (PF, Tax, etc.)</label>
                            <input
                                type="number"
                                value={formData.deductions}
                                onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label>Effective From <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="date"
                                value={formData.effectiveFrom}
                                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Net Salary Display */}
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', border: '2px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Net Monthly Salary</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Basic (₹{formData.basicSalary}) + Allowances (₹{formData.allowances}) - Deductions (₹{formData.deductions})
                                </div>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>₹{netSalary.toFixed(2)}</div>
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Link href="/management/salaries" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 1.5rem' }}
                        >
                            {loading ? 'Creating...' : 'Create Salary Structure'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
