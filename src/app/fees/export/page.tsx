'use client';

import { useState, useEffect } from 'react';
import { getAllFeesByClass } from '@/app/actions/export';
import { getClasses } from '@/app/actions/class';
import { Download } from 'lucide-react';

export default function ExportFeesPage() {
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
            const data = await getAllFeesByClass(selectedClass);

            if (data.length === 0) {
                alert('No fees found for this class.');
                return;
            }

            // Convert to CSV
            const headers = ['Admission No', 'Student Name', 'Fee Type', 'Amount', 'Paid', 'Due', 'Due Date'];
            const csvContent = [
                headers.join(','),
                ...data.map(row => [
                    row.admissionNo,
                    `"${row.studentName}"`,
                    row.feeType,
                    row.amount,
                    row.paid,
                    row.due,
                    row.dueDate
                ].join(','))
            ].join('\n');

            // Download
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `class_fees_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export fees.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '2rem' }}>Export Class Fees</h1>

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
