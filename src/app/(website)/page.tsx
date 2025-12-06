import Link from 'next/link';
import { BookOpen, Users, Sun, Star } from 'lucide-react';

export default function HomePage() {
    return (
        <div>
            {/* Hero Section */}
            <section style={{
                backgroundColor: 'var(--w-bg-alt)',
                padding: '6rem 0',
                textAlign: 'center',
                backgroundImage: 'radial-gradient(#10b98115 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }}>
                <div className="w-container">
                    <span style={{
                        color: 'var(--w-secondary)',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                        display: 'block'
                    }}>Welcome to Sprout School</span>

                    <h1 className="w-title">
                        Nurturing Little Leaders for a<br />
                        <span style={{ color: 'var(--w-primary)' }}>Bright Tomorrow</span>
                    </h1>

                    <p style={{ fontSize: '1.25rem', color: 'var(--w-text-light)', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
                        Providing a safe, loving, and stimulating environment where every child can bloom, grow, and discover their potential.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/contact" className="w-btn w-btn-primary">
                            Admissions Open
                        </Link>
                        <Link href="/about" className="w-btn w-btn-outline">
                            Learn More
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features / Why Choose Us */}
            <section className="w-section">
                <div className="w-container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Why Choose Sprout?</h2>
                        <p style={{ color: 'var(--w-text-light)', marginTop: '0.5rem' }}>We focus on the holistic development of every child.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        <FeatureCard
                            icon={<Sun size={32} />}
                            title="Holistic Grooming"
                            desc="We focus on physical, emotional, and social growth alongside academics."
                            color="#f59e0b"
                        />
                        <FeatureCard
                            icon={<BookOpen size={32} />}
                            title="Modern Curriculum"
                            desc="A blend of traditional values and modern teaching methodologies."
                            color="#10b981"
                        />
                        <FeatureCard
                            icon={<Users size={32} />}
                            title="Expert Faculty"
                            desc="Caring, qualified, and experienced teachers who love what they do."
                            color="#3b82f6"
                        />
                        <FeatureCard
                            icon={<Star size={32} />}
                            title="Safe Environment"
                            desc="Secure premises with a warm, home-like atmosphere for your little ones."
                            color="#ec4899"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ backgroundColor: 'var(--w-primary)', color: 'white' }} className="w-section">
                <div className="w-container" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Ready to start the journey?</h2>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                        Admissions represent the first step in a lifelong journey of learning. We invite you to visit our campus.
                    </p>
                    <Link href="/contact" className="w-btn" style={{ backgroundColor: 'white', color: 'var(--w-primary)' }}>
                        Contact Us Today
                    </Link>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, desc, color }: any) {
    return (
        <div style={{
            padding: '2rem',
            borderRadius: '1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }} className="hover:shadow-lg">
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                backgroundColor: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
                marginBottom: '1.5rem'
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{title}</h3>
            <p style={{ color: '#6b7280', lineHeight: '1.6' }}>{desc}</p>
        </div>
    );
}
