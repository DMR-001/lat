/**
 * Airtel IQ SMS Service
 * API: http://iqsms.airtel.in/api/v1/send-sms (single)
 *      http://iqsms.airtel.in/api/v1/send-sms-bulk (bulk)
 *
 * Required env vars:
 *   SMS_ENABLED          - "true" / "false"  (flip to true once DLT headers approved)
 *   SMS_CUSTOMER_ID      - Airtel IQ customer ID
 *   SMS_ENTITY_ID        - DLT entity ID
 *   SMS_SOURCE_ADDRESS   - Approved sender header e.g. SPROUT
 *   SMS_TEMPLATE_OTP            - DLT template ID
 *   SMS_TEMPLATE_REGISTRATION   - DLT template ID
 *   SMS_TEMPLATE_FEE_COLLECTED  - DLT template ID
 *   SMS_TEMPLATE_FEE_REMINDER   - DLT template ID
 *   SMS_TEMPLATE_NOTICE         - DLT template ID
 */

import prisma from './prisma';

const BASE_URL = 'http://iqsms.airtel.in/api/v1';

type MessageType =
    | 'PROMOTIONAL'
    | 'TRANSACTIONAL'
    | 'SERVICE_IMPLICIT'
    | 'SERVICE_EXPLICIT';

type SmsType =
    | 'REGISTRATION'
    | 'FEE_COLLECTED'
    | 'FEE_REMINDER'
    | 'NOTICE'
    | 'OTP';

interface SendOptions {
    destinationAddress: string;
    message: string;
    dltTemplateId: string;
    messageType?: MessageType;
    priority?: boolean;
}

/** Core single SMS sender — all other helpers call this */
async function sendSingleSms(
    opts: SendOptions,
    smsType: SmsType,
    branchId?: string | null,
    sentBy?: string | null
): Promise<boolean> {
    const enabled = process.env.SMS_ENABLED === 'true';
    const customerId = process.env.SMS_CUSTOMER_ID;
    const entityId = process.env.SMS_ENTITY_ID;
    const sourceAddress = process.env.SMS_SOURCE_ADDRESS;

    // Log to DB regardless (so admins can see what would have been sent)
    const logEntry = await prisma.smsLog.create({
        data: {
            type: smsType,
            recipient: opts.destinationAddress,
            message: opts.message,
            status: 'PENDING',
            branchId: branchId ?? null,
            sentBy: sentBy ?? null,
        },
    }).catch(() => null);

    if (!enabled) {
        console.log(`[SMS DISABLED] Would send to ${opts.destinationAddress}: ${opts.message}`);
        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'SENT', errorMessage: 'SMS_DISABLED - not actually sent' },
            }).catch(() => null);
        }
        return true;
    }

    if (!customerId || !entityId || !sourceAddress) {
        console.error('[SMS] Missing required env vars: SMS_CUSTOMER_ID, SMS_ENTITY_ID, SMS_SOURCE_ADDRESS');
        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'FAILED', errorMessage: 'Missing SMS configuration' },
            }).catch(() => null);
        }
        return false;
    }

    try {
        const res = await fetch(`${BASE_URL}/send-sms`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                customerId,
                entityId,
                sourceAddress,
                destinationAddress: opts.destinationAddress,
                message: opts.message,
                dltTemplateId: opts.dltTemplateId,
                messageType: opts.messageType ?? 'SERVICE_IMPLICIT',
                priority: opts.priority ?? false,
                filterBlacklistNumbers: true,
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.errorMessage) {
            throw new Error(data.errorMessage || `HTTP ${res.status}`);
        }

        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'SENT' },
            }).catch(() => null);
        }
        return true;
    } catch (err: any) {
        console.error(`[SMS] Failed to send to ${opts.destinationAddress}:`, err.message);
        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'FAILED', errorMessage: err.message },
            }).catch(() => null);
        }
        return false;
    }
}

/** Bulk SMS sender using /api/v1/send-sms-bulk */
export async function sendBulkSms(
    recipients: Array<{ phone: string; message: string }>,
    dltTemplateId: string,
    smsType: SmsType,
    messageType: MessageType = 'SERVICE_IMPLICIT',
    branchId?: string | null,
    sentBy?: string | null
): Promise<{ sent: number; failed: number }> {
    const enabled = process.env.SMS_ENABLED === 'true';
    const customerId = process.env.SMS_CUSTOMER_ID;
    const entityId = process.env.SMS_ENTITY_ID;
    const sourceAddress = process.env.SMS_SOURCE_ADDRESS;

    // Log all to DB
    const logEntries = await Promise.all(
        recipients.map(r =>
            prisma.smsLog.create({
                data: {
                    type: smsType,
                    recipient: r.phone,
                    message: r.message,
                    status: 'PENDING',
                    branchId: branchId ?? null,
                    sentBy: sentBy ?? null,
                },
            }).catch(() => null)
        )
    );

    if (!enabled) {
        console.log(`[SMS DISABLED] Would send bulk ${smsType} to ${recipients.length} recipients`);
        await Promise.all(
            logEntries.map(e => e
                ? prisma.smsLog.update({ where: { id: e.id }, data: { status: 'SENT', errorMessage: 'SMS_DISABLED' } }).catch(() => null)
                : null
            )
        );
        return { sent: recipients.length, failed: 0 };
    }

    if (!customerId || !entityId || !sourceAddress) {
        await Promise.all(
            logEntries.map(e => e
                ? prisma.smsLog.update({ where: { id: e.id }, data: { status: 'FAILED', errorMessage: 'Missing SMS config' } }).catch(() => null)
                : null
            )
        );
        return { sent: 0, failed: recipients.length };
    }

    // Batch into chunks of 100 (safe bulk limit)
    const CHUNK = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += CHUNK) {
        const chunk = recipients.slice(i, i + CHUNK);
        const payload = chunk.map(r => ({
            customerId,
            entityId,
            sourceAddress,
            destinationAddress: r.phone,
            message: r.message,
            dltTemplateId,
            messageType,
            priority: false,
            filterBlacklistNumbers: true,
        }));

        try {
            const res = await fetch(`${BASE_URL}/send-sms-bulk`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                sent += chunk.length;
                const ids = logEntries.slice(i, i + CHUNK).map(e => e?.id).filter(Boolean) as string[];
                await prisma.smsLog.updateMany({ where: { id: { in: ids } }, data: { status: 'SENT' } }).catch(() => null);
            } else {
                failed += chunk.length;
                const errorText = await res.text().catch(() => `HTTP ${res.status}`);
                const ids = logEntries.slice(i, i + CHUNK).map(e => e?.id).filter(Boolean) as string[];
                await prisma.smsLog.updateMany({ where: { id: { in: ids } }, data: { status: 'FAILED', errorMessage: errorText } }).catch(() => null);
            }
        } catch (err: any) {
            failed += chunk.length;
            const ids = logEntries.slice(i, i + CHUNK).map(e => e?.id).filter(Boolean) as string[];
            await prisma.smsLog.updateMany({ where: { id: { in: ids } }, data: { status: 'FAILED', errorMessage: err.message } }).catch(() => null);
        }
    }

    return { sent, failed };
}

// ─────────────────────────────────────────────────────────────
//  Named helpers for each event type
// ─────────────────────────────────────────────────────────────

export async function sendRegistrationSms(
    phone: string,
    studentName: string,
    admissionNo: string,
    branchId?: string | null
): Promise<void> {
    const templateId = process.env.SMS_TEMPLATE_REGISTRATION ?? '';
    const message = `Dear Parent, ${studentName} has been registered at Sprout School. Admission No: ${admissionNo}. Welcome to our family! - Sprout School`;
    await sendSingleSms({ destinationAddress: phone, message, dltTemplateId: templateId, messageType: 'TRANSACTIONAL' }, 'REGISTRATION', branchId);
}

export async function sendFeeCollectedSms(
    phone: string,
    amount: number,
    admissionNo: string,
    receiptNo: string,
    branchId?: string | null
): Promise<void> {
    const templateId = process.env.SMS_TEMPLATE_FEE_COLLECTED ?? '';
    const message = `Dear Parent, payment of Rs.${amount.toLocaleString('en-IN')} received for Adm No: ${admissionNo}. Receipt: ${receiptNo}. Thank you! - Sprout School`;
    await sendSingleSms({ destinationAddress: phone, message, dltTemplateId: templateId, messageType: 'TRANSACTIONAL' }, 'FEE_COLLECTED', branchId);
}

export async function sendOtpSms(
    phone: string,
    otp: string
): Promise<boolean> {
    const templateId = process.env.SMS_TEMPLATE_OTP ?? '';
    const message = `Your OTP for Sprout School fee portal is ${otp}. Valid for 10 minutes. Do not share with anyone. - Sprout School`;
    return sendSingleSms({ destinationAddress: phone, message, dltTemplateId: templateId, messageType: 'TRANSACTIONAL', priority: true }, 'OTP');
}

export async function sendFeeReminderSms(
    phone: string,
    parentName: string,
    amount: number,
    studentName: string,
    admissionNo: string,
    branchId?: string | null,
    sentBy?: string | null
): Promise<boolean> {
    const templateId = process.env.SMS_TEMPLATE_FEE_REMINDER ?? '';
    const message = `Dear ${parentName}, fee of Rs.${amount.toLocaleString('en-IN')} is pending for ${studentName} (Adm: ${admissionNo}). Please pay at the earliest. - Sprout School`;
    return sendSingleSms({ destinationAddress: phone, message, dltTemplateId: templateId, messageType: 'SERVICE_IMPLICIT' }, 'FEE_REMINDER', branchId, sentBy);
}

export async function sendNoticeSms(
    phone: string,
    noticeText: string,
    branchId?: string | null,
    sentBy?: string | null
): Promise<boolean> {
    const templateId = process.env.SMS_TEMPLATE_NOTICE ?? '';
    const message = `Dear Parent, ${noticeText} - Sprout School`;
    return sendSingleSms({ destinationAddress: phone, message, dltTemplateId: templateId, messageType: 'SERVICE_IMPLICIT' }, 'NOTICE', branchId, sentBy);
}
