'use client';

import { useState } from 'react';
import { markAttendance } from '@/app/actions/attendance';

type Student = {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
};

type ClassWithStudents = {
    id: string;
    name: string;
    students: Student[];
};

export default function AttendanceClient({ classes }: { classes: ClassWithStudents[] }) {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredStudents = classes
        .filter(c => selectedClassId ? c.id === selectedClassId : true)
        .flatMap(c => c.students)
        .filter(s => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                s.admissionNo.toLowerCase().includes(query) ||
                s.firstName.toLowerCase().includes(query) ||
                s.lastName.toLowerCase().includes(query)
            );
        });

    return (
        <div className="card">
            <form action={markAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Date</label>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Filter by Class</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Search by Admission No or Name</label>
                    <input
                        type="text"
                        placeholder="Enter Admission No (e.g. SPR1) or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                    />
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                            <tr>
                                <th style={{ padding: '1rem', width: '50px' }}>
                                    <input type="checkbox" />
                                </th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Admission No</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Student Name</th>
                                <th style={{ padding: '1rem', fontWeight: '500' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No students found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} style={{ borderTop: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <input type="checkbox" name="studentId" value={student.id} />
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.admissionNo}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{student.lastName}, {student.firstName}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--success)', color: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', opacity: 0.2 }}>Present</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary">Save Attendance</button>
                </div>
            </form>
        </div>
    );
}
