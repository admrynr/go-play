import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const GRACE_TIME_MINUTES = 5; // tolerance before auto-cancel

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = await createClient();

    // Resolve slug → page
    const { data: page } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const cutoff = new Date(Date.now() - GRACE_TIME_MINUTES * 60_000).toISOString();

    // Find pending bookings that are past grace time
    const { data: noShows } = await supabase
        .from('bookings')
        .select('id, wa_number, station_id')
        .eq('page_id', page.id)
        .eq('status', 'pending')
        .lt('start_time', cutoff);

    if (!noShows || noShows.length === 0) {
        return NextResponse.json({ cancelled: 0, blacklisted: 0 });
    }

    const ids = noShows.map(b => b.id);
    const waNumbers = [...new Set(noShows.map(b => b.wa_number))];

    // Mark as no_show
    await supabase
        .from('bookings')
        .update({ status: 'no_show' })
        .in('id', ids);

    // Add to blacklist (upsert — ignore duplicates)
    const blacklistRows = waNumbers.map(wa => ({
        page_id: page.id,
        wa_number: wa,
        reason: 'no_show',
    }));

    await supabase
        .from('wa_blacklist')
        .upsert(blacklistRows, { onConflict: 'page_id,wa_number', ignoreDuplicates: true });

    return NextResponse.json({ cancelled: ids.length, blacklisted: waNumbers.length });
}
