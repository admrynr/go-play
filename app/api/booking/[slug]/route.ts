import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ─── Constants (from online-booking.md) ──────────────────────────────────────
const LEAD_TIME_MINUTES = 10;  // earliest booking from now
const BUFFER_TIME_MINUTES = 5;  // cleanup gap between sessions

// ─── GET: Availability data for the booking page ──────────────────────────────
// Returns stations, active sessions, and pending/active bookings for today
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = await createClient();

    // Resolve slug → page
    const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('id, business_name, theme_color, whatsapp_number')
        .eq('slug', slug)
        .single();

    if (pageError || !page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Fetch stations
    const { data: stations } = await supabase
        .from('stations')
        .select('id, name, type, status')
        .eq('page_id', page.id)
        .order('name');

    // Fetch active sessions (to know estimated end times)
    const { data: activeSessions } = await supabase
        .from('sessions')
        .select('id, station_id, start_time, end_time, type, status')
        .eq('page_id', page.id)
        .eq('status', 'active');

    // Fetch open (pending/active) bookings for today and future
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: bookings } = await supabase
        .from('bookings')
        .select('id, station_id, start_time, end_time, status, nickname')
        .eq('page_id', page.id)
        .in('status', ['pending', 'active'])
        .gte('start_time', todayStart.toISOString())
        .order('start_time');

    return NextResponse.json({
        page,
        stations: stations ?? [],
        activeSessions: activeSessions ?? [],
        bookings: bookings ?? [],
        constants: { LEAD_TIME_MINUTES, BUFFER_TIME_MINUTES },
    });
}

// ─── POST: Create a booking ───────────────────────────────────────────────────
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = await createClient();

    const body = await req.json();
    const { station_id, nickname, wa_number, start_time, end_time } = body;

    if (!station_id || !nickname || !wa_number || !start_time || !end_time) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve slug → page
    const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', slug)
        .single();

    if (pageError || !page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // 1. Check blacklist
    const { data: blacklisted } = await supabase
        .from('wa_blacklist')
        .select('id')
        .eq('page_id', page.id)
        .eq('wa_number', wa_number)
        .maybeSingle();

    if (blacklisted) {
        return NextResponse.json(
            { error: 'BLACKLISTED', message: 'Nomor Anda diblokir karena riwayat No-Show. Silakan datang ke lokasi untuk membuka blokir.' },
            { status: 403 }
        );
    }

    // 2. Validate station belongs to this page
    const { data: station } = await supabase
        .from('stations')
        .select('id, status')
        .eq('id', station_id)
        .eq('page_id', page.id)
        .single();

    if (!station) {
        return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    // 3. Check time conflict with existing bookings on the same station
    const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('station_id', station_id)
        .in('status', ['pending', 'active'])
        .lt('start_time', end_time)    // existing starts before our end
        .gt('end_time', start_time);   // existing ends after our start

    if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
            { error: 'CONFLICT', message: 'Stasiun sudah dipesan pada waktu tersebut. Pilih waktu atau stasiun lain.' },
            { status: 409 }
        );
    }

    // 4. Validate LEAD_TIME (start_time must be >= now + 10 min)
    const minStart = new Date(Date.now() + LEAD_TIME_MINUTES * 60_000);
    if (new Date(start_time) < minStart) {
        return NextResponse.json(
            { error: 'TOO_SOON', message: `Booking minimal ${LEAD_TIME_MINUTES} menit dari sekarang.` },
            { status: 400 }
        );
    }

    // 5. Generate unique booking code
    const booking_code = await generateUniqueCode(supabase);

    // 6. Insert booking
    const { data: booking, error: insertError } = await supabase
        .from('bookings')
        .insert({
            booking_code,
            page_id: page.id,
            station_id,
            nickname,
            wa_number,
            start_time,
            end_time,
            status: 'pending',
        })
        .select()
        .single();

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ booking }, { status: 201 });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function generateUniqueCode(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 10; attempt++) {
        const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const code = `BK-${suffix}`;
        const { data } = await supabase.from('bookings').select('id').eq('booking_code', code).maybeSingle();
        if (!data) return code;
    }
    // Fallback: timestamp-based
    return `BK-${Date.now().toString(36).toUpperCase().slice(-4)}`;
}
