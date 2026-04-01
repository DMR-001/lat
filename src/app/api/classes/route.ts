import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const branchId = cookieStore.get('selectedBranchId')?.value || null;
        
        const classes = await prisma.class.findMany({
            where: branchId ? { branchId } : {},
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(classes);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
}
