import prisma from '@/lib/prisma';
import { assignFee } from '@/app/actions/fee';

export default async function AssignFeePage() {
    const students = await prisma.student.findMany({
        orderBy: { lastName: 'asc' }
    });

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Assign Fee</h1>
            <form action={assignFee} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Student</label>
                    <select name="studentId" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <option value="">Select Student</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Fee Type</label>
                    <select name="type" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <option value="TUITION">Tuition Fee</option>
                        <option value="TRANSPORT">Transport Fee</option>
                        <option value="ADMISSION">Admission Fee</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Amount</label>
                        <input type="number" name="amount" step="0.01" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Due Date</label>
                        <input type="date" name="dueDate" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn" style={{ border: '1px solid var(--border)' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Assign Fee</button>
                </div>
            </form>
        </div>
    );
}
