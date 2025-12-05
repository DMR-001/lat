import prisma from '@/lib/prisma';
import { Printer } from 'lucide-react';
import PrintButton from '@/components/PrintButton';

export default async function ReceiptViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            fee: {
                include: {
                    student: {
                        include: {
                            class: true
                        }
                    }
                }
            }
        }
    });

    if (!payment) return <div>Receipt not found</div>;

    const student = payment.fee.student;

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
            <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <PrintButton />
            </div>

            <div className="card" id="receipt" style={{ padding: '1.5rem', border: '2px solid var(--text-main)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <img src="/logo.png" alt="Sprout School Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1.2', color: 'black' }}>SPROUT SCHOOL</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad</p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span>Ph: +91 7032252030</span>
                            <span>Email: sproutmeerpet@gmail.com</span>
                        </div>
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
                            <span style={{ fontWeight: 'bold' }}>Grade {payment.fee.student.class?.grade || 'N/A'}</span>
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
                    @page { margin: 0.5cm; size: A4; }
                    .no-print { display: none !important; }
                    .container { margin: 0 !important; max-width: 100% !important; }
                    .card { 
                        border: 1px solid #000 !important; 
                        box-shadow: none !important; 
                        padding: 1rem !important; 
                        page-break-inside: avoid;
                        height: auto;
                    }
                    body { background-color: white !important; font-size: 12px; }
                }
            `}</style>
        </div>
    );
}
