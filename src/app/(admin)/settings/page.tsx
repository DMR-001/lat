'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { getClasses } from '@/app/actions/class';
import { getBranches, createBranch, updateBranch, deleteBranch } from '@/app/actions/branch';
import { createBackup, getBackups, downloadBackup, deleteBackup, restoreBackup } from '@/app/actions/backup';
import ClassManager from './ClassManager';
import { Plus, Trash2, Download, Upload, Database, Building2, RefreshCw } from 'lucide-react';
import { refreshHeader } from '@/lib/events';

type Branch = { id: string; name: string; code: string; address?: string | null; phone?: string | null; email?: string | null; isActive: boolean };
type Backup = { id: string; filename: string; size: number; createdBy?: string | null; createdAt: Date };

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('school');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [backups, setBackups] = useState<Backup[]>([]);
    const [backupLoading, setBackupLoading] = useState(false);

    // Branch form
    const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '', phone: '', email: '' });
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    const [formData, setFormData] = useState({
        schoolName: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        principalName: '',
        receiptHeader: '',
        receiptFooter: '',
        receiptTerms: ''
    });

    useEffect(() => {
        loadSettings();
        loadClasses();
        loadBranches();
        loadBackups();
    }, []);

    const loadSettings = async () => {
        const result = await getSettings();
        if (result.success && result.settings) {
            setFormData({
                schoolName: result.settings.schoolName || '',
                address: result.settings.address || '',
                phone: result.settings.phone || '',
                email: result.settings.email || '',
                website: result.settings.website || '',
                principalName: result.settings.principalName || '',
                receiptHeader: result.settings.receiptHeader || '',
                receiptFooter: result.settings.receiptFooter || '',
                receiptTerms: result.settings.receiptTerms || ''
            });
        }
    };

    const loadClasses = async () => {
        const result = await getClasses();
        if (result) setClasses(result);
    };

    const loadBranches = async () => {
        const result = await getBranches();
        if (result.success) setBranches(result.branches || []);
    };

    const loadBackups = async () => {
        const result = await getBackups();
        if (result.success) setBackups(result.backups || []);
    };

    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        const result = await updateSettings(formData);

        if (result.success) {
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to save settings');
        }

        setLoading(false);
    };

    // Branch handlers
    const handleAddBranch = async () => {
        if (!newBranch.name || !newBranch.code) {
            setError('Branch name and code are required');
            return;
        }
        setLoading(true);
        const result = await createBranch(newBranch);
        if (result.success) {
            setNewBranch({ name: '', code: '', address: '', phone: '', email: '' });
            loadBranches();
            refreshHeader();
            setSuccess('Branch added successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to add branch');
        }
        setLoading(false);
    };

    const handleDeleteBranch = async (id: string) => {
        if (!confirm('Are you sure you want to delete this branch? All associated data will remain but need to be reassigned.')) return;
        const result = await deleteBranch(id);
        if (result.success) {
            loadBranches();
            refreshHeader();
            setSuccess('Branch deleted');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to delete branch');
        }
    };

    // Backup handlers
    const handleCreateBackup = async () => {
        setBackupLoading(true);
        setError('');
        const result = await createBackup();
        if (result.success) {
            loadBackups();
            setSuccess(`Backup created: ${result.filename} (${formatSize(result.size || 0)})`);
            setTimeout(() => setSuccess(''), 5000);
        } else {
            setError(result.error || 'Failed to create backup');
        }
        setBackupLoading(false);
    };

    const handleDownloadBackup = async (filename: string) => {
        const result = await downloadBackup(filename);
        if (result.success && result.content) {
            const blob = new Blob([result.content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            setError(result.error || 'Failed to download backup');
        }
    };

    const handleDeleteBackup = async (id: string, filename: string) => {
        if (!confirm('Delete this backup?')) return;
        const result = await deleteBackup(id, filename);
        if (result.success) {
            loadBackups();
            setSuccess('Backup deleted');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(result.error || 'Failed to delete backup');
        }
    };

    const handleRestoreBackup = async (file: File) => {
        if (!confirm('WARNING: This will replace ALL existing data. Are you absolutely sure?')) return;
        if (!confirm('FINAL WARNING: This action cannot be undone. Continue?')) return;

        setBackupLoading(true);
        const content = await file.text();
        const result = await restoreBackup(content);
        if (result.success) {
            setSuccess('Backup restored successfully! Page will reload...');
            setTimeout(() => window.location.reload(), 2000);
        } else {
            setError(result.error || 'Failed to restore backup');
        }
        setBackupLoading(false);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const tabs = [
        { id: 'school', label: 'School Profile' },
        { id: 'branches', label: 'Branches' },
        { id: 'classes', label: 'Classes' },
        { id: 'branding', label: 'Branding' },
        { id: 'receipt', label: 'Receipt Settings' },
        { id: 'backup', label: 'Backup & Restore' }
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>Settings</h1>

            {/* Tabs */}
            <div style={{ borderBottom: '2px solid var(--border)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '1rem 0',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginBottom: '-2px',
                                fontSize: '1rem'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'classes' ? (
                <ClassManager classes={classes} onUpdate={loadClasses} />
            ) : (
                <div className="card" style={{ padding: '2.5rem' }}>
                    {activeTab === 'school' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>School Information</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>
                                        School Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.schoolName}
                                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                        className="input"
                                    />
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>
                                        Address
                                    </label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="input"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label>
                                        Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label>
                                        Website
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="input"
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div>
                                    <label>
                                        Principal Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.principalName}
                                        onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'receipt' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Receipt Customization</h2>

                            <div>
                                <label>
                                    Receipt Header
                                </label>
                                <input
                                    type="text"
                                    value={formData.receiptHeader}
                                    onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                                    className="input"
                                    placeholder="e.g., Thank you for your payment"
                                />
                            </div>

                            <div>
                                <label>
                                    Receipt Footer
                                </label>
                                <input
                                    type="text"
                                    value={formData.receiptFooter}
                                    onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                                    className="input"
                                    placeholder="e.g., This is a computer generated receipt"
                                />
                            </div>

                            <div>
                                <label>
                                    Terms & Conditions
                                </label>
                                <textarea
                                    value={formData.receiptTerms}
                                    onChange={(e) => setFormData({ ...formData, receiptTerms: e.target.value })}
                                    className="input"
                                    rows={4}
                                    placeholder="Enter terms and conditions for receipts..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Branding & Assets</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '-1rem' }}>
                                Upload your school logo, principal signature, and official seal for certificates and documents.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {/* Logo Upload */}
                                <div>
                                    <label>School Logo</label>
                                    <div style={{
                                        border: '2px dashed var(--border)',
                                        borderRadius: '0.5rem',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        backgroundColor: 'var(--background)'
                                    }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setLoading(true);
                                                    setError('');
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            await updateSettings({ logoUrl: data.url });
                                                            await loadSettings();
                                                            setSuccess('Logo uploaded successfully!');
                                                            setTimeout(() => setSuccess(''), 3000);
                                                        } else {
                                                            setError(data.error || 'Upload failed');
                                                        }
                                                    } catch (err: any) {
                                                        setError(err.message || 'Upload failed');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                            id="logo-upload"
                                        />
                                        <label htmlFor="logo-upload" style={{ cursor: 'pointer' }}>
                                            {formData.schoolName && formData.schoolName !== 'Sprout School' ? (
                                                <div>
                                                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏫</div>
                                                    <div style={{ color: 'var(--primary)', fontWeight: '500' }}>Click to upload logo</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        PNG, JPG up to 5MB
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏫</div>
                                                    <div style={{ color: 'var(--primary)', fontWeight: '500' }}>Click to upload logo</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        PNG, JPG up to 5MB
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* Signature Upload */}
                                <div>
                                    <label>Principal Signature</label>
                                    <div style={{
                                        border: '2px dashed var(--border)',
                                        borderRadius: '0.5rem',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        backgroundColor: 'var(--background)'
                                    }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setLoading(true);
                                                    setError('');
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            await updateSettings({ principalSignature: data.url });
                                                            await loadSettings();
                                                            setSuccess('Signature uploaded successfully!');
                                                            setTimeout(() => setSuccess(''), 3000);
                                                        } else {
                                                            setError(data.error || 'Upload failed');
                                                        }
                                                    } catch (err: any) {
                                                        setError(err.message || 'Upload failed');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                            id="signature-upload"
                                        />
                                        <label htmlFor="signature-upload" style={{ cursor: 'pointer' }}>
                                            <div>
                                                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✍️</div>
                                                <div style={{ color: 'var(--primary)', fontWeight: '500' }}>Click to upload signature</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                    PNG with transparent background
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* School Seal Upload */}
                                <div>
                                    <label>School Seal</label>
                                    <div style={{
                                        border: '2px dashed var(--border)',
                                        borderRadius: '0.5rem',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        backgroundColor: 'var(--background)'
                                    }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setLoading(true);
                                                    setError('');
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            await updateSettings({ schoolSeal: data.url });
                                                            await loadSettings();
                                                            setSuccess('School seal uploaded successfully!');
                                                            setTimeout(() => setSuccess(''), 3000);
                                                        } else {
                                                            setError(data.error || 'Upload failed');
                                                        }
                                                    } catch (err: any) {
                                                        setError(err.message || 'Upload failed');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                            id="seal-upload"
                                        />
                                        <label htmlFor="seal-upload" style={{ cursor: 'pointer' }}>
                                            <div>
                                                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔖</div>
                                                <div style={{ color: 'var(--primary)', fontWeight: '500' }}>Click to upload seal</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                    PNG with transparent background
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                backgroundColor: 'var(--primary-light)',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <strong>Note:</strong> Uploaded images will be automatically used in certificates and official documents.
                            </div>
                        </div>
                    )}

                    {activeTab === 'receipt' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Receipt Customization</h2>

                            <div>
                                <label>Receipt Header</label>
                                <input
                                    type="text"
                                    value={formData.receiptHeader}
                                    onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                                    placeholder="e.g., Thank you for your payment"
                                />
                            </div>

                            <div>
                                <label>Receipt Footer</label>
                                <input
                                    type="text"
                                    value={formData.receiptFooter}
                                    onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                                    placeholder="e.g., This is a computer generated receipt"
                                />
                            </div>

                            <div>
                                <label>Terms & Conditions</label>
                                <textarea
                                    value={formData.receiptTerms}
                                    onChange={(e) => setFormData({ ...formData, receiptTerms: e.target.value })}
                                    rows={4}
                                    placeholder="Enter terms and conditions for receipts..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'branches' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Branch Management</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        Manage multiple school branches. Data can be filtered by branch using the header selector.
                                    </p>
                                </div>
                            </div>

                            {/* Add Branch Form */}
                            <div style={{ padding: '1.5rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                                <h3 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={18} />
                                    Add New Branch
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    <div>
                                        <label>Branch Name *</label>
                                        <input
                                            type="text"
                                            value={newBranch.name}
                                            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                            placeholder="e.g., Main Branch"
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label>Branch Code *</label>
                                        <input
                                            type="text"
                                            value={newBranch.code}
                                            onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                                            placeholder="e.g., MAIN"
                                            className="input"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div>
                                        <label>Phone</label>
                                        <input
                                            type="text"
                                            value={newBranch.phone}
                                            onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                                            placeholder="Phone number"
                                            className="input"
                                        />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label>Address</label>
                                        <input
                                            type="text"
                                            value={newBranch.address}
                                            onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                                            placeholder="Branch address"
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={newBranch.email}
                                            onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                                            placeholder="branch@school.com"
                                            className="input"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddBranch}
                                    disabled={loading}
                                    className="btn btn-primary"
                                    style={{ marginTop: '1rem' }}
                                >
                                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                                    Add Branch
                                </button>
                            </div>

                            {/* Branches List */}
                            <div>
                                <h3 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Building2 size={18} />
                                    Existing Branches ({branches.length})
                                </h3>
                                {branches.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                                        No branches yet. Add your first branch above.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {branches.map(branch => (
                                            <div key={branch.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem 1.25rem',
                                                backgroundColor: 'var(--background)',
                                                borderRadius: '0.5rem',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {branch.name}
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            padding: '0.125rem 0.5rem',
                                                            backgroundColor: 'var(--primary-light)',
                                                            color: 'var(--primary)',
                                                            borderRadius: '9999px'
                                                        }}>
                                                            {branch.code}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        {[branch.phone, branch.email, branch.address].filter(Boolean).join(' • ') || 'No contact info'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteBranch(branch.id)}
                                                    className="btn"
                                                    style={{ padding: '0.5rem', color: '#ef4444', backgroundColor: '#fee2e2' }}
                                                    title="Delete branch"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Backup & Restore</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Create and restore database backups. Regular backups protect your data.
                                </p>
                            </div>

                            {/* Create Backup */}
                            <div style={{ padding: '1.5rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem', border: '1px solid #22c55e' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontWeight: '600', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Database size={18} />
                                            Create New Backup
                                        </h3>
                                        <p style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.25rem' }}>
                                            Export all data to a downloadable JSON file
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCreateBackup}
                                        disabled={backupLoading}
                                        className="btn btn-primary"
                                        style={{ backgroundColor: '#15803d' }}
                                    >
                                        {backupLoading ? (
                                            <>
                                                <RefreshCw size={18} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={18} style={{ marginRight: '0.5rem' }} />
                                                Create Backup
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Restore Backup */}
                            <div style={{ padding: '1.5rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #f59e0b' }}>
                                <h3 style={{ fontWeight: '600', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Upload size={18} />
                                    Restore from Backup
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#a16207', marginTop: '0.25rem', marginBottom: '1rem' }}>
                                    ⚠️ Warning: Restoring will replace ALL existing data. This cannot be undone!
                                </p>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleRestoreBackup(file);
                                    }}
                                    style={{ display: 'none' }}
                                    id="restore-file"
                                />
                                <label htmlFor="restore-file" className="btn" style={{ cursor: 'pointer', backgroundColor: '#f59e0b', color: 'white' }}>
                                    <Upload size={18} style={{ marginRight: '0.5rem' }} />
                                    Select Backup File
                                </label>
                            </div>

                            {/* Backup History */}
                            <div>
                                <h3 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Database size={18} />
                                    Backup History ({backups.length})
                                </h3>
                                {backups.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                                        No backups yet. Create your first backup above.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {backups.map(backup => (
                                            <div key={backup.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem 1.25rem',
                                                backgroundColor: 'var(--background)',
                                                borderRadius: '0.5rem',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                        {backup.filename}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        {new Date(backup.createdAt).toLocaleString()} • {formatSize(backup.size)}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleDownloadBackup(backup.filename)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                                                    >
                                                        <Download size={14} style={{ marginRight: '0.25rem' }} />
                                                        Download
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBackup(backup.id, backup.filename)}
                                                        className="btn"
                                                        style={{ padding: '0.5rem', color: '#ef4444', backgroundColor: '#fee2e2' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {error && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #ef4444',
                            borderRadius: '0.5rem',
                            color: '#b91c1c',
                            marginTop: '1.5rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#dcfce7',
                            border: '1px solid #22c55e',
                            borderRadius: '0.5rem',
                            color: '#15803d',
                            marginTop: '1.5rem'
                        }}>
                            {success}
                        </div>
                    )}

                    {/* Save Button - only for school, branding, receipt tabs */}
                    {['school', 'branding', 'receipt'].includes(activeTab) && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 2rem' }}
                            >
                                {loading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
