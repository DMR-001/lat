'use client';

import { useRef } from 'react';
import { addClass, deleteClass } from '@/app/actions/class';
import { Trash2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" style={{ height: '46px', minWidth: '100px' }} disabled={pending}>
            {pending ? 'Adding...' : 'Add Class'}
        </button>
    );
}

export default function ClassManager({ classes }: { classes: any[] }) {
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Class Management</h2>

            <form
                action={async (formData) => {
                    await addClass(formData);
                    formRef.current?.reset();
                }}
                ref={formRef}
                style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}
            >
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Class Name</label>
                    <input type="text" name="name" placeholder="e.g. Grade 1" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Section (Optional)</label>
                    <input type="text" name="section" placeholder="e.g. A" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                </div>
                <SubmitButton />
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                    <tr>
                        <th style={{ padding: '1rem', fontWeight: '500' }}>Class Name</th>
                        <th style={{ padding: '1rem', fontWeight: '500' }}>Section</th>
                        <th style={{ padding: '1rem', fontWeight: '500' }}>Students</th>
                        <th style={{ padding: '1rem', fontWeight: '500' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {classes.length === 0 ? (
                        <tr>
                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No classes found.
                            </td>
                        </tr>
                    ) : (
                        classes.map((c) => (
                            <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>{c.name}</td>
                                <td style={{ padding: '1rem' }}>{c.section || '-'}</td>
                                <td style={{ padding: '1rem' }}>{c._count?.students || 0}</td>
                                <td style={{ padding: '1rem' }}>
                                    <form
                                        action={deleteClass.bind(null, c.id)}
                                        onSubmit={(e) => {
                                            if (!confirm('Are you sure you want to delete this class?')) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            style={{ padding: '0.5rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                            title="Delete Class"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
