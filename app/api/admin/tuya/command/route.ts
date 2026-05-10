import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDeviceCommand } from '@/lib/tuya';

export async function POST(request: Request) {
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

        const body = await request.json();
        const { code, value } = body;

        if (!code || value === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: code, value' },
                { status: 400 }
            );
        }

        const deviceId = process.env.TUYA_DEVICE_ID!;

        const result = await sendDeviceCommand(deviceId, [{ code, value }]);

        return NextResponse.json({
            success: true,
            result,
        });
    } catch (error: any) {
        console.error('Tuya command error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send command' },
            { status: 500 }
        );
    }
}
