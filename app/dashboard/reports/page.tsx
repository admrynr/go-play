'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Download, Calendar, DollarSign, TrendingUp, Users, X, Receipt, Coffee, Ticket, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<any[]>([]);
    const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');
    const [summary, setSummary] = useState({ totalRevenue: 0, totalSessions: 0, avgRevenue: 0 });

    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [sessionDetails, setSessionDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Page
        const { data: page } = await supabase
            .from('pages')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (page) {
            let query = supabase
                .from('sessions')
                .select('*, stations(name)')
                .eq('page_id', page.id)
                .eq('status', 'completed')
                .order('end_time', { ascending: false });

            // Date Filter
            const now = new Date();
            let startDate = new Date();

            if (filter === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (filter === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (filter === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            }

            query = query.gte('end_time', startDate.toISOString());

            const { data } = await query;

            if (data) {
                setSessions(data);

                // Aggregation
                const total = data.reduce((sum, s) => sum + (s.total_amount || 0), 0);
                const count = data.length;
                setSummary({
                    totalRevenue: total,
                    totalSessions: count,
                    avgRevenue: count > 0 ? total / count : 0
                });
            }
        }
        setLoading(false);
    };

    const handleOpenDetails = async (session: any) => {
        setSelectedSession(session);
        setLoadingDetails(true);
        setSessionDetails(null);

        // Fetch Orders
        const { data: orders } = await supabase
            .from('orders')
            .select('*, order_items(quantity, price, menu_items(name))')
            .eq('session_id', session.id);

        setSessionDetails({
            orders: orders || []
        });
        setLoadingDetails(false);
    };

    const formatDuration = (ms: number) => {
        if (ms < 0) return "00:00:00";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleExport = () => {
        // Excel Export
        const headers = ["Session ID", "Station", "Start Time", "End Time", "Type", "Status", "Total Amount", "Payment Method"];
        const data = sessions.map(s => ({
            "Session ID": s.id,
            "Station": s.stations?.name || 'Unknown',
            "Start Time": new Date(s.start_time).toLocaleString(),
            "End Time": new Date(s.end_time).toLocaleString(),
            "Type": s.type,
            "Status": s.status,
            "Total Amount": s.total_amount,
            "Payment Method": s.payment_method || '-'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data, { header: headers });

        // Col width adjustment (optional but nice)
        const wscols = [
            { wch: 30 }, // Session ID
            { wch: 15 }, // Station
            { wch: 20 }, // Start
            { wch: 20 }, // End
            { wch: 10 }, // Type
            { wch: 10 }, // Status
            { wch: 15 }, // Amount
            { wch: 15 }  // Payment
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, `Report_${filter}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Reports</h1>
                    <p className="text-gray-400">Financial overview and analytics</p>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1">
                    {['today', 'week', 'month'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all ${filter === f ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                    <div className="p-4 bg-green-500/20 rounded-xl text-green-500">
                        <DollarSign className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase font-bold">Total Revenue</p>
                        <p className="text-2xl font-bold font-mono">{formatCurrency(summary.totalRevenue)}</p>
                    </div>
                </div>

                <div className="bg-surface border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                    <div className="p-4 bg-blue-500/20 rounded-xl text-blue-500">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase font-bold">Total Sessions</p>
                        <p className="text-2xl font-bold font-mono">{summary.totalSessions}</p>
                    </div>
                </div>

                <div className="bg-surface border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                    <div className="p-4 bg-purple-500/20 rounded-xl text-purple-500">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm uppercase font-bold">Avg. / Session</p>
                        <p className="text-2xl font-bold font-mono">{formatCurrency(summary.avgRevenue)}</p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-surface border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Recent Transactions</h2>
                    <button
                        onClick={handleExport}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
                    >
                        <Download className="w-4 h-4" />
                        Export to Excel
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10 text-sm uppercase">
                                <th className="p-4">Date</th>
                                <th className="p-4">Station</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                            ) : sessions.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No transactions found for this period.</td></tr>
                            ) : (
                                sessions.map(s => (
                                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-gray-300">
                                            {new Date(s.end_time).toLocaleDateString()} <br />
                                            <span className="text-xs text-gray-500">{new Date(s.end_time).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-4 font-bold">{s.stations?.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${s.type === 'rental' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {s.type}
                                            </span>
                                        </td>
                                        <td className="p-4 capitalize text-sm">{s.payment_method || '-'}</td>
                                        <td className="p-4 text-right font-mono font-bold text-green-400">
                                            {formatCurrency(s.total_amount)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleOpenDetails(s)}
                                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Session Detail Modal */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-primary" />
                                Detail Transaksi
                            </h2>
                            <button onClick={() => setSelectedSession(null)} className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Rental Info */}
                            <div>
                                <h3 className="text-sm text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Info Rental
                                </h3>
                                <div className="bg-black/20 p-4 rounded-xl space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Station</span>
                                        <span className="font-bold">{selectedSession.stations?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Tipe Sesi</span>
                                        <span className="font-bold uppercase">{selectedSession.type}</span>
                                    </div>
                                    {selectedSession.type === 'timer' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Durasi Timer</span>
                                            <span className="font-bold">{selectedSession.duration_minutes} Menit</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Waktu Mulai</span>
                                        <span className="font-mono">{new Date(selectedSession.start_time).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Waktu Selesai</span>
                                        <span className="font-mono">{new Date(selectedSession.end_time).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-white/10">
                                        <span className="text-gray-400">Lama Bermain (Real)</span>
                                        <span className="font-mono font-bold">{formatDuration(new Date(selectedSession.end_time).getTime() - new Date(selectedSession.start_time).getTime())}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Voucher Info */}
                            {selectedSession.voucher_code && (
                                <div>
                                    <h3 className="text-sm text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                        <Ticket className="w-4 h-4" /> Voucher Terpakai
                                    </h3>
                                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex justify-between items-center">
                                        <span className="text-green-400 font-bold">{selectedSession.voucher_code}</span>
                                        <span className="text-green-400 text-sm font-bold">- 1 Jam (Potongan)</span>
                                    </div>
                                </div>
                            )}

                            {/* F&B Orders */}
                            <div>
                                <h3 className="text-sm text-gray-400 uppercase font-bold mb-3 flex items-center gap-2">
                                    <Coffee className="w-4 h-4" /> Pesanan F&B
                                </h3>
                                <div className="bg-black/20 p-4 rounded-xl">
                                    {loadingDetails ? (
                                        <p className="text-center text-sm text-gray-500 py-2">Memuat pesanan...</p>
                                    ) : sessionDetails?.orders?.length > 0 ? (
                                        <div className="space-y-3">
                                            {sessionDetails.orders.map((order: any, idx: number) => (
                                                <div key={idx} className="space-y-1 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                                    {order.order_items?.map((item: any, i: number) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span>{item.quantity}x {item.menu_items?.name}</span>
                                                            <span className="font-mono text-gray-400">{formatCurrency(item.price * item.quantity)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between text-sm font-bold pt-1">
                                                        <span>Subtotal</span>
                                                        <span className="font-mono">{formatCurrency(order.total_amount)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-sm text-gray-500 py-2">Tidak ada pesanan F&B.</p>
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-400">Total Tagihan ({selectedSession.payment_method?.toUpperCase()})</p>
                                    </div>
                                    <p className="text-2xl font-bold font-mono text-white">{formatCurrency(selectedSession.total_amount)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
