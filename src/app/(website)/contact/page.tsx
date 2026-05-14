'use client';

import { MapPin, Phone, Mail, Clock, Send, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', grade: '', message: '' });

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitted(true);
    }

    return (
        <div>
            {/* ── Hero ── */}
            <section style={{
                background: 'linear-gradient(160deg, #f0fdf4 0%, #eff6ff 100%)',
                padding: '5rem 0 4rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, #10b98120, transparent 70%)', pointerEvents: 'none' }} />
                <div className="w-container">
                    <span className="w-section-label">📞 Reach Out</span>
                    <h1 className="w-title">
                        We'd Love to <span className="gradient-text">Hear from You</span>
                    </h1>
                    <p className="w-subtitle" style={{ margin: '0 auto', textAlign: 'center' }}>
                        Have questions about admissions, programs, or our campus? We're just a call or message away.
                    </p>
                </div>
            </section>

            {/* ── Quick Info Cards ── */}
            <section style={{ background: 'white', padding: '3rem 0' }}>
                <div className="w-container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                        {[
                            {
                                icon: <MapPin size={22} />,
                                label: 'Our Address',
                                value: 'Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad',
                                color: '#10b981',
                                bg: '#f0fdf4',
                            },
                            {
                                icon: <Phone size={22} />,
                                label: 'Call Us',
                                value: '+91 70322 52030',
                                color: '#3b82f6',
                                bg: '#eff6ff',
                                href: 'tel:+917032252030',
                            },
                            {
                                icon: <Mail size={22} />,
                                label: 'Email Us',
                                value: 'sproutmeerpet@gmail.com',
                                color: '#ec4899',
                                bg: '#fdf2f8',
                                href: 'mailto:sproutmeerpet@gmail.com',
                            },
                            {
                                icon: <Clock size={22} />,
                                label: 'Office Hours',
                                value: 'Mon – Sat: 9:00 AM – 4:00 PM',
                                color: '#f59e0b',
                                bg: '#fffbeb',
                            },
                        ].map(c => (
                            <div key={c.label} style={{
                                background: c.bg,
                                borderRadius: '1.25rem',
                                padding: '1.5rem',
                                border: `1px solid ${c.color}30`,
                                transition: 'transform 0.2s',
                            }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
                            >
                                <div style={{ color: c.color, marginBottom: '0.75rem' }}>{c.icon}</div>
                                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{c.label}</div>
                                {c.href ? (
                                    <a href={c.href} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.5 }}>{c.value}</a>
                                ) : (
                                    <p style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>{c.value}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Form + Map ── */}
            <section className="w-section" style={{ background: 'var(--w-bg-soft)' }}>
                <div className="w-container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start' }}>

                        {/* Form */}
                        <div style={{
                            background: 'white',
                            borderRadius: '1.5rem',
                            padding: '2.5rem',
                            border: '1px solid var(--w-border)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                        }}>
                            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>
                                Admissions Inquiry
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                Fill in the form and our team will get back to you within 24 hours.
                            </p>

                            {submitted ? (
                                <div style={{
                                    background: 'var(--w-primary-light)',
                                    borderRadius: '1rem',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    border: '1px solid #6ee7b7',
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                                    <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: 'var(--w-primary-dark)', marginBottom: '0.5rem' }}>
                                        Message Received!
                                    </h3>
                                    <p style={{ color: '#065f46', fontSize: '0.9rem' }}>
                                        Thank you for your interest in Sprout School. We'll reach out shortly.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                                            Parent / Guardian Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="e.g., Priya Sharma"
                                            required
                                            value={form.name}
                                            onChange={handleChange}
                                            className="w-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="+91 9XXXXXXXXX"
                                            required
                                            value={form.phone}
                                            onChange={handleChange}
                                            className="w-input"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                                            Program of Interest
                                        </label>
                                        <select
                                            name="grade"
                                            value={form.grade}
                                            onChange={handleChange}
                                            className="w-input"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value="">Select a program…</option>
                                            <option>Playgroup (1.5 – 2.5 yrs)</option>
                                            <option>Nursery (2.5 – 3.5 yrs)</option>
                                            <option>LKG (3.5 – 4.5 yrs)</option>
                                            <option>UKG (4.5 – 5.5 yrs)</option>
                                            <option>Grade 1</option>
                                            <option>Grade 2</option>
                                            <option>Grade 3</option>
                                            <option>Grade 4</option>
                                            <option>Grade 5</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                                            Message / Questions
                                        </label>
                                        <textarea
                                            name="message"
                                            placeholder="Any specific questions or requests…"
                                            rows={4}
                                            value={form.message}
                                            onChange={handleChange}
                                            className="w-input"
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>
                                    <button type="submit" className="w-btn w-btn-primary" style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}>
                                        <Send size={16} /> Send Inquiry
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Info panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Map embed placeholder */}
                            <div style={{
                                borderRadius: '1.25rem',
                                overflow: 'hidden',
                                border: '1px solid var(--w-border)',
                                background: 'linear-gradient(135deg, #d1fae5, #bfdbfe)',
                                height: '220px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                color: '#475569',
                            }}>
                                <div style={{ fontSize: '2.5rem' }}>📍</div>
                                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Meerpet, Hyderabad</span>
                                <a
                                    href="https://maps.google.com/?q=Raghavanagar+Colony+Meerpet+Hyderabad"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-btn w-btn-primary"
                                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', marginTop: '0.25rem' }}
                                >
                                    Open in Maps
                                </a>
                            </div>

                            {/* FAQ */}
                            <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.75rem', border: '1px solid var(--w-border)' }}>
                                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem', color: '#0f172a' }}>
                                    Frequently Asked Questions
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[
                                        { q: 'When do admissions open?', a: 'Admissions for 2025–26 are currently open. Contact us now to secure a seat.' },
                                        { q: 'Is there a school bus?', a: 'Yes, we provide a safe bus service covering Meerpet and nearby localities.' },
                                        { q: 'What documents are needed?', a: 'Birth certificate, Aadhar card, passport-size photos, and previous school records (if any).' },
                                    ].map(faq => (
                                        <div key={faq.q} style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--w-border)' }}>
                                            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--w-primary)', marginBottom: '0.3rem' }}>Q: {faq.q}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.65 }}>{faq.a}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
