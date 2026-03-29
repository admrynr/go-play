'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowLeft, Search, CheckCircle2, Clock, AlertTriangle,
    Shield, ShieldOff, Loader2, RefreshCw, Ticket
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
    id: string;
    booking_code: string;
    nickname: string;
    wa_number: string;
    start_time: string;
    end_time: string;
    status: string;
    station_id: string;
    stations?: { name: string; type: string };
}
interface BlacklistEntry {
    id: string;
    wa_number: string;
    reason: string;
    created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
    pending: { label: 'Menunggu', class: 'bg-yellow-500/20 text-yellow-400' },
    active: { label: 'Aktif', class: 'bg-green-500/20  text-green-400' },
    completed: { label: 'Selesai', class: 'bg-gray-500/20   text-gray-400' },
    no_show: { label: 'No-Show', class: 'bg-red-500/20    text-red-400' },
    cancelled: { label: 'Dibatalkan', class: 'bg-gray-500/20   text-gray-400' },
};

function fmt(iso: string) {
    return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function BookingsPage() {
    const supabase = createClient();
    const [pageId, setPageId] = useState<string | null>(null);
    const [slug, setSlug] = useState<string>('');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
    const [tab, setTab] = useState<'bookings' | 'blacklist'>('bookings');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState('');
    const [loyalty, setLoyalty] = useState('');

    const fetchAll = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: page } = await supabase
            .from('pages').select('id, slug').eq('owner_id', user.id).single();
        if (!page) { setLoading(false); return; }

        setPageId(page.id);
        setSlug(page.slug);

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const { data: bkData } = await supabase
            .from('bookings')
            .select('*, stations(name, type)')
            .eq('page_id', page.id)
            .gte('start_time', today.toISOString())
            .order('start_time');

        const { data: blData } = await supabase
            .from('wa_blacklist')
            .select('*')
            .eq('page_id', page.id)
            .order('created_at', { ascending: false });

        setBookings(bkData || []);
        setBlacklist(blData || []);
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleCheckin = async (booking: Booking) => {
        if (!pageId) return;
        setRunning(booking.id);
        try {
            // Create session
            await supabase.from('sessions').insert({
                station_id: booking.station_id,
                page_id: pageId,
                start_time: new Date().toISOString(),
                end_time: booking.end_time,
                duration_minutes: Math.round((new Date(booking.end_time).getTime() - Date.now()) / 60_000),
                type: 'timer',
                status: 'active',
            });
            // Update station status
            await supabase.from('stations').update({ status: 'active' }).eq('id', booking.station_id);
            // Update booking status
            await supabase.from('bookings').update({ status: 'active' }).eq('id', booking.id);
            // Loyalty hook
            setLoyalty(`Sesi ${booking.stations?.name ?? ''} diaktifkan untuk ${booking.nickname} (WA: ${booking.wa_number}). Ingatkan user untuk daftar agar poin bisa ditukar reward!`);
            fetchAll();
        } finally {
            setRunning('');
        }
    };

    const handlePardon = async (entry: BlacklistEntry) => {
        setRunning(entry.id);
        await supabase.from('wa_blacklist').delete().eq('id', entry.id);
        setBlacklist(prev => prev.filter(e => e.id !== entry.id));
        setRunning('');
    };

    const handleNoShowCheck = async () => {
        if (!slug) return;
        setRunning('noshows');
        try {
            const res = await fetch(`/api/booking/${slug}/cancel-noshows`, { method: 'POST' });
            const data = await res.json();
            alert(`Auto-cancel selesai. Dibatalkan: ${data.cancelled || 0}, Diblokir: ${data.blacklisted || 0}`);
            fetchAll();
        } finally {
            setRunning('');
        }
    };

    const filtered = bookings.filter(b =>
        b.booking_code.toLowerCase().includes(search.toLowerCase()) ||
        b.wa_number.includes(search) ||
        b.nickname.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-white p-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Kelola Booking</h1>
                        <p className="text-gray-400 text-sm">Check-in, blacklist, dan auto-cancel no-show</p>
                    </div>
                    <button
                        onClick={handleNoShowCheck}
                        disabled={running === 'noshows'}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                        {running === 'noshows' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Cek No-Show
                    </button>
                </div>

                {/* Loyalty hook toast */}
                {loyalty && (
                    <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl mb-6">
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-green-300 text-sm font-semibold">Sesi Diaktifkan</p>
                            <p className="text-green-400/80 text-xs mt-0.5">{loyalty}</p>
                        </div>
                        <button onClick={() => setLoyalty('')} className="ml-auto text-gray-500 hover:text-white text-xs">✕</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['bookings', 'blacklist'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}>
                            {t === 'bookings' ? (
                                <><Ticket className="inline w-4 h-4 mr-1.5" />Booking Hari Ini ({bookings.length})</>
                            ) : (
                                <><ShieldOff className="inline w-4 h-4 mr-1.5" />Blacklist ({blacklist.length})</>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── BOOKINGS TAB ── */}
                {tab === 'bookings' && (
                    <>
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Cari kode BK, nomor WA, atau nama..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                            />
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Belum ada booking hari ini.</p>
                                <Link href={`/${slug}/booking`} target="_blank"
                                    className="text-primary text-sm mt-2 hover:underline inline-block">
                                    Buka halaman booking →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map(b => {
                                    const { label, class: cls } = STATUS_LABEL[b.status] ?? { label: b.status, class: 'bg-gray-500/20 text-gray-400' };
                                    return (
                                        <div key={b.id} className="bg-surface border border-white/10 rounded-2xl p-5">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-xl font-black tracking-widest text-primary">{b.booking_code}</span>
                                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>
                                                    </div>
                                                    <p className="font-semibold">{b.nickname}</p>
                                                    <p className="text-xs text-gray-400">{b.wa_number}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                        <span className="font-medium text-white">{b.stations?.name ?? '—'}</span>
                                                        <span>·</span>
                                                        <Clock className="w-3 h-3" />
                                                        <span>{fmt(b.start_time)} – {fmt(b.end_time)}</span>
                                                    </div>
                                                </div>
                                                {b.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleCheckin(b)}
                                                        disabled={!!running}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
                                                    >
                                                        {running === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                        Aktifkan Sesi
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ── BLACKLIST TAB ── */}
                {tab === 'blacklist' && (
                    <>
                        {blacklist.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Tidak ada nomor yang diblokir.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {blacklist.map(entry => (
                                    <div key={entry.id} className="bg-surface border border-red-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <ShieldOff className="w-4 h-4 text-red-400" />
                                                <span className="font-bold">{entry.wa_number}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Alasan: <span className="text-red-400">{entry.reason}</span> ·{' '}
                                                {new Date(entry.created_at).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handlePardon(entry)}
                                            disabled={running === entry.id}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-sm font-semibold hover:bg-green-600/30 transition-colors disabled:opacity-50 shrink-0"
                                        >
                                            {running === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                            Pardon
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
