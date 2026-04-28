export default function AboutPage() {
    return (
        <div className="w-container w-section">
            <h1 className="w-title">About Our School</h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--w-text-light)', marginBottom: '3rem' }}>
                Sprout School was founded with a simple vision: To create a happy place where children love to learn.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                <div>
                    <img src="/sprout-logo.png" alt="About Sprout" style={{ width: '100%', borderRadius: '1rem' }} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>Our Mission</h2>
                    <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
                        Our mission is to provide a safe, secure, and stimulating environment where every child is treated as a unique individual. We believe in learning through play, exploration, and hands-on experiences.
                    </p>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>Our Philosophy</h2>
                    <p style={{ color: '#4b5563' }}>
                        We follow a child-centric approach that respects the pace and style of learning of each child. Our curriculum is designed to foster physical, intellectual, emotional, and social development.
                    </p>
                </div>
            </div>

            {/* Services / Offerings */}
            <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>Our Services</h2>
                <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2.5rem' }}>Comprehensive educational offerings for every stage of early childhood</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {[
                        { title: 'Pre-Primary Education', desc: 'Playgroup, Nursery, LKG & UKG — foundational early learning programs' },
                        { title: 'Primary Education', desc: 'Classes 1 to 5 with structured CBSE/State curriculum' },
                        { title: 'After-School Care', desc: 'Safe and supervised care with homework assistance' },
                        { title: 'Online Fee Payment', desc: 'Secure digital fee collection portal for parents' },
                        { title: 'Parent Communication', desc: 'SMS notifications for admissions, fee receipts, and school updates' },
                        { title: 'Transport Facility', desc: 'Safe school bus service covering nearby areas' },
                    ].map(s => (
                        <div key={s.title} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.875rem', padding: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: '#111827' }}>{s.title}</h3>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legal */}
            <div style={{ marginTop: '3rem', padding: '1.25rem 1.5rem', background: '#f1f5f9', borderRadius: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                <strong style={{ color: '#374151' }}>Legal Entity:</strong> SPROUT EDUCATIONAL SOCIETY &nbsp;|&nbsp;
                <strong style={{ color: '#374151' }}>Registered Address:</strong> Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad &nbsp;|&nbsp;
                <strong style={{ color: '#374151' }}>Email:</strong> info@sproutschool.edu.in
            </div>
        </div>
    );
}
