'use client';

import { useState } from 'react';
import { updateSalaryStructure } from '@/app/actions/salary';
import { Pencil } from 'lucide-react';

export default function EditSalaryButton({ salary }: { salary: any }) {
    const [open, setOpen] = useState(false);
    const [basic, setBasic] = useState(String(salary.basicSalary));
    const [allowances, setAllowances] = useState(String(salary.allowances));
    const [deductions, setDeductions] = useState(String(salary.deductions));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const net = (parseFloat(basic) || 0) + (parseFloat(allowances) || 0) - (parseFloat(deductions) || 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');
        const result = await updateSalaryStructure(salary.id, {
            basicSalary: parseFloat(basic),
            allowances: parseFloat(allowances),
            deductions: parseFloat(deductions),
        });
        if (result.success) {
            setOpen(false);
        } else {
            setError(result.error || 'Failed to update');
        }
        setSaving(false);
    }

    const inp: React.CSSProperties = { width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box' };

    return (
        <>
            <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem', background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                <Pencil size={13} /> Edit
            </button>

            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Edit Salary Structure</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>{salary.teacher.firstName} {salary.teacher.lastName}</div>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94a3b8' }}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>Basic Salary (₹)</label>
                                <input type="number" value={basic} onChange={e => setBasic(e.target.value)} min="0" step="1" required style={inp} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>Allowances (₹)</label>
                                <input type="number" value={allowances} onChange={e => setAllowances(e.target.value)} min="0" step="1" required style={inp} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>Deductions (₹)</label>
                                <input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} min="0" step="1" required style={inp} />
                            </div>

                            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, color: '#374151' }}>Net Salary</span>
                                <span style={{ fontWeight: 800, color: '#16a34a' }}>₹{net.toLocaleString('en-IN')}</span>
                            </div>

                            {error && <div style={{ padding: '0.6rem 0.875rem', borderRadius: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.82rem' }}>{error}</div>}

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={saving} style={{ flex: 2, padding: '0.7rem', borderRadius: '0.5rem', border: 'none', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
