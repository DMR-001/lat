import { getActiveSalaries } from '@/app/actions/salary';
import Link from 'next/link';
import { Plus, DollarSign, Users, Calendar } from 'lucide-react';

export default async function SalariesPage() {
    const result = await getActiveSalaries();
    const salaries = result.success && result.salaries ? result.salaries : [];

    const totalSalaries = salaries.reduce((sum: number, s: any) => sum + s.netSalary, 0);
    const pendingPayments = salaries.reduce((sum: number, s: any) => sum + s.payments.length, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Salary Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage teacher salaries and payments</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/management/salaries/generate" className="btn btn-secondary">
                        <Calendar size={20} style={{ marginRight: '0.5rem' }} />
                        Generate Monthly Payments
                    </Link>
                    <Link href="/management/salaries/new" className="btn btn-primary">
                        <Plus size={20} style={{ marginRight: '0.5rem' }} />
                        Add Salary Structure
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={24} style={{ color: '#3b82f6' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Teachers</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{salaries.length}</div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={24} style={{ color: '#10b981' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Monthly Total</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{totalSalaries.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={24} style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Payments</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{pendingPayments}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link href="/management/salaries/payments" className="btn btn-secondary">
                    View All Payments
                </Link>
            </div>

            {/* Salaries Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Teacher</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Email</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Basic Salary</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Allowances</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Deductions</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Net Salary</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salaries.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No salary structures found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            salaries.map((salary: any) => (
                                <tr key={salary.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '600' }}>
                                        {salary.teacher.firstName} {salary.teacher.lastName}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{salary.teacher.email}</td>
                                    <td style={{ padding: '1rem' }}>₹{salary.basicSalary.toFixed(2)}</td>
                                    <td style={{ padding: '1rem', color: 'var(--success)' }}>+₹{salary.allowances.toFixed(2)}</td>
                                    <td style={{ padding: '1rem', color: 'var(--error)' }}>-₹{salary.deductions.toFixed(2)}</td>
                                    <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                        ₹{salary.netSalary.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            backgroundColor: salary.isActive ? 'var(--success)' : 'var(--text-secondary)',
                                            color: 'white'
                                        }}>
                                            {salary.isActive ? 'Active' : 'Inactive'}
                                        </span>
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
