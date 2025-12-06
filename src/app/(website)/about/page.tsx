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
        </div>
    );
}
