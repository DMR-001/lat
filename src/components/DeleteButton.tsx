'use client';

import { deleteStudent } from '@/app/actions/student';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ id }: { id: string }) {
    const router = useRouter();
    
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            try {
                const result = await deleteStudent(id);
                if (result?.success) {
                    router.push('/students');
                    router.refresh();
                }
            } catch (error: any) {
                alert(error?.message || 'Failed to delete student');
            }
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="btn btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--error)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
        >
            <Trash2 size={18} />
            Delete
        </button>
    );
}
