import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importPKCS8, compactDecrypt } from 'jose';
import { createPrivateKey } from 'crypto';

function parsePem(val: string | undefined): string {
    return (val || '').replace(/\\n/g, '\n');
}

function toPkcs8(pem: string): string {
    // Converts PKCS#1 (RSA PRIVATE KEY) to PKCS#8 (PRIVATE KEY) that jose accepts
    return createPrivateKey(pem).export({ type: 'pkcs8', format: 'pem' }) as string;
}

async function parseHdfcResponse(text: string, privateKeyPem: string): Promise<any> {
    // Try plain JSON first
    try { return JSON.parse(text); } catch { /* not plain JSON */ }
    // Try JWE decryption (response encrypted with merchant public key)
    try {
        const key = await importPKCS8(privateKeyPem, 'RSA-OAEP-256');
        const { plaintext } = await compactDecrypt(text.trim(), key);
        return JSON.parse(new TextDecoder().decode(plaintext));
    } catch { return { raw: text }; }
}

export async function POST(req: NextRequest) {
    try {
        const { amount, studentId } = await req.json();

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const merchantId = process.env.HDFC_MERCHANT_ID;
        const apiKey = process.env.HDFC_API_KEY;
        const paymentPageClientId = process.env.HDFC_PAYMENT_PAGE_CLIENT_ID;
        const baseUrl = process.env.HDFC_BASE_URL || 'https://smartgateway.hdfcuat.bank.in';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const keyId = process.env.HDFC_KEY_UUID;
        const privateKeyPem = toPkcs8(parsePem(process.env.HDFC_PRIVATE_KEY));

        if (!merchantId || !apiKey || !paymentPageClientId || !keyId || !privateKeyPem) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        const orderId = `order_${Date.now()}`;
        const returnUrl = `${appUrl}/pay`;

        const payload: Record<string, unknown> = {
            order_id: orderId,
            amount: amount,
            payment_page_client_id: paymentPageClientId,
            customer_id: studentId || 'guest',
            action: 'paymentPage',
            return_url: returnUrl,
            currency: 'INR',
        };

        // Sign request body with merchant RSA private key (JWS RS256)
        const privateKey = await importPKCS8(privateKeyPem, 'RS256');
        const jws = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'RS256', kid: keyId })
            .sign(privateKey);

        const credentials = Buffer.from(`${merchantId}:${apiKey}`).toString('base64');

        const response = await fetch(`${baseUrl}/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/jose',
                'Authorization': `Basic ${credentials}`,
                'x-merchantid': merchantId,
            },
            body: jws,
        });

        const responseText = await response.text();
        const data = await parseHdfcResponse(responseText, privateKeyPem);

        if (!response.ok || data.status !== 'NEW') {
            console.error('HDFC session failed:', JSON.stringify(data));
            return NextResponse.json({
                error: data.error_message || data.message || data.status || 'Failed to create payment session',
                raw: data,
            }, { status: 502 });
        }

        return NextResponse.json({
            orderId,
            paymentLink: data.payment_links?.web,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('HDFC session error:', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

