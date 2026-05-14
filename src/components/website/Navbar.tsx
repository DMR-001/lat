'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/academics', label: 'Academics' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => { setIsOpen(false); }, [pathname]);

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(16px)',
            borderBottom: scrolled ? '1px solid #e2e8f0' : '1px solid transparent',
            boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.3s ease',
        }}>
            <div className="w-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '76px' }}>

                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                    <img src="/sprout-logo.png" alt="Sprout School" style={{ height: '48px', width: 'auto' }} />
                    <span style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 900,
                        fontSize: '1.2rem',
                        color: '#0f172a',
                        lineHeight: 1.2,
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <span style={{ color: 'var(--w-primary)' }}>Sprout</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>School · Meerpet</span>
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="desktop-menu" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                            style={{ padding: '0.4rem 0.85rem' }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop Buttons */}
                <div className="desktop-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <a
                        href="https://admin.sproutschool.edu.in"
                        className="w-btn w-btn-outline"
                        style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                    >
                        Staff Login
                    </a>
                    <a
                        href="https://pay.sproutschool.edu.in"
                        className="w-btn w-btn-primary"
                        style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                    >
                        💳 Pay Fees
                    </a>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                    style={{
                        background: isOpen ? 'var(--w-primary-light)' : 'none',
                        border: 'none',
                        color: isOpen ? 'var(--w-primary)' : '#374151',
                        cursor: 'pointer',
                        borderRadius: '0.5rem',
                        padding: '0.4rem',
                        transition: 'all 0.2s',
                    }}
                >
                    {isOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <div style={{
                position: 'absolute',
                top: '76px',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: isOpen ? '1.25rem 1.5rem 1.5rem' : '0 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                boxShadow: '0 16px 30px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                maxHeight: isOpen ? '420px' : '0',
                opacity: isOpen ? 1 : 0,
                transition: 'max-height 0.35s ease, opacity 0.25s ease, padding 0.3s ease',
            }}>
                {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        style={{
                            padding: '0.75rem 1rem',
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: pathname === link.href ? 'var(--w-primary)' : '#334155',
                            textDecoration: 'none',
                            borderRadius: '0.5rem',
                            backgroundColor: pathname === link.href ? 'var(--w-primary-light)' : 'transparent',
                            transition: 'all 0.2s',
                        }}
                    >
                        {link.label}
                    </Link>
                ))}
                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.5rem 0' }} />
                <a href="https://admin.sproutschool.edu.in" className="w-btn w-btn-outline" style={{ textAlign: 'center', borderRadius: '0.75rem' }}>Staff Login</a>
                <a href="https://pay.sproutschool.edu.in" className="w-btn w-btn-primary" style={{ textAlign: 'center', borderRadius: '0.75rem', marginTop: '0.5rem' }}>💳 Pay Fees</a>
            </div>
        </nav>
    );
}
