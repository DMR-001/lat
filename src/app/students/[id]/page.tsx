import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            class: true,
            fees: {
                orderBy: { dueDate: 'desc' }
            }
        }
    });

    if (!student) return <div>Student not found</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/students" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Student Profile</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href={`/students/${student.id}/edit`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Edit size={18} />
                        Edit
                    </Link>
                    <DeleteButton id={student.id} />
                </div>
            </div>

            {/* Profile Card */}
            <div className="card">
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'var(--primary)'
                    }}>
                        {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{student.firstName} {student.lastName}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Admission No: {student.admissionNo}</p>

                        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Class</p>
                                <p style={{ fontWeight: '500' }}>{student.class.name} (Grade {student.class.grade})</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Date of Birth</p>
                                <p style={{ fontWeight: '500' }}>{student.dob.toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gender</p>
                                <p style={{ fontWeight: '500' }}>{student.gender}</p>
                            </div>

                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Phone</p>
                                <p style={{ fontWeight: '500' }}>{student.phone || '-'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email</p>
                                <p style={{ fontWeight: '500' }}>{student.email || '-'}</p>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Address</p>
                                <p style={{ fontWeight: '500' }}>{student.address || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fees Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Fee History</h3>
                    <Link href={`/fees/collect/${student.id}`} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                        Manage Fees
                    </Link>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Type</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Amount</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Paid</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Status</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {student.fees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No fee records found.
                                    </td>
                                </tr>
                            ) : (
                                student.fees.map(fee => (
                                    <tr key={fee.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>{fee.type}</td>
                                        <td style={{ padding: '1rem' }}>₹{fee.amount.toFixed(2)}</td>
                                        <td style={{ padding: '1rem', color: 'var(--success)' }}>₹{fee.paidAmount.toFixed(2)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                backgroundColor: fee.status === 'PAID' ? 'var(--success)' : 'var(--warning)',
                                                color: 'white'
                                            }}>
                                                {fee.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{fee.dueDate.toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
