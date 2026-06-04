'use client';

import { useActionState } from 'react';
import { addStudent } from '@/app/actions/student';
import { getClasses } from '@/app/actions/class';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AddStudentPage() {
    const [state, formAction, pending] = useActionState(addStudent, null);
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        getClasses().then(setClasses);
    }, []);

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Add New Student</h1>

            {state?.error && (
                <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1.25rem', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>
                    {state.error}
                </div>
            )}

            <form action={formAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>First Name</label>
                        <input type="text" name="firstName" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Last Name</label>
                        <input type="text" name="lastName" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Email <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(Optional)</span></label>
                    <input type="email" name="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Parent Name</label>
                    <input type="text" name="parentName" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                </div>

                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Date of Birth</label>
                        <input type="date" name="dob" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Gender</label>
                        <select name="gender" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Class</label>
                    <select name="classId" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                        ))}
                    </select>
                    {classes.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--error)', marginTop: '0.5rem' }}>No classes found. Please create a class first in Settings.</p>}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Address</label>
                    <textarea name="address" rows={3} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}></textarea>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Phone (Primary)</label>
                        <input type="tel" name="phone" required placeholder="Father / Guardian" maxLength={10} pattern="[0-9]{10}" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Phone 2 <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(Optional)</span></label>
                        <input type="tel" name="phone2" placeholder="Mother / Alternate" maxLength={10} pattern="[0-9]{10}" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <Link href="/students" className="btn" style={{ border: '1px solid var(--border)', textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" disabled={pending} className="btn btn-primary">
                        {pending ? 'Saving...' : 'Save Student'}
                    </button>
                </div>
            </form>
        </div>
    );
}
