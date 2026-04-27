import { getBranchesAndClasses, getSmsLogs } from '@/app/actions/sms';
import { getFilterContext } from '@/lib/filter-context';
import CommunicationsClient from './CommunicationsClient';

export default async function CommunicationsPage() {
    const [{ branches, classes }, { logs, total }, { branchId }] = await Promise.all([
        getBranchesAndClasses(),
        getSmsLogs(1, 50),
        getFilterContext(),
    ]);

    return (
        <CommunicationsClient
            branches={branches}
            classes={classes}
            initialLogs={logs}
            initialLogsTotal={total}
            defaultBranchId={branchId ?? ''}
        />
    );
}
