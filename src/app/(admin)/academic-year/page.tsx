import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Plus, CheckCircle, Calendar } from 'lucide-react';
import { setActiveYear } from '@/app/actions/academic-year';

export default async function AcademicYearPage() {
    const years = await prisma.academicYear.findMany({
        orderBy: { startDate: 'desc' },
        include: {
            _count: {
                select: {
                    enrollments: true,
                    fees: true,
                    certificates: true
                }
            }
        }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Academic Years</h1>
                <Link href="/academic-year/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    New Academic Year
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {years.map((year) => (
                    <div
                        key={year.id}
                        className="card"
                        style={{
                            padding: '1.5rem',
                            border: year.isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                            position: 'relative'
                        }}
                    >
                        {year.isActive && (
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                            }}>
                                <CheckCircle size={14} />
                                Active
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {year.name}
                            </h3>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={14} />
                                {year.startDate.toLocaleDateString()} - {year.endDate.toLocaleDateString()}
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: '0.25rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {year._count.enrollments}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Enrollments
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {year._count.fees}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Fees
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {year._count.certificates}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Certificates
                                </div>
                            </div>
                        </div>

                        {!year.isActive && (
                            <form action={async () => {
                                'use server';
                                await setActiveYear(year.id);
                            }}>
                                <button
                                    type="submit"
                                    className="btn btn-secondary"
                                    style={{ width: '100%', fontSize: '0.875rem' }}
                                >
                                    Set as Active Year
                                </button>
                            </form>
                        )}
                    </div>
                ))}

                {years.length === 0 && (
                    <div className="card" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            No academic years created yet.
                        </p>
                        <Link href="/academic-year/new" className="btn btn-primary">
                            Create First Academic Year
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
