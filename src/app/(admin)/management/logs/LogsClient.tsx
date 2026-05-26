'use client';

import { useState, useTransition, useMemo } from 'react';
import { getAuditLogs, AuditLogRecord } from '@/app/actions/audit';
import { Search, RefreshCw, Download, ChevronDown, ChevronRight, Shield, User, CreditCard, Banknote, LayoutList, Filter, Calendar } from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    FEE:           { label: 'Fee',           color: '#059669', bg: '#d1fae5', icon: CreditCard },
    SALARY:        { label: 'Salary',        color: '#7c3aed', bg: '#ede9fe', icon: Banknote },
    STUDENT:       { label: 'Student',       color: '#2563eb', bg: '#dbeafe', icon: User },
    ADMIN:         { label: 'Admin',         color: '#dc2626', bg: '#fee2e2', icon: Shield },
    FEE_STRUCTURE: { label: 'Fee Structure', color: '#d97706', bg: '#fef3c7', icon: LayoutList },
};

const ACTION_LABEL: Record<string, string> = {
    FEE_ASSIGNED:              'Fee Assigned',
    FEE_PAYMENT_RECORDED:      'Payment Recorded',
    FEE_DISCOUNT_APPLIED:      'Discount Applied',
    SALARY_STRUCTURE_CREATED:  'Salary Structure Set',
    SALARY_PAYMENT_MARKED_PAID:'Salary Paid',
    SALARY_BULK_MARKED_PAID:   'Bulk Salary Paid',
    ADMIN_CREATED:             'Admin Created',
    ADMIN_DELETED:             'Admin Deleted',
    FEE_STRUCTURE_CREATED:     'Fee Structure Created',
    FEE_STRUCTURE_UPDATED:     'Fee Structure Updated',
    FEE_STRUCTURE_DELETED:     'Fee Structure Deleted',
};

type Props = {
    initialLogs: AuditLogRecord[];
    stats: { total: number; today: number; byCategory: { category: string; _count: { id: number } }[] };
};

export default function LogsClient({ initialLogs, stats }: Props) {
    const [logs, setLogs] = useState(initialLogs);
    const [isPending, startTransition] = useTransition();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [userFilter, setUserFilter] = useState('');

    const uniqueUsers = useMemo(() => {
        const set = new Set(logs.map(l => l.performedBy));
        return Array.from(set).sort();
    }, [logs]);

    const filteredLogs = useMemo(() => {
        let result = logs;

        if (categoryFilter !== 'all') {
            result = result.filter(l => l.category === categoryFilter);
        }

        if (userFilter) {
            result = result.filter(l => l.performedBy === userFilter);
        }

        if (dateFilter !== 'all') {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            result = result.filter(l => {
                const d = new Date(l.createdAt);
                if (dateFilter === 'today') return d >= startOfDay;
                if (dateFilter === 'week') {
                    const w = new Date(startOfDay); w.setDate(w.getDate() - 7);
                    return d >= w;
                }
                if (dateFilter === 'month') {
                    const m = new Date(startOfDay); m.setMonth(m.getMonth() - 1);
                    return d >= m;
                }
                return true;
            });
        }

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.description.toLowerCase().includes(s) ||
                l.performedBy.toLowerCase().includes(s) ||
                l.action.toLowerCase().includes(s)
            );
        }

        return result;
    }, [logs, categoryFilter, userFilter, dateFilter, searchTerm]);

    const handleRefresh = () => {
        startTransition(async () => {
            const fresh = await getAuditLogs();
            setLogs(fresh);
        });
    };

    const exportToCSV = () => {
        const headers = ['Timestamp', 'Performed By', 'Category', 'Action', 'Description'];
        const rows = filteredLogs.map(l => [
            new Date(l.createdAt).toLocaleString('en-IN'),
            l.performedBy,
            l.category,
            ACTION_LABEL[l.action] ?? l.action,
            l.description,
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const isYesterday = d.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();
        const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        if (isToday) return `Today, ${time}`;
        if (isYesterday) return `Yesterday, ${time}`;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + `, ${time}`;
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Audit Logs</h1>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Track every action performed by your team</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={exportToCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #e5e7eb', background: 'white', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                            <Download size={16} /> Export
                        </button>
                        <button onClick={handleRefresh} disabled={isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}>
                            <RefreshCw size={16} style={{ animation: isPending ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #bfdbfe' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Actions</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e40af', marginTop: '0.25rem' }}>{stats.total}</p>
                </div>
                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>{stats.today}</p>
                </div>
                {stats.byCategory.slice(0, 3).map(c => {
                    const m = CATEGORY_META[c.category];
                    if (!m) return null;
                    return (
                        <div key={c.category} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>{c._count.id}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Category tabs */}
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '0.5rem', padding: '0.25rem', gap: '0.125rem' }}>
                        {(['all', ...Object.keys(CATEGORY_META)] as string[]).map(cat => (
                            <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: 'none', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', background: categoryFilter === cat ? 'white' : 'transparent', color: categoryFilter === cat ? '#111827' : '#6b7280', boxShadow: categoryFilter === cat ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s' }}>
                                {cat === 'all' ? 'All' : CATEGORY_META[cat]?.label ?? cat}
                            </button>
                        ))}
                    </div>

                    {/* User filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={15} color="#9ca3af" />
                        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ padding: '0.375rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.8125rem', background: 'white', cursor: 'pointer' }}>
                            <option value="">All Users</option>
                            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>

                    {/* Date filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={15} color="#9ca3af" />
                        <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)} style={{ padding: '0.375rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.8125rem', background: 'white', cursor: 'pointer' }}>
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input type="text" placeholder="Search actions, users, descriptions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.375rem 0.75rem 0.375rem 2.25rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.8125rem' }} />
                    </div>
                </div>
            </div>

            {/* Count */}
            <div style={{ marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Showing <strong>{filteredLogs.length}</strong> log entries</p>
            </div>

            {/* Log list */}
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {filteredLogs.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Filter size={28} color="#9ca3af" />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>No logs found</h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Actions will appear here once they are performed</p>
                    </div>
                ) : filteredLogs.map((log, idx) => {
                    const cat = CATEGORY_META[log.category] ?? { label: log.category, color: '#6b7280', bg: '#f3f4f6', icon: Filter };
                    const CatIcon = cat.icon;
                    const isExpanded = expandedRow === log.id;
                    const actionLabel = ACTION_LABEL[log.action] ?? log.action;

                    return (
                        <div key={log.id} style={{ borderBottom: idx < filteredLogs.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                            <div onClick={() => setExpandedRow(isExpanded ? null : log.id)} style={{ padding: '0.875rem 1.25rem', cursor: 'pointer', background: isExpanded ? '#fafafa' : 'white', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                {/* Expand */}
                                <div style={{ color: '#9ca3af', flexShrink: 0 }}>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>

                                {/* Category badge */}
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: cat.bg, color: cat.color, flexShrink: 0, minWidth: '110px', justifyContent: 'center' }}>
                                    <CatIcon size={11} />
                                    {actionLabel}
                                </div>

                                {/* Description */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description}</p>
                                </div>

                                {/* User + time */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>{log.performedBy}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>{formatDate(log.createdAt)}</p>
                                </div>
                            </div>

                            {/* Expanded meta */}
                            {isExpanded && log.meta && (
                                <div style={{ padding: '0 1.25rem 1rem 3.25rem', background: '#fafafa' }}>
                                    <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem' }}>
                                        {Object.entries(log.meta).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([key, value]) => (
                                            <div key={key}>
                                                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                                                </p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', wordBreak: 'break-all' }}>
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
