'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Monitor, Clock, DollarSign, ChefHat, Plus, ExternalLink, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [page, setPage] = useState<any>(null);
    const [stats, setStats] = useState({
        activeStations: 0,
        totalStations: 0,
        pendingOrders: 0,
        revenueToday: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Owner's Page
        const { data: pageData } = await supabase
            .from('pages')
            .select('*')
            .eq('owner_id', user.id)
            .single();

        setPage(pageData);

        if (pageData) {
            // Get Stats
            const { count: totalStations } = await supabase
                .from('stations')
                .select('*', { count: 'exact', head: true })
                .eq('page_id', pageData.id);

            const { count: activeSessions } = await supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('page_id', pageData.id)
                .eq('status', 'active');

            const { count: pendingOrders } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('page_id', pageData.id)
                .eq('status', 'pending');

            setStats({
                activeStations: activeSessions || 0,
                totalStations: totalStations || 0,
                pendingOrders: pendingOrders || 0,
                revenueToday: 0
            });

            // Get Revenue Today
            const msStart = new Date();
            msStart.setHours(0, 0, 0, 0);
            const { data: revenueData } = await supabase
                .from('sessions')
                .select('total_amount')
                .eq('page_id', pageData.id)
                .gte('end_time', msStart.toISOString())
                .eq('status', 'completed');

            const totalRevenue = revenueData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

            setStats(prev => ({ ...prev, revenueToday: totalRevenue }));
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

    if (!page) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Monitor className="w-16 h-16 text-gray-600 mb-6" />
                <h2 className="text-2xl font-bold mb-2">Belum ada Rental Profile</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    Anda belum mengatur profil rental PS anda. Silakan hubungi Super Admin untuk setup awal, atau jika anda adalah Super Admin, gunakan menu Admin.
                </p>
                <Link
                    href="/admin/websites/create"
                    className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                    Setup Rental Profile
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold mb-1">Overview</h1>
                    <p className="text-gray-400">Welcome back, {page.business_name}</p>
                </div>
                <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-white transition-colors bg-primary/10 px-4 py-2 rounded-lg"
                >
                    View Public Site <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stat Cards */}
                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <Monitor className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Stations</p>
                            <p className="text-2xl font-bold">{stats.totalStations}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Active Sessions</p>
                            <p className="text-2xl font-bold">{stats.activeStations}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400">
                            <ChefHat className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Kitchen Orders</p>
                            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Today's Revenue</p>
                            <p className="text-2xl font-bold">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.revenueToday)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/dashboard/stations"
                    className="p-4 bg-surface border border-white/10 rounded-xl hover:bg-white/5 transition-colors flex flex-col items-center text-center gap-2"
                >
                    <Monitor className="w-8 h-8 text-primary" />
                    <span className="font-medium">Manage Stations</span>
                </Link>
                <Link
                    href="/dashboard/menu"
                    className="p-4 bg-surface border border-white/10 rounded-xl hover:bg-white/5 transition-colors flex flex-col items-center text-center gap-2"
                >
                    <UtensilsCrossed className="w-8 h-8 text-orange-400" />
                    <span className="font-medium">Update Menu</span>
                </Link>
            </div>
        </div>
    );
}
