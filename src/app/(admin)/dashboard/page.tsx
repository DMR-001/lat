'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Users, DollarSign, FileText, TrendingUp, CreditCard, GraduationCap } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    feesCollected: 0,
    pendingFees: 0,
    certificatesThisMonth: 0
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  // Track whether the initial fetch for this page visit has been superseded by context-ready
  const initialFetchDone = useRef(false);

  const loadDashboardData = useCallback(async () => {
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
  }, []);

  // On every navigation to this page, wait for the Header to confirm the branch
  // context is ready before fetching — avoids stale-cookie race condition on login.
  useEffect(() => {
    initialFetchDone.current = false;
    setLoading(true);

    // If context-ready fires before the timeout, use it; otherwise fall back to direct fetch
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        loadDashboardData();
      }
    }, 600); // fallback: fetch anyway after 600ms if Header hasn't responded

    const handleContextReady = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        loadDashboardData();
      } else if (initialFetchDone.current) {
        // Branch changed after initial load — re-fetch
        loadDashboardData();
      }
      initialFetchDone.current = true;
    };

    window.addEventListener('context-ready', handleContextReady);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('context-ready', handleContextReady);
    };
  }, [pathname, loadDashboardData]);

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <div style={{ width: '160px', height: '32px', borderRadius: '0.5rem', backgroundColor: 'var(--border)', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '280px', height: '20px', borderRadius: '0.5rem', backgroundColor: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'var(--border)', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '80px', height: '14px', borderRadius: '0.25rem', backgroundColor: 'var(--border)', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: '100px', height: '24px', borderRadius: '0.25rem', backgroundColor: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ width: '140px', height: '24px', borderRadius: '0.5rem', backgroundColor: 'var(--border)', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: '20px', borderRadius: '0.25rem', backgroundColor: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite', width: `${70 + (i * 5) % 30}%` }} />
            ))}
          </div>
        </div>
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
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Receipt No</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem' }}>
                    No recent payments
                  </td>
                </tr>
              ) : (
                recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: '500' }}>
                      {payment.fee?.student.firstName ?? '—'} {payment.fee?.student.lastName ?? ''}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {payment.receiptNo}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--success)' }}>
                      ₹{payment.amount.toFixed(2)}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge badge-${payment.method.toLowerCase()}`}>
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
