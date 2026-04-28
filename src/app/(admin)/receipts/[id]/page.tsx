import prisma from '@/lib/prisma';
import PrintButton from '@/components/PrintButton';

export default async function ReceiptViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [payment, schoolSettings] = await Promise.all([
        prisma.payment.findUnique({
            where: { id },
            include: {
                fee: {
                    include: {
                        student: {
                            include: {
                                class: true,
                                branch: true,
                            }
                        }
                    }
                },
                branch: true,
            }
        }),
        prisma.schoolSettings.findFirst(),
    ]);

    if (!payment) return <div>Receipt not found</div>;

    const student = payment.fee.student;
    const branch = student.branch || payment.branch;

    const schoolName = (schoolSettings?.schoolName && schoolSettings.schoolName.trim()) || 'Sprout School';
    const address = (branch?.address && branch.address.trim()) || (schoolSettings?.address && schoolSettings.address.trim()) || '';
    const phone = (branch?.phone && branch.phone.trim()) || (schoolSettings?.phone && schoolSettings.phone.trim()) || '';
    const email = (branch?.email && branch.email.trim()) || (schoolSettings?.email && schoolSettings.email.trim()) || '';

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
            <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <PrintButton />
            </div>

            <div className="card" id="receipt" style={{ padding: '1.5rem', border: '2px solid var(--text-main)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <img src="/sprout-logo.png" alt="Sprout School Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.2', color: 'black' }}>{schoolName}</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>Fee Receipt{branch?.name ? ` — ${branch.name}` : ''}</p>
                        {address && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>{address}</p>}
                        {(phone || email) && (
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {phone && <span>Ph: {phone}</span>}
                                {email && <span>Email: {email}</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Receipt Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Receipt No: </span>
                        <span style={{ fontWeight: 'bold' }}>{payment.receiptNo}</span>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Date: </span>
                        <span style={{ fontWeight: 'bold' }}>{payment.date.toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Student Info */}
                <div style={{ marginBottom: '0.5rem', backgroundColor: 'var(--background)', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                    <div className="grid grid-cols-2" style={{ gap: '0.5rem' }}>
                        <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Name: </span>
                            <span style={{ fontWeight: 'bold' }}>{student.firstName} {student.lastName}</span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Adm No: </span>
                            <span style={{ fontWeight: 'bold' }}>{student.admissionNo}</span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Class: </span>
                            <span style={{ fontWeight: 'bold' }}>{payment.fee.student.class?.name} {payment.fee.student.class?.section ? `(${payment.fee.student.class.section})` : ''}</span>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-secondary)' }}>Parent: </span>
                            <span style={{ fontWeight: 'bold' }}>{student.parentName || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--text-main)' }}>
                            <th style={{ textAlign: 'left', padding: '0.25rem 0' }}>Description</th>
                            <th style={{ textAlign: 'right', padding: '0.25rem 0' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '0.25rem 0', borderBottom: '1px solid var(--border)' }}>
                                {payment.fee.type} Fee
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                    ({payment.method})
                                </span>
                            </td>
                            <td style={{ textAlign: 'right', padding: '0.25rem 0', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
                                ₹{payment.amount.toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style={{ paddingTop: '0.5rem', fontWeight: 'bold', textAlign: 'right' }}>Total:</td>
                            <td style={{ paddingTop: '0.5rem', fontWeight: 'bold', textAlign: 'right', fontSize: '1rem' }}>
                                ₹{payment.amount.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* Footer */}
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '100px', borderTop: '1px solid var(--text-main)', paddingTop: '0.25rem' }}>
                            Sign
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        Computer generated receipt.
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { 
                        margin: 0; 
                        size: A5 landscape; /* 210mm x 148mm */
                    }
                    html, body {
                        width: 210mm;
                        height: 148mm;
                        margin: 0;
                        padding: 0;
                    }
                    .no-print { display: none !important; }
                    .container { 
                        margin: 0 !important; 
                        max-width: 100% !important; 
                        width: 210mm !important;
                        height: 148mm !important;
                        padding: 0 !important;
                    }
                    .card { 
                        border: 2px solid black !important; 
                        box-shadow: none !important; 
                        padding: 1.5rem !important; 
                        page-break-inside: avoid;
                        width: calc(210mm - 10mm) !important;
                        height: calc(148mm - 10mm) !important;
                        margin: 5mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .card img {
                        height: 50px !important;
                    }
                    .card h1 {
                        font-size: 1.25rem !important;
                    }
                    .card p, .card span, .card td, .card th {
                        font-size: 11px !important;
                    }
                    .grid-cols-2 {
                        display: grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        gap: 0.5rem !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body { 
                        background-color: white !important; 
                    }
                    table {
                        font-size: 11px !important;
                        flex: 1 !important;
                    }
                }
            `}</style>
        </div>
    );
}
