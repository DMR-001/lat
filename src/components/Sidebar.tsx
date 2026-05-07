import React from 'react';
import { Home, Users, GraduationCap, CreditCard, Settings, FileText, CalendarDays, MessageSquare, Banknote, LayoutList, Receipt, UserCheck } from 'lucide-react';
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

    let links: { name: string; href: string; icon: React.ElementType }[] = [];

    if (isPayrollDomain) {
        links = [
            { name: 'Attendance', href: '/management/attendance', icon: CalendarDays },
            { name: 'Salaries', href: '/management/salaries', icon: Banknote },
        ];
    } else {
        links = [
            { name: 'Dashboard', href: '/dashboard', icon: Home },
            { name: 'Students', href: '/students', icon: GraduationCap },
            { name: 'Teachers', href: '/teachers', icon: Users },
            { name: 'Fees', href: '/fees', icon: CreditCard },
            { name: 'Collect Fees', href: '/fees/collect', icon: Banknote },
            { name: 'Fee Structure', href: '/fee-structure', icon: LayoutList },
            { name: 'Receipts', href: '/receipts', icon: Receipt },
            { name: 'Certificates', href: '/certificates', icon: FileText },
            { name: 'Academic Year', href: '/academic-year', icon: CalendarDays },
            { name: 'Communications', href: '/communications', icon: MessageSquare },
            { name: 'Settings', href: '/settings', icon: Settings },
        ];

        if (role === 'MANAGEMENT' || role === 'ADMIN') {
            links.push(
                { name: 'Attendance', href: '/management/attendance', icon: UserCheck },
                { name: 'Salaries', href: '/management/salaries', icon: Banknote },
                { name: 'Management', href: '/management', icon: Users }
            );
        }
    }

    return (
        <aside className={styles.sidebar}>
            <SidebarLinks links={links} />
        </aside>
    );
};

export default Sidebar;
