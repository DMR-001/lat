import prisma from '@/lib/prisma';
import { updateStudent } from '@/app/actions/student';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const student = await prisma.student.findUnique({
        where: { id }
    });

    const classes = await prisma.class.findMany({
        orderBy: { name: 'asc' }
    });

    if (!student) return <div>Student not found</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href={`/students/${student.id}`} style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Edit Student</h1>
            </div>

            <form action={updateStudent} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input type="hidden" name="id" value={student.id} />

                <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>First Name</label>
                        <input type="text" name="firstName" defaultValue={student.firstName} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Last Name</label>
                        <input type="text" name="lastName" defaultValue={student.lastName} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date of Birth</label>
                        <input type="date" name="dob" defaultValue={student.dob.toISOString().split('T')[0]} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Gender</label>
                        <select name="gender" defaultValue={student.gender} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Class</label>
                        <select name="classId" defaultValue={student.classId} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.section ? `(Section ${c.section})` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone</label>
                        <input type="tel" name="phone" defaultValue={student.phone || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                        <input type="email" name="email" defaultValue={student.email || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Parent Name</label>
                        <input type="text" name="parentName" defaultValue={student.parentName || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Address</label>
                        <textarea name="address" defaultValue={student.address || ''} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}></textarea>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Link href={`/students/${student.id}`} className="btn" style={{ border: '1px solid var(--border)' }}>Cancel</Link>
                    <button type="submit" className="btn btn-primary">Update Student</button>
                </div>
            </form>
        </div>
    );
}
