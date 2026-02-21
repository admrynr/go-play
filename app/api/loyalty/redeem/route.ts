import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { stationId, pageId, voucherCode, durationMinutes, type } = body;

        if (!stationId || !pageId || !voucherCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 1. Validate Voucher
        const { data: voucher, error: voucherError } = await supabaseAdmin
            .from('vouchers')
            .select(`
                *,
                tenant:tenants!inner (
                    id,
                    user_id
                )
            `)
            .eq('code', voucherCode)
            .single();

        if (voucherError || !voucher) {
            return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
        }

        if (voucher.status !== 'active') {
            return NextResponse.json({ error: 'Voucher is already used or expired' }, { status: 400 });
        }

        // Verify Ownership (Tenant User ID must match Auth User ID)
        if (voucher.tenant.user_id !== user.id) {
            return NextResponse.json({ error: 'Voucher does not belong to this tenant' }, { status: 403 });
        }

        // 2. Mark Voucher Used
        const { error: updateError } = await supabaseAdmin
            .from('vouchers')
            .update({
                status: 'used',
                used_at: new Date().toISOString()
            })
            .eq('id', voucher.id);

        if (updateError) throw updateError;

        // 3. Create Session
        // Calculate Times
        const startTime = new Date();
        // Voucher Value (Usually 1 hour / 60 mins)
        // If durationMinutes is passed (e.g. 120 mins), we use that.
        // If not passed, we default to voucher value
        const effectiveDuration = durationMinutes || (voucher.hours_value * 60) || 60;

        const endTime = new Date(startTime.getTime() + effectiveDuration * 60000);

        const { error: sessionError } = await supabaseAdmin
            .from('sessions')
            .insert({
                station_id: stationId,
                page_id: pageId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                duration_minutes: effectiveDuration,
                type: type || 'timer',
                status: 'active',
                total_amount: 0, // Will be calculated at checkout, noting discount
                voucher_code: voucherCode
            });

        if (sessionError) {
            // Rollback Voucher
            await supabaseAdmin
                .from('vouchers')
                .update({ status: 'active', used_at: null })
                .eq('id', voucher.id);
            throw sessionError;
        }

        // Update Station Status
        await supabaseAdmin
            .from('stations')
            .update({ status: 'active' })
            .eq('id', stationId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Redeem Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
