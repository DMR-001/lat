export default function GalleryPage() {
    // Placeholder images using a reliable placeholder service or simple colored blocks for now.
    // Ideally, these would be real photos from the school.
    const images = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="w-container w-section">
            <h1 className="w-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Our Gallery</h1>
            <p style={{ textAlign: 'center', color: 'var(--w-text-light)', marginBottom: '4rem', fontSize: '1.25rem' }}>
                Glimpses of daily life, events, and celebrations at Sprout School.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {images.map((img) => (
                    <div key={img} style={{
                        height: '250px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '0.75rem',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {/* Placeholder for actual image */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9ca3af',
                            backgroundColor: '#e5e7eb'
                        }}>
                            Image {img}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <p style={{ color: '#6b7280' }}>Follow us on social media for more updates!</p>
            </div>
        </div>
    );
}
