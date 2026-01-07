import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSettings } from '@/app/actions/settings';

// Helper to handle the CAMS logic
async function handler(request: NextRequest) {
    try {
        let body: any = {};
        let query: any = {};

        // Parse body if valid JSON
        try {
            body = await request.json();
        } catch (e) {
            // Body might be empty for GET or encoded differently
        }

        // Parse query params
        request.nextUrl.searchParams.forEach((value, key) => {
            query[key.toLowerCase()] = value;
        });

        // Normalize data keys (CAMS sends lowercase or mixed)
        // Check body first, then query
        const getVal = (key: string) => body[key] || body[key.toLowerCase()] || query[key] || query[key.toLowerCase()];

        const userId = getVal('userid') || getVal('userId');
        const attendanceTime = getVal('attendancetime') || getVal('attendanceTime');
        const deviceId = getVal('deviceid') || getVal('deviceId');
        const status = getVal('status');

        console.log("CAMS Attendance:", { userId, attendanceTime, deviceId, status });

        if (!userId || !attendanceTime) {
            // CAMS requires 200 OK even if data invalid to stop retrying? 
            // Better to log error but return 200.
            console.error("Missing userId or attendanceTime");
            return new NextResponse("OK", { status: 200 });
        }

        // Parse Date
        // Format might be "yyyy-MM-dd HH:mm:ss" or ISO
        const dateObj = new Date(attendanceTime);
        if (isNaN(dateObj.getTime())) {
            console.error("Invalid date:", attendanceTime);
            return new NextResponse("OK", { status: 200 });
        }

        const dateOnly = new Date(dateObj);
        dateOnly.setHours(12, 0, 0, 0);

        // Find teacher by employeeId OR id
        const teacher = await prisma.teacher.findFirst({
            where: {
                OR: [
                    { employeeId: userId },
                    { id: userId } // Fallback if they use internal ID
                ]
            }
        });

        if (!teacher) {
            console.error("Teacher not found for ID:", userId);
            return new NextResponse("OK", { status: 200 });
        }

        // Get Settings
        const settings = await prisma.schoolSettings.findFirst();
        const gracePeriod = settings?.lateGracePeriod || 15;
        const workHours = settings?.fullDayWorkHours || 8;

        // Find existing attendance for this day
        const existing = await prisma.teacherAttendance.findUnique({
            where: {
                teacherId_date: {
                    teacherId: teacher.id,
                    date: dateOnly
                }
            }
        });

        // Determine updates
        let updateData: any = {};
        let isLate = false;
        let lateMinutes = 0;

        // Logic:
        // If FIRST punch of the day -> Check In
        // If LAST punch of the day -> Check Out
        // But CAMS sends each punch as it happens. So we valid update.

        // Update Check In: If empty or new time is earlier
        if (!existing?.checkIn || dateObj < existing.checkIn) {
            updateData.checkIn = dateObj;

            // Late Calculation
            const standardStart = new Date(dateObj);
            standardStart.setHours(9, 0, 0, 0); // 9:00 AM standard
            // TODO: Move start time to SchoolSettings!

            const diffMs = dateObj.getTime() - standardStart.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins > gracePeriod) {
                lateMinutes = diffMins;
                isLate = true;
            } else {
                lateMinutes = 0;
                isLate = false;
            }

            updateData.lateMinutes = lateMinutes;
            updateData.isLate = isLate;
        }

        // Update Check Out: If empty or new time is later
        if (!existing?.checkOut || dateObj > existing.checkOut) {
            updateData.checkOut = dateObj;
        }

        // Calculate Status
        // Re-evaluate worked hours based on new in/out
        const finalIn = updateData.checkIn || existing?.checkIn || dateObj;
        const finalOut = updateData.checkOut || existing?.checkOut || dateObj;

        if (finalIn && finalOut && finalOut > finalIn) {
            const workedMs = finalOut.getTime() - finalIn.getTime();
            const workedHrs = workedMs / (1000 * 60 * 60);
            updateData.workedHours = workedHrs;

            if (workedHrs >= workHours - 1) {
                updateData.status = 'PRESENT';
            } else if (workedHrs >= workHours / 2) {
                updateData.status = 'HALF_DAY';
            } else {
                // Even if hours low, if they checked in, mark PRESENT for now or leave as is?
                // Let's default to PRESENT if we have entries but maybe flag it later. 
                // Or keep it 'PRESENT' because 'ABSENT' implies no show.
                updateData.status = 'PRESENT';
            }
        } else {
            // Single punch
            updateData.status = 'PRESENT';
        }

        await prisma.teacherAttendance.upsert({
            where: { teacherId_date: { teacherId: teacher.id, date: dateOnly } },
            update: updateData,
            create: {
                teacherId: teacher.id,
                date: dateOnly,
                status: 'PRESENT',
                ...updateData
            }
        });

        return new NextResponse("OK", { status: 200 });

    } catch (error: any) {
        console.error("CAMS Error:", error);
        return new NextResponse("OK", { status: 200 }); // Always return OK to device
    }
}

export async function GET(request: NextRequest) {
    return handler(request);
}

export async function POST(request: NextRequest) {
    return handler(request);
}
