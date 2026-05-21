'use client';

import { useState, useTransition, useMemo } from 'react';
import { getTransactions, TransactionRecord, TransactionFilter } from '@/app/actions/transaction';
import { CheckCircle2, XCircle, Search, RefreshCw, Download, Copy, ChevronDown, ChevronRight, IndianRupee, ArrowUpRight, ArrowDownRight, Filter, Calendar, Clock } from 'lucide-react';

type Props = {
    initialTransactions: TransactionRecord[];
    stats: {
        total: number;
        success: number;
        failed: number;
        pending: number;
        successAmount: number;
    };
};

export default function TransactionsClient({ initialTransactions, stats }: Props) {
    const [transactions, setTransactions] = useState(initialTransactions);
    const [filter, setFilter] = useState<TransactionFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    const handleFilterChange = (newFilter: TransactionFilter) => {
        setFilter(newFilter);
        startTransition(async () => {
            const data = await getTransactions(newFilter);
            setTransactions(data);
        });
    };

    const handleRefresh = () => {
        startTransition(async () => {
            const data = await getTransactions(filter);
            setTransactions(data);
        });
    };

    const copyOrderId = (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(orderId);
        setCopiedId(orderId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const exportToCSV = () => {
        const headers = ['Order ID', 'Receipt No', 'Student Name', 'Admission No', 'Class', 'Amount', 'Status', 'HDFC Status', 'Method', 'Fee Type', 'Date'];
        const rows = filteredTransactions.map(t => [
            t.hdfcOrderId || '',
            t.receiptNo || '',
            t.student?.name || '',
            t.student?.admissionNo || '',
            t.student?.class || '',
            t.amount,
            t.status,
            t.hdfcStatus || '',
            t.method,
            t.feeType || '',
            new Date(t.createdAt).toLocaleString()
        ]);
        
        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;
        
        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            filtered = filtered.filter(t => {
                const date = new Date(t.createdAt);
                if (dateFilter === 'today') {
                    return date >= startOfDay;
                } else if (dateFilter === 'week') {
                    const weekAgo = new Date(startOfDay);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date >= weekAgo;
                } else if (dateFilter === 'month') {
                    const monthAgo = new Date(startOfDay);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return date >= monthAgo;
                }
                return true;
            });
        }
        
        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(t => 
                t.hdfcOrderId?.toLowerCase().includes(search) ||
                t.receiptNo?.toLowerCase().includes(search) ||
                t.student?.name.toLowerCase().includes(search) ||
                t.student?.admissionNo.toLowerCase().includes(search)
            );
        }
        
        return filtered;
    }, [transactions, searchTerm, dateFilter]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();
        
        if (isToday) {
            return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (isYesterday) {
            return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
    };

    const getStatusStyle = (status: string, hdfcStatus?: string | null) => {
        if (status === 'SUCCESS') {
            return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2, label: 'Success' };
        }
        if (status === 'CANCELLED') {
            return { bg: 'bg-orange-50', text: 'text-orange-700', icon: XCircle, label: 'Cancelled' };
        }
        if (status === 'INITIATED') {
            return { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock, label: 'Initiated' };
        }
        if (status === 'EXPIRED') {
            return { bg: 'bg-gray-50', text: 'text-gray-600', icon: Clock, label: 'Expired' };
        }
        return { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: hdfcStatus || 'Failed' };
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Transactions</h1>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Track all payment activity</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={exportToCSV}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #e5e7eb', background: 'white', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}
                        >
                            <Download size={16} /> Export
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={isPending}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}
                        >
                            <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#166534', marginTop: '0.25rem' }}>₹{formatCurrency(stats.successAmount)}</p>
                        </div>
                        <div style={{ background: '#22c55e', borderRadius: '50%', padding: '0.75rem' }}>
                            <IndianRupee size={24} color="white" />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>{stats.success}</p>
                        </div>
                        <div style={{ background: '#dcfce7', borderRadius: '50%', padding: '0.75rem' }}>
                            <ArrowUpRight size={24} color="#16a34a" />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Failed</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>{stats.failed}</p>
                        </div>
                        <div style={{ background: '#fee2e2', borderRadius: '50%', padding: '0.75rem' }}>
                            <ArrowDownRight size={24} color="#dc2626" />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>{stats.pending}</p>
                        </div>
                        <div style={{ background: '#dbeafe', borderRadius: '50%', padding: '0.75rem' }}>
                            <Clock size={24} color="#2563eb" />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>{stats.total}</p>
                        </div>
                        <div style={{ background: '#e0e7ff', borderRadius: '50%', padding: '0.75rem' }}>
                            <Filter size={24} color="#4f46e5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    {/* Status Tabs */}
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '0.5rem', padding: '0.25rem' }}>
                        {(['all', 'success', 'failed', 'pending'] as TransactionFilter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    background: filter === f ? 'white' : 'transparent',
                                    color: filter === f ? '#111827' : '#6b7280',
                                    boxShadow: filter === f ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {f === 'all' ? 'All' : f === 'success' ? '✓ Success' : f === 'failed' ? '✕ Failed' : '⏳ Pending'}
                            </button>
                        ))}
                    </div>

                    {/* Date Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} color="#9ca3af" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', background: 'white', cursor: 'pointer' }}
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Search order ID, receipt, student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Showing <strong>{filteredTransactions.length}</strong> transactions
                </p>
            </div>

            {/* Transaction List */}
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {filteredTransactions.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Search size={28} color="#9ca3af" />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>No transactions found</h3>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Try adjusting your filters or search term</p>
                    </div>
                ) : (
                    filteredTransactions.map((t, index) => {
                        const statusStyle = getStatusStyle(t.status, t.hdfcStatus);
                        const StatusIcon = statusStyle.icon;
                        const isExpanded = expandedRow === t.id;
                        
                        return (
                            <div
                                key={t.id}
                                style={{ borderBottom: index < filteredTransactions.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                            >
                                <div
                                    onClick={() => setExpandedRow(isExpanded ? null : t.id)}
                                    style={{ 
                                        padding: '1rem 1.25rem', 
                                        cursor: 'pointer',
                                        background: isExpanded ? '#fafafa' : 'white',
                                        transition: 'background 0.15s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {/* Expand Icon */}
                                        <div style={{ color: '#9ca3af' }}>
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </div>

                                        {/* Status Badge */}
                                        <div style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '0.375rem',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: statusStyle.bg,
                                            color: statusStyle.text,
                                            minWidth: '90px',
                                            justifyContent: 'center'
                                        }}>
                                            <StatusIcon size={12} />
                                            {statusStyle.label}
                                        </div>

                                        {/* Main Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {t.student ? (
                                                    <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>{t.student.name}</span>
                                                ) : (
                                                    <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>No student linked</span>
                                                )}
                                                {t.student && (
                                                    <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                                                        {t.student.admissionNo} • {t.student.class}
                                                    </span>
                                                )}
                                            </div>
                                            {t.hdfcOrderId && (
                                                <button
                                                    onClick={(e) => copyOrderId(t.hdfcOrderId!, e)}
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.25rem',
                                                        marginTop: '0.25rem',
                                                        padding: '0.125rem 0.5rem',
                                                        background: '#f3f4f6',
                                                        border: 'none',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'monospace',
                                                        color: '#6b7280',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {t.hdfcOrderId}
                                                    <Copy size={10} />
                                                    {copiedId === t.hdfcOrderId && <span style={{ color: '#16a34a', marginLeft: '0.25rem' }}>✓</span>}
                                                </button>
                                            )}
                                        </div>

                                        {/* Amount & Date */}
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ 
                                                fontWeight: 700, 
                                                fontSize: '1.125rem',
                                                color: t.status === 'SUCCESS' ? '#059669' : '#dc2626'
                                            }}>
                                                ₹{formatCurrency(t.amount)}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>{formatDate(t.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div style={{ padding: '0 1.25rem 1.25rem 3.5rem', background: '#fafafa' }}>
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: 'white',
                                            borderRadius: '0.75rem',
                                            border: '1px solid #e5e7eb'
                                        }}>
                                            <div>
                                                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Receipt No</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{t.receiptNo || '—'}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Method</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{t.method}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Fee Type</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{t.feeType || '—'}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Branch</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{t.branchName || '—'}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>HDFC Status</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{t.hdfcStatus || '—'}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Date</p>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{formatDate(t.date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
