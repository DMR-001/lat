import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function addClass(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const grade = formData.get('grade') as string;

    await prisma.class.create({
        data: { name, grade }
    });

    revalidatePath('/settings');
}

export default async function SettingsPage() {
    const classes = await prisma.class.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Settings</h1>

            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Class Management</h2>

                <form action={addClass} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Class Name</label>
                        <input type="text" name="name" placeholder="e.g. Grade 1A" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Grade Level</label>
                        <input type="text" name="grade" placeholder="e.g. 1" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <button type="submit" className="btn btn-primary">Add Class</button>
                </form>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Class Name</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Grade</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Students</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No classes found.
                                </td>
                            </tr>
                        ) : (
                            classes.map((c) => (
                                <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>{c.name}</td>
                                    <td style={{ padding: '1rem' }}>{c.grade}</td>
                                    <td style={{ padding: '1rem' }}>-</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
