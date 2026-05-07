import styles from './Sidebar.module.css';
import { getSession } from '@/lib/auth';
import SidebarLinks from './SidebarLinks';

const Sidebar = async () => {
    const session = await getSession();
    const role = session?.user?.role;

    const { headers } = await import('next/headers');
    const headersList = await headers();
    const domain = headersList.get('host') || '';
    const isPayrollDomain = domain.startsWith('payroll.');

    return (
        <aside className={styles.sidebar}>
            <SidebarLinks role={role} isPayrollDomain={isPayrollDomain} />
        </aside>
    );
};

export default Sidebar;
