import { cookies } from 'next/headers';
import prisma from './prisma';

export type FilterContext = {
    branchId: string | null;
    academicYearId: string | null;
    branchFilter: { branchId: string } | {};
    yearFilter: { academicYearId: string } | {};
};

/**
 * Get the currently selected branch and academic year IDs from cookies.
 * Use this in server components to filter data queries.
 */
export async function getFilterContext(): Promise<FilterContext> {
    const cookieStore = await cookies();
    const selectedBranchId = cookieStore.get('selectedBranchId')?.value || null;
    const selectedAcademicYearId = cookieStore.get('selectedAcademicYearId')?.value || null;

    // If no branch selected, try to get the first active branch
    let branchId = selectedBranchId;
    if (!branchId) {
        const firstBranch = await prisma.branch.findFirst({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        branchId = firstBranch?.id || null;
    }

    // If no year selected, try to get the active year for the branch
    let academicYearId = selectedAcademicYearId;
    if (!academicYearId && branchId) {
        const activeYear = await prisma.academicYear.findFirst({
            where: { branchId, isActive: true }
        });
        academicYearId = activeYear?.id || null;

        // If no active year, get the most recent
        if (!academicYearId) {
            const latestYear = await prisma.academicYear.findFirst({
                where: { branchId },
                orderBy: { startDate: 'desc' }
            });
            academicYearId = latestYear?.id || null;
        }
    }

    return {
        branchId,
        academicYearId,
        // Convenience objects for Prisma where clauses
        branchFilter: branchId ? { branchId } : {},
        yearFilter: academicYearId ? { academicYearId } : {}
    };
}

/**
 * Helper to check if multi-branch mode is enabled (has more than 1 branch)
 */
export async function isMultiBranchEnabled(): Promise<boolean> {
    const count = await prisma.branch.count({ where: { isActive: true } });
    return count > 1;
}
