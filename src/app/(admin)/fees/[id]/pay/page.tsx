import prisma from '@/lib/prisma';
import { recordPayment } from '@/app/actions/fee';
import Link from 'next/link';

export default async function RecordPaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const fee = await prisma.fee.findUnique({
        where: { id },
        include: {
            student: true,
            feeStructure: { select: { installments: true } }
        }
    });

    if (!fee) return <div>Fee not found</div>;

    const remainingAmount = fee.amount - fee.paidAmount;
    const isTuition = fee.type === 'TUITION';

    // Compute installments for tuition fees only
    const installmentCount = isTuition ? Math.max(1, fee.feeStructure?.installments || 1) : 1;
    const installments = Array.from({ length: installmentCount }, (_, i) => {
        const instStart = i * (fee.amount / installmentCount);
        const instEnd = i === installmentCount - 1 ? fee.amount : (i + 1) * (fee.amount / installmentCount);
        const faceValue = instEnd - instStart;
        const paidTowardThis = Math.max(0, Math.min(fee.paidAmount - instStart, faceValue));
        const due = faceValue - paidTowardThis;
        return {
            index: i,
            label: installmentCount === 1 ? 'Full Fee' : `Installment ${i + 1} of ${installmentCount}`,
            faceValue,
            paid: paidTowardThis,
            due,
            isPaid: due <= 0.01,
        };
    });

    // Default amount = next unpaid installment (for tuition) or full remaining (for others)
    const nextDue = installments.find(inst => !inst.isPaid);
    const defaultAmount = isTuition && nextDue ? nextDue.due : remainingAmount;

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

                {/* Show installment breakdown only for Tuition fees */}
                {isTuition && installmentCount > 1 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Installments</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {installments.map(inst => (
                                <div key={inst.index} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem',
                                    backgroundColor: inst.isPaid ? '#f0fdf4' : '#fafafa',
                                    border: `1px solid ${inst.isPaid ? '#bbf7d0' : 'var(--border)'}`
                                }}>
                                    <span style={{ fontWeight: '500' }}>{inst.label}</span>
                                    {inst.isPaid ? (
                                        <span style={{ color: 'var(--success)', fontWeight: '600', fontSize: '0.78rem' }}>✓ Paid</span>
                                    ) : (
                                        <span style={{ color: 'var(--error)', fontWeight: '600' }}>₹{inst.due.toFixed(2)} due</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <form action={recordPayment} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input type="hidden" name="feeId" value={fee.id} />

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                        Payment Amount{isTuition && nextDue && installmentCount > 1 ? ` (${nextDue.label})` : ''}
                    </label>
                    <input
                        type="number"
                        name="amount"
                        step="0.01"
                        max={remainingAmount}
                        required
                        defaultValue={defaultAmount}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Payment Method</label>
                    <select name="method" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="ONLINE">Online Transfer</option>
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <Link href="/fees" className="btn" style={{ border: '1px solid var(--border)', textDecoration: 'none' }}>Cancel</Link>
                    <button type="submit" className="btn btn-primary">Record Payment</button>
                </div>
            </form>
        </div>
    );
}
