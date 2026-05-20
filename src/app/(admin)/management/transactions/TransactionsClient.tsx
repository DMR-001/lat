'use client';

import { useState, useTransition } from 'react';
import { getTransactions, TransactionRecord, TransactionFilter } from '@/app/actions/transaction';
import { CheckCircle, XCircle, Clock, CreditCard, Search, RefreshCw, Download, Copy, ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
    initialTransactions: TransactionRecord[];
    stats: {
        total: number;
        success: number;
        failed: number;
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

    const copyOrderId = (orderId: string) => {
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

    const filteredTransactions = transactions.filter(t => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            t.hdfcOrderId?.toLowerCase().includes(search) ||
            t.receiptNo?.toLowerCase().includes(search) ||
            t.student?.name.toLowerCase().includes(search) ||
            t.student?.admissionNo.toLowerCase().includes(search)
        );
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                    <p className="text-sm text-gray-500 mt-1">View all payment transactions and their status</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                        <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <button
                    onClick={() => handleFilterChange('all')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                        filter === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase">Total</span>
                        <CreditCard size={18} className="text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </button>
                
                <button
                    onClick={() => handleFilterChange('success')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                        filter === 'success' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase">Success</span>
                        <CheckCircle size={18} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.success}</p>
                </button>
                
                <button
                    onClick={() => handleFilterChange('failed')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                        filter === 'failed' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase">Failed</span>
                        <XCircle size={18} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
                </button>
                
                <div className="p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-purple-50 to-white">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase">Collected</span>
                        <span className="text-lg">💰</span>
                    </div>
                    <p className="text-xl font-bold text-purple-600 mt-1">{formatCurrency(stats.successAmount)}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by Order ID, Receipt No, Student Name, Admission No..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">
                    {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
                    {filter !== 'all' && ` (${filter})`}
                    {searchTerm && ` matching "${searchTerm}"`}
                </p>
            </div>

            {/* Transaction Cards (Mobile-friendly) */}
            <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
                        <p className="text-gray-500">
                            {transactions.length === 0 
                                ? 'No payment transactions have been recorded yet.'
                                : 'Try adjusting your search or filter.'}
                        </p>
                    </div>
                ) : (
                    filteredTransactions.map((t) => (
                        <div
                            key={t.id}
                            className={`bg-white rounded-xl border transition-all ${
                                expandedRow === t.id ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {/* Main Row */}
                            <div 
                                className="p-4 cursor-pointer"
                                onClick={() => setExpandedRow(expandedRow === t.id ? null : t.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Order ID & Status */}
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            {t.hdfcOrderId && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyOrderId(t.hdfcOrderId!);
                                                    }}
                                                    className="inline-flex items-center gap-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                                                    title="Click to copy"
                                                >
                                                    {t.hdfcOrderId}
                                                    <Copy size={12} className="text-gray-400" />
                                                    {copiedId === t.hdfcOrderId && (
                                                        <span className="text-green-600 text-xs ml-1">Copied!</span>
                                                    )}
                                                </button>
                                            )}
                                            {t.status === 'SUCCESS' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                    <CheckCircle size={12} /> Success
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                    <XCircle size={12} /> {t.hdfcStatus || t.status}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Student Info */}
                                        {t.student ? (
                                            <div className="text-sm">
                                                <span className="font-medium text-gray-900">{t.student.name}</span>
                                                <span className="text-gray-400 mx-2">•</span>
                                                <span className="text-gray-500">{t.student.admissionNo}</span>
                                                <span className="text-gray-400 mx-2">•</span>
                                                <span className="text-gray-500">{t.student.class}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">No student linked</span>
                                        )}
                                    </div>
                                    
                                    {/* Amount & Expand */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${t.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(t.amount)}
                                            </p>
                                            <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                                        </div>
                                        {expandedRow === t.id ? (
                                            <ChevronUp size={20} className="text-gray-400" />
                                        ) : (
                                            <ChevronDown size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedRow === t.id && (
                                <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase mb-1">Receipt No</p>
                                            <p className="font-medium">{t.receiptNo || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase mb-1">Payment Method</p>
                                            <p className="font-medium">{t.method}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase mb-1">Fee Type</p>
                                            <p className="font-medium">{t.feeType || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase mb-1">Branch</p>
                                            <p className="font-medium">{t.branchName || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase mb-1">HDFC Status</p>
                                            <p className="font-medium">{t.hdfcStatus || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase mb-1">Transaction Date</p>
                                            <p className="font-medium">{formatDate(t.date)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase mb-1">Created At</p>
                                            <p className="font-medium">{formatDate(t.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase mb-1">Updated At</p>
                                            <p className="font-medium">{formatDate(t.updatedAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
