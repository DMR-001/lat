'use client';

import { useState, useEffect } from 'react';
import { getStudentsByClass } from '@/app/actions/student_export';
import { getClasses } from '@/app/actions/class';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ExportStudentsPage() {
    const [classes, setClasses] = useState<{ id: string; name: string; section?: string | null }[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        getClasses().then(cls => {
            setClasses(cls);
            if (cls.length > 0) {
                setSelectedClass(cls[0].id);
            }
        });
    }, []);

    const handleExport = async () => {
        if (!selectedClass) return;
        setIsExporting(true);
        try {
            const data = await getStudentsByClass(selectedClass);

            if (data.length === 0) {
                alert('No students found for this class.');
                return;
            }

            // Convert to CSV
            const headers = ['Admission No', 'First Name', 'Last Name', 'Gender', 'DOB', 'Class', 'Section', 'Parent Name', 'Phone', 'Email', 'Address'];
            const csvContent = [
                headers.join(','),
                ...data.map(row => [
                    row.admissionNo,
                    `"${row.firstName}"`,
                    `"${row.lastName}"`,
                    row.gender,
                    row.dob,
                    row.className,
                    row.section || '',
                    `"${row.parentName}"`,
                    row.phone,
                    row.email,
                    `"${row.address}"`
                ].join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_class_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export students.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/students" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Export Students</h1>
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Class</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)'
                        }}
                    >
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} {cls.section ? `(${cls.section})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting || !selectedClass}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <Download size={20} />
                    {isExporting ? 'Generating CSV...' : 'Export CSV'}
                </button>
            </div>
        </div>
    );
}
