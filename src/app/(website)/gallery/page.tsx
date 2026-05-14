'use client';

import { useState } from 'react';
import { Camera, Image as ImageIcon, ZoomIn } from 'lucide-react';

type GalleryItem = {
    id: number;
    category: string;
    title: string;
    src: string;
    placeholder: string;
    emoji: string;
};

const galleryData: GalleryItem[] = [
    // Classroom
    { id: 1, category: 'classroom', title: 'Nursery Classroom', src: '/gallery/classroom/classroom-01.jpg', placeholder: 'Nursery learning in progress', emoji: '📚' },
    { id: 2, category: 'classroom', title: 'LKG Activity Time', src: '/gallery/classroom/classroom-02.jpg', placeholder: 'LKG activity session', emoji: '✏️' },
    { id: 3, category: 'classroom', title: 'UKG Reading Corner', src: '/gallery/classroom/classroom-03.jpg', placeholder: 'UKG reading corner', emoji: '📖' },
    { id: 4, category: 'classroom', title: 'Primary Classroom', src: '/gallery/classroom/classroom-04.jpg', placeholder: 'Grade 2 classroom lesson', emoji: '🏫' },

    // Events
    { id: 5, category: 'events', title: 'Annual Day 2024', src: '/gallery/events/event-01.jpg', placeholder: 'Annual Day celebration stage', emoji: '🎭' },
    { id: 6, category: 'events', title: 'Independence Day', src: '/gallery/events/event-02.jpg', placeholder: 'Independence Day flag hoisting', emoji: '🇮🇳' },
    { id: 7, category: 'events', title: 'Children\'s Day', src: '/gallery/events/event-03.jpg', placeholder: 'Children\'s Day fun activities', emoji: '🎈' },
    { id: 8, category: 'events', title: 'Sports Day', src: '/gallery/events/event-04.jpg', placeholder: 'Sports Day races and prizes', emoji: '🏆' },

    // Arts & Crafts
    { id: 9, category: 'arts', title: 'Art Exhibition', src: '/gallery/arts/arts-01.jpg', placeholder: 'Student artwork on display', emoji: '🎨' },
    { id: 10, category: 'arts', title: 'Craft Workshop', src: '/gallery/arts/arts-02.jpg', placeholder: 'Kids crafting with clay', emoji: '🧩' },
    { id: 11, category: 'arts', title: 'Painting Session', src: '/gallery/arts/arts-03.jpg', placeholder: 'Children painting freely', emoji: '🖌️' },

    // Sports & Play
    { id: 12, category: 'sports', title: 'Morning Assembly', src: '/gallery/sports/sports-01.jpg', placeholder: 'Students in morning assembly', emoji: '🌅' },
    { id: 13, category: 'sports', title: 'Playground Fun', src: '/gallery/sports/sports-02.jpg', placeholder: 'Kids playing on the playground', emoji: '⚽' },
    { id: 14, category: 'sports', title: 'Yoga & Exercise', src: '/gallery/sports/sports-03.jpg', placeholder: 'Yoga session in progress', emoji: '🧘' },

    // Celebrations
    { id: 15, category: 'celebrations', title: 'Diwali Celebration', src: '/gallery/celebrations/celebration-01.jpg', placeholder: 'Diwali lights and decorations', emoji: '🪔' },
    { id: 16, category: 'celebrations', title: 'Birthday Bash', src: '/gallery/celebrations/celebration-02.jpg', placeholder: 'School birthday celebration', emoji: '🎂' },
    { id: 17, category: 'celebrations', title: 'Christmas Party', src: '/gallery/celebrations/celebration-03.jpg', placeholder: 'Christmas party with Santa', emoji: '🎄' },
    { id: 18, category: 'celebrations', title: 'Graduation Day', src: '/gallery/celebrations/celebration-04.jpg', placeholder: 'Pre-Primary graduation ceremony', emoji: '🎓' },
];

const categories = [
    { id: 'all', label: 'All Photos', emoji: '📷' },
    { id: 'classroom', label: 'Classroom', emoji: '📚' },
    { id: 'events', label: 'Events', emoji: '🎭' },
    { id: 'arts', label: 'Arts & Crafts', emoji: '🎨' },
    { id: 'sports', label: 'Sports & Play', emoji: '⚽' },
    { id: 'celebrations', label: 'Celebrations', emoji: '🎉' },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
    classroom: { bg: '#eff6ff', text: '#3b82f6' },
    events:    { bg: '#fdf2f8', text: '#ec4899' },
    arts:      { bg: '#fff7ed', text: '#f97316' },
    sports:    { bg: '#f0fdf4', text: '#10b981' },
    celebrations: { bg: '#fefce8', text: '#ca8a04' },
};

export default function GalleryPage() {
    const [active, setActive] = useState('all');
    const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

    const filtered = active === 'all' ? galleryData : galleryData.filter(g => g.category === active);

    return (
        <div>
            {/* ── Hero ── */}
            <section style={{
                background: 'linear-gradient(160deg, #fdf2f8 0%, #f0fdf4 50%, #fffbeb 100%)',
                padding: '5rem 0 4rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, #ec489920, transparent 70%)', pointerEvents: 'none' }} />
                <div className="w-container">
                    <span className="w-section-label">📸 Moments &amp; Memories</span>
                    <h1 className="w-title">
                        Our School <span className="gradient-text">Gallery</span>
                    </h1>
                    <p className="w-subtitle" style={{ margin: '0 auto', textAlign: 'center' }}>
                        Glimpses of joy, learning, creativity, and celebrations — every day is an adventure at Sprout School.
                    </p>
                </div>
            </section>

            {/* ── Filter Tabs ── */}
            <section style={{ background: 'white', padding: '2rem 0', borderBottom: '1px solid var(--w-border)' }}>
                <div className="w-container">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActive(cat.id)}
                                className="gallery-tab"
                                style={active === cat.id ? {
                                    background: 'var(--w-primary)',
                                    borderColor: 'var(--w-primary)',
                                    color: 'white',
                                } : {}}
                            >
                                {cat.emoji} {cat.label}
                            </button>
                        ))}
                    </div>
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>
                        Showing {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </section>

            {/* ── Grid ── */}
            <section className="w-section" style={{ background: 'var(--w-bg-soft)' }}>
                <div className="w-container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1.25rem',
                    }}>
                        {filtered.map(item => {
                            const cc = categoryColors[item.category] || { bg: '#f8fafc', text: '#64748b' };
                            return (
                                <div
                                    key={item.id}
                                    className="gallery-item"
                                    onClick={() => setLightbox(item)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Try to load real image, fall back to styled placeholder */}
                                    <div
                                        className="gallery-placeholder"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            background: `linear-gradient(135deg, ${cc.bg} 0%, #f8fafc 100%)`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'transform 0.4s ease',
                                        }}
                                    >
                                        <div style={{ fontSize: '3rem', lineHeight: 1 }}>{item.emoji}</div>
                                        <div style={{
                                            fontFamily: "'Nunito', sans-serif",
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                            color: cc.text,
                                            textAlign: 'center',
                                            padding: '0 1rem',
                                        }}>
                                            {item.title}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#94a3b8',
                                            textAlign: 'center',
                                            padding: '0 1rem',
                                        }}>
                                            {item.placeholder}
                                        </div>
                                        <div style={{
                                            marginTop: '0.5rem',
                                            background: cc.text,
                                            color: 'white',
                                            borderRadius: '9999px',
                                            padding: '0.25rem 0.75rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}>
                                            {item.category}
                                        </div>
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.75rem',
                                            right: '0.75rem',
                                            background: 'rgba(255,255,255,0.85)',
                                            borderRadius: '0.5rem',
                                            padding: '0.3rem',
                                            backdropFilter: 'blur(4px)',
                                        }}>
                                            <ZoomIn size={14} style={{ color: '#475569' }} />
                                        </div>
                                    </div>

                                    {/* Overlay */}
                                    <div className="gallery-overlay">
                                        <div className="gallery-caption">{item.title}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Replace photos notice */}
                    <div style={{
                        marginTop: '3rem',
                        padding: '1.5rem 2rem',
                        background: 'linear-gradient(135deg, #fef3c7, #d1fae5)',
                        borderRadius: '1rem',
                        border: '1px dashed #f59e0b',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'flex-start',
                    }}>
                        <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>📁</div>
                        <div>
                            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: '#92400e', marginBottom: '0.35rem' }}>
                                Photo folders are ready — just drop in your images!
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#78350f', lineHeight: 1.65 }}>
                                Replace the placeholder cards with real photos by placing your images in:<br />
                                <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>public/gallery/classroom/</code>,&nbsp;
                                <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>public/gallery/events/</code>,&nbsp;
                                <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>public/gallery/arts/</code>,&nbsp;
                                <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>public/gallery/sports/</code>,&nbsp;
                                <code style={{ background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>public/gallery/celebrations/</code>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Social CTA ── */}
            <section style={{ background: 'white', padding: '3.5rem 0' }}>
                <div className="w-container" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📸</div>
                    <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.75rem', color: '#0f172a', marginBottom: '0.75rem' }}>
                        Follow Our Daily Journey
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                        Stay updated with daily activities, events, and smiles from Sprout School on social media.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="#" className="w-btn w-btn-primary" style={{ background: 'linear-gradient(135deg, #f9a8d4, #ec4899)' }}>
                            📸 Instagram
                        </a>
                        <a href="#" className="w-btn w-btn-outline">
                            👍 Facebook
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Lightbox ── */}
            {lightbox && (
                <div
                    onClick={() => setLightbox(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15,23,42,0.9)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '1.5rem',
                            overflow: 'hidden',
                            maxWidth: '600px',
                            width: '100%',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
                        }}
                    >
                        <div style={{
                            height: '300px',
                            background: `linear-gradient(135deg, ${categoryColors[lightbox.category]?.bg || '#f0fdf4'}, #f8fafc)`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                        }}>
                            <div style={{ fontSize: '5rem' }}>{lightbox.emoji}</div>
                            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#334155' }}>
                                {lightbox.placeholder}
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>{lightbox.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'capitalize', marginTop: '0.25rem' }}>{lightbox.category}</div>
                            </div>
                            <button
                                onClick={() => setLightbox(null)}
                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, color: '#475569' }}
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
