import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

export default function Header() {
    return (
        <header style={{
            height: '64px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface)',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/sprout-logo.png" alt="Sprout Logo" style={{ height: '50px', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <form action={logoutAction}>
                    <button type="submit" style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        border: 'none',
                        cursor: 'pointer'
                    }} title="Logout">
                        <LogOut size={18} />
                    </button>
                </form>
            </div>
        </header>
    );
}
