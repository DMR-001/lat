

import Link from 'next/link';
import Image from 'next/image';
import { Home, Users, GraduationCap, Calendar, CreditCard, Settings, LogOut } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import styles from './Sidebar.module.css';

import { getSession } from '@/lib/auth';

const Sidebar = async () => {
    const session = await getSession();
    const role = session?.user?.role;

    const links = [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Students', href: '/students', icon: GraduationCap },
        { name: 'Teachers', href: '/teachers', icon: Users },
        { name: 'Fees', href: '/fees', icon: CreditCard },
        { name: 'Collect Fees', href: '/fees/collect', icon: CreditCard },
        { name: 'Receipts', href: '/receipts', icon: CreditCard },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    if (role === 'MANAGEMENT') {
        links.push({ name: 'Management', href: '/management', icon: Users });
    }



    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <img src="/logo.png" alt="Sprout Logo" style={{ width: '150px', height: '50px', objectFit: 'contain' }} />
            </div>
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

                <form action={logoutAction} style={{ marginTop: 'auto' }}>
                    <button
                        type="submit"
                        className={styles.link}
                        style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </form>
            </nav>
        </aside>
    );
};

export default Sidebar;
