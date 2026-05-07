import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Plus, Download, Upload, ArrowRight } from 'lucide-react';
import Search from '@/components/Search';
import ClassFilter from '@/components/ClassFilter';
import { Prisma } from '@prisma/client';
import { getFilterContext } from '@/lib/filter-context';

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ query?: string, classId?: string }> }) {
    const { query, classId } = await searchParams;
    const { branchId } = await getFilterContext();

    const where: Prisma.StudentWhereInput = {};

    // Filter by branch if selected
    if (branchId) {
        where.branchId = branchId;
    }

    if (query) {
        where.OR = [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { admissionNo: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
        ];
    }

    if (classId) {
        where.classId = classId;
    }

    const students = await prisma.student.findMany({
        where,
        include: { class: true },
        orderBy: { createdAt: 'desc' }
    });

    // Also filter classes by branch
    const classes = await prisma.class.findMany({
        where: branchId ? { branchId } : {},
        orderBy: { name: 'asc' }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Students</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/students/promote" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--secondary-light, #fef3c7)', color: 'var(--secondary, #f59e0b)', textDecoration: 'none' }}>
                        <ArrowRight size={20} />
                        Promote Students
                    </Link>
                    <Link href="/students/import" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', textDecoration: 'none' }}>
                        <Upload size={20} />
                        Import CSV
                    </Link>
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

            <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, maxWidth: '400px' }}>
                    <Search placeholder="Search students..." />
                </div>
                <div style={{ width: '200px' }}>
                    <ClassFilter classes={classes} />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Admission No</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Gender</th>
                            <th>Parent Contact</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem' }}>
                                    No students found.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.id}>
                                    <td style={{ fontWeight: '600', fontFamily: 'monospace', fontSize: '0.85rem' }}>{student.admissionNo}</td>
                                    <td>
                                        <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{student.firstName} {student.lastName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{student.email}</div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                                            {student.class.name}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{student.gender}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{student.phone || '-'}</td>
                                    <td>
                                        <Link href={`/students/${student.id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>View</Link>
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
