export default function AcademicsPage() {
    return (
        <div className="w-container w-section">
            <h1 className="w-title" style={{ textAlign: 'center', marginBottom: '4rem' }}>Academic Programs</h1>

            {/* Pre-Primary */}
            <div style={{ marginBottom: '5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '8px', height: '40px', backgroundColor: 'var(--w-secondary)' }}></div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Pre-Primary Wing</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <ProgramCard
                        title="Playgroup"
                        age="1.5 - 2.5 Years"
                        desc="A gentle introduction to social interaction and sensory play in a loving environment."
                    />
                    <ProgramCard
                        title="Nursery"
                        age="2.5 - 3.5 Years"
                        desc="Focuses on foundational skills like language, motor skills, and creative expression."
                    />
                    <ProgramCard
                        title="LKG & UKG"
                        age="3.5 - 5.5 Years"
                        desc="Preparation for formal schooling with reading, writing, and logical thinking exercises."
                    />
                </div>
            </div>

            {/* Primary */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '8px', height: '40px', backgroundColor: 'var(--w-primary)' }}></div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Primary Wing</h2>
                </div>
                <p style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '2rem' }}>
                    Our Primary program (Grades 1 to 5) follows a rigorous yet engaging curriculum designed to build strong academic foundations while encouraging curiosity and critical thinking.
                </p>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', display: 'grid', gap: '1rem', fontSize: '1.125rem', color: '#374151' }}>
                    <li>Integrated curriculum combining CBSE standards with experiential learning.</li>
                    <li>Focus on STEM (Science, Technology, Engineering, Math) activities.</li>
                    <li>Language enrichment programs for English and regional languages.</li>
                    <li>Regular sports, arts, and music sessions.</li>
                </ul>
            </div>
        </div>
    );
}

function ProgramCard({ title, age, desc }: any) {
    return (
        <div style={{ padding: '2rem', backgroundColor: '#fcfcfc', border: '1px solid #e5e7eb', borderRadius: '0.75rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--w-text)', marginBottom: '0.5rem' }}>{title}</h3>
            <div style={{ display: 'inline-block', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>
                {age}
            </div>
            <p style={{ color: '#6b7280' }}>{desc}</p>
        </div>
    );
}
