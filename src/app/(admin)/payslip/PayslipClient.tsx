'use client';

import { useState } from 'react';
import { Wallet, ChevronDown, ChevronRight, Printer, Calendar, IndianRupee, CheckCircle2, Clock } from 'lucide-react';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

type Payment = {
    id: string;
    month: number;
    year: number;
    amount: number;
    leaveDays: number;
    leaveDeduction: number;
    finalAmount: number;
    status: string;
    paymentDate: string | null;
    paymentMethod: string | null;
    referenceNo: string | null;
    remarks: string | null;
    createdAt: string;
};

type Teacher = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string | null;
    subject: string | null;
    branchName: string | null;
};

type Salary = {
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    effectiveFrom: string;
};

type Props = {
    teacher: Teacher;
    salary: Salary | null;
    payments: Payment[];
    schoolName: string;
};

function fmt(n: number) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

function PayslipPrint({ payment, teacher, salary, schoolName }: { payment: Payment; teacher: Teacher; salary: Salary | null; schoolName: string }) {
    return (
        <div id={`payslip-${payment.id}`} style={{ display: 'none' }}>
            <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem', maxWidth: '700px', margin: '0 auto', color: '#111' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{schoolName}</h2>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#444' }}>Salary Slip — {MONTHS[payment.month]} {payment.year}</p>
                </div>

                {/* Employee info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    <div><span style={{ color: '#666' }}>Employee Name:</span> <strong>{teacher.firstName} {teacher.lastName}</strong></div>
                    <div><span style={{ color: '#666' }}>Employee ID:</span> {teacher.employeeId || '—'}</div>
                    <div><span style={{ color: '#666' }}>Email:</span> {teacher.email}</div>
                    <div><span style={{ color: '#666' }}>Subject:</span> {teacher.subject || '—'}</div>
                    <div><span style={{ color: '#666' }}>Branch:</span> {teacher.branchName || '—'}</div>
                    <div><span style={{ color: '#666' }}>Pay Period:</span> {MONTHS[payment.month]} {payment.year}</div>
                </div>

                {/* Earnings & Deductions */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Earnings</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #e5e7eb' }}>Amount (₹)</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Deductions</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #e5e7eb' }}>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>Basic Salary</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #e5e7eb' }}>{fmt(salary?.basicSalary ?? 0)}</td>
                            <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>Fixed Deductions</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #e5e7eb' }}>{fmt(salary?.deductions ?? 0)}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>Allowances</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #e5e7eb' }}>{fmt(salary?.allowances ?? 0)}</td>
                            <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>Leave Deduction ({payment.leaveDays} days)</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #e5e7eb' }}>{fmt(payment.leaveDeduction)}</td>
                        </tr>
                        <tr style={{ background: '#f9fafb', fontWeight: 600 }}>
                            <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>Gross Earnings</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #e5e7eb' }}>{fmt((salary?.basicSalary ?? 0) + (salary?.allowances ?? 0))}</td>
                            <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>Total Deductions</td>
                            <td style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #e5e7eb' }}>{fmt((salary?.deductions ?? 0) + payment.leaveDeduction)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Net Pay */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>Net Pay</span>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#16a34a' }}>₹ {fmt(payment.finalAmount)}</span>
                </div>

                {/* Payment info */}
                {payment.status === 'PAID' && (
                    <div style={{ fontSize: '0.8125rem', color: '#444', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 2rem' }}>
                        <div><span style={{ color: '#666' }}>Payment Date:</span> {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : '—'}</div>
                        <div><span style={{ color: '#666' }}>Payment Method:</span> {payment.paymentMethod || '—'}</div>
                        {payment.referenceNo && <div><span style={{ color: '#666' }}>Reference No:</span> {payment.referenceNo}</div>}
                        {payment.remarks && <div><span style={{ color: '#666' }}>Remarks:</span> {payment.remarks}</div>}
                    </div>
                )}

                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
                    This is a computer-generated payslip and does not require a signature.
                </div>
            </div>
        </div>
    );
}

export default function PayslipClient({ teacher, salary, payments, schoolName }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(
        payments.find(p => p.status === 'PAID')?.id ?? payments[0]?.id ?? null
    );

    const handlePrint = (payment: Payment) => {
        const el = document.getElementById(`payslip-${payment.id}`);
        if (!el) return;
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`<html><head><title>Payslip ${MONTHS[payment.month]} ${payment.year}</title><style>body{margin:0}@media print{body{margin:0}}</style></head><body>${el.innerHTML}</body></html>`);
        win.document.close();
        win.focus();
        win.print();
        win.close();
    };

    const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.finalAmount, 0);
    const pendingCount = payments.filter(p => p.status === 'PENDING').length;

    return (
        <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>My Payslips</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {teacher.firstName} {teacher.lastName} {teacher.employeeId ? `· ${teacher.employeeId}` : ''} {teacher.branchName ? `· ${teacher.branchName}` : ''}
                </p>
            </div>

            {/* Salary structure summary */}
            {salary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Basic Salary', value: salary.basicSalary, color: '#2563eb', bg: '#dbeafe' },
                        { label: 'Allowances', value: salary.allowances, color: '#059669', bg: '#d1fae5' },
                        { label: 'Deductions', value: salary.deductions, color: '#dc2626', bg: '#fee2e2' },
                        { label: 'Net Salary', value: salary.netSalary, color: '#7c3aed', bg: '#ede9fe' },
                    ].map(s => (
                        <div key={s.label} style={{ background: s.bg, borderRadius: '0.75rem', padding: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, margin: '0.25rem 0 0' }}>₹{fmt(s.value)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', margin: 0 }}>Total Payslips</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0.25rem 0 0' }}>{payments.length}</p>
                </div>
                <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', margin: 0 }}>Total Received</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669', margin: '0.25rem 0 0' }}>₹{fmt(totalPaid)}</p>
                </div>
                {pendingCount > 0 && (
                    <div style={{ background: '#fffbeb', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #fde68a' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', margin: 0 }}>Pending</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b45309', margin: '0.25rem 0 0' }}>{pendingCount} month{pendingCount > 1 ? 's' : ''}</p>
                    </div>
                )}
            </div>

            {/* Payslip list */}
            {payments.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Wallet size={28} color="#9ca3af" />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>No payslips yet</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Your payslips will appear here once monthly payments are generated</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    {payments.map((p, idx) => {
                        const isPaid = p.status === 'PAID';
                        const isExpanded = expandedId === p.id;
                        return (
                            <div key={p.id} style={{ borderBottom: idx < payments.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                    style={{ padding: '1rem 1.25rem', cursor: 'pointer', background: isExpanded ? '#fafafa' : 'white', display: 'flex', alignItems: 'center', gap: '0.875rem' }}
                                >
                                    <div style={{ color: '#9ca3af', flexShrink: 0 }}>
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: isPaid ? '#d1fae5' : '#fef3c7', color: isPaid ? '#065f46' : '#92400e', flexShrink: 0 }}>
                                        {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {isPaid ? 'Paid' : 'Pending'}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>
                                            {MONTHS[p.month]} {p.year}
                                        </p>
                                        {isPaid && p.paymentDate && (
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                                                Paid on {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {p.paymentMethod ? ` via ${p.paymentMethod}` : ''}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem', color: isPaid ? '#059669' : '#d97706' }}>
                                            ₹{fmt(p.finalAmount)}
                                        </p>
                                        {p.leaveDays > 0 && (
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
                                                {p.leaveDays} leave day{p.leaveDays > 1 ? 's' : ''} deducted
                                            </p>
                                        )}
                                    </div>

                                    {isPaid && (
                                        <button
                                            onClick={e => { e.stopPropagation(); handlePrint(p); }}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', fontSize: '0.8125rem', color: '#374151', cursor: 'pointer', flexShrink: 0 }}
                                        >
                                            <Printer size={14} /> Print
                                        </button>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div style={{ padding: '0 1.25rem 1.25rem 3.25rem', background: '#fafafa' }}>
                                        <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                                <tbody>
                                                    {[
                                                        ['Basic Salary', `₹${fmt(salary?.basicSalary ?? 0)}`],
                                                        ['Allowances', `₹${fmt(salary?.allowances ?? 0)}`],
                                                        ['Gross Earnings', `₹${fmt((salary?.basicSalary ?? 0) + (salary?.allowances ?? 0))}`],
                                                        ['Fixed Deductions', `−₹${fmt(salary?.deductions ?? 0)}`],
                                                        [`Leave Deduction (${p.leaveDays} day${p.leaveDays !== 1 ? 's' : ''})`, `−₹${fmt(p.leaveDeduction)}`],
                                                        p.remarks ? ['Remarks', p.remarks] : null,
                                                        ['Net Pay', `₹${fmt(p.finalAmount)}`],
                                                    ].filter((r): r is string[] => r !== null).map(([label, value], i, arr) => (
                                                        <tr key={label as string} style={{ borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none', background: label === 'Net Pay' ? '#f0fdf4' : 'white' }}>
                                                            <td style={{ padding: '0.625rem 1rem', color: '#6b7280' }}>{label}</td>
                                                            <td style={{ padding: '0.625rem 1rem', textAlign: 'right', fontWeight: label === 'Net Pay' ? 700 : 500, color: label === 'Net Pay' ? '#059669' : (String(value).startsWith('−') ? '#dc2626' : '#111827') }}>{value}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Hidden print template */}
                                <PayslipPrint payment={p} teacher={teacher} salary={salary} schoolName={schoolName} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
