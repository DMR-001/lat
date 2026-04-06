'use client';

import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    /** Extra warning shown below the message in a red box — for destructive double-confirms */
    warningNote?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    warningNote,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const isDanger = variant === 'danger';
    const iconBg = isDanger ? '#fef2f2' : '#eff6ff';
    const iconColor = isDanger ? '#dc2626' : '#2563eb';
    const confirmBg = isDanger ? '#dc2626' : 'var(--primary)';
    const confirmHover = isDanger ? '#b91c1c' : undefined;
    const Icon = isDanger ? Trash2 : Info;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99998,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            {/* Backdrop */}
            <div
                onClick={onCancel}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(2px)',
                }}
            />

            {/* Dialog */}
            <div
                style={{
                    position: 'relative',
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    padding: '2rem',
                    maxWidth: '420px',
                    width: '100%',
                    animation: 'dialogPop 0.2s ease',
                }}
            >
                <style>{`
                    @keyframes dialogPop {
                        from { opacity: 0; transform: scale(0.94); }
                        to   { opacity: 1; transform: scale(1); }
                    }
                `}</style>

                {/* Icon */}
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                }}>
                    <Icon size={22} style={{ color: iconColor }} />
                </div>

                <h2 id="confirm-title" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                    {title}
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6', marginBottom: warningNote ? '1rem' : '1.75rem' }}>
                    {message}
                </p>

                {warningNote && (
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start',
                        padding: '0.75rem',
                        backgroundColor: '#fff7ed',
                        border: '1px solid #f97316',
                        borderRadius: '0.5rem',
                        marginBottom: '1.75rem',
                        fontSize: '0.825rem',
                        color: '#9a3412',
                    }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.1rem', color: '#ea580c' }} />
                        {warningNote}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '0.5rem',
                            border: '1.5px solid #e2e8f0',
                            background: 'white',
                            color: '#475569',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: confirmBg,
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
