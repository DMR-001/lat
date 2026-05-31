import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { renderToStream } from '@react-pdf/renderer';
import { CombinedReceiptPDF } from '@/components/pdf/CombinedReceiptPDF';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ studentId: string }> }
) {
    const { studentId } = await params;

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true, branch: true },
    });

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const payments = await prisma.payment.findMany({
        where: {
            status: 'SUCCESS',
            fee: { studentId },
        },
        include: { fee: true, branch: true },
        orderBy: { date: 'asc' },
    });

    if (payments.length === 0) {
        return NextResponse.json({ error: 'No payments found' }, { status: 404 });
    }

    const schoolSettings = await prisma.schoolSettings.findFirst();

    const fs = require('fs');
    const path = require('path');
    let logoBase64 = '';
    try {
        const logoPath = path.join(process.cwd(), 'public', 'sprout-logo.png');
        if (fs.existsSync(logoPath)) {
            const buf = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
        }
    } catch {}

    try {
        const stream = await renderToStream(
            <CombinedReceiptPDF
                student={student}
                payments={payments}
                logoData={logoBase64}
                schoolSettings={schoolSettings}
            />
        );

        const webStream = new ReadableStream({
            start(controller) {
                stream.on('data', (chunk) => controller.enqueue(chunk));
                stream.on('end', () => controller.close());
                stream.on('error', (err) => controller.error(err));
            },
        });

        const filename = `Combined-Receipt-${student.admissionNo}.pdf`;

        return new NextResponse(webStream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Combined PDF error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
