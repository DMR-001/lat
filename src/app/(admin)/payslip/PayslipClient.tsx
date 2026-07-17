'use client';

import { useState } from 'react';
import { Wallet, ChevronDown, ChevronRight, Printer, CheckCircle2, Clock } from 'lucide-react';

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
    schoolAddress: string | null;
    schoolPhone: string | null;
    logoUrl: string | null;
};

function fmt(n: number) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

function buildPayslipHtml(payment: Payment, teacher: Teacher, salary: Salary | null,
    schoolName: string, schoolAddress: string | null, schoolPhone: string | null, logoBase64: string | null
): string {
    const gross = (salary?.basicSalary ?? 0) + (salary?.allowances ?? 0);
    const totalDed = (salary?.deductions ?? 0) + payment.leaveDeduction;
    const f = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
    const logoHtml = logoBase64
        ? `<img src="${logoBase64}" style="height:64px;width:auto;object-fit:contain;" />`
        : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Payslip - ${MONTHS[payment.month]} ${payment.year}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 32px; }
  .header { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #111; margin-bottom: 16px; }
  .header-text { flex: 1; }
  .school-name { font-size: 18px; font-weight: 700; letter-spacing: 0.02em; }
  .school-sub { font-size: 11px; color: #444; margin-top: 2px; }
  .slip-title { font-size: 13px; font-weight: 700; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.08em; }
  .divider { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
  .emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 32px; margin-bottom: 16px; }
  .emp-row { display: flex; gap: 6px; }
  .emp-label { color: #555; min-width: 110px; }
  .emp-val { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #111; color: #fff; padding: 7px 10px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
  th:last-child, th:nth-child(2) { text-align: right; }
  td { padding: 7px 10px; border-bottom: 1px solid #ddd; }
  td:last-child, td:nth-child(2) { text-align: right; }
  .subtotal td { border-top: 1.5px solid #999; font-weight: 600; background: #f5f5f5; }
  .net-row { display: flex; justify-content: space-between; align-items: center; border: 2px solid #111; padding: 10px 14px; margin-bottom: 24px; }
  .net-label { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .net-val { font-size: 18px; font-weight: 700; }
  .footer { margin-top: 32px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 10px; color: #888; text-align: center; }
  @media print { .wrap { padding: 16px; } }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    ${logoHtml}
    <div class="header-text">
      <div class="school-name">${schoolName}</div>
      ${schoolAddress ? `<div class="school-sub">${schoolAddress}</div>` : ''}
      ${schoolPhone ? `<div class="school-sub">Ph: ${schoolPhone}</div>` : ''}
      <div class="slip-title">Salary Slip — ${MONTHS[payment.month]} ${payment.year}</div>
    </div>
  </div>

  <div class="emp-grid">
    <div class="emp-row"><span class="emp-label">Employee Name</span><span class="emp-val">${teacher.firstName} ${teacher.lastName}</span></div>
    <div class="emp-row"><span class="emp-label">Employee ID</span><span class="emp-val">${teacher.employeeId || '—'}</span></div>
    <div class="emp-row"><span class="emp-label">Designation</span><span class="emp-val">${teacher.subject || '—'}</span></div>
    <div class="emp-row"><span class="emp-label">Branch</span><span class="emp-val">${teacher.branchName || '—'}</span></div>
    <div class="emp-row"><span class="emp-label">Email</span><span class="emp-val">${teacher.email}</span></div>
    <div class="emp-row"><span class="emp-label">Pay Period</span><span class="emp-val">${MONTHS[payment.month]} ${payment.year}</span></div>
    ${payment.paymentDate ? `<div class="emp-row"><span class="emp-label">Payment Date</span><span class="emp-val">${new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
    ${payment.referenceNo ? `<div class="emp-row"><span class="emp-label">Reference No</span><span class="emp-val">${payment.referenceNo}</span></div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Earnings</th><th>Amount (₹)</th>
        <th>Deductions</th><th>Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic Salary</td><td>${f(salary?.basicSalary ?? 0)}</td>
        <td>Fixed Deductions</td><td>${f(salary?.deductions ?? 0)}</td>
      </tr>
      <tr>
        <td>Allowances</td><td>${f(salary?.allowances ?? 0)}</td>
        <td>Leave Deduction (${payment.leaveDays} day${payment.leaveDays !== 1 ? 's' : ''})</td><td>${f(payment.leaveDeduction)}</td>
      </tr>
      <tr class="subtotal">
        <td>Gross Earnings</td><td>${f(gross)}</td>
        <td>Total Deductions</td><td>${f(totalDed)}</td>
      </tr>
    </tbody>
  </table>

  <div class="net-row">
    <span class="net-label">Net Pay for ${MONTHS[payment.month]} ${payment.year}</span>
    <span class="net-val">₹ ${f(payment.finalAmount)}</span>
  </div>

  ${payment.remarks ? `<p style="font-size:12px;color:#555;margin-bottom:16px;"><strong>Remarks:</strong> ${payment.remarks}</p>` : ''}

  <div class="footer">This is a computer-generated payslip and does not require a signature. | ${schoolName}</div>
</div>
</body>
</html>`;
}

export default function PayslipClient({ teacher, salary, payments, schoolName, schoolAddress, schoolPhone, logoUrl }: Props) {
    const [expandedId, setExpandedId] = useState<string | null>(
        payments.find(p => p.status === 'PAID')?.id ?? payments[0]?.id ?? null
    );

    const handlePrint = async (payment: Payment) => {
        // Convert logo to base64 so it loads correctly in the print popup
        let logoBase64: string | null = null;
        if (logoUrl) {
            try {
                const res = await fetch(logoUrl);
                const blob = await res.blob();
                logoBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch { /* skip logo if fetch fails */ }
        }

        const html = buildPayslipHtml(payment, teacher, salary, schoolName, schoolAddress, schoolPhone, logoBase64);
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>My Payslips</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {teacher.firstName} {teacher.lastName}
                    {teacher.employeeId ? ` · ID: ${teacher.employeeId}` : ''}
                    {teacher.branchName ? ` · ${teacher.branchName}` : ''}
                </p>
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

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
