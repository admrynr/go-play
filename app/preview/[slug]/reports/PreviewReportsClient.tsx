'use client';

import { useState } from 'react';
import { TrendingUp, Calendar, DollarSign, Hash } from 'lucide-react';

interface Props {
    sessions: any[];
    businessName: string;
}

export default function PreviewReportsClient({ sessions, businessName }: Props) {
    const [filter, setFilter] = useState<'today' | 'week' | 'month'>('week');

    const now = new Date();
    const getFilterDate = () => {
        const d = new Date(now);
        if (filter === 'today') d.setHours(0, 0, 0, 0);
        else if (filter === 'week') d.setDate(d.getDate() - 7);
        else d.setMonth(d.getMonth() - 1);
        return d;
    };

    const filteredSessions = sessions.filter((s) => new Date(s.end_time) >= getFilterDate());
    const totalRevenue = filteredSessions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalSessions = filteredSessions.length;
    const avgRevenue = totalSessions > 0 ? totalRevenue / totalSessions : 0;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    // Chart data
    const daysToShow = filter === 'today' ? 1 : filter === 'week' ? 7 : 14;
    const dailyData: { label: string; value: number }[] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
        const rev = filteredSessions
            .filter((s) => { const et = new Date(s.end_time); return et >= dayStart && et <= dayEnd; })
            .reduce((sum, s) => sum + (s.total_amount || 0), 0);
        dailyData.push({
            label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
            value: rev,
        });
    }
    const maxRev = Math.max(...dailyData.map((d) => d.value), 1);
    const chartW = 600, chartH = 160, padding = 30;
    const points = dailyData.map((d, i) => {
        const x = padding + (i / Math.max(dailyData.length - 1, 1)) * (chartW - padding * 2);
        const y = chartH - padding - ((d.value / maxRev) * (chartH - padding * 2));
        return `${x},${y}`;
    });

    return (
        <div>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Reports</h1>
                    <p className="text-gray-400">{businessName} — Transaction reports</p>
                </div>
                <div className="flex gap-2 bg-surface border border-white/10 rounded-xl p-1">
                    {(['today', 'week', 'month'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {f === 'today' ? 'Today' : f === 'week' ? 'Week' : 'Month'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Revenue</p>
                            <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <Hash className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Sessions</p>
                            <p className="text-xl font-bold">{totalSessions}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-surface border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Avg per Session</p>
                            <p className="text-xl font-bold">{formatCurrency(avgRevenue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            {dailyData.length > 1 && (
                <div className="bg-surface border border-white/10 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" /> Revenue Trend
                    </h2>
                    <p className="text-xs text-gray-500 mb-6">Pendapatan harian</p>
                    <div className="overflow-x-auto">
                        <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full min-w-[400px] h-auto">
                            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                                const y = chartH - padding - pct * (chartH - padding * 2);
                                return (
                                    <g key={pct}>
                                        <line x1={padding} y1={y} x2={chartW - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                        <text x={padding - 4} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8">
                                            {formatCurrency(maxRev * pct).replace('Rp', '')}
                                        </text>
                                    </g>
                                );
                            })}
                            <polygon
                                points={`${padding},${chartH - padding} ${points.join(' ')} ${padding + ((dailyData.length - 1) / Math.max(dailyData.length - 1, 1)) * (chartW - padding * 2)},${chartH - padding}`}
                                fill="url(#previewReportGrad)"
                            />
                            <defs>
                                <linearGradient id="previewReportGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(0,55,145,0.3)" />
                                    <stop offset="100%" stopColor="rgba(0,55,145,0)" />
                                </linearGradient>
                            </defs>
                            <polyline points={points.join(' ')} fill="none" stroke="#003791" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                            {dailyData.map((d, i) => {
                                const x = padding + (i / Math.max(dailyData.length - 1, 1)) * (chartW - padding * 2);
                                const y = chartH - padding - ((d.value / maxRev) * (chartH - padding * 2));
                                return (
                                    <g key={i}>
                                        <circle cx={x} cy={y} r="3.5" fill="#003791" stroke="#0A0A0A" strokeWidth="2" />
                                        <text x={x} y={chartH + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">{d.label}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10 text-xs uppercase">
                                <th className="p-3">Date</th>
                                <th className="p-3">Station</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Payment</th>
                                <th className="p-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSessions.slice(0, 15).map((s) => (
                                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-gray-300 text-xs">
                                        {new Date(s.end_time).toLocaleDateString('id-ID')}
                                        <br />
                                        <span className="text-gray-500">
                                            {new Date(s.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </td>
                                    <td className="p-3 font-medium">{s.stations?.name}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${s.type === 'open' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            {s.type}
                                        </span>
                                    </td>
                                    <td className="p-3 capitalize text-gray-400 text-xs">{s.payment_method || '-'}</td>
                                    <td className="p-3 text-right font-mono font-bold text-green-400">{formatCurrency(s.total_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* No Export button in preview */}
            </div>
        </div>
    );
}
