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
        const { sessionId, phone, customerName } = body;

        if (!sessionId || !phone) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 1. Format Phone Number (08... -> 628...)
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.slice(1);
        }

        // 2. Get Session & Tenant Details
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                page:pages!inner (
                    id,
                    business_name,
                    tenant:tenants!inner (
                        id,
                        loyalty_program_active,
                        loyalty_target_hours
                    )
                )
            `)
            .eq('id', sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const tenant = session.page.tenant;
        const tenantId = tenant.id;

        // Check if loyalty is active
        if (!tenant.loyalty_program_active) {
            return NextResponse.json({
                success: true,
                message: 'Loyalty program inactive',
                pointsAdded: 0
            });
        }

        // 3. Calculate Points (Hours)
        // Round up to nearest hour? or specific logic? 
        // Plan says "total_hours". Let's use session.duration_minutes / 60.
        // Let's ceil it for generosity or float? 
        // The table uses NUMERIC, so we can store 1.5. 
        // But typically "Buy 10 hours" means 10 full hours.
        // Let's use exact hours (float) for 'total_hours' but maybe 'current_points' is also float.

        const hoursPlayed = (session.duration_minutes || 0) / 60;
        const pointsToAdd = Math.floor(hoursPlayed); // Standard: 1 point per FULL hour? Or just hours?
        // Let's stick to: 1 hour = 1 point. 
        // If they play 1.5 hours, do they get 1.5 points? 
        // 'current_points' is numeric, so let's give exact amount.
        const exactPoints = parseFloat(hoursPlayed.toFixed(1));

        // 4. Find or Create Player
        let { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('whatsapp', formattedPhone)
            .single();

        if (!player) {
            const { data: newPlayer, error: createError } = await supabaseAdmin
                .from('players')
                .insert({
                    tenant_id: tenantId,
                    whatsapp: formattedPhone,
                    name: customerName || 'Guest',
                    total_hours: 0,
                    current_points: 0
                })
                .select()
                .single();

            if (createError) throw createError;
            player = newPlayer;
        } else if (customerName && player.name === 'Guest') {
            // Update name if captured
            await supabaseAdmin.from('players').update({ name: customerName }).eq('id', player.id);
        }

        // 5. Update Points
        let newTotalHours = (player.total_hours || 0) + exactPoints;
        let newCurrentPoints = (player.current_points || 0) + exactPoints;
        let voucherCode = null;
        let rewardEarned = false;

        // 6. Check Reward
        const target = tenant.loyalty_target_hours || 10;

        if (newCurrentPoints >= target) {
            rewardEarned = true;
            newCurrentPoints = newCurrentPoints - target; // Reset/Deduct points

            // Generate Voucher
            // Format: V-[RANDOM]-[TenantSuffix?] -> Let's just use V-[RANDOM 5 CHARS]
            const code = `V-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const { error: voucherError } = await supabaseAdmin
                .from('vouchers')
                .insert({
                    tenant_id: tenantId,
                    player_id: player.id,
                    code: code,
                    hours_value: 1, // Default 1 hour free
                    status: 'active'
                });

            if (voucherError) throw voucherError;
            voucherCode = code;
        }

        // Save Player updates
        await supabaseAdmin
            .from('players')
            .update({
                total_hours: newTotalHours,
                current_points: newCurrentPoints
            })
            .eq('id', player.id);

        // 7. Construct WhatsApp Message
        const businessName = session.page.business_name;
        const totalPay = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(session.total_amount || 0);

        // Standard Message
        let message = `Halo kak ${player.name || 'Gamer'}! Terima kasih sudah main di ${businessName}. Total: ${totalPay}. Poin kamu nambah ${exactPoints} jam! Total Poin: ${newCurrentPoints}/${target}. Yuk main lagi biar dapet GRATIS 1 JAM!`;

        // Reward Message
        if (rewardEarned && voucherCode) {
            message = `LEVEL UP! 🔥 Selamat ${player.name || 'Champion'}, Misi Selesai! Kamu resmi dapat *VOUCHER GRATIS 1 JAM* di ${businessName}.\n\n🎫 Kode Voucher: *${voucherCode}*\n\nTunjukin chat ini ke kasir pas main berikutnya ya. Ditunggu, Champion! 🎮`;
        }

        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

        return NextResponse.json({
            success: true,
            pointsAdded: exactPoints,
            totalPoints: newCurrentPoints,
            targetPoints: target,
            rewardEarned,
            voucherCode,
            waUrl
        });

    } catch (error: any) {
        console.error('Loyalty Process Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
