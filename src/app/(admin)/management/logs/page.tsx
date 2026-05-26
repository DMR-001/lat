import { getAuditLogs, getAuditStats } from '@/app/actions/audit';
import LogsClient from './LogsClient';

export default async function LogsPage() {
    const [logs, stats] = await Promise.all([
        getAuditLogs(),
        getAuditStats()
    ]);

    return <LogsClient initialLogs={logs} stats={stats} />;
}
