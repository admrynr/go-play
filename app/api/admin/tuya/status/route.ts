import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDeviceStatus, getDeviceInfo } from '@/lib/tuya';

export async function GET(request: Request) {
    try {
        // Auth check: super admin only
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user || user.user_metadata?.role !== 1) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const deviceId = process.env.TUYA_DEVICE_ID!;

        // Fetch both status and device info in parallel
        const [statusRes, infoRes] = await Promise.all([
            getDeviceStatus(deviceId),
            getDeviceInfo(deviceId),
        ]);

        return NextResponse.json({
            success: true,
            status: statusRes,
            info: infoRes,
        });
    } catch (error: any) {
        console.error('Tuya status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get device status' },
            { status: 500 }
        );
    }
}
