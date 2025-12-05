import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Search, Download } from 'lucide-react';

export default async function StudentsPage() {
    const students = await prisma.student.findMany({
        include: { class: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Students</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/students/export" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={20} />
                        Export
                    </Link>
                    <Link href="/students/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={20} />
                        Add Student
                    </Link>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search students..."
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

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Admission No</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Name</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Class</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Gender</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Parent Contact</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No students found. Add your first student!
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.admissionNo}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{student.firstName} {student.lastName}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                                            {student.class.name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{student.gender}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{student.phone || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/students/${student.id}`} style={{ color: 'var(--primary)', fontWeight: '500' }}>View</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
