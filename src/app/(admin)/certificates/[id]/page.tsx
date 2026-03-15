import React from 'react';
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

    const student = certificate.student as any;
    const isBonafide = certificate.type === 'BONAFIDE';
    const isSchoolRecord = certificate.type === 'SCHOOL_RECORD';

    // Add "Class" prefix if the class name is just a number
    const className = student.class?.name;
    const displayClassName = className && /^\d+$/.test(className) ? `Class ${className}` : className;

    // School Record Sheet layout
    if (isSchoolRecord) {
        return (
            <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <PrintButton />
                </div>

                <div className="card school-record-card" style={{ 
                    padding: '0', 
                    border: '2px solid #1a365d',
                    position: 'relative',
                    fontFamily: 'Georgia, serif',
                    fontSize: '11px'
                }}>
                    {/* Main Grid Layout */}
                    <div style={{ display: 'flex' }}>
                        {/* Left Section - Logo, Admission, Attendance Table */}
                        <div style={{ flex: '1', borderRight: '1px solid #1a365d', padding: '12px' }}>
                            {/* School Stamp/Logo */}
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto',
                                    border: '2px solid #1a365d',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    fontSize: '8px',
                                    fontWeight: 'bold',
                                    color: '#1a365d'
                                }}>
                                    <img src="/sprout-logo.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                                </div>
                                <div style={{ marginTop: '5px', fontWeight: 'bold', fontSize: '10px', color: '#1a365d' }}>
                                    SPROUT SCHOOL
                                </div>
                                <div style={{ fontSize: '7px', color: '#666' }}>Meerpet, R.R. Dist.</div>
                            </div>

                            {/* Admission Info */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '9px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #ccc' }}>Admission No.</td>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#c53030' }}>{student.admissionNo}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #ccc' }}>Date of Admission & Promotion</td>
                                        <td style={{ padding: '4px', borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#c53030' }}>
                                            {student.createdAt.toLocaleDateString('en-IN')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Quarterly Attendance Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', border: '1px solid #1a365d' }}>
                                <tbody>
                                    {['June to Aug', 'Sep to Nov', 'Dec to Feb', 'Mar to May'].map((quarter, idx) => (
                                        <React.Fragment key={quarter}>
                                            <tr style={{ borderBottom: '1px solid #ccc' }}>
                                                <td rowSpan={3} style={{ 
                                                    padding: '4px', 
                                                    borderRight: '1px solid #1a365d',
                                                    writingMode: 'vertical-lr',
                                                    transform: 'rotate(180deg)',
                                                    textAlign: 'center',
                                                    width: '20px',
                                                    fontSize: '7px',
                                                    backgroundColor: '#f7fafc'
                                                }}>{quarter}</td>
                                                <td style={{ padding: '3px', borderRight: '1px solid #ccc' }}>Class</td>
                                                <td style={{ padding: '3px', color: '#c53030' }}></td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid #ccc' }}>
                                                <td style={{ padding: '3px', borderRight: '1px solid #ccc' }}>Working Days</td>
                                                <td style={{ padding: '3px', color: '#c53030' }}></td>
                                            </tr>
                                            <tr style={{ borderBottom: idx < 3 ? '1px solid #1a365d' : 'none' }}>
                                                <td style={{ padding: '3px', borderRight: '1px solid #ccc' }}>Days of Present</td>
                                                <td style={{ padding: '3px', color: '#c53030' }}></td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>

                            {/* Bottom fields */}
                            <div style={{ marginTop: '10px', fontSize: '8px' }}>
                                <div style={{ display: 'flex', borderBottom: '1px solid #ccc', padding: '3px 0' }}>
                                    <span style={{ width: '20px' }}>9.</span>
                                    <span>Conduct:</span>
                                    <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#c53030' }}>Good</span>
                                </div>
                                <div style={{ display: 'flex', borderBottom: '1px solid #ccc', padding: '3px 0' }}>
                                    <span style={{ width: '20px' }}>10.</span>
                                    <span>Date of Leaving the School:</span>
                                    <span style={{ marginLeft: '10px', color: '#c53030' }}>___________</span>
                                </div>
                                <div style={{ borderBottom: '1px solid #ccc', padding: '3px 0' }}>
                                    <div style={{ display: 'flex' }}>
                                        <span style={{ width: '20px' }}>11.</span>
                                        <span>Certificate that the pupil has attained the age prescribed and completed the Course:</span>
                                    </div>
                                    <div style={{ marginLeft: '20px', color: '#c53030' }}>___________</div>
                                </div>
                                <div style={{ display: 'flex', padding: '3px 0' }}>
                                    <span style={{ width: '20px' }}>12.</span>
                                    <span>Identification of Marks:</span>
                                    <span style={{ marginLeft: '10px', color: '#c53030' }}>___________</span>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '8px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ borderTop: '1px solid #000', width: '80px', paddingTop: '3px', marginTop: '30px' }}>
                                        Signature of the Student
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '7px', color: '#666' }}>
                                        SPROUT SCHOOL<br />
                                        #14-218/5, Raghavanagar<br />
                                        Meerpet, R.R. Dist.
                                    </div>
                                    <div style={{ borderTop: '1px solid #000', width: '80px', paddingTop: '3px', marginTop: '10px', fontWeight: 'bold' }}>
                                        Head Mistress
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Section - Title and Student Details */}
                        <div style={{ width: '180px', position: 'relative' }}>
                            {/* Vertical Title */}
                            <div style={{
                                position: 'absolute',
                                right: '5px',
                                top: '50%',
                                transform: 'translateY(-50%) rotate(-90deg)',
                                transformOrigin: 'center center',
                                whiteSpace: 'nowrap',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                color: '#c53030',
                                letterSpacing: '2px'
                            }}>
                                SCHOOL RECORD SHEET
                            </div>

                            {/* Student Details */}
                            <div style={{ padding: '12px', paddingRight: '40px', fontSize: '8px' }}>
                                <div style={{ marginBottom: '3px', color: '#c53030', fontSize: '7px' }}>Admission No.</div>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#c53030' }}>{student.admissionNo}</div>

                                {[
                                    { num: 1, label: 'Name of the Student', value: `${student.firstName} ${student.lastName}`, highlight: true },
                                    { num: 2, label: 'Date of Birth', value: student.dob.toLocaleDateString('en-IN'), subLabel: '(in words)', highlight: true },
                                    { num: 3, label: 'Religion', value: student.religion || '___________', highlight: !!student.religion },
                                    { num: 4, label: 'Aadhar Card No.', value: student.aadharNo || '___________', highlight: !!student.aadharNo },
                                    { num: 5, label: 'PEN No.', value: student.penNo || '___________', highlight: !!student.penNo },
                                    { num: 6, label: "Father's Name (in full)", value: student.parentName || '___________', highlight: !!student.parentName },
                                    { num: 7, label: "Mother's Name (in full)", value: student.motherName || '___________', highlight: !!student.motherName },
                                    { num: 8, label: 'Address', value: student.address || '___________', highlight: !!student.address },
                                    { num: 9, label: 'APAAR ID No.', value: student.apaarId || '___________', highlight: !!student.apaarId },
                                ].map((field) => (
                                    <div key={field.num} style={{ 
                                        display: 'flex', 
                                        borderBottom: '1px solid #e2e8f0', 
                                        padding: '2px 0',
                                        fontSize: '7px'
                                    }}>
                                        <span style={{ width: '12px', color: '#1a365d' }}>{field.num}.</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#1a365d' }}>{field.label}</div>
                                            <div style={{ 
                                                color: field.highlight ? '#c53030' : '#666',
                                                fontWeight: field.highlight ? 'bold' : 'normal'
                                            }}>{field.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        @page { 
                            margin: 0.3cm; 
                            size: A5 portrait;
                        }
                        .no-print { display: none !important; }
                        .container { margin: 0 !important; max-width: 100% !important; }
                        .school-record-card { 
                            border: 2px solid #1a365d !important; 
                            box-shadow: none !important;
                            page-break-inside: avoid;
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

    // Regular Certificate (Bonafide / Study Certificate)

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
                        margin: 0; 
                        size: A5 landscape;
                    }
                    html, body {
                        width: 210mm;
                        height: 148mm;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .no-print { display: none !important; }
                    .container { 
                        margin: 0 !important; 
                        max-width: 100% !important;
                        width: 210mm !important;
                        height: 148mm !important;
                        padding: 0 !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                    }
                    .certificate-card { 
                        border: 2px solid black !important; 
                        box-shadow: none !important; 
                        padding: 0.5rem 1rem !important; 
                        page-break-inside: avoid;
                        position: relative;
                        width: calc(210mm - 6mm) !important;
                        height: calc(148mm - 6mm) !important;
                        margin: 3mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .certificate-card img {
                        height: 35px !important;
                        margin-bottom: 0.25rem !important;
                    }
                    .certificate-card h2 {
                        font-size: 0.9rem !important;
                        margin-bottom: 0.4rem !important;
                    }
                    .certificate-card p {
                        font-size: 9px !important;
                        line-height: 1.4 !important;
                        margin-bottom: 0.3rem !important;
                    }
                    .certificate-card > div:first-child {
                        padding-bottom: 0.4rem !important;
                        margin-bottom: 0.4rem !important;
                    }
                    .certificate-card > div:last-child {
                        margin-top: auto !important;
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
