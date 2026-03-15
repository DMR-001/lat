'use client';

import { useState, useEffect, useCallback } from 'react';
import { LogOut, Building2, Calendar, ChevronDown } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { getSelectedBranchAndYear, setSelectedBranch, setSelectedAcademicYear } from '@/app/actions/branch';
import { usePathname } from 'next/navigation';

type Branch = { id: string; name: string; code: string };
type AcademicYear = { id: string; name: string; isActive: boolean };

export default function Header() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedYearId, setSelectedYearId] = useState('');
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    const loadData = useCallback(async () => {
        const result = await getSelectedBranchAndYear();
        if (result.success) {
            setBranches(result.branches || []);
            setAcademicYears(result.academicYears || []);
            setSelectedBranchId(result.selectedBranchId || '');
            setSelectedYearId(result.selectedAcademicYearId || '');
        }
        setLoading(false);
    }, []);

    // Reload data on route change
    useEffect(() => {
        loadData();
    }, [pathname, loadData]);

    // Listen for custom refresh event (triggered after creating branches/years)
    useEffect(() => {
        const handleRefresh = () => loadData();
        window.addEventListener('header-refresh', handleRefresh);
        return () => window.removeEventListener('header-refresh', handleRefresh);
    }, [loadData]);

    const handleBranchChange = async (branchId: string) => {
        setSelectedBranchId(branchId);
        await setSelectedBranch(branchId);
        // Reload to get academic years for new branch
        const result = await getSelectedBranchAndYear();
        if (result.success) {
            setAcademicYears(result.academicYears || []);
            // If current year isn't available in new branch, switch to active/first
            const currentYearExists = result.academicYears?.find(y => y.id === selectedYearId);
            if (!currentYearExists && result.academicYears?.length) {
                const activeYear = result.academicYears.find(y => y.isActive);
                const newYearId = activeYear?.id || result.academicYears[0].id;
                setSelectedYearId(newYearId);
                await setSelectedAcademicYear(newYearId);
            }
        }
        // Reload page to reflect new branch data
        window.location.reload();
    };

    const handleYearChange = async (yearId: string) => {
        setSelectedYearId(yearId);
        await setSelectedAcademicYear(yearId);
        // Reload page to reflect new year data
        window.location.reload();
    };

    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    const selectedYear = academicYears.find(y => y.id === selectedYearId);

    return (
        <header style={{
            height: '64px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--surface)',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/sprout-logo.png" alt="Sprout Logo" style={{ height: '50px', objectFit: 'contain' }} />
            </div>

            {/* Branch & Year Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!loading && branches.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={18} style={{ color: 'var(--text-secondary)' }} />
                        <select
                            value={selectedBranchId}
                            onChange={(e) => handleBranchChange(e.target.value)}
                            style={{
                                padding: '0.5rem 2rem 0.5rem 0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--background)',
                                color: 'var(--text-main)',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.5rem center'
                            }}
                        >
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {!loading && academicYears.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
                        <select
                            value={selectedYearId}
                            onChange={(e) => handleYearChange(e.target.value)}
                            style={{
                                padding: '0.5rem 2rem 0.5rem 0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                backgroundColor: selectedYear?.isActive ? '#dcfce7' : 'var(--background)',
                                color: 'var(--text-main)',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.5rem center'
                            }}
                        >
                            {academicYears.map(year => (
                                <option key={year.id} value={year.id}>
                                    {year.name} {year.isActive ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {!loading && branches.length > 0 && academicYears.length === 0 && (
                    <a 
                        href="/academic-year/new"
                        style={{ 
                            fontSize: '0.75rem', 
                            color: '#b45309', 
                            padding: '0.5rem', 
                            backgroundColor: '#fef3c7', 
                            borderRadius: '0.25rem',
                            textDecoration: 'none'
                        }}
                    >
                        + Add Academic Year
                    </a>
                )}

                {!loading && branches.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.25rem' }}>
                        Add branches in Settings
                    </span>
                )}

                <form action={logoutAction}>
                    <button type="submit" style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        border: 'none',
                        cursor: 'pointer'
                    }} title="Logout">
                        <LogOut size={18} />
                    </button>
                </form>
            </div>
        </header>
    );
}
