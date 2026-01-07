import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSettings } from '@/app/actions/settings';

// Support simple JSON push from devices
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const records = Array.isArray(body) ? body : body.records; // Handle array or {records: []}

        if (!records || !Array.isArray(records)) {
            return NextResponse.json({ error: 'Invalid data format. Expected array of records.' }, { status: 400 });
        }

        const settings = await prisma.schoolSettings.findFirst();
        const gracePeriod = settings?.lateGracePeriod || 15;
        const workHours = settings?.fullDayWorkHours || 8;

        const results = [];

        for (const record of records) {
            const { teacherId, timestamp, type } = record;

            if (!teacherId || !timestamp) continue;

            const dateObj = new Date(timestamp);
            const dateOnly = new Date(dateObj);
            dateOnly.setHours(12, 0, 0, 0); // Normalize date

            // Find existing
            const existing = await prisma.teacherAttendance.findUnique({
                where: {
                    teacherId_date: {
                        teacherId,
                        date: dateOnly
                    }
                }
            });

            // Determine updates
            let updateData: any = {};

            // Check In Logic
            if (type === 'CHECK_IN' || type === 'IN') {
                // If no checkIn or new time is earlier
                if (!existing?.checkIn || dateObj < existing.checkIn) {
                    updateData.checkIn = dateObj;

                    // Calculate Late
                    // Assuming school starts at 9:00 AM (Should be in settings, but hardcoding or extracting from date)
                    // Let's assume standard start time is 9:00 AM for now, or configurable later
                    const standardStart = new Date(dateObj);
                    standardStart.setHours(9, 0, 0, 0);

                    const diffMs = dateObj.getTime() - standardStart.getTime();
                    const diffMins = Math.floor(diffMs / 60000);

                    if (diffMins > gracePeriod) {
                        updateData.lateMinutes = diffMins;
                        updateData.isLate = true;
                    } else {
                        updateData.lateMinutes = 0;
                        updateData.isLate = false;
                    }
                }
            }

            // Check Out Logic
            if (type === 'CHECK_OUT' || type === 'OUT') {
                if (!existing?.checkOut || dateObj > existing.checkOut) {
                    updateData.checkOut = dateObj;
                }
            }

            // Calculate Status based on worked hours if both exist
            if ((existing?.checkIn || updateData.checkIn) && (existing?.checkOut || updateData.checkOut)) {
                const inTime = updateData.checkIn || existing!.checkIn;
                const outTime = updateData.checkOut || existing!.checkOut;

                const workedMs = outTime.getTime() - inTime.getTime();
                const workedHrs = workedMs / (1000 * 60 * 60);

                updateData.workedHours = workedHrs;

                if (workedHrs >= workHours - 1) { // 1 hour buffer
                    updateData.status = 'PRESENT';
                } else if (workedHrs >= workHours / 2) {
                    updateData.status = 'HALF_DAY';
                } else {
                    updateData.status = 'ABSENT'; // Present but not enough hours? Or Leave?
                    // Let's keep it PRESENT if they checked in, maybe SHORT_ATTENDANCE
                }
            } else if (!existing) {
                // Initial creation
                updateData.status = 'PRESENT'; // Default to present on first punch
            }

            const upserted = await prisma.teacherAttendance.upsert({
                where: { teacherId_date: { teacherId, date: dateOnly } },
                update: updateData,
                create: {
                    teacherId,
                    date: dateOnly,
                    status: 'PRESENT',
                    ...updateData
                }
            });

            results.push(upserted);
        }

        return NextResponse.json({ success: true, processed: results.length });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
