/**
 * Cloudflare Worker — MSG91 SMS Proxy
 *
 * Deploy steps:
 *  1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *  2. Paste this entire file, click Deploy
 *  3. Go to the Worker → Settings → Variables → Add:
 *       MSG91_AUTHKEY  = your MSG91 authkey
 *       WORKER_SECRET  = any long random string (e.g. openssl rand -hex 32)
 *  4. Note your worker URL: https://sms-proxy.<your-subdomain>.workers.dev
 *  5. Trigger one SMS from the app, check MSG91 error logs for the egress IP
 *  6. Add that IP to MSG91 → API Keys → Whitelisted IPs
 *  7. Add these to Vercel env vars:
 *       SMS_WORKER_URL    = https://sms-proxy.<your-subdomain>.workers.dev
 *       SMS_WORKER_SECRET = same value as WORKER_SECRET above
 */

export default {
    async fetch(request, env) {
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ type: 'error', message: 'Method not allowed' }), {
                status: 405,
                headers: { 'content-type': 'application/json' },
            });
        }

        // Verify the secret so only our app can use this worker
        const secret = request.headers.get('x-worker-secret');
        if (!secret || secret !== env.WORKER_SECRET) {
            return new Response(JSON.stringify({ type: 'error', message: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (!env.MSG91_AUTHKEY) {
            return new Response(JSON.stringify({ type: 'error', message: 'MSG91_AUTHKEY not configured' }), {
                status: 500,
                headers: { 'content-type': 'application/json' },
            });
        }

        // Forward the request body to MSG91
        const body = await request.text();

        const res = await fetch('https://control.msg91.com/api/v5/flow/', {
            method: 'POST',
            headers: {
                'authkey': env.MSG91_AUTHKEY,
                'accept': 'application/json',
                'content-type': 'application/json',
            },
            body,
        });

        const responseText = await res.text();
        return new Response(responseText, {
            status: res.status,
            headers: { 'content-type': 'application/json' },
        });
    },
};
