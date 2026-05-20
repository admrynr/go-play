import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendIRCommand, getIRRemotes, getIRRemoteKeys, getDeviceInfo } from '@/lib/tuya';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/dashboard/iot?stationId=xxx
 * Get IR blaster status for a station
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const stationId = searchParams.get('stationId');

        if (!stationId) {
            return NextResponse.json({ error: 'stationId required' }, { status: 400 });
        }

        // Get station with IR config
        const { data: station, error: stationError } = await supabase
            .from('stations')
            .select('id, ir_infrared_id, ir_remote_id, smart_plug_id, page_id')
            .eq('id', stationId)
            .single();

        if (stationError || !station) {
            return NextResponse.json({ error: 'Station not found' }, { status: 404 });
        }

        // We can consider it connected if it has either IR blaster OR Smart Plug
        if (!station.ir_infrared_id && !station.ir_remote_id && !station.smart_plug_id) {
            return NextResponse.json({ connected: false, message: 'No IoT devices linked' });
        }

        // Get IR blaster info + remote list if IR is set
        let isOnline = false;
        let blasterName = '';
        let remoteName = '';

        if (station.ir_infrared_id) {
            const [deviceInfo, remotesRes] = await Promise.all([
                getDeviceInfo(station.ir_infrared_id),
                getIRRemotes(station.ir_infrared_id),
            ]);

            if (deviceInfo?.success && deviceInfo.result) {
                isOnline = deviceInfo.result.online === true;
                blasterName = deviceInfo.result.name || '';
            }

            // Find the specific remote
            if (remotesRes?.success && Array.isArray(remotesRes.result)) {
                const remote = remotesRes.result.find((r: any) => r.remote_id === station.ir_remote_id);
                if (remote) {
                    remoteName = remote.remote_name || '';
                }
            }
        }

        return NextResponse.json({
            connected: true,
            infraredId: station.ir_infrared_id,
            remoteId: station.ir_remote_id,
            smartPlugId: station.smart_plug_id,
            isOnline,
            blasterName,
            remoteName,
        });
    } catch (error: any) {
        console.error('IoT GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/dashboard/iot
 * Send IR command or manage IR blaster connection for a station
 * 
 * Actions:
 *   { stationId, action: "power" }    — Send power toggle via IR
 *   { stationId, action: "on" }       — Alias for power (for billing flow compatibility)
 *   { stationId, action: "off" }      — Alias for power (for billing flow compatibility)
 *   { stationId, action: "connect", infraredId, remoteId }  — Link IR blaster to station
 *   { stationId, action: "disconnect" }  — Unlink IR blaster from station
 *   { stationId, action: "test" }     — Test power command
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { stationId, action, infraredId, remoteId, smartPlugId } = body;

        if (!stationId || !action) {
            return NextResponse.json({ error: 'stationId and action required' }, { status: 400 });
        }

        // --- CONNECT ---
        if (action === 'connect') {
            try {
                let blasterName = infraredId;
                let remoteName = remoteId;
                let isOnline = false;

                // Only verify IR if provided
                if (infraredId && remoteId) {
                    const info = await getDeviceInfo(infraredId);
                    if (!info.success) {
                        return NextResponse.json({ error: `IR blaster not found: ${info.msg || 'Unknown'}` }, { status: 400 });
                    }
                    isOnline = info.result?.online === true;
                    blasterName = info.result?.name || infraredId;

                    const remotes = await getIRRemotes(infraredId);
                    if (remotes?.success && Array.isArray(remotes.result)) {
                        const remote = remotes.result.find((r: any) => r.remote_id === remoteId);
                        if (!remote) {
                            return NextResponse.json({ error: `Remote ID not found. Available: ${remotes.result.map((r: any) => r.remote_name || r.remote_id).join(', ')}` }, { status: 400 });
                        }
                        remoteName = remote.remote_name || remoteId;
                    }
                }

                // Verify Smart Plug if provided
                if (smartPlugId) {
                    const plugInfo = await getDeviceInfo(smartPlugId);
                    if (!plugInfo.success) {
                        return NextResponse.json({ error: `Smart Plug not found: ${plugInfo.msg || 'Unknown'}` }, { status: 400 });
                    }
                }

                // Save to station
                const { error: updateError } = await supabase
                    .from('stations')
                    .update({
                        ir_infrared_id: infraredId || null,
                        ir_remote_id: remoteId || null,
                        smart_plug_id: smartPlugId || null
                    })
                    .eq('id', stationId);

                if (updateError) throw updateError;

                return NextResponse.json({
                    success: true,
                    message: 'IoT devices connected',
                    blasterName,
                    remoteName,
                    isOnline,
                });
            } catch (err: any) {
                return NextResponse.json({ error: `Failed to connect IoT: ${err.message}` }, { status: 400 });
            }
        }

        // --- DISCONNECT ---
        if (action === 'disconnect') {
            const { error: updateError } = await supabase
                .from('stations')
                .update({ ir_infrared_id: null, ir_remote_id: null, smart_plug_id: null })
                .eq('id', stationId);

            if (updateError) throw updateError;

            return NextResponse.json({ success: true, message: 'IoT devices disconnected' });
        }

        // --- POWER / ON / OFF / TEST ---
        // Get station's IR config
        const { data: station, error: stationError } = await supabase
            .from('stations')
            .select('id, ir_infrared_id, ir_remote_id')
            .eq('id', stationId)
            .single();

        if (stationError || !station) {
            return NextResponse.json({ error: 'Station not found' }, { status: 404 });
        }

        if (!station.ir_infrared_id || !station.ir_remote_id) {
            // No IR blaster linked — silently succeed (fire-and-forget friendly)
            return NextResponse.json({ success: true, skipped: true, message: 'No IR blaster linked' });
        }

        if (action === 'power' || action === 'on' || action === 'off' || action === 'test') {
            // TV IR is always a "power toggle" — there's no separate ON/OFF
            const result = await sendIRCommand(
                station.ir_infrared_id,
                station.ir_remote_id,
                'power'
            );

            console.log(`IR ${action} for station ${stationId}:`, JSON.stringify(result));

            return NextResponse.json({
                success: result.success === true,
                message: result.success
                    ? `TV power command sent`
                    : (result.msg || 'IR command failed'),
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('IoT POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
