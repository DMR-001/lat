import { getBranchesAndClasses, getSmsLogs } from '@/app/actions/sms';
import CommunicationsClient from './CommunicationsClient';

export default async function CommunicationsPage() {
    const [{ branches, classes }, { logs, total }] = await Promise.all([
        getBranchesAndClasses(),
        getSmsLogs(1, 50),
    ]);

    return <CommunicationsClient branches={branches} classes={classes} initialLogs={logs} initialLogsTotal={total} />;
}
