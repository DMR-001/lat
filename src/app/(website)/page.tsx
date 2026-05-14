import Link from 'next/link';
import { BookOpen, Users, Sun, Star, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
    return (
        <div>
            {/* ── Hero ── */}
            <section style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(160deg, #f0fdf4 0%, #fffbeb 55%, #eff6ff 100%)',
                padding: '6rem 0 4rem',
            }}>
                {/* Decorative blobs */}
                <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, #10b98140 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, #f59e0b30 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '40%', left: '50%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, #6366f120 0%, transparent 70%)', pointerEvents: 'none' }} />

                {/* Floating emoji decorations */}
                <div style={{ position: 'absolute', top: '12%', left: '8%', fontSize: '2.5rem', animation: 'float 4s ease-in-out infinite', opacity: 0.7 }}>🌱</div>
                <div style={{ position: 'absolute', top: '20%', right: '10%', fontSize: '2rem', animation: 'float-slow 6s ease-in-out infinite', opacity: 0.6 }}>⭐</div>
                <div style={{ position: 'absolute', bottom: '25%', left: '5%', fontSize: '1.75rem', animation: 'float 5s ease-in-out infinite', opacity: 0.5 }}>🎨</div>
                <div style={{ position: 'absolute', bottom: '30%', right: '7%', fontSize: '2rem', animation: 'float-slow 7s ease-in-out infinite', opacity: 0.5 }}>📚</div>

                <div className="w-container" style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <span className="w-section-label">
                            🌟 Welcome to Sprout School
                        </span>
                    </div>

                    <h1 className="w-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', marginBottom: '1.5rem' }}>
                        Where Every Child
                        <br />
                        <span className="gradient-text">Blooms & Thrives</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                        color: 'var(--w-text-light)',
                        maxWidth: '620px',
                        margin: '0 auto 2.5rem',
                        lineHeight: 1.75,
                    }}>
                        A nurturing pre &amp; primary school in Meerpet, Hyderabad — giving your child a joyful, safe, and stimulating start to their lifelong learning journey.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
                        <Link href="/contact" className="w-btn w-btn-primary w-btn-lg">
                            Apply for Admission <ArrowRight size={18} />
                        </Link>
                        <Link href="/about" className="w-btn w-btn-outline w-btn-lg">
                            Explore Our School
                        </Link>
                    </div>

                    {/* Quick trust badges */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        justifyContent: 'center',
                    }}>
                        {[
                            { icon: '✅', text: 'CBSE Aligned Curriculum' },
                            { icon: '🔒', text: 'Safe & Secure Campus' },
                            { icon: '👩‍🏫', text: 'Experienced Faculty' },
                            { icon: '🎓', text: 'Playgroup to Grade 5' },
                        ].map(b => (
                            <div key={b.text} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                background: 'white',
                                border: '1px solid var(--w-border)',
                                borderRadius: '9999px',
                                padding: '0.4rem 1rem',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: 'var(--w-text-mid)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            }}>
                                <span>{b.icon}</span> {b.text}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Wave divider */}
            <div style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #fffbeb 55%, #eff6ff 100%)', lineHeight: 0 }}>
                <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
                    <path d="M0,28 C480,56 960,0 1440,28 L1440,56 L0,56 Z" fill="white" />
                </svg>
            </div>

            {/* ── Stats Row ── */}
            <section style={{ background: 'white', padding: '3rem 0' }}>
                <div className="w-container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { num: '500+', label: 'Happy Students', icon: '👦' },
                            { num: '20+', label: 'Expert Teachers', icon: '👩‍🏫' },
                            { num: '10+', label: 'Years of Excellence', icon: '🏆' },
                            { num: '100%', label: 'Safe Environment', icon: '🔒' },
                            { num: '6', label: 'Programs Offered', icon: '📚' },
                        ].map(s => (
                            <div key={s.label} className="w-stat-card">
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                                <span className="w-stat-number">{s.num}</span>
                                <span className="w-stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Choose Us ── */}
            <section className="w-section" style={{ background: 'var(--w-bg-soft)' }}>
                <div className="w-container">
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <span className="w-section-label">Our Difference</span>
                        <h2 className="w-title" style={{ margin: '0 auto 1rem' }}>
                            Why Choose <span className="gradient-text">Sprout?</span>
                        </h2>
                        <p className="w-subtitle" style={{ margin: '0 auto', textAlign: 'center' }}>
                            We focus on the holistic development of every child — mind, body, and heart.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>
                        <FeatureCard
                            emoji="☀️"
                            title="Holistic Grooming"
                            desc="Physical, emotional, social, and cognitive development go hand in hand. We nurture the whole child."
                            color="#f59e0b"
                            bg="#fffbeb"
                        />
                        <FeatureCard
                            emoji="📖"
                            title="Modern Curriculum"
                            desc="A balanced blend of CBSE standards, play-based learning, and 21st-century skills."
                            color="#10b981"
                            bg="#f0fdf4"
                        />
                        <FeatureCard
                            emoji="👩‍🏫"
                            title="Expert Faculty"
                            desc="Caring, qualified, and passionate teachers dedicated to your child's success every single day."
                            color="#3b82f6"
                            bg="#eff6ff"
                        />
                        <FeatureCard
                            emoji="🔒"
                            title="Safe & Secure"
                            desc="CCTV surveillance, secure entry, and a warm home-like atmosphere for complete peace of mind."
                            color="#ec4899"
                            bg="#fdf2f8"
                        />
                        <FeatureCard
                            emoji="🎨"
                            title="Creative Arts"
                            desc="Music, art, dance, and drama programs that bring out the unique creative spark in every child."
                            color="#8b5cf6"
                            bg="#f5f3ff"
                        />
                        <FeatureCard
                            emoji="🚌"
                            title="Safe Transport"
                            desc="Reliable school bus service covering Meerpet and nearby areas with trained staff on board."
                            color="#f97316"
                            bg="#fff7ed"
                        />
                    </div>
                </div>
            </section>

            {/* ── Programs Preview ── */}
            <section className="w-section" style={{ background: 'white' }}>
                <div className="w-container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                        <div>
                            <span className="w-section-label">Academic Programs</span>
                            <h2 className="w-title">Programs Built for Every Stage</h2>
                            <p style={{ color: 'var(--w-text-light)', lineHeight: 1.8, marginBottom: '1.75rem' }}>
                                From the very first steps of a toddler to the confident strides of a Grade 5 student — we have a thoughtfully designed program for every age.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
                                {[
                                    'Playgroup · Nursery · LKG & UKG',
                                    'Primary Education (Grades 1–5)',
                                    'STEM & Experiential Learning',
                                    'Language & Arts Enrichment',
                                    'After-School Care Program',
                                ].map(item => (
                                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <CheckCircle size={18} style={{ color: 'var(--w-primary)', flexShrink: 0 }} />
                                        <span style={{ color: 'var(--w-text-mid)', fontWeight: 500 }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <Link href="/academics" className="w-btn w-btn-primary">
                                View All Programs <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {[
                                { emoji: '🧸', label: 'Playgroup', age: '1.5 – 2.5 yrs', color: '#fef3c7' },
                                { emoji: '🌸', label: 'Nursery', age: '2.5 – 3.5 yrs', color: '#fdf2f8' },
                                { emoji: '🌈', label: 'LKG & UKG', age: '3.5 – 5.5 yrs', color: '#f0fdf4' },
                                { emoji: '🎒', label: 'Primary', age: 'Grades 1 – 5', color: '#eff6ff' },
                            ].map(p => (
                                <div key={p.label} style={{
                                    background: p.color,
                                    borderRadius: '1.25rem',
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    transition: 'transform 0.2s',
                                }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{p.emoji}</div>
                                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{p.label}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{p.age}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="w-section" style={{ background: 'var(--w-bg-soft)' }}>
                <div className="w-container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <span className="w-section-label">Parent Stories</span>
                        <h2 className="w-title">What Parents Say</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {[
                            {
                                name: 'Priya Reddy',
                                child: 'Mother of Aarav (UKG)',
                                quote: "My son looks forward to school every morning. The teachers are so caring and patient. Sprout has truly made learning fun for him!",
                                stars: 5,
                            },
                            {
                                name: 'Ramesh Kumar',
                                child: 'Father of Ananya (Grade 2)',
                                quote: "The school's approach to holistic development is outstanding. Ananya has blossomed in confidence, creativity, and academics since joining.",
                                stars: 5,
                            },
                            {
                                name: 'Sunita Devi',
                                child: 'Mother of Rohan (Nursery)',
                                quote: "Excellent environment and very attentive staff. The school keeps us updated regularly. We feel completely at ease leaving Rohan here.",
                                stars: 5,
                            },
                        ].map(t => (
                            <div key={t.name} className="testimonial-card">
                                <div style={{ display: 'flex', marginBottom: '0.75rem' }}>
                                    {Array.from({ length: t.stars }).map((_, i) => (
                                        <span key={i} style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★</span>
                                    ))}
                                </div>
                                <p style={{ color: 'var(--w-text-mid)', lineHeight: 1.8, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                                    "{t.quote}"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--w-primary), var(--w-secondary))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontFamily: "'Nunito', sans-serif",
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                    }}>
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{t.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.child}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                padding: '5rem 0',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

                <div className="w-container" style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
                    <h2 style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                        fontWeight: 900,
                        color: 'white',
                        marginBottom: '1rem',
                    }}>
                        Admissions Open for 2025–26!
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', maxWidth: '560px', margin: '0 auto 2.5rem' }}>
                        Give your child the best start in life. Visit our campus, meet our teachers, and see the Sprout difference for yourself.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/contact" className="w-btn w-btn-white w-btn-lg">
                            Enquire Now <ArrowRight size={18} />
                        </Link>
                        <Link href="/academics" className="w-btn w-btn-lg" style={{ border: '2px solid rgba(255,255,255,0.6)', color: 'white', background: 'transparent' }}>
                            View Programs
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ emoji, title, desc, color, bg }: any) {
    return (
        <div style={{
            padding: '2rem',
            borderRadius: '1.25rem',
            backgroundColor: bg,
            border: `1px solid ${color}30`,
            transition: 'all 0.3s',
            cursor: 'default',
        }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-5px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
        >
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '14px',
                backgroundColor: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                marginBottom: '1.25rem',
            }}>
                {emoji}
            </div>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.6rem', color: '#0f172a' }}>{title}</h3>
            <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9rem' }}>{desc}</p>
        </div>
    );
}
