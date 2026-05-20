import crypto from 'crypto';

const TUYA_CLIENT_ID = process.env.TUYA_CLIENT_ID!;
const TUYA_CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET!;
const TUYA_BASE_URL = process.env.TUYA_BASE_URL || 'https://openapi-sg.iotbing.com';

// Token cache (server-side, survives across API route calls in the same process)
let tokenCache: { access_token: string; expire_time: number } | null = null;

/**
 * Generate HMAC-SHA256 signature for Tuya API requests.
 */
function calcSign(
    clientId: string,
    secret: string,
    t: string,
    accessToken: string,
    method: string,
    path: string,
    body?: string
): string {
    // Content-SHA256: SHA256 of the body (or empty string hash for GET/empty body)
    const contentHash = crypto
        .createHash('sha256')
        .update(body || '')
        .digest('hex');

    // stringToSign = METHOD\nContent-SHA256\n\npath
    const stringToSign = `${method}\n${contentHash}\n\n${path}`;

    // str = client_id + access_token + t + stringToSign
    const str = clientId + accessToken + t + stringToSign;

    const sign = crypto
        .createHmac('sha256', secret)
        .update(str)
        .digest('hex')
        .toUpperCase();

    return sign;
}

/**
 * Get access token from Tuya Cloud API.
 * Uses token caching to avoid unnecessary requests.
 */
async function getAccessToken(): Promise<string> {
    // Check cache
    if (tokenCache && Date.now() < tokenCache.expire_time) {
        return tokenCache.access_token;
    }

    const t = Date.now().toString();
    const path = '/v1.0/token?grant_type=1';
    const method = 'GET';

    const sign = calcSign(TUYA_CLIENT_ID, TUYA_CLIENT_SECRET, t, '', method, path);

    const response = await fetch(`${TUYA_BASE_URL}${path}`, {
        method,
        headers: {
            'client_id': TUYA_CLIENT_ID,
            'sign': sign,
            't': t,
            'sign_method': 'HMAC-SHA256',
        },
    });

    const data = await response.json();

    if (!data.success) {
        console.error('Tuya token error:', data);
        throw new Error(`Tuya token error: ${data.msg || 'Unknown error'}`);
    }

    // Cache the token (expire 2 minutes early to be safe)
    tokenCache = {
        access_token: data.result.access_token,
        expire_time: Date.now() + (data.result.expire_time - 120) * 1000,
    };

    return data.result.access_token;
}

/**
 * Make an authenticated request to the Tuya Cloud API.
 */
async function tuyaRequest(method: string, path: string, body?: object): Promise<any> {
    const accessToken = await getAccessToken();
    const t = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '';

    const sign = calcSign(
        TUYA_CLIENT_ID,
        TUYA_CLIENT_SECRET,
        t,
        accessToken,
        method,
        path,
        bodyStr
    );

    const headers: Record<string, string> = {
        'client_id': TUYA_CLIENT_ID,
        'access_token': accessToken,
        'sign': sign,
        't': t,
        'sign_method': 'HMAC-SHA256',
    };

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${TUYA_BASE_URL}${path}`, {
        method,
        headers,
        body: bodyStr || undefined,
    });

    const data = await response.json();
    return data;
}

/**
 * Get the current status of a Tuya device.
 * Returns an array of status codes and their values.
 */
export async function getDeviceStatus(deviceId: string) {
    return tuyaRequest('GET', `/v1.0/devices/${deviceId}/status`);
}

/**
 * Get status of multiple Tuya devices at once (Batch).
 * Very useful for fetching power data of many smart plugs without hitting quota limits.
 * @param deviceIds Array of device IDs, max 20-50 per request
 */
export async function getBatchDeviceStatus(deviceIds: string[]) {
    if (!deviceIds || deviceIds.length === 0) return { result: [], success: true };
    const idsParam = deviceIds.join(',');
    return tuyaRequest('GET', `/v1.0/devices/status?device_ids=${idsParam}`);
}

/**
 * Get device info (including online status).
 */
export async function getDeviceInfo(deviceId: string) {
    return tuyaRequest('GET', `/v1.0/devices/${deviceId}`);
}

/**
 * Send commands to a Tuya device.
 * @param commands - Array of { code, value } objects
 * 
 * Example for smart plug:
 *   sendDeviceCommand(deviceId, [{ code: 'switch_1', value: true }])
 */
export async function sendDeviceCommand(
    deviceId: string,
    commands: Array<{ code: string; value: any }>
) {
    return tuyaRequest('POST', `/v1.0/devices/${deviceId}/commands`, { commands });
}

// ============================================================
// IR Blaster (Universal Infrared) Functions
// ============================================================

/**
 * Send a key command to a TV via IR blaster.
 * Tries standard key first, falls back to raw key if standard fails.
 * 
 * @param infraredId - Tuya IR blaster device ID (physical device)
 * @param remoteId - Tuya paired remote ID (virtual remote for the TV)
 * @param key - Standard key name (e.g. "power", "volume_up", "volume_down", "mute")
 * 
 * Standard API: POST /v1.0/infrareds/{id}/remotes/{rid}/command { key }
 * Raw API:      POST /v1.0/infrareds/{id}/remotes/{rid}/raw/command { raw_key }
 */
export async function sendIRCommand(
    infraredId: string,
    remoteId: string,
    key: string
) {
    // Map standard key names to raw_key IDs (from Tuya pairing rules)
    const rawKeyMap: Record<string, number> = {
        'power': 1,
    };

    // Try standard command first
    const result = await tuyaRequest(
        'POST',
        `/v1.0/infrareds/${infraredId}/remotes/${remoteId}/command`,
        { key }
    );

    if (result.success) return result;

    // Fallback to raw command
    const rawKey = rawKeyMap[key];
    if (rawKey !== undefined) {
        console.log(`IR standard "${key}" failed (${result.msg}), trying raw_key ${rawKey}...`);
        return tuyaRequest(
            'POST',
            `/v1.0/infrareds/${infraredId}/remotes/${remoteId}/raw/command`,
            { raw_key: rawKey }
        );
    }

    return result; // Return original error if no raw fallback
}

/**
 * Get the list of remote controls bound to an IR blaster device.
 * Useful for verifying paired remotes.
 * 
 * API: GET /v1.0/infrareds/{infrared_id}/remotes
 */
export async function getIRRemotes(infraredId: string) {
    return tuyaRequest('GET', `/v1.0/infrareds/${infraredId}/remotes`);
}

/**
 * Get the list of keys supported by a specific remote control.
 * Returns both standard keys and non-standard keys.
 * 
 * API: GET /v1.0/infrareds/{infrared_id}/remotes/{remote_id}/keys
 */
export async function getIRRemoteKeys(infraredId: string, remoteId: string) {
    return tuyaRequest('GET', `/v1.0/infrareds/${infraredId}/remotes/${remoteId}/keys`);
}
