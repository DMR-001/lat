import Link from 'next/link';

export default function Footer() {
    return (
        <footer style={{ backgroundColor: '#1f2937', color: 'white', padding: '4rem 0 2rem' }}>
            <div className="w-container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>

                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <img src="/sprout-logo.png" alt="Sprout Logo" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} />
                        </div>
                        <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>
                            Nurturing Little Leaders for a Bright Tomorrow. We provide a safe, engaging, and holistic learning environment.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.25rem', color: '#f59e0b' }}>Quick Links</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <Link href="/" style={{ color: '#d1d5db', textDecoration: 'none' }}>Home</Link>
                            <Link href="/about" style={{ color: '#d1d5db', textDecoration: 'none' }}>About Us</Link>
                            <Link href="/gallery" style={{ color: '#d1d5db', textDecoration: 'none' }}>Gallery</Link>
                            <Link href="/academics" style={{ color: '#d1d5db', textDecoration: 'none' }}>Academics</Link>
                            <Link href="/contact" style={{ color: '#d1d5db', textDecoration: 'none' }}>Contact</Link>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.25rem', color: '#f59e0b' }}>Contact Us</h3>
                        <div style={{ color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <p>Hno-14-218/5, Raghavanagar Colony,<br />Meerpet, Hyderabad</p>
                            <p>Phone: +91 7032252030</p>
                            <p>Email: sproutmeerpet@gmail.com</p>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #374151', paddingTop: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                    &copy; {new Date().getFullYear()} Sprout School - Little Leaders Learning Hub. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
