'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

const styles: Record<ToastType, { bg: string; border: string; iconColor: string; textColor: string }> = {
    success: { bg: '#f0fdf4', border: '#22c55e', iconColor: '#16a34a', textColor: '#15803d' },
    error:   { bg: '#fef2f2', border: '#ef4444', iconColor: '#dc2626', textColor: '#b91c1c' },
    info:    { bg: '#eff6ff', border: '#3b82f6', iconColor: '#2563eb', textColor: '#1d4ed8' },
};

export default function Toast({ message, type = 'info', duration = 4500, onClose }: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onClose, duration);
        return () => clearTimeout(t);
    }, [duration, onClose]);

    const s = styles[type];
    const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info;

    return (
        <div
            role="alert"
            style={{
                position: 'fixed',
                top: '1.25rem',
                right: '1.25rem',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                backgroundColor: s.bg,
                border: `1.5px solid ${s.border}`,
                borderRadius: '0.75rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                maxWidth: '420px',
                minWidth: '280px',
                animation: 'toastSlideIn 0.25s ease',
            }}
        >
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
            <Icon size={20} style={{ color: s.iconColor, flexShrink: 0, marginTop: '0.1rem' }} />
            <span style={{ flex: 1, fontSize: '0.9rem', color: s.textColor, lineHeight: '1.5' }}>{message}</span>
            <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.iconColor, padding: '0', flexShrink: 0 }}
                aria-label="Close"
            >
                <X size={16} />
            </button>
        </div>
    );
}
