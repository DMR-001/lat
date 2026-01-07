'use client';

import { useActionState, useState } from 'react';
import { importStudents } from '@/app/actions/student';
import Link from 'next/link';
import { ArrowLeft, Upload, FileSpreadsheet } from 'lucide-react';

export default function ImportStudentsPage() {
    const [state, formAction, isPending] = useActionState(importStudents, null);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileName(file ? file.name : '');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/students" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    <ArrowLeft size={20} />
                    Back to Students
                </Link>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Import Students</h1>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', border: '1px solid var(--primary)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                        <FileSpreadsheet size={20} />
                        Instructions
                    </h3>
                    <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                        Upload a CSV file with the following columns (headers are required):
                    </p>
                    <code style={{ display: 'block', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.25rem', fontSize: '0.875rem', fontFamily: 'monospace', border: '1px solid var(--border)' }}>
                        admissionNo,fullName,dob,gender,address,className,parentName,phone,feeAmount,feePaid
                    </code>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                        * <strong>fullName</strong>: Complete name of the student.<br />
                        * <strong>address</strong>: Full residential address.<br />
                        * Date of Birth (dob) should be in YYYY-MM-DD format.<br />
                        * Class Name (className) will be created if it doesn't exist.<br />
                        * <strong>feeAmount</strong>: Total tuition fee for the student.<br />
                        * <strong>feePaid</strong>: Amount already paid (optional).
                    </p>
                </div>

                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ border: '2px dashed var(--border)', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--background)' }}>
                        <Upload size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', margin: '0 auto' }} />
                        <p style={{ marginBottom: '1rem', fontWeight: '500', color: 'var(--text-main)' }}>
                            Select CSV file to upload
                        </p>
                        <input
                            id="file-upload"
                            type="file"
                            name="file"
                            accept=".csv"
                            required
                            onChange={handleFileChange}
                            style={{
                                display: 'block',
                                margin: '0 auto',
                                maxWidth: '300px',
                                padding: '0.5rem',
                                border: '1px solid var(--border)',
                                borderRadius: '0.25rem',
                                cursor: 'pointer'
                            }}
                        />
                        {fileName && (
                            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '500' }}>
                                Selected: {fileName}
                            </p>
                        )}
                    </div>

                    {state?.error && (
                        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#b91c1c' }}>
                            <p style={{ fontWeight: 'bold' }}>Import Failed</p>
                            <p>{state.error}</p>
                        </div>
                    )}

                    {state?.success && (
                        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', border: '1px solid #22c55e', borderRadius: '0.5rem', color: '#15803d' }}>
                            <p style={{ fontWeight: 'bold' }}>Success!</p>
                            <p>{state.message}</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{state.count} students imported successfully.</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isPending}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '150px', justifyContent: 'center' }}
                        >
                            {isPending ? 'Importing...' : 'Start Import'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
