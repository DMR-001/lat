'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home, Users, GraduationCap, CreditCard, Settings, FileText,
    CalendarDays, MessageSquare, Banknote, LayoutList, Receipt, UserCheck, ArrowLeftRight, ClipboardList, Wallet
} from 'lucide-react';
import styles from './Sidebar.module.css';

type SidebarLink = { name: string; href: string; icon: React.ElementType };

function getLinks(role: string | undefined, isPayrollDomain: boolean): SidebarLink[] {
    if (isPayrollDomain) {
        if (role === 'TEACHER') {
            return [
                { name: 'My Payslips', href: '/payslip', icon: Wallet },
            ];
        }
        return [
            { name: 'Attendance', href: '/management/attendance', icon: CalendarDays },
            { name: 'Salaries', href: '/management/salaries', icon: Banknote },
            { name: 'Transactions', href: '/management/transactions', icon: ArrowLeftRight },
            { name: 'Logs', href: '/management/logs', icon: ClipboardList },
            { name: 'Management', href: '/management', icon: Users },
        ];
    }

    const links: SidebarLink[] = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Students', href: '/students', icon: GraduationCap },
        { name: 'Teachers', href: '/teachers', icon: Users },
        { name: 'Fees', href: '/fees', icon: CreditCard },
        { name: 'Collect Fees', href: '/fees/collect', icon: Banknote },
        { name: 'Fee Structure', href: '/fee-structure', icon: LayoutList },
        { name: 'Receipts', href: '/receipts', icon: Receipt },
        { name: 'Certificates', href: '/certificates', icon: FileText },
        { name: 'Academic Year', href: '/academic-year', icon: CalendarDays },
        { name: 'Transactions', href: '/management/transactions', icon: ArrowLeftRight },
        { name: 'Communications', href: '/communications', icon: MessageSquare },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    if (role === 'MANAGEMENT') {
        links.push(
            { name: 'Attendance', href: '/management/attendance', icon: UserCheck },
            { name: 'Salaries', href: '/management/salaries', icon: Banknote },
            { name: 'Transactions', href: '/management/transactions', icon: ArrowLeftRight },
            { name: 'Logs', href: '/management/logs', icon: ClipboardList },
            { name: 'Management', href: '/management', icon: Users }
        );
    }

    return links;
}

export default function SidebarLinks({ role, isPayrollDomain }: { role?: string; isPayrollDomain: boolean }) {
    const pathname = usePathname();
    const links = getLinks(role, isPayrollDomain);

    return (
        <nav className={styles.nav}>
            {links.map((link) => {
                const isActive =
                    pathname === link.href ||
                    (link.href !== '/dashboard' && pathname.startsWith(link.href));
                return (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`${styles.link} ${isActive ? styles.active : ''}`}
                    >
                        <link.icon size={20} />
                        <span>{link.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
