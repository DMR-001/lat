'use client';

import { deleteStudent } from '@/app/actions/student';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({ id }: { id: string }) {
    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            await deleteStudent(id);
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
