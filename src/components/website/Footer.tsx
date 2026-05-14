import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{ backgroundColor: '#0f172a', color: 'white', paddingTop: '4.5rem' }}>
            {/* Top wave */}
            <div style={{ background: 'white', display: 'block', lineHeight: 0 }}>
                <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
                    <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#0f172a" />
                </svg>
            </div>

            <div className="w-container">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '3rem',
                    marginBottom: '3.5rem',
                }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <img src="/sprout-logo.png" alt="Sprout School" style={{ height: '44px', filter: 'brightness(0) invert(1)' }} />
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.2rem', color: 'white' }}>
                                Sprout School
                            </span>
                        </div>
                        <p style={{ color: '#94a3b8', lineHeight: '1.7', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Nurturing Little Leaders for a Bright Tomorrow. A safe, loving, and stimulating environment where every child blooms.
                        </p>
                        {/* Social */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {[
                                { icon: <Facebook size={16} />, label: 'Facebook' },
                                { icon: <Instagram size={16} />, label: 'Instagram' },
                                { icon: <Youtube size={16} />, label: 'YouTube' },
                            ].map(s => (
                                <a
                                    key={s.label}
                                    href="#"
                                    aria-label={s.label}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1e293b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                        transition: 'all 0.2s',
                                        textDecoration: 'none',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--w-primary)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--w-secondary)' }}>
                            Quick Links
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {[
                                { href: '/', label: 'Home' },
                                { href: '/about', label: 'About Us' },
                                { href: '/academics', label: 'Academics' },
                                { href: '/gallery', label: 'Gallery' },
                                { href: '/contact', label: 'Admissions' },
                            ].map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    style={{
                                        color: '#94a3b8',
                                        textDecoration: 'none',
                                        fontSize: '0.9rem',
                                        transition: 'color 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                    }}
                                >
                                    <span style={{ color: 'var(--w-primary)', fontSize: '0.75rem' }}>▶</span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Programs */}
                    <div>
                        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--w-secondary)' }}>
                            Programs
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {['Playgroup (1.5–2.5 yrs)', 'Nursery (2.5–3.5 yrs)', 'LKG & UKG (3.5–5.5 yrs)', 'Primary – Grades 1–5', 'After-School Care'].map(p => (
                                <span key={p} style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ color: 'var(--w-secondary)', fontSize: '0.75rem' }}>✦</span>
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--w-secondary)' }}>
                            Contact Us
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <MapPin size={16} style={{ color: 'var(--w-primary)', marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                    Hno-14-218/5, Raghavanagar Colony,<br />Meerpet, Hyderabad, Telangana
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Phone size={16} style={{ color: 'var(--w-primary)', flexShrink: 0 }} />
                                <a href="tel:+917032252030" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none' }}>+91 70322 52030</a>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Mail size={16} style={{ color: 'var(--w-primary)', flexShrink: 0 }} />
                                <a href="mailto:info@sproutschool.edu.in" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none' }}>info@sproutschool.edu.in</a>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Clock size={16} style={{ color: 'var(--w-primary)', flexShrink: 0 }} />
                                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Mon–Sat: 9:00 AM – 4:00 PM</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    borderTop: '1px solid #1e293b',
                    paddingTop: '1.75rem',
                    paddingBottom: '1.75rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>SPROUT EDUCATIONAL SOCIETY</span>
                        &nbsp;·&nbsp; © {new Date().getFullYear()} Sprout School. All rights reserved.
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        Designed with ❤️ for little learners
                    </div>
                </div>
            </div>
        </footer>
    );
}
