'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e5e7eb',
            zIndex: 1000
        }}>
            <div className="w-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px' }}>
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                    <img src="/sprout-logo.png" alt="Sprout School" style={{ height: '50px' }} />
                </Link>

                {/* Desktop Links */}
                <div className="desktop-menu" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link href="/" className="nav-link">Home</Link>
                    <Link href="/about" className="nav-link">About Us</Link>
                    <Link href="/gallery" className="nav-link">Gallery</Link>
                    <Link href="/academics" className="nav-link">Academics</Link>
                    <Link href="/contact" className="nav-link">Contact</Link>
                </div>

                {/* Desktop Buttons */}
                <div className="desktop-buttons" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <a href="https://admin.sproutschool.edu.in" className="w-btn w-btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                        Staff Login
                    </a>
                    <a href="https://pay.sproutschool.edu.in" className="w-btn w-btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                        Pay Fees
                    </a>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer' }}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '80px',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                    <Link href="/" onClick={() => setIsOpen(false)} style={{ padding: '0.5rem', fontWeight: '500', color: '#374151', textDecoration: 'none' }}>Home</Link>
                    <Link href="/about" onClick={() => setIsOpen(false)} style={{ padding: '0.5rem', fontWeight: '500', color: '#374151', textDecoration: 'none' }}>About Us</Link>
                    <Link href="/gallery" onClick={() => setIsOpen(false)} style={{ padding: '0.5rem', fontWeight: '500', color: '#374151', textDecoration: 'none' }}>Gallery</Link>
                    <Link href="/academics" onClick={() => setIsOpen(false)} style={{ padding: '0.5rem', fontWeight: '500', color: '#374151', textDecoration: 'none' }}>Academics</Link>
                    <Link href="/contact" onClick={() => setIsOpen(false)} style={{ padding: '0.5rem', fontWeight: '500', color: '#374151', textDecoration: 'none' }}>Contact</Link>
                    <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0.5rem 0' }} />
                    <a href="https://admin.sproutschool.edu.in" onClick={() => setIsOpen(false)} className="w-btn w-btn-outline" style={{ textAlign: 'center' }}>Staff Login</a>
                    <a href="https://pay.sproutschool.edu.in" onClick={() => setIsOpen(false)} className="w-btn w-btn-primary" style={{ textAlign: 'center' }}>Pay Fees</a>
                </div>
            )}

            {/* Styles moved to website.css */}
        </nav>
    );
}
