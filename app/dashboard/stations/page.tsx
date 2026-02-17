'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Monitor, Trash2, QrCode, X, Play, Square, Clock, Timer, AlertCircle, ShoppingBag, Calendar, CreditCard, Banknote, CheckCircle, Download } from 'lucide-react';
import QRCode from "react-qr-code";

interface RateConfig {
    hourly: number;
    halfDay: number;
    daily: number;
}

export default function StationsPage() {
    const [stations, setStations] = useState<any[]>([]);
    const [activeSessions, setActiveSessions] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState<Record<string, RateConfig>>({});

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStartModal, setShowStartModal] = useState<string | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState<string | null>(null); // Station ID
    const [showQRModal, setShowQRModal] = useState<any | null>(null);

    // Page Info
    const [pageId, setPageId] = useState<string | null>(null);
    const [pageSlug, setPageSlug] = useState<string>('');

    // Forms
    const [stationForm, setStationForm] = useState({ name: '', type: '' });
    const [sessionMode, setSessionMode] = useState<'onsite' | 'rental'>('onsite');
    const [onsiteForm, setOnsiteForm] = useState({ type: 'open', duration: 60 });
    const [rentalForm, setRentalForm] = useState({ package: 'daily', duration: 1, customerName: '' });

    // Checkout State
    const [checkoutData, setCheckoutData] = useState<any>(null); // Summary data
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
    const [cashReceived, setCashReceived] = useState<string>(''); // string for input handling
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const supabase = createClient();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchData();
        // Set default station type once rates are loaded
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: page } = await supabase
            .from('pages')
            .select('id, slug, rental_rates')
            .eq('owner_id', user.id)
            .single();

        if (page) {
            setPageId(page.id);
            setPageSlug(page.slug);

            // Parse rates
            const parsedRates: Record<string, RateConfig> = {};
            const rawRates = page.rental_rates || {};

            Object.keys(rawRates).forEach(key => {
                const current = rawRates[key];
                if (typeof current === 'number') {
                    parsedRates[key] = { hourly: current, halfDay: 0, daily: 0 };
                } else if (current && typeof current === 'object') {
                    parsedRates[key] = {
                        hourly: current.hourly || 0,
                        halfDay: current.halfDay || 0,
                        daily: current.daily || 0
                    };
                }
            });
            setRates(parsedRates);

            // Fetch Stations
            const { data: stationsData } = await supabase
                .from('stations')
                .select('*')
                .eq('page_id', page.id)
                .order('created_at', { ascending: true });

            setStations(stationsData || []);

            // Fetch Active Sessions
            const { data: sessionsData } = await supabase
                .from('sessions')
                .select('*')
                .eq('page_id', page.id)
                .eq('status', 'active');

            const sessionsMap: Record<string, any> = {};
            sessionsData?.forEach(s => {
                sessionsMap[s.station_id] = s;
            });
            setActiveSessions(sessionsMap);
        }
        setLoading(false);
    };

    // --- Station Management ---

    const handleAddStation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pageId) return;

        // If no types exist, warn user
        const availableTypes = Object.keys(rates);
        if (availableTypes.length === 0) {
            alert('Please go to Settings to define Console Types first!');
            return;
        }

        const typeToUse = stationForm.type || availableTypes[0];

        setLoading(true);
        const { error } = await supabase.from('stations').insert({
            page_id: pageId,
            name: stationForm.name,
            type: typeToUse,
            status: 'idle'
        });

        if (error) alert('Failed to add station');
        else {
            setShowAddModal(false);
            setStationForm({ name: '', type: '' });
            fetchData();
        }
        setLoading(false);
    };

    const handleDeleteStation = async (id: string, name: string) => {
        if (confirm(`Delete station "${name}"?`)) {
            await supabase.from('stations').delete().eq('id', id);
            fetchData();
        }
    };

    // --- Session Start ---

    const handleStartSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showStartModal || !pageId) return;

        setLoading(true);
        const startTime = new Date().toISOString();
        let endTime = null;
        let durationMinutes = null;
        let sessionType = '';

        if (sessionMode === 'onsite') {
            sessionType = onsiteForm.type === 'timer' ? 'timer' : 'open';
            if (sessionType === 'timer') {
                durationMinutes = onsiteForm.duration;
                const end = new Date();
                end.setMinutes(end.getMinutes() + durationMinutes);
                endTime = end.toISOString();
            }
        } else {
            sessionType = 'rental';
            if (rentalForm.package === 'halfDay') {
                durationMinutes = 12 * 60 * rentalForm.duration;
            } else if (rentalForm.package === 'daily') {
                durationMinutes = 24 * 60 * rentalForm.duration;
            } else {
                durationMinutes = 60 * rentalForm.duration;
            }
            const end = new Date();
            end.setMinutes(end.getMinutes() + durationMinutes);
            endTime = end.toISOString();
        }

        const { error: sessionError } = await supabase.from('sessions').insert({
            station_id: showStartModal,
            page_id: pageId,
            start_time: startTime,
            end_time: endTime,
            duration_minutes: durationMinutes,
            type: sessionType,
            status: 'active',
            total_amount: 0,
        });

        await supabase.from('stations').update({ status: 'active' }).eq('id', showStartModal);

        if (sessionError) {
            alert('Failed to start session');
        } else {
            setShowStartModal(null);
            fetchData();
        }
        setLoading(false);
    };

    // --- Checkout Flow ---

    const handleOpenCheckout = async (stationId: string, stationType: string) => {
        const session = activeSessions[stationId];
        if (!session) return;

        setShowCheckoutModal(stationId);
        setCheckoutData(null); // Loading state inside modal

        // 1. Calculate Rental Cost
        const endTime = new Date();
        const startTime = new Date(session.start_time);
        const rateConfig = rates[stationType] || { hourly: 0, halfDay: 0, daily: 0 };
        let rentalCost = 0;

        if (session.type === 'open') {
            const diffMs = endTime.getTime() - startTime.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            rentalCost = Math.ceil(diffHours * rateConfig.hourly);
            // Min charge 1 hour? Let's just do ceil.
        } else if (session.type === 'timer') {
            const hours = (session.duration_minutes || 0) / 60;
            rentalCost = hours * rateConfig.hourly;
        } else if (session.type === 'rental') {
            // simplified recalc based on duration set
            const mins = session.duration_minutes || 0;
            if (mins >= 1440) rentalCost = (mins / 1440) * rateConfig.daily;
            else if (mins >= 720) rentalCost = (mins / 720) * rateConfig.halfDay;
            else rentalCost = (mins / 60) * rateConfig.hourly;
        }

        // 2. Fetch Orders
        // Make sure to fetch confirmed orders if you have status logic, but let's grab all for session
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('session_id', session.id); // Assuming simple checkout, unpaid orders

        const ordersTotal = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

        // 3. Set Data
        setCheckoutData({
            sessionId: session.id,
            rentalCost,
            ordersTotal,
            orders: orders || [],
            grandTotal: rentalCost + ordersTotal,
            stationType,
            startTime,
            endTime
        });
        setPaymentMethod('cash');
        setCashReceived('');
    };

    const handleFinishPayment = async () => {
        if (!checkoutData || !pageId) return;
        setIsProcessingPayment(true);

        const finalAmount = checkoutData.grandTotal;
        const cashIn = parseFloat(cashReceived) || 0;
        const change = cashIn - finalAmount;

        // Update Session
        const { error } = await supabase.from('sessions').update({
            status: 'completed',
            end_time: new Date().toISOString(),
            total_amount: finalAmount,
            payment_method: paymentMethod,
            cash_received: paymentMethod === 'cash' ? cashIn : null,
            change_given: paymentMethod === 'cash' ? change : null
        }).eq('id', checkoutData.sessionId);

        // Update Orders to Paid
        if (!error) {
            await supabase.from('orders')
                .update({ status: 'paid' })
                .eq('session_id', checkoutData.sessionId);
        }

        // Update Station
        await supabase.from('stations').update({ status: 'idle' }).eq('id', showCheckoutModal);

        if (error) {
            alert('Error completing transaction');
        } else {
            setShowCheckoutModal(null);
            fetchData();
        }
        setIsProcessingPayment(false);
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById("station-qr-code");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `QR-${showQRModal.name}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    // --- Helpers ---

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    // ... (formatDuration helpers same as before)
    const formatDuration = (ms: number) => {
        if (ms < 0) return "00:00:00";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading && stations.length === 0) return <div>Loading...</div>;

    const availableTypes = Object.keys(rates);

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Stations</h1>
                    <p className="text-gray-400">Manage your consoles and screens</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Station
                    </button>
                </div>
            </div>

            {/* Stations Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stations.map((station) => {
                    const session = activeSessions[station.id];
                    const isActive = !!session;

                    // RATE LOOKUP
                    const rateConfig = rates[station.type] || { hourly: 0 };

                    let timeDisplay = "IDLE";
                    let costDisplay = "Rp --";
                    let statusLabel = station.type;

                    if (isActive && session) {
                        const start = new Date(session.start_time).getTime();
                        const current = now.getTime();

                        if (session.type === 'timer' || session.type === 'rental') {
                            const durationMs = session.duration_minutes * 60 * 1000;
                            const end = start + durationMs;
                            const remaining = end - current;
                            timeDisplay = formatDuration(remaining);

                            // Cost calc
                            let estimatedCost = 0;
                            if (session.type === 'rental') {
                                if (session.duration_minutes >= 1440) estimatedCost = rateConfig.daily * (session.duration_minutes / 1440);
                                else if (session.duration_minutes >= 720) estimatedCost = rateConfig.halfDay;
                                else estimatedCost = (session.duration_minutes / 60) * rateConfig.hourly;
                            } else {
                                estimatedCost = (session.duration_minutes / 60) * rateConfig.hourly;
                            }
                            costDisplay = formatCurrency(estimatedCost);

                            if (remaining < 0) timeDisplay = "OVERDUE";
                            statusLabel = session.type === 'rental' ? 'RENTED OUT' : 'BUSY';
                        } else {
                            // Open billing
                            const elapsed = current - start;
                            timeDisplay = formatDuration(elapsed);
                            const hours = elapsed / (1000 * 60 * 60);
                            costDisplay = formatCurrency(Math.ceil(hours * rateConfig.hourly));
                            statusLabel = 'BUSY';
                        }
                    }

                    return (
                        <div key={station.id} className={`bg-surface border rounded-2xl p-6 relative group transition-all ${isActive ? 'border-primary shadow-lg shadow-primary/10' : 'border-white/10 hover:border-primary/50'
                            }`}>
                            <div className="absolute top-4 right-4 flex gap-2">
                                <a
                                    href={`/${pageSlug}/station/${station.id}`}
                                    target="_blank"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Open Player Interface"
                                >
                                    <Monitor className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => setShowQRModal(station)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Show QR"
                                >
                                    <QrCode className="w-4 h-4" />
                                </button>
                                {!isActive && (
                                    <button
                                        onClick={() => handleDeleteStation(station.id, station.name)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-xl ${station.type === 'PS5' ? 'bg-blue-600/20 text-blue-400' : 'bg-indigo-600/20 text-indigo-400'}`}>
                                    <Monitor className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{station.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'
                                            }`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-black/20 rounded-xl p-4 mb-4">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">{isActive ? (session.type === 'rental' ? 'Due In' : 'Time') : 'Status'}</p>
                                        <p className={`text-2xl font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                            {timeDisplay}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 mb-1">Est. Bill</p>
                                        <p className="text-lg font-bold text-primary">{costDisplay}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="grid gap-2">
                                {isActive ? (
                                    <button
                                        onClick={() => handleOpenCheckout(station.id, station.type)}
                                        className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/50 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Square className="w-4 h-4 fill-current" />
                                        Stop & Checkout
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowStartModal(station.id)}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:glow-box"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Start Session
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Station Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-6">Add New Station</h2>
                        <form onSubmit={handleAddStation} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Station Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. TV 1 or PS5 Unit 3"
                                    className="w-full bg-background border border-white/10 rounded-lg p-3 focus:border-primary focus:outline-none"
                                    value={stationForm.name}
                                    onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Type</label>
                                <select
                                    className="w-full bg-background border border-white/10 rounded-lg p-3"
                                    value={stationForm.type}
                                    onChange={(e) => setStationForm({ ...stationForm, type: e.target.value })}
                                >
                                    {availableTypes.length === 0 ? <option value="">No types defined in Settings</option> : null}
                                    {availableTypes.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl disabled:opacity-50" disabled={availableTypes.length === 0}>
                                Create Station
                            </button>
                            <button type="button" onClick={() => setShowAddModal(false)} className="w-full mt-2 text-gray-400">Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Payment & Checkout
                            </h2>
                            <button onClick={() => setShowCheckoutModal(null)}>
                                <X className="w-6 h-6 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-grow">
                            {!checkoutData ? (
                                <div className="text-center py-10"><h2 className="animate-pulse">Calculating Bill...</h2></div>
                            ) : (
                                <>
                                    {/* Summary List */}
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                            <div>
                                                <p className="font-bold">Rental Cost</p>
                                                <p className="text-xs text-gray-400">
                                                    Duration: {((new Date(checkoutData.endTime).getTime() - new Date(checkoutData.startTime).getTime()) / (1000 * 60)).toFixed(0)} mins
                                                </p>
                                            </div>
                                            <p className="font-mono font-bold">{formatCurrency(checkoutData.rentalCost)}</p>
                                        </div>

                                        {checkoutData.orders.length > 0 && (
                                            <div className="p-3 bg-white/5 rounded-lg space-y-2">
                                                <p className="font-bold border-b border-white/10 pb-2 mb-2">F&B Orders</p>
                                                {checkoutData.orders.map((o: any) => (
                                                    <div key={o.id} className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Order #{o.id.slice(0, 4)}</span>
                                                        <span>{formatCurrency(o.total_amount)}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between font-bold pt-2 border-t border-white/10">
                                                    <span>Subtotal F&B</span>
                                                    <span>{formatCurrency(checkoutData.ordersTotal)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center py-4 border-t-2 border-white/10">
                                            <p className="text-xl font-bold">TOTAL TO PAY</p>
                                            <p className="text-2xl font-bold text-primary">{formatCurrency(checkoutData.grandTotal)}</p>
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold mb-3 text-gray-400">Payment Method</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setPaymentMethod('cash')}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-green-500 bg-green-500/10 text-white' : 'border-white/10 text-gray-500 hover:border-white/30'
                                                    }`}
                                            >
                                                <Banknote className="w-6 h-6" />
                                                <span className="font-bold">CASH</span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('qris')}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'qris' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/10 text-gray-500 hover:border-white/30'
                                                    }`}
                                            >
                                                <QrCode className="w-6 h-6" />
                                                <span className="font-bold">QRIS</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cash Input */}
                                    {paymentMethod === 'cash' && (
                                        <div className="mb-6 p-4 bg-white/5 rounded-xl animate-in slide-in-from-top-2">
                                            <label className="block text-sm text-gray-400 mb-1">Cash Received</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-black/50 border border-white/20 rounded-lg py-3 pl-10 pr-4 text-xl font-mono focus:border-green-500 focus:outline-none"
                                                    value={cashReceived}
                                                    onChange={(e) => setCashReceived(e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>

                                            {/* Change Calculation */}
                                            {parseFloat(cashReceived) > 0 && (
                                                <div className="mt-4 flex justify-between items-center text-lg">
                                                    <span className="text-gray-400">Change / Kembalian:</span>
                                                    <span className={`font-bold font-mono ${(parseFloat(cashReceived) - checkoutData.grandTotal) < 0 ? 'text-red-500' : 'text-green-400'
                                                        }`}>
                                                        {formatCurrency(Math.max(0, parseFloat(cashReceived) - checkoutData.grandTotal))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 bg-surface">
                            <button
                                onClick={handleFinishPayment}
                                disabled={isProcessingPayment || (paymentMethod === 'cash' && (parseFloat(cashReceived) || 0) < (checkoutData?.grandTotal || 0))}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessingPayment ? <span className="animate-pulse">Processing...</span> : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Complete Payment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Start Modal (Existing) - Truncated for brevity if unchanged, but keeping it full for safety */}
            {showStartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Start Session</h2>
                            <button onClick={() => setShowStartModal(null)}>
                                <X className="w-6 h-6 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {/* Session Type Tabs */}
                        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
                            <button
                                onClick={() => setSessionMode('onsite')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${sessionMode === 'onsite' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Play On-Site
                            </button>
                            <button
                                onClick={() => setSessionMode('rental')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${sessionMode === 'rental' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Rent Out
                            </button>
                        </div>

                        <form onSubmit={handleStartSession} className="space-y-6">
                            {/* ON SITE */}
                            {sessionMode === 'onsite' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setOnsiteForm({ ...onsiteForm, type: 'timer' })}
                                            className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-all ${onsiteForm.type === 'timer' ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <Timer className="w-6 h-6 mx-auto mb-2 text-primary" />
                                            <p className="font-bold">Timer</p>
                                        </div>
                                        <div
                                            onClick={() => setOnsiteForm({ ...onsiteForm, type: 'open' })}
                                            className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-all ${onsiteForm.type === 'open' ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                            <p className="font-bold">Open Bill</p>
                                        </div>
                                    </div>
                                    {onsiteForm.type === 'timer' && (
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Duration (Minutes)</label>
                                            <div className="grid grid-cols-4 gap-2 mb-2">
                                                {[30, 60, 120, 180].map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => setOnsiteForm({ ...onsiteForm, duration: m })}
                                                        className={`py-2 rounded-lg text-sm border ${onsiteForm.duration === m ? 'bg-primary text-white border-primary' : 'border-white/10 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {m}m
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                                value={onsiteForm.duration}
                                                onChange={(e) => setOnsiteForm({ ...onsiteForm, duration: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* RENTAL */}
                            {sessionMode === 'rental' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRentalForm({ ...rentalForm, package: 'daily', duration: 1 })}
                                            className={`p-3 rounded-xl border text-center ${rentalForm.package === 'daily' ? 'border-primary bg-primary/10' : 'border-white/10'
                                                }`}
                                        >
                                            <Calendar className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs font-bold block">Daily</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRentalForm({ ...rentalForm, package: 'halfDay', duration: 1 })}
                                            className={`p-3 rounded-xl border text-center ${rentalForm.package === 'halfDay' ? 'border-primary bg-primary/10' : 'border-white/10'
                                                }`}
                                        >
                                            <Clock className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs font-bold block">12h</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRentalForm({ ...rentalForm, package: 'custom', duration: 1 })}
                                            className={`p-3 rounded-xl border text-center ${rentalForm.package === 'custom' ? 'border-primary bg-primary/10' : 'border-white/10'
                                                }`}
                                        >
                                            <Timer className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs font-bold block">Hourly</span>
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">
                                            {rentalForm.package === 'daily' ? 'Days' : rentalForm.package === 'halfDay' ? 'Qty (12h blocks)' : 'Hours'}
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                            value={rentalForm.duration}
                                            onChange={(e) => setRentalForm({ ...rentalForm, duration: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl">
                                Start Session
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* QR Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Station QR Code</h2>
                            <button onClick={() => setShowQRModal(null)}>
                                <X className="w-6 h-6 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
                            <QRCode
                                id="station-qr-code"
                                value={`${window.location.origin}/${pageSlug}/station/${showQRModal.id}`}
                                size={200}
                            />
                        </div>

                        <p className="font-bold text-lg mb-1">{showQRModal.name}</p>
                        <p className="text-sm text-gray-400 mb-6">Scan to open Player Interface</p>

                        <button
                            onClick={handleDownloadQR}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download Image
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
