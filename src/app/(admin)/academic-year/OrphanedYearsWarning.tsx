'use client';

import { assignYearToBranch } from '@/app/actions/academic-year';
import { refreshHeader } from '@/lib/events';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

type OrphanedYear = {
    id: string;
    name: string;
};

export default function OrphanedYearsWarning({ 
    orphanedYears, 
    branchId 
}: { 
    orphanedYears: OrphanedYear[];
    branchId: string | null;
}) {
    const router = useRouter();

    const handleAssign = async (yearId: string) => {
        if (!branchId) return;
        
        const result = await assignYearToBranch(yearId, branchId);
        if (result.success) {
            refreshHeader();
            router.refresh();
        }
    };

    if (orphanedYears.length === 0) return null;

    return (
        <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fef3c7', 
            borderRadius: '0.5rem',
            border: '1px solid #f59e0b'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={18} style={{ color: '#b45309' }} />
                <span style={{ fontWeight: '600', color: '#b45309' }}>
                    {orphanedYears.length} academic year(s) not linked to any branch
                </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {orphanedYears.map(year => (
                    <button 
                        key={year.id}
                        onClick={() => handleAssign(year.id)}
                        disabled={!branchId}
                        style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: '#fff',
                            border: '1px solid #d97706',
                            borderRadius: '0.25rem',
                            cursor: branchId ? 'pointer' : 'not-allowed',
                            fontSize: '0.875rem'
                        }}
                    >
                        Assign "{year.name}" to current branch
                    </button>
                ))}
            </div>
        </div>
    );
}
