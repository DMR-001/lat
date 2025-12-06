import prisma from '@/lib/prisma';
import Link from 'next/link';
import Search from '@/components/Search';
import ClassFilter from '@/components/ClassFilter';
import { Prisma } from '@prisma/client';

export default async function CollectFeesSearchPage({ searchParams }: { searchParams: Promise<{ query?: string, classId?: string }> }) {
    const { query, classId } = await searchParams;

    const where: Prisma.StudentWhereInput = {};

    if (query) {
        where.OR = [
            { admissionNo: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
        ];
    }

    if (classId) {
        where.classId = classId;
    }

    // Fetch students if query or classId is present, or just first 10 if nothing selected (optional, or just show empty state)
    let students: any[] = [];
    if (query || classId) {
        students = await prisma.student.findMany({
            where,
            include: { class: true },
            orderBy: { firstName: 'asc' },
            take: 50 // Limit results for performance
        });
    }

    const classes = await prisma.class.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Collect Fees</h1>

            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <Search placeholder="Search Student by Admission No, Name, or Phone..." />
                </div>
                <div style={{ width: '200px' }}>
                    <ClassFilter classes={classes} />
                </div>
            </div>

            {(query || classId) && (
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
                                        No students found.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{student.admissionNo}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{student.firstName} {student.lastName}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {student.class.name} {student.class.section ? `(${student.class.section})` : ''}
                                        </td>
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
