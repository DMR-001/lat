

import Link from 'next/link';
import Image from 'next/image';
import { Home, Users, GraduationCap, Calendar, CreditCard, Settings, LogOut, FileText, CalendarDays } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import styles from './Sidebar.module.css';

import { getSession } from '@/lib/auth';

const Sidebar = async () => {
    const session = await getSession();
    const role = session?.user?.role;

    const links = [
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
