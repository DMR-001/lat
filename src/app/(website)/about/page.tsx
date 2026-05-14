'use client';

import Link from 'next/link';
import { ArrowRight, Heart, Target, Eye, Award } from 'lucide-react';

export default function AboutPage() {
    return (
        <div>
            {/* ── Hero ── */}
            <section style={{
                background: 'linear-gradient(160deg, #f0fdf4 0%, #fffbeb 100%)',
                padding: '5rem 0 4rem',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, #10b98125, transparent 70%)', pointerEvents: 'none' }} />
                <div className="w-container" style={{ textAlign: 'center' }}>
                    <span className="w-section-label">Our Story</span>
                    <h1 className="w-title">
                        About <span className="gradient-text">Sprout School</span>
                    </h1>
                    <p className="w-subtitle" style={{ margin: '0 auto', textAlign: 'center' }}>
                        Founded with a simple, powerful vision: to create a happy place where children love to learn and families feel at home.
                    </p>
                </div>
            </section>

            {/* ── Mission & Philosophy ── */}
            <section className="w-section" style={{ background: 'white' }}>
                <div className="w-container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '5rem', alignItems: 'center' }}>
                        {/* Image placeholder */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                borderRadius: '1.5rem',
                                overflow: 'hidden',
                                aspectRatio: '4/3',
                                background: 'linear-gradient(135deg, #d1fae5 0%, #fef3c7 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                            }}>
                                <img src="/sprout-logo.png" alt="Sprout School Campus" style={{ width: '60%', opacity: 0.8 }} />
                            </div>
                            {/* Floating badge */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-20px',
                                right: '-20px',
                                background: 'white',
                                borderRadius: '1rem',
                                padding: '1rem 1.5rem',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                textAlign: 'center',
                                border: '1px solid var(--w-border)',
                            }}>
                                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.75rem', fontWeight: 900, color: 'var(--w-primary)' }}>10+</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Years of Excellence</div>
                            </div>
                        </div>

                        <div>
                            <span className="w-section-label">Our Identity</span>
                            <h2 className="w-title" style={{ fontSize: '2rem' }}>A School Built on Love &amp; Learning</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--w-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Target size={20} style={{ color: 'var(--w-primary)' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: '0.4rem', fontSize: '1.1rem' }}>Our Mission</h3>
                                        <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '0.95rem' }}>
                                            To provide a safe, secure, and stimulating environment where every child is treated as a unique individual. We believe in learning through play, exploration, and hands-on experiences.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--w-secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Eye size={20} style={{ color: 'var(--w-secondary-dark)' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: '0.4rem', fontSize: '1.1rem' }}>Our Vision</h3>
                                        <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '0.95rem' }}>
                                            To be the most trusted early learning institution in Hyderabad, producing confident, curious, and compassionate lifelong learners who make a positive impact on the world.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Heart size={20} style={{ color: '#ec4899' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: '0.4rem', fontSize: '1.1rem' }}>Our Philosophy</h3>
                                        <p style={{ color: '#4b5563', lineHeight: 1.75, fontSize: '0.95rem' }}>
                                            We follow a child-centric approach that respects the pace and style of each child's learning. Our curriculum fosters physical, intellectual, emotional, and social development in a joyful atmosphere.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Values ── */}
            <section className="w-section" style={{ background: 'var(--w-bg-soft)' }}>
                <div className="w-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <span className="w-section-label">What We Stand For</span>
                        <h2 className="w-title">Our Core Values</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { emoji: '💛', title: 'Compassion', desc: 'We treat every child with warmth, empathy, and unconditional care.' },
                            { emoji: '🌱', title: 'Growth', desc: 'We believe every child can grow and improve with the right support.' },
                            { emoji: '🤝', title: 'Respect', desc: 'We honour each child\'s uniqueness, culture, and pace of learning.' },
                            { emoji: '🔍', title: 'Curiosity', desc: 'We cultivate a love of asking questions and exploring the world.' },
                            { emoji: '🏆', title: 'Excellence', desc: 'We set high standards while keeping learning joyful and stress-free.' },
                            { emoji: '🌍', title: 'Community', desc: 'We build strong bonds between students, families, and teachers.' },
                        ].map(v => (
                            <div key={v.title} style={{
                                background: 'white',
                                borderRadius: '1.25rem',
                                padding: '1.75rem 1.5rem',
                                textAlign: 'center',
                                border: '1px solid var(--w-border)',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                            }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'; }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
                            >
                                <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>{v.emoji}</div>
                                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#0f172a' }}>{v.title}</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Services ── */}
            <section className="w-section" style={{ background: 'white' }}>
                <div className="w-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <span className="w-section-label">What We Offer</span>
                        <h2 className="w-title">Our Services</h2>
                        <p className="w-subtitle" style={{ margin: '0 auto', textAlign: 'center' }}>
                            Comprehensive educational offerings for every stage of early childhood.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { emoji: '🎒', title: 'Pre-Primary Education', desc: 'Playgroup, Nursery, LKG & UKG — joyful foundational early learning programs tailored for little ones.', color: '#f0fdf4', border: '#bbf7d0' },
                            { emoji: '📚', title: 'Primary Education', desc: 'Classes 1 to 5 with a structured, engaging CBSE-aligned curriculum that builds strong academic foundations.', color: '#eff6ff', border: '#bfdbfe' },
                            { emoji: '🌙', title: 'After-School Care', desc: 'Safe and supervised care with homework assistance for working parents. Your child is in good hands.', color: '#fdf2f8', border: '#fbcfe8' },
                            { emoji: '💳', title: 'Online Fee Payment', desc: 'Secure digital fee collection portal for parents — pay fees anytime, anywhere, from any device.', color: '#fefce8', border: '#fde68a' },
                            { emoji: '📱', title: 'Parent Communication', desc: 'Real-time SMS notifications for admissions, fee receipts, exam schedules, and important school updates.', color: '#fff7ed', border: '#fed7aa' },
                            { emoji: '🚌', title: 'Transport Facility', desc: 'Safe, reliable school bus service covering Meerpet and nearby areas with trained staff accompanying students.', color: '#f5f3ff', border: '#ddd6fe' },
                        ].map(s => (
                            <div key={s.title} style={{
                                background: s.color,
                                border: `1px solid ${s.border}`,
                                borderRadius: '1.25rem',
                                padding: '1.75rem',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                            }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'; }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '0.875rem' }}>{s.emoji}</div>
                                <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem', color: '#0f172a' }}>{s.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.7 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Legal ── */}
            <section style={{ background: 'var(--w-bg-soft)', padding: '2rem 0 3rem' }}>
                <div className="w-container">
                    <div style={{
                        padding: '1.5rem 2rem',
                        background: 'white',
                        borderRadius: '1rem',
                        border: '1px solid var(--w-border)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        alignItems: 'center',
                    }}>
                        <Award size={22} style={{ color: 'var(--w-primary)', flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7 }}>
                            <strong style={{ color: '#374151' }}>Registered As:</strong> SPROUT EDUCATIONAL SOCIETY &nbsp;·&nbsp;
                            <strong style={{ color: '#374151' }}>Address:</strong> Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad, Telangana &nbsp;·&nbsp;
                            <strong style={{ color: '#374151' }}>Email:</strong> info@sproutschool.edu.in &nbsp;·&nbsp;
                            <strong style={{ color: '#374151' }}>UDISE:</strong> 36230500631
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '4rem 0' }}>
                <div className="w-container" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '2rem', color: 'white', marginBottom: '1rem' }}>
                        Want to Know More?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.88)', marginBottom: '2rem' }}>
                        Book a campus visit or get in touch — we'd love to meet you and your child.
                    </p>
                    <Link href="/contact" className="w-btn w-btn-white w-btn-lg">
                        Contact Us <ArrowRight size={18} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
