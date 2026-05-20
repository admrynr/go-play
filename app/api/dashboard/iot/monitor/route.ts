import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBatchDeviceStatus, getDeviceStatus } from '@/lib/tuya';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/dashboard/iot/monitor
 * 
 * Two modes:
 * 1. Batch mode (pageId): Fetches power status of ALL smart plugs for a page.
 *    Used for background polling every 5 minutes.
 * 
 * 2. Single mode (stationId): Fetches real-time power of ONE station's smart plug.
 *    Used for transactional validation before IR toggle (e.g. is TV already on?).
 *    Returns { success, watts: number }
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pageId = searchParams.get('pageId');
        const stationId = searchParams.get('stationId');

        // ─── Single Station Mode ───
        if (stationId) {
            const { data: station, error } = await supabase
                .from('stations')
                .select('id, smart_plug_id')
                .eq('id', stationId)
                .single();

            if (error || !station?.smart_plug_id) {
                // No smart plug configured — return -1 meaning "unknown / not available"
                return NextResponse.json({ success: true, watts: -1 });
            }

            const tuyaRes = await getDeviceStatus(station.smart_plug_id);

            if (!tuyaRes.success) {
                console.error('Single device status failed:', tuyaRes.msg);
                return NextResponse.json({ success: true, watts: -1 });
            }

            const statusArray = tuyaRes.result || [];
            const powerStatus = statusArray.find((s: any) => s.code === 'cur_power');
            const watts = powerStatus !== undefined ? (powerStatus.value as number) / 10 : -1;

            return NextResponse.json({ success: true, watts });
        }

        // ─── Batch Mode (existing) ───
        if (!pageId) {
            return NextResponse.json({ error: 'pageId or stationId required' }, { status: 400 });
        }

        // Fetch stations with smart plugs
        const { data: stations, error } = await supabase
            .from('stations')
            .select('id, smart_plug_id')
            .eq('page_id', pageId)
            .not('smart_plug_id', 'is', null);

        if (error) throw error;

        if (!stations || stations.length === 0) {
            return NextResponse.json({ success: true, powerData: {} });
        }

        // Extract unique smart plug IDs
        const deviceIds = [...new Set(stations.map(s => s.smart_plug_id).filter(Boolean) as string[])];

        // Fetch batch status from Tuya (1 API call for all devices!)
        const tuyaRes = await getBatchDeviceStatus(deviceIds);

        if (!tuyaRes.success) {
            console.error('Batch status fetch failed:', tuyaRes.msg);
            return NextResponse.json({ success: false, error: tuyaRes.msg }, { status: 500 });
        }

        // Map the results back to stations
        const powerData: Record<string, number> = {};
        
        // Tuya batch result format: { result: { "deviceId1": [{code: "cur_power", value: 120}], "deviceId2": [...] } }
        const devicesStatusMap = tuyaRes.result || {};
        
        stations.forEach(station => {
            if (!station.smart_plug_id) return;
            
            const statusArray = devicesStatusMap[station.smart_plug_id];
            if (statusArray && Array.isArray(statusArray)) {
                // Find cur_power in the status array
                const powerStatus = statusArray.find((s: any) => s.code === 'cur_power');
                if (powerStatus !== undefined) {
                    // power is usually returned as 1/10th of a Watt in Tuya API (e.g. 120 = 12W)
                    powerData[station.id] = (powerStatus.value as number) / 10;
                } else {
                    powerData[station.id] = 0;
                }
            } else {
                powerData[station.id] = 0; // default if not found
            }
        });

        return NextResponse.json({ success: true, powerData });

    } catch (err: any) {
        console.error('IoT Monitor Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
