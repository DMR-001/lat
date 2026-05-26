'use client';

import { useState } from 'react';
import { addAdmin, deleteAdmin, setTeacherPortalPassword, removeTeacherPortalPassword } from '@/app/actions/management';
import { useRouter } from 'next/navigation';
import { Trash2, Key, UserX, ChevronDown, ChevronRight } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

type Admin = {
    id: string;
    username: string;
    createdAt: string;
    defaultBranch: { name: string } | null;
};

type Branch = {
    id: string;
    name: string;
};

type Teacher = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string | null;
    hasPortalAccess: boolean;
    branchName: string | null;
};

export default function ManagementClient({ admins, branches, teachers }: { admins: Admin[]; branches: Branch[]; teachers: Teacher[] }) {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; username: string } | null>(null);
    const [teacherPasswords, setTeacherPasswords] = useState<Record<string, string>>({});
    const [teacherLoading, setTeacherLoading] = useState<string | null>(null);
    const [teacherMsg, setTeacherMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
    const [showTeacherSection, setShowTeacherSection] = useState(true);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await addAdmin(formData);

        if (result.success) {
            setSuccess('Admin created successfully!');
            (e.target as HTMLFormElement).reset();
            router.refresh();
        } else {
            setError(result.error || 'Failed to create admin');
        }

        setLoading(false);
    };

    const handleDelete = async (id: string, username: string) => {
        setConfirmDelete({ id, username });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        const result = await deleteAdmin(confirmDelete.id);
        setConfirmDelete(null);
        if (result.success) {
            router.refresh();
        } else {
            setError(result.error || 'Failed to delete admin');
        }
    };

    const handleSetTeacherPassword = async (teacherId: string) => {
        const pwd = teacherPasswords[teacherId] || '';
        setTeacherLoading(teacherId);
        setTeacherMsg(null);
        const result = await setTeacherPortalPassword(teacherId, pwd);
        setTeacherLoading(null);
        setTeacherMsg({ id: teacherId, msg: result.success ? 'Access granted' : (result.error || 'Failed'), ok: result.success });
        if (result.success) {
            setTeacherPasswords(p => ({ ...p, [teacherId]: '' }));
            router.refresh();
        }
    };

    const handleRevokeTeacherAccess = async (teacherId: string) => {
        setTeacherLoading(teacherId);
        setTeacherMsg(null);
        const result = await removeTeacherPortalPassword(teacherId);
        setTeacherLoading(null);
        setTeacherMsg({ id: teacherId, msg: result.success ? 'Access revoked' : (result.error || 'Failed'), ok: result.success });
        if (result.success) router.refresh();
    };

    return (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Management Portal</h1>

            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Add New Admin</h2>
                
                {error && (
                    <div style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#fee2e2', 
                        color: '#dc2626', 
                        borderRadius: '0.25rem', 
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}
                
                {success && (
                    <div style={{ 
                        padding: '0.75rem', 
                        backgroundColor: '#dcfce7', 
                        color: '#16a34a', 
                        borderRadius: '0.25rem', 
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Default Branch</label>
                        <select
                            name="defaultBranchId"
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)' }}
                        >
                            <option value="">All Branches (No Default)</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add Admin'}
                    </button>
                </form>
            </div>

            {/* Teacher Portal Access */}
            <div className="card">
                <button
                    onClick={() => setShowTeacherSection(s => !s)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showTeacherSection ? '1rem' : 0 }}
                >
                    {showTeacherSection ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Teacher Payroll Portal Access</h2>
                </button>
                {showTeacherSection && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '0.5rem' }}>Teacher</th>
                                <th style={{ padding: '0.5rem' }}>Login (Email / ID)</th>
                                <th style={{ padding: '0.5rem' }}>Branch</th>
                                <th style={{ padding: '0.5rem' }}>Status</th>
                                <th style={{ padding: '0.5rem', minWidth: '260px' }}>Set Password</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{t.firstName} {t.lastName}</td>
                                    <td style={{ padding: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                        {t.employeeId ? <span>{t.employeeId} / </span> : null}{t.email}
                                    </td>
                                    <td style={{ padding: '0.5rem', fontSize: '0.8125rem' }}>{t.branchName || '—'}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: t.hasPortalAccess ? '#dcfce7' : '#f3f4f6', color: t.hasPortalAccess ? '#16a34a' : '#6b7280' }}>
                                            {t.hasPortalAccess ? 'Active' : 'No Access'}
                                        </span>
                                        {teacherMsg?.id === t.id && (
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: teacherMsg.ok ? '#16a34a' : '#dc2626' }}>
                                                {teacherMsg.msg}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="password"
                                                placeholder="New password"
                                                value={teacherPasswords[t.id] || ''}
                                                onChange={e => setTeacherPasswords(p => ({ ...p, [t.id]: e.target.value }))}
                                                style={{ flex: 1, padding: '0.375rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                                            />
                                            <button
                                                onClick={() => handleSetTeacherPassword(t.id)}
                                                disabled={teacherLoading === t.id || !(teacherPasswords[t.id]?.length >= 6)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', opacity: teacherLoading === t.id ? 0.7 : 1 }}
                                            >
                                                <Key size={13} />
                                                {t.hasPortalAccess ? 'Update' : 'Grant'}
                                            </button>
                                            {t.hasPortalAccess && (
                                                <button
                                                    onClick={() => handleRevokeTeacherAccess(t.id)}
                                                    disabled={teacherLoading === t.id}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                                >
                                                    <UserX size={13} />
                                                    Revoke
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {teachers.length === 0 && (
                                <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No teachers found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Existing Admins</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.5rem' }}>Username</th>
                            <th style={{ padding: '0.5rem' }}>Default Branch</th>
                            <th style={{ padding: '0.5rem' }}>Created At</th>
                            <th style={{ padding: '0.5rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map((admin) => (
                            <tr key={admin.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem' }}>{admin.username}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    {admin.defaultBranch?.name || (
                                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>All Branches</span>
                                    )}
                                </td>
                                <td style={{ padding: '0.5rem' }}>{new Date(admin.createdAt).toLocaleDateString()}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    <button
                                        onClick={() => handleDelete(admin.id, admin.username)}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: '#fee2e2',
                                            color: '#dc2626',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {admins.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No admins found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {confirmDelete && (
            <ConfirmDialog
                title="Delete Admin"
                message={`Are you sure you want to delete admin "${confirmDelete.username}"? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        )}
        </>
    );
}
