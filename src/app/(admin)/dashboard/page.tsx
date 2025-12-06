import Link from 'next/link';
import { Users, GraduationCap, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import PaymentDashboard from '@/components/PaymentDashboard';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const studentCount = await prisma.student.count();
  const teacherCount = await prisma.teacher.count();

  const feeStats = await prisma.fee.aggregate({
    _sum: {
      amount: true,
      paidAmount: true
    }
  });

  const totalFees = feeStats._sum.amount || 0;
  const paidFees = feeStats._sum.paidAmount || 0;
  const pendingFees = totalFees - paidFees;

  const stats = [
    { label: 'Total Students', value: studentCount, icon: GraduationCap, color: 'var(--primary)' },
    { label: 'Total Teachers', value: teacherCount, icon: Users, color: 'var(--secondary)' },
    { label: 'Total Fees', value: `₹${totalFees.toLocaleString()}`, icon: CreditCard, color: 'var(--text-main)' },
    { label: 'Collected Fees', value: `₹${paidFees.toLocaleString()}`, icon: Wallet, color: 'var(--success)' },
    { label: 'Pending Fees', value: `₹${pendingFees.toLocaleString()}`, icon: AlertCircle, color: 'var(--warning)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: stat.color,
              opacity: 0.1,
              position: 'absolute',
              width: '48px',
              height: '48px'
            }}></div>
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              color: stat.color,
              zIndex: 1
            }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{stat.label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/students/add" className="btn btn-primary">
              Add Student
            </Link>
            <Link href="/fees/collect" className="btn btn-secondary">
              Collect Fees
            </Link>
            <Link href="/receipts" className="btn btn-secondary">
              Print Receipt
            </Link>
          </div>
        </div>
      </div>

      <PaymentDashboard />
    </div>
  );
}
