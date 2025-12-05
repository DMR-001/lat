import prisma from '@/lib/prisma';
import { recordPayment } from '@/app/actions/fee';

export default async function RecordPaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const fee = await prisma.fee.findUnique({
        where: { id },
        include: { student: true }
    });

    if (!fee) return <div>Fee not found</div>;

    const remainingAmount = fee.amount - fee.paidAmount;

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Record Payment</h1>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Fee Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Student:</div>
                    <div style={{ fontWeight: '500' }}>{fee.student.firstName} {fee.student.lastName}</div>

                    <div style={{ color: 'var(--text-secondary)' }}>Type:</div>
                    <div style={{ fontWeight: '500' }}>{fee.type}</div>

                    <div style={{ color: 'var(--text-secondary)' }}>Total Amount:</div>
                    <div style={{ fontWeight: '500' }}>₹{fee.amount.toFixed(2)}</div>

                    <div style={{ color: 'var(--text-secondary)' }}>Paid So Far:</div>
                    <div style={{ fontWeight: '500', color: 'var(--success)' }}>₹{fee.paidAmount.toFixed(2)}</div>

                    <div style={{ color: 'var(--text-secondary)' }}>Remaining:</div>
                    <div style={{ fontWeight: '500', color: 'var(--error)' }}>₹{remainingAmount.toFixed(2)}</div>
                </div>
            </div>

            <form action={recordPayment} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input type="hidden" name="feeId" value={fee.id} />

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Payment Amount</label>
                    <input
                        type="number"
                        name="amount"
                        step="0.01"
                        max={remainingAmount}
                        required
                        defaultValue={remainingAmount}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Payment Method</label>
                    <select name="method" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="ONLINE">Online Transfer</option>
                        <option value="CHEQUE">Cheque</option>
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" className="btn" style={{ border: '1px solid var(--border)' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Record Payment</button>
                </div>
            </form>
        </div>
    );
}
