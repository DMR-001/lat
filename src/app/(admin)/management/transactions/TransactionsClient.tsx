'use client';

import { useState, useTransition } from 'react';
import { getTransactions, TransactionRecord, TransactionFilter } from '@/app/actions/transaction';
import { CheckCircle, XCircle, Clock, CreditCard, Search, Filter, RefreshCw } from 'lucide-react';

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

    const getStatusBadge = (status: string, hdfcStatus: string | null) => {
        if (status === 'SUCCESS') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle size={12} />
                    Success
                </span>
            );
        } else if (status === 'FAILED' || status === 'CANCELLED') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle size={12} />
                    {hdfcStatus || status}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Clock size={12} />
                {status}
            </span>
        );
    };

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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                <button
                    onClick={handleRefresh}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Transactions</p>
                            <p className="text-xl font-bold">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Successful</p>
                            <p className="text-xl font-bold text-green-600">{stats.success}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Failed</p>
                            <p className="text-xl font-bold text-red-600">{stats.failed}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <CreditCard className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Collected</p>
                            <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.successAmount)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Receipt No, Student Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => handleFilterChange(e.target.value as TransactionFilter)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Transactions</option>
                            <option value="success">Successful Only</option>
                            <option value="failed">Failed Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                {filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
                        <p className="text-gray-500">
                            {transactions.length === 0 
                                ? 'No payment transactions have been recorded yet.'
                                : 'No transactions match your search criteria.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Receipt No
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Method
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fee Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono text-sm text-blue-600">
                                                {transaction.hdfcOrderId || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono text-sm">
                                                {transaction.receiptNo || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {transaction.student ? (
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {transaction.student.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {transaction.student.admissionNo} • {transaction.student.class}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-semibold">
                                                {formatCurrency(transaction.amount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {getStatusBadge(transaction.status, transaction.hdfcStatus)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {transaction.method}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {transaction.feeType || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(transaction.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {filteredTransactions.length > 0 && (
                <div className="mt-4 text-sm text-gray-500 text-center">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
            )}
        </div>
    );
}
