

import Link from 'next/link';
import Image from 'next/image';
import { Home, Users, GraduationCap, Calendar, CreditCard, Settings, LogOut, FileText, CalendarDays } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import styles from './Sidebar.module.css';

import { getSession } from '@/lib/auth';

const Sidebar = async () => {
    const session = await getSession();
    const role = session?.user?.role;

    // Check if we are on the payroll subdomain
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const domain = headersList.get('host') || '';
    const isPayrollDomain = domain.startsWith('payroll.');

    let links: { name: string; href: string; icon: any }[] = [];

    if (isPayrollDomain) {
        // Payroll Portal: Only show Salaries & Attendance
        if (role === 'MANAGEMENT' || role === 'ADMIN') { // Allow ADMIN to see it on payroll domain? Let's stick to MANAGEMENT for now or allow both if they can login there.
            // Actually, middleware restricts /management to MANAGEMENT role.
            // So safe to assume they are correct role if they are here, or they get bumped.
            links = [
                { name: 'Attendance', href: '/management/attendance', icon: CalendarDays },
                { name: 'Salaries', href: '/management/salaries', icon: CreditCard },
            ];
        }
    } else {
        // Admin Portal: Show everything
        links = [
            { name: 'Dashboard', href: '/dashboard', icon: Home },
            { name: 'Students', href: '/students', icon: GraduationCap },
            { name: 'Teachers', href: '/teachers', icon: Users },
            { name: 'Fees', href: '/fees', icon: CreditCard },
            { name: 'Collect Fees', href: '/fees/collect', icon: CreditCard },
            { name: 'Fee Structure', href: '/fee-structure', icon: CreditCard },
            { name: 'Receipts', href: '/receipts', icon: CreditCard },
            { name: 'Certificates', href: '/certificates', icon: FileText },
            { name: 'Academic Year', href: '/academic-year', icon: CalendarDays },
            { name: 'Settings', href: '/settings', icon: Settings },
        ];

        if (role === 'MANAGEMENT') {
            links.push(
                { name: 'Attendance', href: '/management/attendance', icon: CalendarDays },
                { name: 'Salaries', href: '/management/salaries', icon: CreditCard },
                { name: 'Management', href: '/management', icon: Users }
            );
        }
    }



    return (
        <aside className={styles.sidebar}>
            {/* Logo moved to Header */}
            <nav className={styles.nav}>
                {links.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={styles.link}
                    >
                        <link.icon size={20} />
                        <span>{link.name}</span>
                    </Link>
                ))}

                {/* Logout moved to Header */}

            </nav>
        </aside>
    );
};

export default Sidebar;
