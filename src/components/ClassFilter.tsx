'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function ClassFilter({ classes }: { classes: any[] }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleFilter = (classId: string) => {
        const params = new URLSearchParams(searchParams);
        if (classId) {
            params.set('classId', classId);
        } else {
            params.delete('classId');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <select
            onChange={(e) => handleFilter(e.target.value)}
            defaultValue={searchParams.get('classId')?.toString()}
            style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                outline: 'none',
                cursor: 'pointer'
            }}
        >
            <option value="">All Classes</option>
            {classes.map((c) => (
                <option key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                </option>
            ))}
        </select>
    );
}
