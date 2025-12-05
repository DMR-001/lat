'use client';

import { useState, useEffect } from 'react';
import { getPendingFeesByClass } from '@/app/actions/export';
import { getClasses } from '@/app/actions/class';
import { Download } from 'lucide-react';

export default function ExportFeesPage() {
    const [grades, setGrades] = useState<{ id: string; name: string; grade: string }[]>([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        getClasses().then(classes => {
            setGrades(classes);
            if (classes.length > 0) {
                setSelectedGrade(classes[0].grade);
            }
        });
    }, []);

    const handleExport = async () => {
        if (!selectedGrade) return;
        setIsExporting(true);
        try {
            const data = await getPendingFeesByClass(selectedGrade);

            if (data.length === 0) {
                alert('No pending fees found for this class.');
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
            a.download = `pending_fees_${selectedGrade.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`;
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '2rem' }}>Export Pending Fees</h1>

            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Class</label>
                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)'
                        }}
                    >
                        {grades.map((cls) => (
                            <option key={cls.id} value={cls.grade}>
                                {cls.name} (Grade {cls.grade})
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting || !selectedGrade}
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
