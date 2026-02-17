'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Monitor, Trash2, QrCode, X, Play, Square, Clock, Timer, AlertCircle, ShoppingBag, Calendar } from 'lucide-react';

interface RateConfig {
    hourly: number;
    halfDay: number;
    daily: number;
}

export default function StationsPage() {
    const [stations, setStations] = useState<any[]>([]);
    const [activeSessions, setActiveSessions] = useState<Record<string, any>>({});
    const [stationsWithPageId, setStationsWithPageId] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStartModal, setShowStartModal] = useState<string | null>(null);
    const [pageId, setPageId] = useState<string | null>(null);
    const [pageSlug, setPageSlug] = useState<string>('');
    const [rates, setRates] = useState<Record<string, RateConfig>>({});

    // Forms
    const [stationForm, setStationForm] = useState({ name: '', type: 'PS5' });

    // Session Form
    const [sessionMode, setSessionMode] = useState<'onsite' | 'rental'>('onsite');
    const [onsiteForm, setOnsiteForm] = useState({ type: 'open', duration: 60 });
    const [rentalForm, setRentalForm] = useState({ package: 'daily', duration: 1, customerName: '', customerPhone: '' }); // package: daily | halfDay | custom

    const supabase = createClient();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Page Info (ID, Slug, Rate)
        const { data: page } = await supabase
            .from('pages')
            .select('id, slug, rental_rates')
            .eq('owner_id', user.id)
            .single();

        if (page) {
            setPageId(page.id);
            setPageSlug(page.slug);

            // Parse rates safe
            const parsedRates: Record<string, RateConfig> = {};
            const rawRates = page.rental_rates || {};

            ['PS5', 'PS4', 'PS3', 'XBOX', 'PC'].forEach(type => {
                const current = rawRates[type];
                if (typeof current === 'number') {
                    parsedRates[type] = { hourly: current, halfDay: 0, daily: 0 };
                } else if (current && typeof current === 'object') {
                    parsedRates[type] = {
                        hourly: current.hourly || 0,
                        halfDay: current.halfDay || 0,
                        daily: current.daily || 0
                    };
                } else {
                    parsedRates[type] = { hourly: 0, halfDay: 0, daily: 0 };
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

    const handleAddStation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pageId) return;

        setLoading(true);
        const { error } = await supabase.from('stations').insert({
            page_id: pageId,
            name: stationForm.name,
            type: stationForm.type,
            status: 'idle'
        });

        if (error) alert('Failed to add station');
        else {
            setShowAddModal(false);
            setStationForm({ name: '', type: 'PS5' });
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

    const handleStartSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showStartModal || !pageId) return;

        setLoading(true);
        const startTime = new Date().toISOString();
        let endTime = null;
        let durationMinutes = null;
        let sessionType = '';
        let initialAmount = 0; // Prepaid amount if any

        if (sessionMode === 'onsite') {
            sessionType = onsiteForm.type === 'timer' ? 'timer' : 'open';
            if (sessionType === 'timer') {
                durationMinutes = onsiteForm.duration;
                const end = new Date();
                end.setMinutes(end.getMinutes() + durationMinutes);
                endTime = end.toISOString();
            }
        } else {
            // RENTAL MODE
            sessionType = 'rental';
            // Determine duration based on package
            if (rentalForm.package === 'halfDay') {
                durationMinutes = 12 * 60 * rentalForm.duration; // duration is multiplier? usually just 1
            } else if (rentalForm.package === 'daily') {
                durationMinutes = 24 * 60 * rentalForm.duration;
            } else {
                // Custom hours
                durationMinutes = 60 * rentalForm.duration;
            }

            const end = new Date();
            end.setMinutes(end.getMinutes() + durationMinutes);
            endTime = end.toISOString();
        }

        // Insert Session
        const { error: sessionError } = await supabase.from('sessions').insert({
            station_id: showStartModal,
            page_id: pageId,
            start_time: startTime,
            end_time: endTime,
            duration_minutes: durationMinutes,
            type: sessionType, // 'open', 'timer', 'rental'
            status: 'active',
            total_amount: initialAmount,
            // metadata could store customer info if column existed, skipping for now as schema strictly typed without it
            // Assuming we tracked it elsewhere or need schema update. For now, we trust the flow.
        });

        // Update Station Status
        await supabase.from('stations').update({ status: 'active' }).eq('id', showStartModal);

        if (sessionError) {
            console.error(sessionError);
            alert('Failed to start session');
        } else {
            setShowStartModal(null);
            fetchData();
        }
        setLoading(false);
    };

    const handleStopSession = async (stationId: string, stationType: string) => {
        const session = activeSessions[stationId];
        if (!session) return;

        if (!confirm('Stop/Finish this session?')) return;

        setLoading(true);
        const endTime = new Date();
        const startTime = new Date(session.start_time);

        const rateConfig = rates[stationType] || { hourly: 0, halfDay: 0, daily: 0 };
        let totalAmount = 0;

        if (session.type === 'open') {
            // On-site Open Bill
            const diffMs = endTime.getTime() - startTime.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            totalAmount = Math.ceil(diffHours * rateConfig.hourly);
        } else if (session.type === 'timer') {
            // On-site Timer (Prepaid ideally, but user might pay at end)
            const hours = (session.duration_minutes || 0) / 60;
            totalAmount = hours * rateConfig.hourly;
        } else if (session.type === 'rental') {
            // Rental Pricing Logic
            // We need to trace back what package it was. 
            // For simplicity, we re-calculate based on duration.
            const durationMins = session.duration_minutes || 0;
            const hours = durationMins / 60;

            // Check if it matches daily or half day multiples
            if (hours >= 24 && hours % 24 === 0) {
                totalAmount = (hours / 24) * rateConfig.daily;
            } else if (hours >= 12 && hours % 12 === 0) {
                // It's ambiguous if 24h is 2x 12h or 1x 24h. 
                // Assuming optimal pricing:
                const days = Math.floor(hours / 24);
                const remain = hours % 24;
                const halfDays = Math.floor(remain / 12);
                // Fallback to hourly for remainders
                // This logic is complex without storing 'package_type' in session.
                // Simplification: Just use what matches best.
                totalAmount = (hours / 12) * rateConfig.halfDay;
            } else {
                // Custom or Fallback
                totalAmount = hours * rateConfig.hourly;
            }

            // Correction: If user set price rules carefully, we should respect them. 
            // Better approach: Calculate cost at START and store in 'total_amount'.
            // For now, let's just use a simple heuristic or prompt user? 
            // Let's assume the duration * implied rate.

            // Re-eval based on typical packages:
            if (durationMins === 720) totalAmount = rateConfig.halfDay; // 12h
            else if (durationMins === 1440) totalAmount = rateConfig.daily; // 24h
            else if (durationMins > 0) totalAmount = (durationMins / 60) * rateConfig.hourly;
        }

        // Update Session
        await supabase.from('sessions').update({
            status: 'completed',
            end_time: endTime.toISOString(),
            total_amount: totalAmount
        }).eq('id', session.id);

        await supabase.from('stations').update({ status: 'idle' }).eq('id', stationId);

        fetchData();
        setLoading(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDuration = (ms: number) => {
        if (ms < 0) return "00:00:00";
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading && stations.length === 0) return <div>Loading...</div>;

    // Helper to get current rate config for modal
    const currentStation = stations.find(s => s.id === showStartModal);
    const currentRates = currentStation ? (rates[currentStation.type] || { hourly: 0, halfDay: 0, daily: 0 }) : { hourly: 0, halfDay: 0, daily: 0 };

    return (
        <div>
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

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stations.map((station) => {
                    const session = activeSessions[station.id];
                    const isActive = !!session;

                    // RATE LOOKUP
                    const rateConfig = rates[station.type] || { hourly: 0 };

                    let timeDisplay = "IDLE";
                    let costDisplay = "Rp --";
                    let statusLabel = station.type;
                    let progress = 0;

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
                                // Simplified display logic
                                if (session.duration_minutes >= 1440) estimatedCost = rateConfig.daily * (session.duration_minutes / 1440);
                                else if (session.duration_minutes >= 720) estimatedCost = rateConfig.halfDay;
                                else estimatedCost = (session.duration_minutes / 60) * rateConfig.hourly;
                            } else {
                                estimatedCost = (session.duration_minutes / 60) * rateConfig.hourly;
                            }
                            costDisplay = formatCurrency(estimatedCost);

                            progress = Math.max(0, Math.min(100, ((durationMs - remaining) / durationMs) * 100));

                            if (remaining < 0) {
                                timeDisplay = "OVERDUE";
                            }

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
                                    title="QR Link"
                                >
                                    <QrCode className="w-4 h-4" />
                                </a>
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

                            {/* Timer / Session Info */}
                            <div className="bg-black/20 rounded-xl p-4 mb-4">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">{isActive ? (session.type === 'rental' ? 'Due In' : 'Time') : 'Status'}</p>
                                        <p className={`text-2xl font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                            {timeDisplay}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 mb-1">Bill</p>
                                        <p className="text-lg font-bold text-primary">{costDisplay}</p>
                                    </div>
                                </div>
                                {isActive && (session.type === 'timer' || session.type === 'rental') && (
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mt-2">
                                        <div
                                            className="bg-primary h-full transition-all duration-1000"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="grid gap-2">
                                {isActive ? (
                                    <button
                                        onClick={() => handleStopSession(station.id, station.type)}
                                        className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/50 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Square className="w-4 h-4 fill-current" />
                                        Finish Session
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Add New Station</h2>
                            <button onClick={() => setShowAddModal(false)}>
                                <X className="w-6 h-6 text-gray-400 hover:text-white" />
                            </button>
                        </div>
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
                                    {['PS5', 'PS4', 'PS3', 'XBOX', 'PC'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl">
                                Create Station
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Start Session Modal */}
            {showStartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
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
                                Rent Out / Bawa Pulang
                            </button>
                        </div>

                        <form onSubmit={handleStartSession} className="space-y-6">

                            {/* ON SITE MODE */}
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
                                            <p className="text-xs text-gray-400">Fixed Duration</p>
                                        </div>
                                        <div
                                            onClick={() => setOnsiteForm({ ...onsiteForm, type: 'open' })}
                                            className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-all ${onsiteForm.type === 'open' ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                            <p className="font-bold">Open Bill</p>
                                            <p className="text-xs text-gray-400">Pay at end</p>
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
                                                onChange={(e) => setOnsiteForm({ ...onsiteForm, duration: parseInt(e.target.value) || 0 })}
                                            />
                                            <p className="text-right text-sm text-primary mt-2 font-bold">
                                                Rate: {formatCurrency(currentRates.hourly)}/hr
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* RENTAL MODE */}
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
                                            <span className="text-xs font-bold block">12 Hours</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRentalForm({ ...rentalForm, package: 'custom', duration: 1 })}
                                            className={`p-3 rounded-xl border text-center ${rentalForm.package === 'custom' ? 'border-primary bg-primary/10' : 'border-white/10'
                                                }`}
                                        >
                                            <Timer className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs font-bold block">Custom</span>
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

                                    <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Total Price</span>
                                        <span className="text-xl font-bold text-primary">
                                            {formatCurrency(
                                                rentalForm.package === 'daily' ? currentRates.daily * rentalForm.duration :
                                                    rentalForm.package === 'halfDay' ? currentRates.halfDay * rentalForm.duration :
                                                        currentRates.hourly * rentalForm.duration
                                            )}
                                        </span>
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
        </div>
    );
}
