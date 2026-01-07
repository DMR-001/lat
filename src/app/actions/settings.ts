'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSettings() {
    try {
        let settings = await prisma.schoolSettings.findFirst();

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.schoolSettings.create({
                data: {
                    schoolName: 'Sprout School',
                    address: 'Hno-14-218/5, Raghavanagar Colony, Meerpet, Hyderabad',
                    phone: '+91 7032252030',
                    email: 'sproutmeerpet@gmail.com'
                }
            });
        }

        return { success: true, settings };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateSettings(data: {
    schoolName?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    principalName?: string;
    principalSignature?: string;
    logoUrl?: string;
    schoolSeal?: string;
    receiptHeader?: string;
    receiptFooter?: string;
    receiptTerms?: string;
    certificateLetterhead?: string;
}) {
    try {
        let settings = await prisma.schoolSettings.findFirst();

        if (!settings) {
            // Create if doesn't exist
            settings = await prisma.schoolSettings.create({
                data: data as any
            });
        } else {
            // Update existing
            settings = await prisma.schoolSettings.update({
                where: { id: settings.id },
                data: data as any
            });
        }

        revalidatePath('/settings');
        return { success: true, settings };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
