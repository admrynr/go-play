'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Monitor, Clock, DollarSign, ChefHat, Plus, ExternalLink, UtensilsCrossed, Rocket, CheckSquare, BarChart3, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [page, setPage] = useState<any>(null);
    const [stats, setStats] = useState({
        activeStations: 0,
        totalStations: 0,
        pendingOrders: 0,
        revenueToday: 0
    });
    const [sessions, setSessions] = useState<any[]>([]);
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

            // Fetch last 7 days sessions for chart
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { data: weekSessions } = await supabase
                .from('sessions')
                .select('total_amount, end_time')
                .eq('page_id', pageData.id)
                .eq('status', 'completed')
                .gte('end_time', weekAgo.toISOString())
                .order('end_time', { ascending: false });

            setSessions(weekSessions || []);
        }
        setLoading(false);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

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

    // Chart data
    const now = new Date();
    const dailyRevenue: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
        const rev = sessions
            .filter((s: any) => {
                const et = new Date(s.end_time);
                return et >= dayStart && et <= dayEnd;
            })
            .reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);
        dailyRevenue.push({
            label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
            value: rev,
        });
    }
    const maxRevenue = Math.max(...dailyRevenue.map((d) => d.value), 1);
    const chartW = 600;
    const chartH = 160;
    const chartPadding = 30;
    const chartPoints = dailyRevenue.map((d, i) => {
        const x = chartPadding + (i / Math.max(dailyRevenue.length - 1, 1)) * (chartW - chartPadding * 2);
        const y = chartH - chartPadding - ((d.value / maxRevenue) * (chartH - chartPadding * 2));
        return `${x},${y}`;
    });

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
                                {formatCurrency(stats.revenueToday)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            {sessions.length > 0 && (
                <div className="bg-surface border border-white/10 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Revenue Trend (7 Hari Terakhir)
                    </h2>
                    <p className="text-xs text-gray-500 mb-6">Pendapatan harian dari sesi bermain</p>
                    <div className="overflow-x-auto">
                        <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full min-w-[400px] h-auto">
                            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                                const y = chartH - chartPadding - pct * (chartH - chartPadding * 2);
                                return (
                                    <g key={pct}>
                                        <line x1={chartPadding} y1={y} x2={chartW - chartPadding} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                        <text x={chartPadding - 4} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8">
                                            {formatCurrency(maxRevenue * pct).replace('Rp', '')}
                                        </text>
                                    </g>
                                );
                            })}
                            <polygon
                                points={`${chartPadding},${chartH - chartPadding} ${chartPoints.join(' ')} ${chartPadding + ((dailyRevenue.length - 1) / Math.max(dailyRevenue.length - 1, 1)) * (chartW - chartPadding * 2)},${chartH - chartPadding}`}
                                fill="url(#dashChartGradient)"
                            />
                            <defs>
                                <linearGradient id="dashChartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(0,55,145,0.3)" />
                                    <stop offset="100%" stopColor="rgba(0,55,145,0)" />
                                </linearGradient>
                            </defs>
                            <polyline
                                points={chartPoints.join(' ')}
                                fill="none"
                                stroke="#003791"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            {dailyRevenue.map((d, i) => {
                                const x = chartPadding + (i / Math.max(dailyRevenue.length - 1, 1)) * (chartW - chartPadding * 2);
                                const y = chartH - chartPadding - ((d.value / maxRevenue) * (chartH - chartPadding * 2));
                                return (
                                    <g key={i}>
                                        <circle cx={x} cy={y} r="3.5" fill="#003791" stroke="#0A0A0A" strokeWidth="2" />
                                        <text x={x} y={chartH + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">
                                            {d.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            )}

            {/* Get Started Guide (shown when empty after claim) */}
            {stats.totalStations === 0 && (
                <div className="bg-gradient-to-br from-primary/10 to-blue-500/5 border border-primary/20 rounded-2xl p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/20 rounded-xl">
                            <Rocket className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Mulai Setup Rental Anda! 🚀</h2>
                            <p className="text-gray-400 text-sm">Ikuti langkah-langkah ini untuk memulai</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Atur Tarif Rental (Rental Rates)', href: '/dashboard/settings', done: false },
                            { label: 'Tambahkan Konsol PS Pertama Anda', href: '/dashboard/stations', done: false },
                            { label: 'Set Menu Makanan & Minuman', href: '/dashboard/menu', done: false },
                            { label: 'Generate QR Code Stations', href: '/dashboard/stations', done: false },
                            { label: 'Coba Buat Station Request & Order F&B', href: '/dashboard/kitchen', done: false },
                            { label: 'Lakukan Checkout Pertama', href: '/dashboard/stations', done: false },
                        ].map((item, i) => (
                            <Link
                                key={i}
                                href={item.href}
                                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group"
                            >
                                <CheckSquare className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                                <span className="text-sm font-medium group-hover:text-white transition-colors">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

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
                <Link
                    href="/dashboard/reports"
                    className="p-4 bg-surface border border-white/10 rounded-xl hover:bg-white/5 transition-colors flex flex-col items-center text-center gap-2"
                >
                    <BarChart3 className="w-8 h-8 text-green-400" />
                    <span className="font-medium">Reports</span>
                </Link>
            </div>
        </div>
    );
}
