'use server';

import prisma from '@/lib/prisma';

export async function getClasses() {
    return await prisma.class.findMany({
        orderBy: { grade: 'asc' }
    });
}
