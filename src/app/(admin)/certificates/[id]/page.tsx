import prisma from '@/lib/prisma';
import PrintButton from '@/components/PrintButton';

export default async function CertificateViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const certificate = await prisma.certificate.findUnique({
        where: { id },
        include: {
            student: {
                include: {
                    class: true
                }
            },
            academicYear: true
        }
    });

    if (!certificate) return <div>Certificate not found</div>;

    const student = certificate.student;
    const isBonafide = certificate.type === 'BONAFIDE';

    // Add "Class" prefix if the class name is just a number
    const className = student.class?.name;
    const displayClassName = className && /^\d+$/.test(className) ? `Class ${className}` : className;

    return (
        <div className="container" style={{ maxWidth: '700px', margin: '2rem auto' }}>
            <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <PrintButton />
            </div>

            <div className="card certificate-card" style={{ padding: '2rem', border: '2px solid var(--text-main)' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--text-main)', paddingBottom: '1rem' }}>
                    <img src="/sprout-logo.png" alt="Sprout School Logo" style={{ height: '60px', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Ph: +91 7032252030 | Email: sproutmeerpet@gmail.com
                    </p>
                </div>

                {/* Certificate Type Title */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: '0.5rem',
                        display: 'inline-block'
                    }}>
                        {isBonafide ? 'Bonafide Certificate' : 'Study Certificate'}
                    </h2>
                </div>

                {/* Certificate Number and Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.75rem' }}>
                    <div>
                        <strong>Certificate No:</strong> {certificate.certificateNo}
                    </div>
                    <div>
                        <strong>Date:</strong> {certificate.issueDate.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </div>
                </div>

                {/* Certificate Content */}
                <div style={{ lineHeight: '1.8', fontSize: '0.875rem', textAlign: 'justify', marginBottom: '2rem' }}>
                    <p style={{ marginBottom: '1rem' }}>
                        This is to certify that <strong>{student.firstName} {student.lastName}</strong>,
                        son/daughter of <strong>{student.parentName || '_______________'}</strong>,
                        bearing Admission Number <strong>{student.admissionNo}</strong>,
                        is a bonafide student of this school.
                    </p>

                    <p style={{ marginBottom: '1rem' }}>
                        He/She is currently studying in <strong>{displayClassName}</strong> during
                        the academic year <strong>{certificate.academicYear.name}</strong>.
                    </p>

                    <p style={{ marginBottom: '1rem' }}>
                        Date of Birth: <strong>{student.dob.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })}</strong>
                    </p>

                    {isBonafide && certificate.purpose && (
                        <p style={{ marginBottom: '1rem' }}>
                            This certificate is issued for the purpose of <strong>{certificate.purpose}</strong>.
                        </p>
                    )}

                    {certificate.remarks && (
                        <p style={{ marginBottom: '1rem', fontStyle: 'italic' }}>
                            Remarks: {certificate.remarks}
                        </p>
                    )}
                </div>

                {/* Footer - Signature */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Academic Year: {certificate.academicYear.name}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '150px', borderTop: '1px solid var(--text-main)', paddingTop: '0.5rem', marginTop: '2rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                {certificate.issuedBy || 'Principal'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Sprout School
                            </div>
                        </div>
                    </div>
                </div>

                {/* School Seal Placeholder */}
                <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', opacity: 0.1 }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        border: '2px solid var(--primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.625rem',
                        textAlign: 'center'
                    }}>
                        SCHOOL<br />SEAL
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { 
                        margin: 0.5cm; 
                        size: A5 portrait;
                    }
                    .no-print { display: none !important; }
                    .container { margin: 0 !important; max-width: 100% !important; }
                    .certificate-card { 
                        border: 2px solid black !important; 
                        box-shadow: none !important; 
                        padding: 1rem !important; 
                        page-break-inside: avoid;
                        position: relative;
                        font-size: 9px !important;
                    }
                    .certificate-card img {
                        height: 40px !important;
                    }
                    .certificate-card h2 {
                        font-size: 1rem !important;
                    }
                    .certificate-card p {
                        font-size: 8px !important;
                        line-height: 1.6 !important;
                        margin-bottom: 0.5rem !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body { 
                        background-color: white !important;
                    }
                }
            `}</style>
        </div>
    );
}
