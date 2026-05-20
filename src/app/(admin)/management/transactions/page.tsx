import { getTransactions, getTransactionStats } from '@/app/actions/transaction';
import TransactionsClient from './TransactionsClient';

export default async function TransactionsPage() {
    const [transactions, stats] = await Promise.all([
        getTransactions('all'),
        getTransactionStats()
    ]);

    return (
        <TransactionsClient 
            initialTransactions={transactions}
            stats={stats}
        />
    );
}
