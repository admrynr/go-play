import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDeviceCommand, getDeviceStatus, getDeviceInfo } from '@/lib/tuya';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/dashboard/iot?stationId=xxx
 * Get IoT device status for a station
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stationId = searchParams.get('stationId');

        if (!stationId) {
            return NextResponse.json({ error: 'stationId required' }, { status: 400 });
        }

        // Get station with iot_device_id
        const { data: station, error: stationError } = await supabase
            .from('stations')
            .select('id, iot_device_id, page_id')
            .eq('id', stationId)
            .single();

        if (stationError || !station) {
            return NextResponse.json({ error: 'Station not found' }, { status: 404 });
        }

        if (!station.iot_device_id) {
            return NextResponse.json({ connected: false, message: 'No IoT device linked' });
        }

        // Fetch status and info from Tuya
        const [statusRes, infoRes] = await Promise.all([
            getDeviceStatus(station.iot_device_id),
            getDeviceInfo(station.iot_device_id),
        ]);

        let isOn = false;
        let isOnline = false;
        let deviceName = '';

        if (statusRes?.success && Array.isArray(statusRes.result)) {
            const sw = statusRes.result.find((s: any) => s.code === 'switch_1' || s.code === 'switch');
            if (sw) isOn = sw.value === true;
        }

        if (infoRes?.success && infoRes.result) {
            isOnline = infoRes.result.online === true;
            deviceName = infoRes.result.name || '';
        }

        return NextResponse.json({
            connected: true,
            deviceId: station.iot_device_id,
            isOn,
            isOnline,
            deviceName,
        });
    } catch (error: any) {
        console.error('IoT GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/dashboard/iot
 * Send IoT command or manage IoT connection for a station
 * 
 * Actions:
 *   { stationId, action: "on" }       — Turn smart plug ON
 *   { stationId, action: "off" }      — Turn smart plug OFF
 *   { stationId, action: "connect", deviceId: "xxx" }  — Link device to station
 *   { stationId, action: "disconnect" }  — Unlink device from station
 *   { stationId, action: "test" }     — Test device connection
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { stationId, action, deviceId } = body;

        if (!stationId || !action) {
            return NextResponse.json({ error: 'stationId and action required' }, { status: 400 });
        }

        // --- CONNECT / DISCONNECT ---
        if (action === 'connect') {
            if (!deviceId) {
                return NextResponse.json({ error: 'deviceId required for connect' }, { status: 400 });
            }

            // Test the device first
            try {
                const info = await getDeviceInfo(deviceId);
                if (!info.success) {
                    return NextResponse.json({
                        error: `Device not found or inaccessible: ${info.msg || 'Unknown'}`,
                    }, { status: 400 });
                }

                // Save to station
                const { error: updateError } = await supabase
                    .from('stations')
                    .update({ iot_device_id: deviceId })
                    .eq('id', stationId);

                if (updateError) throw updateError;

                return NextResponse.json({
                    success: true,
                    message: 'Device connected',
                    deviceName: info.result?.name || deviceId,
                    isOnline: info.result?.online === true,
                });
            } catch (err: any) {
                return NextResponse.json({
                    error: `Failed to connect device: ${err.message}`,
                }, { status: 400 });
            }
        }

        if (action === 'disconnect') {
            const { error: updateError } = await supabase
                .from('stations')
                .update({ iot_device_id: null })
                .eq('id', stationId);

            if (updateError) throw updateError;

            return NextResponse.json({ success: true, message: 'Device disconnected' });
        }

        // --- ON / OFF / TEST ---
        // Get station's iot_device_id
        const { data: station, error: stationError } = await supabase
            .from('stations')
            .select('id, iot_device_id')
            .eq('id', stationId)
            .single();

        if (stationError || !station) {
            return NextResponse.json({ error: 'Station not found' }, { status: 404 });
        }

        if (!station.iot_device_id) {
            // No IoT device linked — silently succeed (fire-and-forget friendly)
            return NextResponse.json({ success: true, skipped: true, message: 'No IoT device linked' });
        }

        if (action === 'test') {
            const info = await getDeviceInfo(station.iot_device_id);
            const status = await getDeviceStatus(station.iot_device_id);

            let isOn = false;
            if (status?.success && Array.isArray(status.result)) {
                const sw = status.result.find((s: any) => s.code === 'switch_1' || s.code === 'switch');
                if (sw) isOn = sw.value === true;
            }

            return NextResponse.json({
                success: info.success,
                isOnline: info.result?.online === true,
                isOn,
                deviceName: info.result?.name || '',
                error: info.success ? undefined : info.msg,
            });
        }

        if (action === 'on' || action === 'off') {
            const result = await sendDeviceCommand(station.iot_device_id, [
                { code: 'switch_1', value: action === 'on' },
            ]);

            return NextResponse.json({
                success: result.success === true,
                message: result.success ? `Smart plug turned ${action.toUpperCase()}` : (result.msg || 'Command failed'),
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('IoT POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
