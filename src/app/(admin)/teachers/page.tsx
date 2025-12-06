import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Search, Mail, Phone } from 'lucide-react';

export default async function TeachersPage() {
    const teachers = await prisma.teacher.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Teachers</h1>
                <Link href="/teachers/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    Add Teacher
                </Link>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search teachers..."
                            style={{
                                width: '100%',
                                padding: '0.5rem 1rem 0.5rem 2.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1" style={{ gap: '1px', backgroundColor: 'var(--border)' }}>
                    {teachers.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}>
                            No teachers found. Add your first teacher!
                        </div>
                    ) : (
                        teachers.map((teacher) => (
                            <div key={teacher.id} style={{ padding: '1.5rem', backgroundColor: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
                                        {teacher.firstName[0]}{teacher.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: '600', color: 'var(--text-main)' }}>{teacher.firstName} {teacher.lastName}</h3>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{teacher.subject || 'No Subject'}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={16} />
                                        {teacher.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Phone size={16} />
                                        {teacher.phone || '-'}
                                    </div>
                                </div>

                                <button style={{ color: 'var(--primary)', fontWeight: '500' }}>View Profile</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
