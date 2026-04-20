'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Tag, CreditCard } from 'lucide-react';

const FEE_TYPE_LABELS: Record<string, string> = {
    REGISTRATION: 'Registration Fee',
    TUITION:      'Tuition Fee',
    SPORTS:       'Sports & Activity Fee',
    BOOKS:        'Book Fee',
    UNIFORM:      'Uniform & Bag Fee',
    TRANSPORT:    'Transport Fee',
};

type Fee = {
    id: string;
    type: string;
    amount: number;
    originalAmount: number;
    discountAmount: number;
    discountReason: string | null;
    paidAmount: number;
    dueDate: string;
    status: string;
};

type StudentGroup = {
    student: {
        id: string;
        firstName: string;
        lastName: string;
        admissionNo: string;
        class: { name: string } | null;
    };
    fees: Fee[];
};

export default function FeesTreeView({ studentGroups }: { studentGroups: StudentGroup[] }) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (studentGroups.length === 0) {
        return (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No fee records found. Assign fees to students to get started.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {/* Column header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
                padding: '0.5rem 1.25rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                gap: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            }}>
                <div>Student</div>
                <div>Total Fee</div>
                <div>Paid</div>
                <div>Due</div>
                <div>Status</div>
                <div>Components</div>
                <div></div>
            </div>

            {studentGroups.map(({ student, fees: rawFees }) => {
                // Hide stale ₹0 rows left over from old fee types (EXAM, OTHER)
                const fees = rawFees.filter(f => f.amount > 0 || f.paidAmount > 0);
                if (fees.length === 0) return null;
                const totalAmount = fees.reduce((s, f) => s + f.amount, 0);
                const totalPaid   = fees.reduce((s, f) => s + f.paidAmount, 0);
                const totalDue    = totalAmount - totalPaid;
                const allPaid     = fees.every(f => f.status === 'PAID');
                const somePaid    = !allPaid && fees.some(f => f.paidAmount > 0);
                const overallStatus = allPaid ? 'PAID' : somePaid ? 'PARTIAL' : 'PENDING';
                const statusColor   = allPaid ? 'var(--success)' : somePaid ? '#f59e0b' : 'var(--warning)';
                const isOpen = expanded.has(student.id);

                return (
                    <div key={student.id} className="card" style={{ padding: 0, overflow: 'hidden', border: isOpen ? '1.5px solid var(--primary)' : undefined }}>
                        {/* Student summary row */}
                        <div
                            onClick={() => toggle(student.id)}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
                                alignItems: 'center',
                                padding: '0.9rem 1.25rem',
                                cursor: 'pointer',
                                backgroundColor: isOpen ? 'var(--primary-light)' : undefined,
                                gap: '1rem',
                                userSelect: 'none',
                            }}
                        >
                            {/* Name + admission */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ color: isOpen ? 'var(--primary)' : 'var(--text-secondary)', flexShrink: 0 }}>
                                    {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                                </span>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                                        {student.firstName} {student.lastName}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                        {student.admissionNo}{student.class ? ` · ${student.class.name}` : ''}
                                    </div>
                                </div>
                            </div>

                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>₹{totalAmount.toFixed(2)}</div>

                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--success)' }}>
                                ₹{totalPaid.toFixed(2)}
                            </div>

                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: totalDue > 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
                                ₹{totalDue.toFixed(2)}
                            </div>

                            <div>
                                <span style={{
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    backgroundColor: statusColor,
                                    color: 'white',
                                }}>
                                    {overallStatus}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {fees.length} item{fees.length !== 1 ? 's' : ''}
                            </div>

                            <div onClick={e => e.stopPropagation()}>
                                <Link
                                    href={`/fees/collect/${student.id}`}
                                    className="btn btn-primary"
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                                >
                                    <CreditCard size={13} /> Collect
                                </Link>
                            </div>
                        </div>

                        {/* Expanded fee components */}
                        {isOpen && (
                            <div style={{ borderTop: '1px solid var(--border)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--background)' }}>
                                            <th style={{ padding: '0.55rem 1.5rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'left' }}>Fee Type</th>
                                            <th style={{ padding: '0.55rem 1rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'right' }}>Original</th>
                                            <th style={{ padding: '0.55rem 1rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'right' }}>Discount</th>
                                            <th style={{ padding: '0.55rem 1rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'right' }}>Final</th>
                                            <th style={{ padding: '0.55rem 1rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'right' }}>Paid</th>
                                            <th style={{ padding: '0.55rem 1rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'right' }}>Due</th>
                                            <th style={{ padding: '0.55rem 1rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'center' }}>Due Date</th>
                                            <th style={{ padding: '0.55rem 1rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'center' }}>Status</th>
                                            <th style={{ padding: '0.55rem 1rem', fontWeight: '500', color: 'var(--text-secondary)', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fees.map(fee => {
                                            const due = fee.amount - fee.paidAmount;
                                            return (
                                                <tr key={fee.id} style={{ borderTop: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.65rem 1.5rem', fontWeight: '500' }}>
                                                        {FEE_TYPE_LABELS[fee.type] || fee.type}
                                                    </td>
                                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                        ₹{(fee.originalAmount > 0 ? fee.originalAmount : fee.amount).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                                                        {fee.discountAmount > 0 ? (
                                                            <span style={{ color: 'var(--error)' }} title={fee.discountReason || ''}>
                                                                −₹{fee.discountAmount.toFixed(2)}
                                                            </span>
                                                        ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: '600' }}>
                                                        ₹{fee.amount.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--success)' }}>
                                                        ₹{fee.paidAmount.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: due > 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
                                                        ₹{due.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                        {new Date(fee.dueDate).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.68rem',
                                                            fontWeight: '700',
                                                            backgroundColor: fee.status === 'PAID' ? 'var(--success)' : 'var(--warning)',
                                                            color: 'white',
                                                        }}>
                                                            {fee.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                                                            <Link
                                                                href={`/fees/${fee.id}/discount`}
                                                                style={{ color: 'var(--primary)', fontWeight: '500', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                            >
                                                                <Tag size={12} /> Discount
                                                            </Link>
                                                            {fee.status !== 'PAID' && (
                                                                <Link href={`/fees/${fee.id}/pay`} style={{ color: 'var(--success)', fontWeight: '600', fontSize: '0.78rem' }}>
                                                                    Pay
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
