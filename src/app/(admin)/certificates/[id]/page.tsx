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

    // School Record Sheet layout - A4 with two copies (School Copy + Student Copy)
    if (isSchoolRecord) {
        const RecordCard = ({ copyType }: { copyType: string }) => (
            <div style={{ 
                width: '50%',
                padding: '8px',
                borderRight: copyType === 'SCHOOL COPY' ? '1px dashed #999' : 'none',
                boxSizing: 'border-box',
                fontSize: '9px',
                fontFamily: 'Georgia, serif'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '2px solid #1a365d', paddingBottom: '6px' }}>
                    <img src="/sprout-logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#1a365d', marginTop: '2px' }}>SPROUT SCHOOL</div>
                    <div style={{ fontSize: '7px', color: '#666' }}>Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad</div>
                    <div style={{ fontSize: '7px', color: '#666' }}>Ph: +91 7032252030 | Email: info@sproutschool.edu.in</div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#c53030', letterSpacing: '1px' }}>SCHOOL RECORD SHEET</div>
                    <div style={{ fontSize: '8px', color: '#666', fontStyle: 'italic' }}>({copyType})</div>
                </div>

                {/* Student Details Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid #1a365d' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', width: '40%', backgroundColor: '#f7fafc' }}>Admission No.</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#c53030' }}>{student.admissionNo}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Name of the Student</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#c53030' }}>{student.firstName} {student.lastName}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Date of Birth</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#c53030' }}>{student.dob.toLocaleDateString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Father's Name</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#c53030' }}>{student.parentName || '___________'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Mother's Name</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#c53030' }}>{student.motherName || '___________'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Religion</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', color: '#c53030' }}>{student.religion || '___________'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Aadhar No.</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', color: '#c53030' }}>{student.aadharNo || '___________'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>PEN No.</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', color: '#c53030' }}>{student.penNo || '___________'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>APAAR ID</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', color: '#c53030' }}>{student.apaarId || '___________'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Address</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', color: '#c53030', fontSize: '8px' }}>{student.address || '___________'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Date of Admission</td>
                            <td style={{ padding: '3px 5px', fontWeight: 'bold', color: '#c53030' }}>{student.createdAt.toLocaleDateString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Attendance Table */}
                <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '3px', color: '#1a365d' }}>Quarterly Attendance Record:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid #1a365d', fontSize: '7px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f7fafc' }}>
                            <th style={{ padding: '2px', borderRight: '1px solid #ccc', borderBottom: '1px solid #1a365d' }}>Quarter</th>
                            <th style={{ padding: '2px', borderRight: '1px solid #ccc', borderBottom: '1px solid #1a365d' }}>Class</th>
                            <th style={{ padding: '2px', borderRight: '1px solid #ccc', borderBottom: '1px solid #1a365d' }}>Working Days</th>
                            <th style={{ padding: '2px', borderBottom: '1px solid #1a365d' }}>Days Present</th>
                        </tr>
                    </thead>
                    <tbody>
                        {['June-Aug', 'Sep-Nov', 'Dec-Feb', 'Mar-May'].map((quarter, idx) => (
                            <tr key={quarter} style={{ borderBottom: idx < 3 ? '1px solid #ccc' : 'none' }}>
                                <td style={{ padding: '2px 4px', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>{quarter}</td>
                                <td style={{ padding: '2px 4px', borderRight: '1px solid #ccc', color: '#c53030' }}></td>
                                <td style={{ padding: '2px 4px', borderRight: '1px solid #ccc', color: '#c53030' }}></td>
                                <td style={{ padding: '2px 4px', color: '#c53030' }}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Additional Fields */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid #1a365d', fontSize: '8px' }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', width: '50%', backgroundColor: '#f7fafc' }}>Conduct</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', fontWeight: 'bold', color: '#c53030' }}>Good</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Date of Leaving</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', color: '#c53030' }}>___________</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Course Completed</td>
                            <td style={{ padding: '3px 5px', borderBottom: '1px solid #ccc', color: '#c53030' }}>___________</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '3px 5px', borderRight: '1px solid #ccc', backgroundColor: '#f7fafc' }}>Identification Marks</td>
                            <td style={{ padding: '3px 5px', color: '#c53030' }}>___________</td>
                        </tr>
                    </tbody>
                </table>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '7px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #000', width: '70px', paddingTop: '2px', marginTop: '20px' }}>
                            Student's Sign
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '1px solid #000', width: '70px', paddingTop: '2px', marginTop: '20px', fontWeight: 'bold' }}>
                            Head Mistress
                        </div>
                    </div>
                </div>
            </div>
        );

        return (
            <div className="container" style={{ maxWidth: '900px', margin: '2rem auto' }}>
                <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <PrintButton />
                </div>

                <div className="card school-record-card" style={{ 
                    padding: '0', 
                    border: '2px solid #1a365d',
                    display: 'flex',
                    flexDirection: 'row'
                }}>
                    <RecordCard copyType="SCHOOL COPY" />
                    <RecordCard copyType="STUDENT COPY" />
                </div>

                <style>{`
                    @media print {
                        @page { 
                            margin: 5mm; 
                            size: A4 landscape;
                        }
                        .no-print { display: none !important; }
                        .container { margin: 0 !important; max-width: 100% !important; width: 100% !important; }
                        .school-record-card { 
                            border: 1px solid #1a365d !important; 
                            box-shadow: none !important;
                            page-break-inside: avoid;
                            width: 100% !important;
                            height: calc(210mm - 10mm) !important;
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
                <div className="cert-header" style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '2px solid var(--text-main)', paddingBottom: '0.5rem' }}>
                    <img src="/sprout-logo.png" alt="Sprout School Logo" style={{ height: '60px', marginBottom: '0.25rem' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Ph: +91 7032252030, +91 9704717264 | Email: info@sproutschool.edu.in
                    </p>
                </div>

                {/* Certificate Type Title */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.75rem' }}>
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
                <div className="cert-body" style={{ lineHeight: '1.8', fontSize: '1rem', textAlign: 'justify', marginBottom: '2rem', flex: 1 }}>
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
                <div className="cert-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'black', fontWeight: 'bold' }}>
                            Academic Year: {certificate.academicYear.name}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '150px', borderTop: '1px solid var(--text-main)', paddingTop: '0.5rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                {certificate.issuedBy || 'Principal'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Sprout School
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { 
                        margin: 0; 
                        size: A5 portrait;
                    }
                    html, body {
                        width: 148mm;
                        height: 210mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }
                    .no-print { display: none !important; }
                    .container { 
                        margin: 0 !important; 
                        max-width: 148mm !important;
                        width: 148mm !important;
                        height: 210mm !important;
                        padding: 8mm !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                    }
                    .certificate-card { 
                        border: 2px solid black !important; 
                        box-shadow: none !important; 
                        padding: 8mm 10mm !important; 
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        position: relative;
                        width: 100% !important;
                        height: 100% !important;
                        max-height: calc(210mm - 16mm) !important;
                        margin: 0 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                    }
                    .certificate-card img {
                        height: 35px !important;
                        margin-bottom: 0.15rem !important;
                    }
                    .certificate-card h2 {
                        font-size: 1rem !important;
                        margin-bottom: 0.4rem !important;
                        padding-bottom: 0.25rem !important;
                    }
                    .certificate-card > div:first-child {
                        padding-bottom: 0.25rem !important;
                        margin-bottom: 0.25rem !important;
                    }
                    .cert-header {
                        margin-bottom: 0.4rem !important;
                        padding-bottom: 0.25rem !important;
                    }
                    .cert-header p {
                        font-size: 9px !important;
                        margin: 0 !important;
                        line-height: 1.3 !important;
                    }
                    .cert-body {
                        font-size: 11px !important;
                        line-height: 1.7 !important;
                        flex: 1 !important;
                        margin-bottom: 0.5rem !important;
                    }
                    .cert-body p {
                        font-size: 11px !important;
                        line-height: 1.7 !important;
                        margin-bottom: 0.5rem !important;
                    }
                    .cert-footer {
                        margin-top: auto !important;
                        padding-top: 0.5rem !important;
                    }
                    .cert-footer > div {
                        font-size: 10px !important;
                    }
                    .certificate-card > div:last-child {
                        margin-top: auto !important;
                        padding-top: 0.5rem !important;
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
