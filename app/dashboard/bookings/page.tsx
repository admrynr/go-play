'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowLeft, Search, CheckCircle2, Clock, AlertTriangle,
    Shield, ShieldOff, Loader2, RefreshCw, Ticket, Bell, Check, X
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
    pending_approval: { label: 'Menunggu Konfirmasi', class: 'bg-blue-500/20 text-blue-400' },
    pending: { label: 'Dikonfirmasi', class: 'bg-yellow-500/20 text-yellow-400' },
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
    const [noShowToast, setNoShowToast] = useState('');

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
            .order('created_at', { ascending: false });

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

    // Realtime: auto-refresh when bookings change + detect no-show
    useEffect(() => {
        if (!pageId) return;
        const channel = supabase
            .channel(`admin-bookings-${pageId}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'bookings',
                filter: `page_id=eq.${pageId}`
            }, (payload) => {
                // Detect no-show auto-cancel
                if (payload.eventType === 'UPDATE') {
                    const updated = payload.new as { status: string; nickname: string; booking_code: string; wa_number: string };
                    if (updated.status === 'no_show') {
                        setNoShowToast(`Booking ${updated.booking_code} (${updated.nickname} / ${updated.wa_number}) dibatalkan otomatis karena No-Show. WA diblokir.`);
                    }
                }
                fetchAll();
            })
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'wa_blacklist',
                filter: `page_id=eq.${pageId}`
            }, fetchAll)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [pageId, fetchAll, supabase]);

    // Accept booking request
    const handleAccept = async (booking: Booking) => {
        setRunning(booking.id + '-accept');
        await supabase.from('bookings').update({ status: 'pending' }).eq('id', booking.id);
        fetchAll();
        setRunning('');
    };

    // Reject booking request
    const handleReject = async (booking: Booking) => {
        setRunning(booking.id + '-reject');
        await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);
        fetchAll();
        setRunning('');
    };

    // Check-in: activate session
    const handleCheckin = async (booking: Booking) => {
        if (!pageId) return;
        setRunning(booking.id);
        try {
            await supabase.from('sessions').insert({
                station_id: booking.station_id,
                page_id: pageId,
                start_time: new Date().toISOString(),
                end_time: booking.end_time,
                duration_minutes: Math.round((new Date(booking.end_time).getTime() - Date.now()) / 60_000),
                type: 'timer',
                status: 'active',
            });
            await supabase.from('stations').update({ status: 'active' }).eq('id', booking.station_id);
            await supabase.from('bookings').update({ status: 'active' }).eq('id', booking.id);
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
            if ((data.cancelled || 0) > 0) {
                setNoShowToast(`Auto-cancel selesai. ${data.cancelled} booking No-Show dibatalkan, ${data.blacklisted || 0} WA diblokir.`);
            } else {
                alert('Tidak ada no-show yang ditemukan saat ini.');
            }
            fetchAll();
        } finally {
            setRunning('');
        }
    };

    const pendingApproval = bookings.filter(b => b.status === 'pending_approval');
    const otherBookings = bookings.filter(b => b.status !== 'pending_approval');
    const filtered = otherBookings.filter(b =>
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
                        <p className="text-gray-400 text-sm">Konfirmasi permintaan, check-in, dan manajemen blacklist</p>
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

                {/* No-Show Toast */}
                {noShowToast && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl mb-6">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-300 text-sm font-semibold">Booking Batal Otomatis — No-Show</p>
                            <p className="text-red-400/80 text-xs mt-0.5">{noShowToast}</p>
                        </div>
                        <button onClick={() => setNoShowToast('')} className="text-gray-500 hover:text-white text-xs">✕</button>
                    </div>
                )}

                {/* Loyalty hook toast */}
                {loyalty && (
                    <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl mb-6">
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-green-300 text-sm font-semibold">Sesi Diaktifkan</p>
                            <p className="text-green-400/80 text-xs mt-0.5">{loyalty}</p>
                        </div>
                        <button onClick={() => setLoyalty('')} className="text-gray-500 hover:text-white text-xs">✕</button>
                    </div>
                )}

                {/* ── PERMINTAAN MASUK (pending_approval) ── */}
                {pendingApproval.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Bell className="w-4 h-4 text-blue-400 animate-pulse" />
                            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                                Permintaan Masuk ({pendingApproval.length})
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {pendingApproval.map(b => (
                                <div key={b.id} className="bg-blue-500/5 border border-blue-500/30 rounded-2xl p-5">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-xl font-black tracking-widest text-blue-400">{b.booking_code}</span>
                                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Menunggu Konfirmasi</span>
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
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleReject(b)}
                                                disabled={!!running}
                                                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                            >
                                                {running === b.id + '-reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                Tolak
                                            </button>
                                            <button
                                                onClick={() => handleAccept(b)}
                                                disabled={!!running}
                                                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                            >
                                                {running === b.id + '-accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                Konfirmasi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['bookings', 'blacklist'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                            {t === 'bookings' ? (
                                <><Ticket className="inline w-4 h-4 mr-1.5" />Booking Hari Ini ({otherBookings.length})</>
                            ) : (
                                <><ShieldOff className="inline w-4 h-4 mr-1.5" />Blacklist ({blacklist.length})</>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── BOOKINGS TAB ── */}
                {tab === 'bookings' && (
                    <>
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
                                <p>Belum ada booking yang dikonfirmasi hari ini.</p>
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
