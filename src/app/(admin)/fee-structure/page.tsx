import { getFeeStructures } from '@/app/actions/fee-structure';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default async function FeeStructurePage() {
    const result = await getFeeStructures();
    const feeStructures = result.success ? result.feeStructures : [];

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
                        {feeStructures.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No fee structures found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            feeStructures.map((structure) => (
                                <tr key={structure.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '600' }}>{structure.name}</td>
                                    <td style={{ padding: '1rem' }}>{structure.class?.name || 'All Classes'}</td>
                                    <td style={{ padding: '1rem' }}>{structure.academicYear?.name || 'All Years'}</td>
                                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary)' }}>
                                        ₹{structure.totalFee.toFixed(2)}
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
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Fee Breakdown Legend */}
            {feeStructures.length > 0 && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Fee Components</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                        <div>• Tuition Fee</div>
                        <div>• Transport Fee</div>
                        <div>• Books Fee</div>
                        <div>• Uniform Fee</div>
                        <div>• Exam Fee</div>
                        <div>• Other Fee</div>
                    </div>
                </div>
            )}
        </div>
    );
}
