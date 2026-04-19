'use client';

import { useState, useEffect } from 'react';
import { Monitor, QrCode, Clock, AlertCircle, ShoppingBag } from 'lucide-react';

interface Props {
    stations: any[];
    activeSessions: Record<string, any>;
    stationRequests: Record<string, any[]>;
    pendingOrders: Record<string, any[]>;
    rates: Record<string, any>;
    pageSlug: string;
}

export default function PreviewStationsClient({ stations, activeSessions, stationRequests, pendingOrders, rates, pageSlug }: Props) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

    const formatDuration = (ms: number) => {
        if (ms < 0) return '00:00:00';
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Stations</h1>
                    <p className="text-gray-400">Manage your consoles and screens</p>
                </div>
                {/* No Add Station button in preview */}
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stations.map((station, index) => {
                    let session = activeSessions[station.id];
                    let confirmedBk: any = null;

                    // Mock data for realism in preview
                    if (index === 0) {
                        session = { type: 'timer', start_time: new Date(now.getTime() - 40 * 60000).toISOString(), duration_minutes: 60 };
                    } else if (index === 1) {
                        session = { type: 'open', start_time: new Date(now.getTime() - 110 * 60000).toISOString(), duration_minutes: 0 };
                    } else if (index === 2) {
                        session = null;
                        confirmedBk = {
                            nickname: 'Budi (Preview)',
                            booking_code: 'GP-BDI-882',
                            start_time: new Date(now.getTime() + 15 * 60000).toISOString()
                        };
                    }
                    const isActive = !!session;
                    const rateConfig = rates[station.type] || { hourly: 0 };

                    let timeDisplay = 'IDLE';
                    let costDisplay = 'Rp --';
                    let statusLabel = station.type;

                    if (isActive && session) {
                        const start = new Date(session.start_time).getTime();
                        const current = now.getTime();

                        if (session.type === 'timer' || session.type === 'rental') {
                            const durationMs = session.duration_minutes * 60 * 1000;
                            const end = start + durationMs;
                            const remaining = end - current;
                            timeDisplay = formatDuration(remaining);

                            let estimatedCost = 0;
                            if (session.type === 'rental') {
                                if (session.duration_minutes >= 1440) estimatedCost = rateConfig.daily * (session.duration_minutes / 1440);
                                else if (session.duration_minutes >= 720) estimatedCost = rateConfig.halfDay;
                                else estimatedCost = (session.duration_minutes / 60) * rateConfig.hourly;
                            } else {
                                estimatedCost = (session.duration_minutes / 60) * rateConfig.hourly;
                            }
                            costDisplay = formatCurrency(estimatedCost);
                            if (remaining < 0) timeDisplay = 'OVERDUE';
                            statusLabel = session.type === 'rental' ? 'RENTED OUT' : 'BUSY';
                        } else {
                            const elapsed = current - start;
                            timeDisplay = formatDuration(elapsed);
                            const hours = elapsed / (1000 * 60 * 60);
                            costDisplay = formatCurrency(Math.ceil(hours * rateConfig.hourly));
                            statusLabel = 'BUSY';
                        }
                    }

                    return (
                        <div
                            key={station.id}
                            className={`bg-surface border rounded-2xl p-6 relative transition-all ${isActive ? 'border-primary shadow-lg shadow-primary/10' : 'border-white/10'}`}
                        >
                            {/* Top-right actions (read-only) */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <div
                                    className="p-2 text-gray-400 rounded-lg"
                                    title="Player Interface"
                                >
                                    <Monitor className="w-4 h-4" />
                                </div>
                                <div
                                    className="p-2 text-gray-400 rounded-lg"
                                    title="QR Code"
                                >
                                    <QrCode className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-xl ${station.type === 'PS5' ? 'bg-blue-600/20 text-blue-400' : 'bg-indigo-600/20 text-indigo-400'}`}>
                                    <Monitor className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{station.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full uppercase font-bold bg-white/10 text-gray-400">
                                            {station.type}
                                        </span>
                                        {isActive && (
                                            <span className="text-xs px-2 py-0.5 rounded-full uppercase font-bold bg-green-500/20 text-green-400">
                                                {statusLabel}
                                            </span>
                                        )}
                                        {!isActive && confirmedBk && (
                                            <span className="text-xs px-2 py-0.5 rounded-full uppercase font-bold bg-yellow-500/20 text-yellow-400">
                                                BOOKED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pending Requests (display only) */}
                            {stationRequests[station.id] && stationRequests[station.id].length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {stationRequests[station.id].map((req, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg border text-sm ${req.type === 'stop_session' ? 'bg-red-500/10 border-red-500/30' :
                                                req.type === 'add_time' ? 'bg-blue-500/10 border-blue-500/30' :
                                                    'bg-yellow-500/10 border-yellow-500/30'}`}
                                        >
                                            <div className="font-bold flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {req.type === 'stop_session' && <span className="text-red-400">Permintaan Berhenti</span>}
                                                {req.type === 'add_time' && <span className="text-blue-400">Tambah Waktu (+{req.payload?.duration_minutes}m)</span>}
                                                {req.type === 'call_operator' && <span className="text-yellow-400">Panggilan Operator</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pending Orders (display only) */}
                            {pendingOrders[station.id] && pendingOrders[station.id].length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {pendingOrders[station.id].map((order, idx) => (
                                        <div key={idx} className="p-3 rounded-lg border text-sm bg-purple-500/10 border-purple-500/30">
                                            <div className="font-bold flex items-center gap-1 text-purple-400">
                                                <ShoppingBag className="w-4 h-4" />
                                                Pesanan F&B Baru
                                            </div>
                                            <div className="text-gray-300 ml-5 text-sm">
                                                {order.order_items?.map((item: any, i: number) => (
                                                    <div key={i}>{item.quantity}x {item.menu_items?.name}</div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="bg-black/20 rounded-xl p-4 mb-4">
                                {isActive ? (
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">{session.type === 'rental' ? 'Due In' : 'Time'}</p>
                                            <p className={`text-2xl font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                                {timeDisplay}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 mb-1">Est. Bill</p>
                                            <p className="text-lg font-bold text-primary">{costDisplay}</p>
                                        </div>
                                    </div>
                                ) : confirmedBk ? (
                                    // BOOKED
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-400">Booking</p>
                                            <span className="text-xs font-mono font-bold text-yellow-400">{confirmedBk.booking_code}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-400">Nama</p>
                                            <p className="text-sm font-semibold">{confirmedBk.nickname}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-400">Datang</p>
                                            <p className="text-sm font-semibold">{new Date(confirmedBk.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-400">Batas check-in</p>
                                            <p className="text-sm font-semibold text-yellow-400">
                                                {new Date(new Date(confirmedBk.start_time).getTime() + 5 * 60_000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    // IDLE
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Status</p>
                                            <p className="text-2xl font-mono font-bold text-gray-500">IDLE</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 mb-1">Est. Bill</p>
                                            <p className="text-lg font-bold text-primary">Rp --</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* No action buttons in preview */}
                            <div className="grid gap-2">
                                <div className="w-full bg-white/5 text-gray-500 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                    <Monitor className="w-4 h-4" />
                                    {isActive ? 'Stop & Checkout' : confirmedBk ? 'Aktifkan Booking' : 'Start Session'}
                                    <span className="text-xs ml-1">(Preview)</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
