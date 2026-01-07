'use client';

import { useState, useEffect } from 'react';
import { getTeacherAttendance, bulkMarkTeacherAttendance } from '@/app/actions/teacher-attendance';
import Link from 'next/link';
import { ArrowLeft, Calendar, Save, CheckCircle } from 'lucide-react';

export default function TeacherAttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadAttendance();
    }, [date]);

    const loadAttendance = async () => {
        setLoading(true);
        const result = await getTeacherAttendance(new Date(date));
        if (result.success) {
            setAttendanceData(result.data || []);
        }
        setLoading(false);
    };

    const handleStatusChange = (teacherId: string, status: string) => {
        setAttendanceData(prev =>
            prev.map(item =>
                item.teacher.id === teacherId ? { ...item, status } : item
            )
        );
    };

    const handleRemarksChange = (teacherId: string, remarks: string) => {
        setAttendanceData(prev =>
            prev.map(item =>
                item.teacher.id === teacherId ? { ...item, remarks } : item
            )
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess('');

        const records = attendanceData
            .filter(item => item.status) // Only save marked records
            .map(item => ({
                teacherId: item.teacher.id,
                status: item.status,
                remarks: item.remarks
            }));

        const result = await bulkMarkTeacherAttendance(new Date(date), records);

        if (result.success) {
            setSuccess('Attendance saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        }

        setSaving(false);
    };

    const markAll = (status: string) => {
        setAttendanceData(prev => prev.map(item => ({ ...item, status })));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Teacher Attendance</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Mark daily attendance for salary calculation</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                    />
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                </div>
            </div>

            {success && (
                <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={20} />
                    {success}
                </div>
            )}

            <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Quick Mark All:</span>
                    <button onClick={() => markAll('PRESENT')} className="btn btn-sm" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: 'none' }}>All Present</button>
                    <button onClick={() => markAll('ABSENT')} className="btn btn-sm" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none' }}>All Absent</button>
                    <button onClick={() => markAll('HOLIDAY')} className="btn btn-sm" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none' }}>Holiday</button>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading teachers...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Teacher</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem' }}>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.map((item) => (
                                    <tr key={item.teacher.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>
                                            {item.teacher.firstName} {item.teacher.lastName}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {['PRESENT', 'ABSENT', 'HALF_DAY', 'UNPAID_LEAVE', 'PAID_LEAVE', 'HOLIDAY'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(item.teacher.id, status)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '9999px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            backgroundColor: item.status === status
                                                                ? getColorForStatus(status)
                                                                : '#f3f4f6',
                                                            color: item.status === status ? 'white' : '#4b5563',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {formatStatus(status)}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <input
                                                type="text"
                                                value={item.remarks || ''}
                                                onChange={(e) => handleRemarksChange(item.teacher.id, e.target.value)}
                                                placeholder="Optional remarks"
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '0.375rem',
                                                    border: '1px solid var(--border)',
                                                    width: '100%'
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function getColorForStatus(status: string) {
    switch (status) {
        case 'PRESENT': return '#22c55e';
        case 'ABSENT': return '#ef4444'; // Red for Absent (Deduction)
        case 'UNPAID_LEAVE': return '#dc2626'; // Dark Red (Deduction)
        case 'HALF_DAY': return '#f59e0b';
        case 'PAID_LEAVE': return '#3b82f6';
        case 'HOLIDAY': return '#6366f1';
        default: return '#9ca3af';
    }
}

function formatStatus(status: string) {
    return status.replace('_', ' ');
}
