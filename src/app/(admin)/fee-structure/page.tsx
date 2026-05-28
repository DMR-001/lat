'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { getFeeStructures, deleteFeeStructure } from '@/app/actions/fee-structure';

export default function FeeStructurePage() {
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [confirmName, setConfirmName] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    const load = () => {
        setLoading(true);
        getFeeStructures().then(r => {
            if (r.success && r.feeStructures) setFeeStructures(r.feeStructures);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleDeleteClick = (id: string, name: string) => {
        setConfirmId(id);
        setConfirmName(name);
        setError('');
    };

    const handleConfirmDelete = () => {
        if (!confirmId) return;
        startTransition(async () => {
            const result = await deleteFeeStructure(confirmId);
            if (result.success) {
                setConfirmId(null);
                load();
            } else {
                setError(result.error || 'Failed to delete');
            }
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Fee Structure Management</h1>
                <Link href="/fee-structure/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    Create Fee Structure
                </Link>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Name</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Class</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Academic Year</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Total Fee</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Installments</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                                </td>
                            </tr>
                        ) : feeStructures.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No fee structures found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            feeStructures.map((structure: any) => (
                                <tr key={structure.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '600' }}>{structure.name}</td>
                                    <td style={{ padding: '1rem' }}>{structure.class?.name || 'All Classes'}</td>
                                    <td style={{ padding: '1rem' }}>{structure.academicYear?.name || 'All Years'}</td>
                                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary)' }}>
                                        ₹{structure.totalFee.toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{structure.installments}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            backgroundColor: structure.isActive ? 'var(--success)' : 'var(--text-secondary)',
                                            color: 'white'
                                        }}>
                                            {structure.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link
                                                href={`/fee-structure/${structure.id}/edit`}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                            >
                                                <Edit size={16} />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteClick(structure.id, structure.name)}
                                                className="btn"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {feeStructures.length > 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Fee Components</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                        <div>• Registration Fee</div>
                        <div>• Tuition Fee</div>
                        <div>• Sports &amp; Activity Fee</div>
                        <div>• Book Fee</div>
                        <div>• Uniform &amp; Bag Fee</div>
                        <div>• Transport Fee</div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Dialog */}
            {confirmId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: '#0f172a' }}>
                            Delete Fee Structure?
                        </h3>
                        <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <strong>&ldquo;{confirmName}&rdquo;</strong> will be permanently deleted.
                        </p>
                        <p style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.6rem 0.75rem' }}>
                            ⚠ Any fee records already assigned to students from this structure will <strong>not</strong> be deleted — only the structure template is removed.
                        </p>
                        {error && (
                            <p style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem' }}>{error}</p>
                        )}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setConfirmId(null)}
                                disabled={isPending}
                                className="btn"
                                style={{ border: '1px solid var(--border)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isPending}
                                className="btn"
                                style={{ background: '#dc2626', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                            >
                                {isPending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={15} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
