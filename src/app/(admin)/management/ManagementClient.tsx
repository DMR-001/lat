'use client';

import { useState } from 'react';
import { addAdmin, deleteAdmin } from '@/app/actions/management';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

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

export default function ManagementClient({ admins, branches }: { admins: Admin[]; branches: Branch[] }) {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
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
        if (!confirm(`Are you sure you want to delete admin "${username}"?`)) {
            return;
        }

        const result = await deleteAdmin(id);
        if (result.success) {
            router.refresh();
        } else {
            setError(result.error || 'Failed to delete admin');
        }
    };

    return (
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
    );
}
