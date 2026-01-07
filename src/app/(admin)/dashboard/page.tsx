'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, DollarSign, FileText, TrendingUp, CreditCard, GraduationCap } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    feesCollected: 0,
    pendingFees: 0,
    certificatesThisMonth: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      setStats(data.stats);
      setRecentPayments(data.recentPayments);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: '#3b82f6',
      bgColor: '#eff6ff'
    },
    {
      title: 'Fees Collected',
      value: `₹${stats.feesCollected.toFixed(2)}`,
      icon: DollarSign,
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: 'Pending Fees',
      value: `₹${stats.pendingFees.toFixed(2)}`,
      icon: TrendingUp,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      title: 'Certificates (This Month)',
      value: stats.certificatesThisMonth,
      icon: FileText,
      color: '#8b5cf6',
      bgColor: '#f3e8ff'
    }
  ];

  const quickActions = [
    { name: 'Add Student', href: '/students/add', icon: GraduationCap, color: '#3b82f6' },
    { name: 'Collect Fee', href: '/fees/collect', icon: CreditCard, color: '#10b981' },
    { name: 'Generate Certificate', href: '/certificates/generate', icon: FileText, color: '#8b5cf6' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'transform 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                backgroundColor: stat.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={28} style={{ color: stat.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {stat.title}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {stat.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: `${action.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={24} style={{ color: action.color }} />
                </div>
                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                  {action.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Payments</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: '500' }}>Student</th>
                <th style={{ padding: '1rem', fontWeight: '500' }}>Receipt No</th>
                <th style={{ padding: '1rem', fontWeight: '500' }}>Amount</th>
                <th style={{ padding: '1rem', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '1rem', fontWeight: '500' }}>Method</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No recent payments
                  </td>
                </tr>
              ) : (
                recentPayments.map((payment) => (
                  <tr key={payment.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                      {payment.fee.student.firstName} {payment.fee.student.lastName}
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {payment.receiptNo}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--success)' }}>
                      ₹{payment.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontWeight: '500'
                      }}>
                        {payment.method}
                      </span>
                    </td>
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
