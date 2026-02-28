import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PreviewDashboard from './PreviewDashboard';

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getTenantPreviewData(slug: string) {
    const supabase = await createClient();

    // Fetch tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('username', slug)
        .single();

    if (!tenant) return null;

    // If already claimed, don't show preview
    if (tenant.is_claimed) return { claimed: true, tenant };

    // Fetch page
    const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

    if (!page) return null;

    // Fetch stations
    const { data: stations } = await supabase
        .from('stations')
        .select('*')
        .eq('page_id', page.id);

    // Fetch sessions (completed, for stats)
    const { data: sessions } = await supabase
        .from('sessions')
        .select('*, stations(name)')
        .eq('page_id', page.id)
        .eq('status', 'completed')
        .order('end_time', { ascending: false });

    // Fetch orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price, menu_items(name))')
        .eq('page_id', page.id);

    // Fetch station requests
    const { count: pendingRequests } = await supabase
        .from('station_requests')
        .select('*', { count: 'exact', head: true })
        .eq('page_id', page.id)
        .eq('status', 'pending');

    return {
        claimed: false,
        tenant,
        page,
        stations: stations || [],
        sessions: sessions || [],
        orders: orders || [],
        pendingRequests: pendingRequests || 0,
    };
}

export default async function PreviewPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await getTenantPreviewData(slug);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4 text-center">
                <h1 className="text-4xl font-bold mb-4 text-primary">404</h1>
                <p className="text-xl mb-8">Preview tidak ditemukan.</p>
                <a href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    Kembali ke Beranda
                </a>
            </div>
        );
    }

    if (data.claimed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Akun Sudah Diklaim</h1>
                <p className="text-gray-400 mb-8">
                    <span className="text-primary font-bold">{data.tenant.business_name}</span> sudah mengambil alih akun ini.
                </p>
                <a href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                    Kembali ke Beranda
                </a>
            </div>
        );
    }

    return (
        <PreviewDashboard
            data={{
                tenant: data.tenant,
                page: data.page!,
                stations: data.stations!,
                sessions: data.sessions!,
                orders: data.orders!,
                pendingRequests: data.pendingRequests!,
            }}
            slug={slug}
        />
    );
}
