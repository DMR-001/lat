'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { getClasses } from '@/app/actions/class';
import ClassManager from './ClassManager';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('school');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [classes, setClasses] = useState<any[]>([]);

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

    const tabs = [
        { id: 'school', label: 'School Profile' },
        { id: 'classes', label: 'Classes' },
        { id: 'branding', label: 'Branding' },
        { id: 'receipt', label: 'Receipt Settings' }
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
                <ClassManager classes={classes} />
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

                    {/* Save Button */}
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
                </div>
            )}
        </div>
    );
}
