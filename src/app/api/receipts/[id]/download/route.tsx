import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { renderToStream } from '@react-pdf/renderer';
import { ReceiptPDF } from '@/components/pdf/ReceiptPDF';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            fee: {
                include: {
                    student: {
                        include: {
                            class: true
                        }
                    }
                }
            }
        }
    });

    if (!payment) {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Read logo file
    const fs = require('fs');
    const path = require('path');
    let logoBase64 = '';

    try {
        const logoPath = path.join(process.cwd(), 'public', 'sprout-logo.png');
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
    } catch (e) {
        console.error('Error reading logo file context:', e);
    }

    try {
        const stream = await renderToStream(<ReceiptPDF payment={payment} logoData={logoBase64} />);

        // Convert Node stream to Web ReadableStream
        const webStream = new ReadableStream({
            start(controller) {
                stream.on('data', (chunk) => controller.enqueue(chunk));
                stream.on('end', () => controller.close());
                stream.on('error', (err) => controller.error(err));
            }
        });

        const filename = `Receipt-${payment.receiptNo.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;

        return new NextResponse(webStream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
