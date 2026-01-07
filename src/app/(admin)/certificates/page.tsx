import prisma from '@/lib/prisma';
import Link from 'next/link';
import { FileText, Plus, Printer } from 'lucide-react';

export default async function CertificatesPage() {
    const certificates = await prisma.certificate.findMany({
        include: {
            student: {
                include: {
                    class: true
                }
            },
            academicYear: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const getCertificateTypeLabel = (type: string) => {
        switch (type) {
            case 'BONAFIDE': return 'Bonafide Certificate';
            case 'STUDY_CERTIFICATE': return 'Study Certificate';
            case 'TRANSFER_CERTIFICATE': return 'Transfer Certificate';
            default: return type;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Certificates</h1>
                <Link href="/certificates/generate" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    Generate Certificate
                </Link>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Certificate No</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Type</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Student</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Class</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Issue Date</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Academic Year</th>
                            <th style={{ padding: '1rem', fontWeight: '500' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No certificates generated yet.
                                </td>
                            </tr>
                        ) : (
                            certificates.map((cert) => (
                                <tr key={cert.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                        {cert.certificateNo}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: 'var(--primary-light)',
                                            color: 'var(--primary)',
                                            borderRadius: '9999px',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}>
                                            {getCertificateTypeLabel(cert.type)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '500' }}>
                                            {cert.student.firstName} {cert.student.lastName}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {cert.student.admissionNo}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {cert.student.class?.name}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {cert.issueDate.toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {cert.academicYear.name}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <Link
                                            href={`/certificates/${cert.id}`}
                                            target="_blank"
                                            className="btn btn-secondary"
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', gap: '0.25rem' }}
                                        >
                                            <Printer size={16} />
                                            View/Print
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
