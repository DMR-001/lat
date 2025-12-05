import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Search, User } from 'lucide-react';

import { Student } from '@prisma/client';

export default async function CollectFeesSearchPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const { query } = await searchParams;

    let students: Student[] = [];
    if (query) {
        students = await prisma.student.findMany({
            where: {
                OR: [
                    { admissionNo: { contains: query, mode: 'insensitive' } },
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                ]
            },
            orderBy: { firstName: 'asc' }
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Collect Fees</h1>

            <div className="card">
                <form style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            name="query"
                            defaultValue={query}
                            placeholder="Search Student by Admission No, Name, or Phone..."
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Search</button>
                </form>
            </div>

            {query && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Admission No</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Name</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Class</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Parent Contact</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No students found for "{query}".
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{student.admissionNo}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{student.firstName} {student.lastName}</td>
                                        <td style={{ padding: '1rem' }}>Grade 1</td>
                                        <td style={{ padding: '1rem' }}>{student.phone || 'N/A'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link href={`/fees/collect/${student.id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                                                Select
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
