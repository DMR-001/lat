'use client';

import { useState } from 'react';
import { deleteStudent } from '@/app/actions/student';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

export default function DeleteButton({ id }: { id: string }) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleConfirm = async () => {
        setShowConfirm(false);
        try {
            const result = await deleteStudent(id);
            if (result?.success) {
                router.push('/students');
                router.refresh();
            }
        } catch (error: any) {
            setErrorMsg(error?.message || 'Failed to delete student');
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--error)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
                <Trash2 size={18} />
                Delete
            </button>

            {showConfirm && (
                <ConfirmDialog
                    title="Delete Student"
                    message="Are you sure you want to delete this student? This action cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            {errorMsg && (
                <Toast message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
            )}
        </>
    );
}

