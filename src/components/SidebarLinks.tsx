'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

type SidebarLink = { name: string; href: string; icon: React.ElementType };

export default function SidebarLinks({ links }: { links: SidebarLink[] }) {
    const pathname = usePathname();

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
