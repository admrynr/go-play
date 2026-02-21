'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, ShoppingCart, Bell, Coffee, Pizza, Package, UtensilsCrossed, X, Loader2, Square } from 'lucide-react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function StationPage() {
    const params = useParams();
    const stationId = params.stationId as string;
    const slug = params.slug as string;

    const [station, setStation] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'session' | 'menu'>('session');
    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);

    // Add Time State
    const [showAddTime, setShowAddTime] = useState(false);
    const [addTimeMinutes, setAddTimeMinutes] = useState(60);
    const [requesting, setRequesting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchData();

        // Setup real-time listener for the session
        const channel = supabase.channel(`station-${stationId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `station_id=eq.${stationId}` }, () => {
                fetchData();
                setShowAddTime(false); // Close modal if admin approves
            })
            .subscribe();

        // Local timer tick (every second)
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [stationId, supabase]);

    const [now, setNow] = useState(new Date());

    const fetchData = async () => {
        // 1. Get Station & Page info
        const { data: stationData } = await supabase
            .from('stations')
            .select('*, pages(business_name, theme_color)')
            .eq('id', stationId)
            .single();

        if (stationData) {
            setStation(stationData);

            // 2. Get Active Session
            const { data: sessionData } = await supabase
                .from('sessions')
                .select('*')
                .eq('station_id', stationId)
                .eq('status', 'active')
                .single();

            setSession(sessionData);

            // 3. Get Menu
            const { data: menuData } = await supabase
                .from('menu_items')
                .select('*')
                .eq('page_id', stationData.page_id)
                .eq('is_available', true);

            setMenuItems(menuData || []);
        }
        setLoading(false);
    };

    const addToCart = (item: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const placeOrder = async () => {
        if (!session || cart.length === 0) return;
        setOrdering(true);

        // 1. Create Order
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                session_id: session.id,
                page_id: station.page_id,
                status: 'pending',
                total_amount: totalAmount
            })
            .select()
            .single();

        if (order) {
            // 2. Create Order Items
            const orderItems = cart.map(item => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.qty,
                price: item.price
            }));

            await supabase.from('order_items').insert(orderItems);

            setCart([]);
            setActiveTab('session');
            toast.success('Pesanan berhasil dibuat!', {
                description: 'Mohon tunggu sebentar.',
            });
        }
        setOrdering(false);
    };

    const callOperator = async () => {
        if (!session) return;
        if (!confirm('Panggil operator ke meja ini?')) return;
        setRequesting(true);

        const { error } = await supabase.from('station_requests').insert({
            session_id: session.id,
            page_id: station.page_id,
            type: 'call_operator',
            status: 'pending'
        });

        setRequesting(false);
        if (error) toast.error('Gagal memanggil operator', { description: error.message });
        else toast.success('Operator telah dipanggil.');
    };

    const handleStopSession = async () => {
        if (!session) return;
        if (!confirm('Akhiri sesi dan minta bill ke kasir?')) return;
        setRequesting(true);

        const { error } = await supabase.from('station_requests').insert({
            session_id: session.id,
            page_id: station.page_id,
            type: 'stop_session',
            status: 'pending'
        });

        setRequesting(false);
        if (error) toast.error('Gagal mengirim permintaan', { description: error.message });
        else toast.success('Permintaan berhenti telah dikirim', { description: 'Mohon tunggu kasir memproses tagihan Anda.' });
    };

    const handleAddTime = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || addTimeMinutes <= 0) return;
        setRequesting(true);

        const { error } = await supabase.from('station_requests').insert({
            session_id: session.id,
            page_id: station.page_id,
            type: 'add_time',
            payload: { duration_minutes: addTimeMinutes },
            status: 'pending'
        });

        setRequesting(false);
        if (error) {
            toast.error('Gagal mengirim permintaan', { description: error.message });
        } else {
            toast.success('Permintaan tambah waktu terkirim', { description: 'Menunggu persetujuan kasir.' });
            setShowAddTime(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
    if (!station) return <div className="flex items-center justify-center h-screen bg-black text-white">Station Not Found</div>;

    const themeColor = station.pages?.theme_color || '#003791';

    return (
        <div className="min-h-screen bg-black text-white font-sans pb-20">
            {/* Header */}
            <header className="p-4 flex justify-between items-center bg-surface border-b border-white/10 sticky top-0 z-10" style={{ borderTop: `4px solid ${themeColor}` }}>
                <div>
                    <h1 className="font-bold text-xl">{station.name}</h1>
                    <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
                        at <span className="text-primary font-bold">{station.pages?.business_name || 'GO-PLAY'}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={callOperator}
                        disabled={requesting}
                        className="p-2 bg-red-600/20 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                    >
                        {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="p-4">
                {activeTab === 'session' ? (
                    <div className="space-y-6">
                        {/* Timer Card */}
                        <div className="bg-surface border border-white/10 rounded-2xl p-6 text-center transform hover:scale-[1.02] transition-transform">
                            <Clock className="w-10 h-10 mx-auto mb-4 text-primary" />
                            <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Status Sesi</h2>

                            {session ? (
                                (() => {
                                    const now = new Date();
                                    const start = new Date(session.start_time).getTime();
                                    const current = now.getTime();
                                    let timeDisplay = "00:00:00";
                                    let subText = "Running";
                                    let progress = 0;

                                    // Helper
                                    const formatDuration = (ms: number) => {
                                        if (ms < 0) return "00:00:00";
                                        const seconds = Math.floor((ms / 1000) % 60);
                                        const minutes = Math.floor((ms / (1000 * 60)) % 60);
                                        const hours = Math.floor((ms / (1000 * 60 * 60)));
                                        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                    };

                                    if (session.type === 'timer' || session.type === 'rental') {
                                        const durationMs = (session.duration_minutes || 0) * 60 * 1000;
                                        const end = start + durationMs;
                                        const remaining = end - current;
                                        timeDisplay = formatDuration(remaining);
                                        subText = remaining < 0 ? "OVERDUE" : "Sisa Waktu";
                                        progress = Math.max(0, Math.min(100, ((durationMs - remaining) / durationMs) * 100));
                                    } else {
                                        const elapsed = current - start;
                                        timeDisplay = formatDuration(elapsed);
                                        subText = "Durasi Berjalan";
                                    }

                                    return (
                                        <>
                                            <div className={`text-4xl font-bold font-mono mb-2 ${subText === 'OVERDUE' ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                                {timeDisplay}
                                            </div>
                                            <p className="text-sm text-gray-500">{subText}</p>

                                            {(session.type === 'timer' || session.type === 'rental') && (
                                                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mt-4">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${subText === 'OVERDUE' ? 'bg-red-500' : 'bg-primary'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                                                <span className="text-gray-400">Mulai</span>
                                                <span className="font-bold">{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </>
                                    );
                                })()
                            ) : (
                                <div className="text-2xl font-bold text-gray-500 mt-2">
                                    OFFLINE / IDLE
                                </div>
                            )}
                        </div>

                        {/* Quick Menu */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setActiveTab('menu')}
                                className="bg-surface border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/5 active:scale-95 transition-all w-full"
                            >
                                <UtensilsCrossed className="w-8 h-8 text-orange-400" />
                                <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">Pesan Makan</span>
                            </button>

                            {session && (session.type === 'timer' || session.type === 'rental') ? (
                                <button
                                    onClick={() => setShowAddTime(true)}
                                    className="bg-surface border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/5 active:scale-95 transition-all w-full"
                                >
                                    <Clock className="w-8 h-8 text-blue-400" />
                                    <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">Tambah Waktu</span>
                                </button>
                            ) : session && session.type === 'open' ? (
                                <button
                                    onClick={handleStopSession}
                                    disabled={requesting}
                                    className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-red-900/50 active:scale-95 transition-all text-red-400 w-full"
                                >
                                    {requesting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Square className="w-8 h-8" fill="currentColor" />}
                                    <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">Berhenti Main</span>
                                </button>
                            ) : null}
                        </div>

                        {/* Add Time Form */}
                        {showAddTime && (
                            <div className="bg-surface border border-white/10 rounded-xl p-4 animate-in slide-in-from-top-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold">Tambah Waktu</h3>
                                    <button onClick={() => setShowAddTime(false)}><X className="w-5 h-5 text-gray-400" /></button>
                                </div>
                                <form onSubmit={handleAddTime} className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-2 block">Durasi (Menit)</label>
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                            {[30, 60, 120].map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setAddTimeMinutes(m)}
                                                    className={`py-2 text-sm rounded-lg border transition-colors ${addTimeMinutes === m ? 'bg-primary text-white border-primary' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
                                                >
                                                    {m}m
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="number"
                                            value={addTimeMinutes}
                                            onChange={(e) => setAddTimeMinutes(Number(e.target.value))}
                                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:outline-none focus:border-primary text-white"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={requesting}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex justify-center items-center gap-2"
                                    >
                                        {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Permintaan'}
                                    </button>
                                    <p className="text-xs text-gray-500 text-center">Admin akan mengkonfirmasi permintaan Anda</p>
                                </form>
                            </div>
                        )}

                        {/* Promo Banner */}
                        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-white/10 rounded-xl p-4 text-center mt-6">
                            <p className="font-bold text-sm">Promo Hari Ini</p>
                            <p className="text-xs text-gray-300">Diskon 10% untuk pemesanan makanan di atas 50rb!</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <UtensilsCrossed className="w-5 h-5 text-primary" /> Menu
                        </h2>

                        <div className="grid gap-4">
                            {menuItems.map((item) => (
                                <div key={item.id} className="flex gap-4 bg-surface border border-white/10 rounded-xl p-3">
                                    <div className="w-20 h-20 bg-white/5 rounded-lg flex-shrink-0 overflow-hidden">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Coffee className="w-6 h-6 opacity-20" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold">{item.name}</h3>
                                        <p className="text-sm text-gray-400 line-clamp-1">{item.description}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-primary font-bold">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)}
                                            </span>
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Cart */}
            {cart.length > 0 && activeTab === 'menu' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-white/10 z-20">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">{cart.reduce((a, b) => a + b.qty, 0)} Items</span>
                        <span className="font-bold text-xl">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cart.reduce((sum, item) => sum + (item.price * item.qty), 0))}
                        </span>
                    </div>
                    <button
                        onClick={placeOrder}
                        disabled={ordering}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                        {ordering ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pesan Sekarang'}
                    </button>
                </div>
            )}

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 p-2 flex justify-around z-10 safe-area-bottom">
                <button
                    onClick={() => setActiveTab('session')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'session' ? 'text-primary' : 'text-gray-500'}`}
                >
                    <Clock className="w-6 h-6" />
                    <span className="text-[10px] uppercase font-bold mt-1">Sesi</span>
                </button>
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'menu' ? 'text-primary' : 'text-gray-500'}`}
                >
                    <UtensilsCrossed className="w-6 h-6" />
                    <span className="text-[10px] uppercase font-bold mt-1">Menu</span>
                </button>
            </nav>
        </div>
    );
}
