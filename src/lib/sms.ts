/**
 * MSG91 SMS Service
 * API: https://control.msg91.com/api/v5/flow/
 *
 * Required env vars:
 *   SMS_ENABLED    - "true" / "false"
 *   SMS_AUTHKEY    - MSG91 Auth Key (from MSG91 panel → API Keys)
 *   SMS_SENDER     - Approved 6-char sender ID e.g. SPROUT
 *   SMS_TEMPLATE_OTP            - MSG91 template ID
 *   SMS_TEMPLATE_REGISTRATION   - MSG91 template ID
 *   SMS_TEMPLATE_FEE_COLLECTED  - MSG91 template ID
 *   SMS_TEMPLATE_FEE_REMINDER   - MSG91 template ID
 *   SMS_TEMPLATE_NOTICE         - MSG91 template ID
 *
 * Template variable mapping (use ##VAR1## etc. in MSG91 template text):
 *   REGISTRATION  : VAR1=studentName, VAR2=admissionNo
 *   FEE_COLLECTED : VAR1=amount,      VAR2=admissionNo, VAR3=receiptNo
 *   OTP           : VAR1=otp
 *   FEE_REMINDER  : VAR1=parentName,  VAR2=amount,      VAR3=studentName, VAR4=admissionNo
 *   NOTICE        : VAR1=noticeText
 */

import prisma from './prisma';

const BASE_URL = 'https://control.msg91.com/api/v5';

type SmsType =
    | 'REGISTRATION'
    | 'FEE_COLLECTED'
    | 'FEE_REMINDER'
    | 'NOTICE'
    | 'OTP';

interface SendOptions {
    phone: string;
    message: string;                      // full text — DB logging only
    templateId: string;
    variables: Record<string, string>;    // VAR1, VAR2, … passed to MSG91
    sender?: string;                      // override default sender ID
}

/** Normalise to 10-digit Indian mobile; returns null if invalid */
function normalisePhone(phone: string): string | null {
    const d = phone.replace(/\D/g, '');
    if (d.length === 10) return d;
    if (d.length === 12 && d.startsWith('91')) return d.slice(2);
    if (d.length === 11 && d.startsWith('0')) return d.slice(1);
    return null;
}

/** Core single SMS sender — all other helpers call this */
async function sendSingleSms(
    opts: SendOptions,
    smsType: SmsType,
    branchId?: string | null,
    sentBy?: string | null
): Promise<boolean> {
    const enabled = process.env.SMS_ENABLED === 'true';
    const authkey = process.env.SMS_AUTHKEY;
    const sender = opts.sender ?? process.env.SMS_SENDER;

    // Log to DB regardless (admins can see what would have been sent)
    const logEntry = await prisma.smsLog.create({
        data: {
            type: smsType,
            recipient: opts.phone,
            message: opts.message,
            status: 'PENDING',
            branchId: branchId ?? null,
            sentBy: sentBy ?? null,
        },
    }).catch(() => null);

    if (!enabled) {
        console.log(`[SMS DISABLED] Would send to ${opts.phone}: ${opts.message}`);
        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'SENT', errorMessage: 'SMS_DISABLED - not actually sent' },
            }).catch(() => null);
        }
        return true;
    }

    if (!authkey || !sender) {
        console.error('[SMS] Missing env vars: SMS_AUTHKEY and SMS_SENDER (or per-type sender override)');
        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'FAILED', errorMessage: 'Missing SMS configuration' },
            }).catch(() => null);
        }
        return false;
    }

    const mobile = normalisePhone(opts.phone);
    if (!mobile) {
        console.error(`[SMS] Invalid phone number: ${opts.phone}`);
        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'FAILED', errorMessage: 'Invalid phone number' },
            }).catch(() => null);
        }
        return false;
    }

    try {
        const res = await fetch(`${BASE_URL}/flow/`, {
            method: 'POST',
            headers: {
                'authkey': authkey,
                'accept': 'application/json',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                template_id: opts.templateId,
                sender,
                short_url: '0',
                mobiles: `91${mobile}`,
                ...opts.variables,
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.type === 'error') {
            throw new Error(data.message || `HTTP ${res.status}`);
        }

        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'SENT' },
            }).catch(() => null);
        }
        return true;
    } catch (err: any) {
        console.error(`[SMS] Failed to send to ${opts.phone}:`, err.message);
        if (logEntry) {
            await prisma.smsLog.update({
                where: { id: logEntry.id },
                data: { status: 'FAILED', errorMessage: err.message },
            }).catch(() => null);
        }
        return false;
    }
}

/**
 * Bulk SMS — sends each recipient individually in parallel batches of 10.
 * Each recipient can have different variables (personalised messages).
 */
export async function sendBulkSms(
    recipients: Array<{ phone: string; message: string; variables: Record<string, string> }>,
    templateId: string,
    smsType: SmsType,
    branchId?: string | null,
    sentBy?: string | null
): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    const BATCH = 10; // parallel concurrency

    for (let i = 0; i < recipients.length; i += BATCH) {
        const chunk = recipients.slice(i, i + BATCH);
        const results = await Promise.all(
            chunk.map(r =>
                sendSingleSms(
                    { phone: r.phone, message: r.message, templateId, variables: r.variables },
                    smsType,
                    branchId,
                    sentBy
                )
            )
        );
        results.forEach(ok => (ok ? sent++ : failed++));
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
    await sendSingleSms(
        { phone, message, templateId, variables: { VAR1: studentName, VAR2: admissionNo } },
        'REGISTRATION',
        branchId
    );
}

export async function sendFeeCollectedSms(
    phone: string,
    amount: number,
    admissionNo: string,
    receiptNo: string,
    branchId?: string | null
): Promise<void> {
    const templateId = process.env.SMS_TEMPLATE_FEE_COLLECTED ?? '';
    const amountStr = amount.toLocaleString('en-IN');
    const message = `Dear Parent, Fee payment of Rs ${amountStr} received for ${admissionNo}. Thank you. Regards, Sprout School`;
    await sendSingleSms(
        { phone, message, templateId, variables: { numeric: amountStr, alphanumeric: admissionNo } },
        'FEE_COLLECTED',
        branchId
    );
}

export async function sendOtpSms(
    phone: string,
    otp: string
): Promise<boolean> {
    const templateId = process.env.SMS_TEMPLATE_OTP ?? '';
    const message = `Dear User, your OTP for Sprout School fee portal login is ${otp}. Valid for 10 minutes. -Sprout IT`;
    return sendSingleSms(
        { phone, message, templateId, variables: { numeric: otp }, sender: 'SPTSEC' },
        'OTP'
    );
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
    const amountStr = amount.toLocaleString('en-IN');
    const message = `Dear Parent, fee of Rs ${amountStr} for ${studentName} is pending. Kindly pay at earliest. Regards, Sprout School`;
    return sendSingleSms(
        { phone, message, templateId, variables: { numeric: amountStr, alphanumeric: studentName } },
        'FEE_REMINDER',
        branchId,
        sentBy
    );
}

export async function sendNoticeSms(
    phone: string,
    noticeText: string,
    branchId?: string | null,
    sentBy?: string | null
): Promise<boolean> {
    const templateId = process.env.SMS_TEMPLATE_NOTICE ?? '';
    const message = `Dear Parent, ${noticeText} - Sprout School`;
    return sendSingleSms(
        { phone, message, templateId, variables: { VAR1: noticeText } },
        'NOTICE',
        branchId,
        sentBy
    );
}
