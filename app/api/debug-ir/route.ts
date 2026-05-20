import { getDeviceInfo } from '@/lib/tuya';
import crypto from 'crypto';

const TUYA_CLIENT_ID = process.env.TUYA_CLIENT_ID!;
const TUYA_CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET!;
const TUYA_BASE_URL = process.env.TUYA_BASE_URL || 'https://openapi-sg.iotbing.com';

function calcSign(clientId: string, secret: string, t: string, accessToken: string, method: string, path: string, body?: string) {
    const contentHash = crypto.createHash('sha256').update(body || '').digest('hex');
    const stringToSign = `${method}\n${contentHash}\n\n${path}`;
    const str = clientId + accessToken + t + stringToSign;
    return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();
}

let tokenCache: any = null;
async function getToken() {
    if (tokenCache && Date.now() < tokenCache.expire_time) return tokenCache.access_token;
    const t = Date.now().toString();
    const path = '/v1.0/token?grant_type=1';
    const sign = calcSign(TUYA_CLIENT_ID, TUYA_CLIENT_SECRET, t, '', 'GET', path);
    const res = await fetch(`${TUYA_BASE_URL}${path}`, {
        headers: { 'client_id': TUYA_CLIENT_ID, 'sign': sign, 't': t, 'sign_method': 'HMAC-SHA256' }
    });
    const data = await res.json();
    tokenCache = { access_token: data.result.access_token, expire_time: Date.now() + (data.result.expire_time - 120) * 1000 };
    return data.result.access_token;
}

export async function tuyaReq(method: string, path: string, body?: object) {
    const token = await getToken();
    const t = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '';
    const sign = calcSign(TUYA_CLIENT_ID, TUYA_CLIENT_SECRET, t, token, method, path, bodyStr);
    const headers: any = { 'client_id': TUYA_CLIENT_ID, 'access_token': token, 'sign': sign, 't': t, 'sign_method': 'HMAC-SHA256' };
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${TUYA_BASE_URL}${path}`, { method, headers, body: bodyStr || undefined });
    return res.json();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Use the known IR blaster ID to test batch API
    const deviceIds = searchParams.get('ids') || 'a38583401e85956854rxai';
    
    try {
        // Test standard batch status API
        const result = await tuyaReq('GET', `/v1.0/devices/status?device_ids=${deviceIds}`);
        return Response.json(result);
    } catch (e: any) {
        return Response.json({ error: e.message });
    }
}
