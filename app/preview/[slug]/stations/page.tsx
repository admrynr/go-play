import { getPreviewPageData } from '@/lib/preview/getPreviewData';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PreviewStationsClient from './PreviewStationsClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function PreviewStationsPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await getPreviewPageData(slug);
    if (!data) redirect('/');

    const supabase = await createClient();
    const pageId = data.pageId;

    // Fetch stations
    const { data: stations } = await supabase
        .from('stations')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: true });

    // Fetch active sessions
    const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('page_id', pageId)
        .eq('status', 'active');

    const activeSessions: Record<string, any> = {};
    sessionsData?.forEach((s) => {
        activeSessions[s.station_id] = s;
    });

    // Fetch pending requests
    const { data: requestsData } = await supabase
        .from('station_requests')
        .select('*, session:sessions(station_id)')
        .eq('page_id', pageId)
        .eq('status', 'pending');

    const stationRequests: Record<string, any[]> = {};
    requestsData?.forEach((req) => {
        const sid = req.session?.station_id;
        if (sid) {
            if (!stationRequests[sid]) stationRequests[sid] = [];
            stationRequests[sid].push(req);
        }
    });

    // Fetch pending orders
    const { data: ordersData } = await supabase
        .from('orders')
        .select('*, session:sessions(station_id), order_items(quantity, menu_items(name))')
        .eq('page_id', pageId)
        .eq('status', 'pending');

    const pendingOrders: Record<string, any[]> = {};
    ordersData?.forEach((order) => {
        const sid = order.session?.station_id;
        if (sid) {
            if (!pendingOrders[sid]) pendingOrders[sid] = [];
            pendingOrders[sid].push(order);
        }
    });

    // Fetch rental rates
    const rates: Record<string, any> = {};
    const rawRates = data.page.rental_rates || {};
    Object.keys(rawRates).forEach((key) => {
        const current = rawRates[key];
        if (typeof current === 'number') {
            rates[key] = { hourly: current, halfDay: 0, daily: 0 };
        } else if (current && typeof current === 'object') {
            rates[key] = {
                hourly: current.hourly || 0,
                halfDay: current.halfDay || 0,
                daily: current.daily || 0,
            };
        }
    });

    return (
        <PreviewStationsClient
            stations={stations || []}
            activeSessions={activeSessions}
            stationRequests={stationRequests}
            pendingOrders={pendingOrders}
            rates={rates}
            pageSlug={data.page.slug}
        />
    );
}
