'use client';

import { useState, useEffect } from 'react';
import { getFeeStructureById, updateFeeStructure } from '@/app/actions/fee-structure';
import Link from 'next/link';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function EditFeeStructurePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [structureInfo, setStructureInfo] = useState<{ name: string; className: string; academicYear: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        tuitionFee: 0,
        transportFee: 0,
        booksFee: 0,
        uniformFee: 0,
        examFee: 0,
        otherFee: 0,
        installments: 1,
        lateFeePerDay: 0,
        isActive: true
    });

    useEffect(() => {
        loadFeeStructure();
    }, [id]);

    const loadFeeStructure = async () => {
        setFetching(true);
        const result = await getFeeStructureById(id);
        if (result.success && result.feeStructure) {
            const fs = result.feeStructure;
            setFormData({
                name: fs.name,
                tuitionFee: fs.tuitionFee,
                transportFee: fs.transportFee,
                booksFee: fs.booksFee,
                uniformFee: fs.uniformFee,
                examFee: fs.examFee,
                otherFee: fs.otherFee,
                installments: fs.installments,
                lateFeePerDay: fs.lateFeePerDay,
                isActive: fs.isActive
            });
            setStructureInfo({
                name: fs.name,
                className: fs.class?.name || 'All Classes',
                academicYear: fs.academicYear?.name || 'All Years'
            });
        } else {
            setError('Fee structure not found');
        }
        setFetching(false);
    };

    const totalFee = formData.tuitionFee + formData.transportFee + formData.booksFee +
        formData.uniformFee + formData.examFee + formData.otherFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await updateFeeStructure(id, formData);

        if (result.success) {
            router.push('/fee-structure');
        } else {
            setError(result.error || 'Failed to update fee structure');
        }

        setLoading(false);
    };

    if (fetching) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading fee structure...
            </div>
        );
    }

    if (!fetching && !structureInfo) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
                <p style={{ color: 'red' }}>Fee structure not found.</p>
                <Link href="/fee-structure" className="btn btn-secondary">Back to Fee Structures</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/fee-structure" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={18} />
                    Back to Fee Structures
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>Edit Fee Structure</h1>
                {structureInfo && (
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        {structureInfo.className} &mdash; {structureInfo.academicYear}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '2.5rem' }}>
                {/* Basic Info */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Basic Information</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Structure Name <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input"
                                placeholder="e.g., Class 1 Annual Fee 2025-26"
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Status</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    style={{ width: '1.1rem', height: '1.1rem' }}
                                />
                                <span style={{ fontWeight: '500' }}>Active</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    (Inactive structures will not be available for new fee assignments)
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '2rem 0' }}></div>

                {/* Fee Components */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                        <DollarSign size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
                        Fee Components
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tuition Fee</label>
                            <input
                                type="number"
                                value={formData.tuitionFee}
                                onChange={(e) => setFormData({ ...formData, tuitionFee: parseFloat(e.target.value) || 0 })}
                                className="input"
                                min="0"
                                step="0.01"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Transport Fee</label>
                            <input
                                type="number"
                                value={formData.transportFee}
                                onChange={(e) => setFormData({ ...formData, transportFee: parseFloat(e.target.value) || 0 })}
                                className="input"
                                min="0"
                                step="0.01"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Books Fee</label>
                            <input
                                type="number"
                                value={formData.booksFee}
                                onChange={(e) => setFormData({ ...formData, booksFee: parseFloat(e.target.value) || 0 })}
                                className="input"
                                min="0"
                                step="0.01"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Uniform Fee</label>
                            <input
                                type="number"
                                value={formData.uniformFee}
                                onChange={(e) => setFormData({ ...formData, uniformFee: parseFloat(e.target.value) || 0 })}
                                className="input"
                                min="0"
                                step="0.01"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Exam Fee</label>
                            <input
                                type="number"
                                value={formData.examFee}
                                onChange={(e) => setFormData({ ...formData, examFee: parseFloat(e.target.value) || 0 })}
                                className="input"
                                min="0"
                                step="0.01"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Other Fee</label>
                            <input
                                type="number"
                                value={formData.otherFee}
                                onChange={(e) => setFormData({ ...formData, otherFee: parseFloat(e.target.value) || 0 })}
                                className="input"
                                min="0"
                                step="0.01"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Total Display */}
                    <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', border: '2px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>Total Fee:</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>₹{totalFee.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '2rem 0' }}></div>

                {/* Payment Options */}
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Payment Options</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Number of Installments</label>
                            <input
                                type="number"
                                value={formData.installments}
                                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                                className="input"
                                min="1"
                                max="12"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Late Fee (per day)</label>
                            <input
                                type="number"
                                value={formData.lateFeePerDay}
                                onChange={(e) => setFormData({ ...formData, lateFeePerDay: parseFloat(e.target.value) || 0 })}
                                className="input"
                                min="0"
                                step="0.01"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <Link href="/fee-structure" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
