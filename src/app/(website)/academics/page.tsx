'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, BookOpen, Beaker, Music, Palette, Globe, Calculator } from 'lucide-react';

export default function AcademicsPage() {
    return (
        <div>
            {/* ── Hero ── */}
            <section style={{
                background: 'linear-gradient(160deg, #eff6ff 0%, #f0fdf4 60%, #fffbeb 100%)',
                padding: '5rem 0 4rem',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, #6366f115, transparent 70%)', pointerEvents: 'none' }} />
                <div className="w-container" style={{ textAlign: 'center' }}>
                    <span className="w-section-label">🎓 Academic Excellence</span>
                    <h1 className="w-title">
                        Programs Designed for <span className="gradient-text">Every Stage</span>
                    </h1>
                    <p className="w-subtitle" style={{ margin: '0 auto', textAlign: 'center' }}>
                        From curious toddlers to confident young learners — our thoughtfully structured programs support every child's unique journey.
                    </p>
                </div>
            </section>

            {/* ── Pre-Primary ── */}
            <section className="w-section" style={{ background: 'white' }}>
                <div className="w-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '6px', height: '44px', background: 'linear-gradient(180deg, var(--w-secondary), var(--w-secondary-dark))', borderRadius: '4px' }} />
                        <div>
                            <span className="w-section-label" style={{ marginBottom: '0.25rem' }}>Ages 1.5 – 5.5 Years</span>
                            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '2rem', fontWeight: 900, margin: 0 }}>Pre-Primary Wing</h2>
                        </div>
                    </div>
                    <p style={{ color: 'var(--w-text-light)', marginBottom: '2.5rem', fontSize: '1.05rem', maxWidth: '700px' }}>
                        Our Pre-Primary programs create a joyful foundation for lifelong learning through play, exploration, and nurturing relationships in a safe, stimulating environment.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
                        <ProgramCard
                            emoji="🧸"
                            title="Playgroup"
                            age="1.5 – 2.5 Years"
                            desc="A gentle, loving first-step into the school world. Focus on social interaction, sensory play, and building trust in a nurturing environment."
                            highlights={['Sensory play activities', 'Circle time & storytime', 'Motor skill development', 'Social interaction basics']}
                            accentColor="#f59e0b"
                            bg="#fffbeb"
                        />
                        <ProgramCard
                            emoji="🌸"
                            title="Nursery"
                            age="2.5 – 3.5 Years"
                            desc="Focuses on foundational language skills, fine motor development, and nurturing creative expression through art and music."
                            highlights={['Language & vocabulary', 'Arts & craft sessions', 'Phonics introduction', 'Number awareness']}
                            accentColor="#ec4899"
                            bg="#fdf2f8"
                        />
                        <ProgramCard
                            emoji="🌈"
                            title="LKG & UKG"
                            age="3.5 – 5.5 Years"
                            desc="Prepares children for formal schooling with structured reading, writing, and logical thinking — while keeping it fun!"
                            highlights={['Reading & writing prep', 'Number concepts', 'Environmental awareness', 'Collaborative play']}
                            accentColor="#10b981"
                            bg="#f0fdf4"
                        />
                    </div>
                </div>
            </section>

            {/* ── Primary ── */}
            <section className="w-section" style={{ background: 'var(--w-bg-soft)' }}>
                <div className="w-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '6px', height: '44px', background: 'linear-gradient(180deg, var(--w-primary), var(--w-primary-dark))', borderRadius: '4px' }} />
                        <div>
                            <span className="w-section-label" style={{ marginBottom: '0.25rem' }}>Grades 1 – 5</span>
                            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '2rem', fontWeight: 900, margin: 0 }}>Primary Wing</h2>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
                        <div>
                            <p style={{ color: '#4b5563', lineHeight: 1.8, marginBottom: '2rem', fontSize: '1.05rem' }}>
                                Our Primary program (Grades 1 to 5) follows a rigorous yet engaging curriculum that builds strong academic foundations while encouraging curiosity, critical thinking, and a love of learning.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                {[
                                    'Integrated CBSE-aligned curriculum with experiential learning',
                                    'Strong focus on STEM activities and project-based learning',
                                    'Language enrichment for English, Telugu & Hindi',
                                    'Regular sports, arts, music and drama sessions',
                                    'Individual attention with small class sizes',
                                    'Regular parent-teacher communication & updates',
                                ].map(item => (
                                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                        <CheckCircle size={18} style={{ color: 'var(--w-primary)', flexShrink: 0, marginTop: '2px' }} />
                                        <span style={{ color: '#374151', lineHeight: 1.6 }}>{item}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href="/contact" className="w-btn w-btn-primary">
                                Enrol for Primary <ArrowRight size={16} />
                            </Link>
                        </div>

                        {/* Grade cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
                            {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].map((g, i) => (
                                <div key={g} style={{
                                    background: 'white',
                                    borderRadius: '1rem',
                                    padding: '1.25rem 1rem',
                                    textAlign: 'center',
                                    border: '1px solid var(--w-border)',
                                    gridColumn: i === 4 ? 'span 1' : 'auto',
                                }}>
                                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.5rem', color: 'var(--w-primary)' }}>{i + 1}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginTop: '0.25rem' }}>{g}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Subject Areas ── */}
            <section className="w-section" style={{ background: 'white' }}>
                <div className="w-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <span className="w-section-label">Curriculum Areas</span>
                        <h2 className="w-title">What Your Child Will Learn</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                        {[
                            { icon: <BookOpen size={24} />, label: 'English Language', color: '#3b82f6', bg: '#eff6ff' },
                            { icon: <Calculator size={24} />, label: 'Mathematics', color: '#10b981', bg: '#f0fdf4' },
                            { icon: <Beaker size={24} />, label: 'Science & EVS', color: '#8b5cf6', bg: '#f5f3ff' },
                            { icon: <Globe size={24} />, label: 'Social Studies', color: '#f59e0b', bg: '#fffbeb' },
                            { icon: <Palette size={24} />, label: 'Art & Craft', color: '#ec4899', bg: '#fdf2f8' },
                            { icon: <Music size={24} />, label: 'Music & Dance', color: '#f97316', bg: '#fff7ed' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: s.bg,
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                textAlign: 'center',
                                border: `1px solid ${s.color}25`,
                                transition: 'transform 0.2s',
                            }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
                            >
                                <div style={{ color: s.color, marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ background: 'linear-gradient(135deg, #6366f1, #10b981)', padding: '4.5rem 0' }}>
                <div className="w-container" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '2.25rem', color: 'white', marginBottom: '1rem' }}>
                        Ready to Enrol?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.88)', marginBottom: '2rem', fontSize: '1.05rem' }}>
                        Admissions are open for all programs. Reach out today to book a school visit.
                    </p>
                    <Link href="/contact" className="w-btn w-btn-white w-btn-lg">
                        Apply Now <ArrowRight size={18} />
                    </Link>
                </div>
            </section>
        </div>
    );
}

function ProgramCard({ emoji, title, age, desc, highlights, accentColor, bg }: any) {
    return (
        <div className="program-card" style={{ background: bg, borderColor: `${accentColor}30` }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{emoji}</div>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem' }}>{title}</h3>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: `${accentColor}18`,
                color: accentColor,
                padding: '0.3rem 0.875rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '1rem',
            }}>
                🗓️ {age}
            </div>
            <p style={{ color: '#4b5563', lineHeight: 1.75, marginBottom: '1.25rem', fontSize: '0.925rem' }}>{desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {highlights.map((h: string) => (
                    <div key={h} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: accentColor, fontSize: '0.75rem' }}>✦</span>
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>{h}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
