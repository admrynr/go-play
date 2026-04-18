'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowLeft, CheckCircle2, Clock, Monitor, AlertTriangle,
    ChevronRight, Loader2, Copy, Share2, Download, XCircle, Hourglass, Search
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ─── Constants ────────────────────────────────────────────────────────────────
const LEAD_TIME = 10;   // minutes
const BUFFER_TIME = 5;  // minutes
const REFRESH_MS = 15_000;

// ─── Types ────────────────────────────────────────────────────────────────────
type StationStatus = 'idle' | 'active' | 'maintenance';
interface Station { id: string; name: string; type: string; status: StationStatus }
interface Session { id: string; station_id: string; end_time: string | null; type: string }
interface Booking { id: string; station_id: string; start_time: string; end_time: string; status: string; nickname: string }
interface PageData { id: string; business_name: string; theme_color: string; whatsapp_number: string }
interface Ticket { booking_code: string; nickname: string; wa_number: string; start_time: string; end_time: string; station_name: string }

type ViewState = 'board' | 'form' | 'waiting' | 'ticket' | 'rejected';

// ─── Helper: station display state ───────────────────────────────────────────
function getStationDisplay(station: Station, sessions: Session[], bookings: Booking[], now: Date) {
    const session = sessions.find(s => s.station_id === station.id);
    const nextBooking = bookings
        .filter(b => b.station_id === station.id && ['pending_approval', 'pending'].includes(b.status) && new Date(b.start_time) >= now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

    if (station.status === 'maintenance') {
        return { color: 'gray', label: 'Maintenance', bookable: false, estAvailable: null, hasBooking: false };
    }
    if (session) {
        if (session.type === 'open' || !session.end_time) {
            return { color: 'red', label: 'Sedang Dipakai', bookable: false, estAvailable: null, hasBooking: false };
        }
        const estEnd = new Date(new Date(session.end_time).getTime() + BUFFER_TIME * 60_000);
        return { color: 'red', label: 'Sedang Dipakai', bookable: false, estAvailable: estEnd, hasBooking: false };
    }
    if (nextBooking && new Date(nextBooking.start_time) <= new Date(now.getTime() + LEAD_TIME * 60_000 + 60_000)) {
        const estEnd = new Date(new Date(nextBooking.end_time).getTime() + BUFFER_TIME * 60_000);
        const label = nextBooking.status === 'pending_approval' ? 'Menunggu Konfirmasi' : 'Dipesan';
        return { color: 'yellow', label, bookable: false, estAvailable: estEnd, hasBooking: nextBooking.status === 'pending' };
    }
    return { color: 'green', label: 'Tersedia', bookable: true, estAvailable: null, hasBooking: false };
}

function fmt(date: Date) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fmtDatetime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
/** Returns 'YYYY-MM-DDTHH:mm' in LOCAL time — required for datetime-local inputs */
function toLocalDatetimeString(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingPage() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const supabase = createClient();

    const [pageData, setPageData] = useState<PageData | null>(null);
    const [stations, setStations] = useState<Station[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [now, setNow] = useState(new Date());
    const [view, setView] = useState<ViewState>('board');
    const [selectedStation, setSelected] = useState<Station | null>(null);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);

    // Lookup form state (for finding existing ticket from board)
    const [lookupQuery, setLookupQuery] = useState('');
    const [lookupLoading, setLookupLoading] = useState<string | null>(null); // station_id
    const [lookupError, setLookupError] = useState('');

    // Form state
    const [nickname, setNickname] = useState('');
    const [waNumber, setWaNumber] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [duration, setDuration] = useState(1);

    const ticketRef = useRef<HTMLDivElement>(null);

    const fetchAvailability = useCallback(async () => {
        try {
            const res = await fetch(`/api/booking/${slug}`);
            if (!res.ok) return;
            const data = await res.json();
            setPageData(data.page);
            setStations(data.stations);
            setSessions(data.activeSessions);
            setBookings(data.bookings);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchAvailability();
        const interval = setInterval(() => {
            setNow(new Date());
            fetchAvailability();
        }, REFRESH_MS);
        return () => clearInterval(interval);
    }, [fetchAvailability]);

    // Realtime: board refresh
    useEffect(() => {
        if (!pageData) return;
        const channel = supabase
            .channel(`booking-page-${pageData.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `page_id=eq.${pageData.id}` }, fetchAvailability)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `page_id=eq.${pageData.id}` }, fetchAvailability)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stations', filter: `page_id=eq.${pageData.id}` }, fetchAvailability)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [pageData, fetchAvailability, supabase]);

    // Realtime: watch specific booking for approval/rejection
    useEffect(() => {
        if (!pendingBookingId || view !== 'waiting') return;
        const channel = supabase
            .channel(`booking-watch-${pendingBookingId}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'bookings',
                filter: `id=eq.${pendingBookingId}`
            }, (payload) => {
                const updated = payload.new as { status: string; booking_code: string; nickname: string; wa_number: string; start_time: string; end_time: string };
                if (updated.status === 'pending') {
                    // Admin accepted → show ticket
                    setTicket({
                        booking_code: updated.booking_code,
                        nickname: updated.nickname,
                        wa_number: updated.wa_number,
                        start_time: updated.start_time,
                        end_time: updated.end_time,
                        station_name: selectedStation?.name ?? '',
                    });
                    setView('ticket');
                } else if (updated.status === 'cancelled') {
                    setView('rejected');
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [pendingBookingId, view, supabase, selectedStation]);

    const minArrival = useMemo(() => {
        const d = new Date(Date.now() + LEAD_TIME * 60_000);
        d.setSeconds(0, 0);
        return toLocalDatetimeString(d);
    }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

    const themeColor = pageData?.theme_color ?? '#003791';

    const handleSelectStation = (s: Station) => {
        setSelected(s);
        setArrivalTime(minArrival);
        setError('');
        setLookupQuery('');
        setLookupError('');
        setView('form');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStation || !pageData) return;
        setError('');
        setSubmitting(true);

        const start = new Date(arrivalTime);
        const end = new Date(start.getTime() + duration * 60 * 60_000);

        try {
            const res = await fetch(`/api/booking/${slug}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    station_id: selectedStation.id,
                    nickname: nickname.trim(),
                    wa_number: waNumber.replace(/\D/g, ''),
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Terjadi kesalahan, coba lagi.');
                return;
            }
            // Go to waiting view — realtime will trigger ticket display
            setPendingBookingId(data.booking.id);
            setView('waiting');
            fetchAvailability();
        } catch {
            setError('Koneksi gagal, periksa internet Anda.');
        } finally {
            setSubmitting(false);
        }
    };

    // Lookup existing ticket by booking code or WA number
    const handleLookup = async (stationId: string) => {
        const q = lookupQuery.trim();
        if (!q) return;
        setLookupLoading(stationId);
        setLookupError('');
        try {
            const { data } = await supabase
                .from('bookings')
                .select('*, stations(name)')
                .eq('page_id', pageData!.id)
                .eq('station_id', stationId)
                .in('status', ['pending', 'pending_approval'])
                .or(`booking_code.ilike.${q},wa_number.eq.${q.replace(/\D/g, '')}`)
                .limit(1)
                .maybeSingle();
            if (!data) {
                setLookupError('Tiket tidak ditemukan. Periksa kode atau nomor WA.');
                return;
            }
            setSelected(stations.find(s => s.id === stationId) ?? null);
            setTicket({
                booking_code: data.booking_code,
                nickname: data.nickname,
                wa_number: data.wa_number,
                start_time: data.start_time,
                end_time: data.end_time,
                station_name: (data.stations as { name: string } | null)?.name ?? '',
            });
            setView('ticket');
        } catch {
            setLookupError('Gagal mencari tiket.');
        } finally {
            setLookupLoading(null);
        }
    };

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        setDownloading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
            const domtoimage = require('dom-to-image-more') as any;
            const blob = await domtoimage.toBlob(ticketRef.current, {
                bgcolor: '#141414',
                scale: 2,
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `tiket-${ticket?.booking_code ?? 'booking'}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            alert('Gagal download tiket. Coba screenshot manual.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center text-center p-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">404</h1>
                    <p className="text-gray-400">Halaman rental tidak ditemukan.</p>
                    <Link href="/" className="mt-6 inline-block text-sm text-gray-500 hover:text-white">← Kembali</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
            <style>{`:root { --theme: ${themeColor}; }`}</style>

            {/* ── Header ── */}
            <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                    <Link href={`/${slug}`} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold truncate">{pageData.business_name}</h1>
                        <p className="text-xs text-gray-500">Cek Slot & Booking Online</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Live
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 max-w-2xl">

                {/* ══ BOARD VIEW ══ */}
                {view === 'board' && (
                    <>
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-bold">Status Stasiun</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Diperbarui setiap {REFRESH_MS / 1000} detik · {fmt(now)}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 mb-6 text-xs font-semibold">
                            {[
                                { color: 'bg-green-500', label: 'Tersedia' },
                                { color: 'bg-yellow-400', label: 'Dipesan' },
                                { color: 'bg-red-500', label: 'Dipakai' },
                                { color: 'bg-gray-500', label: 'Maintenance' },
                            ].map(l => (
                                <span key={l.label} className="flex items-center gap-1.5">
                                    <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                                    {l.label}
                                </span>
                            ))}
                        </div>

                        {stations.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Belum ada stasiun terdaftar.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stations.map(station => {
                                    const { color, label, bookable, estAvailable, hasBooking } = getStationDisplay(station, sessions, bookings, now);
                                    const colorMap: Record<string, string> = {
                                        green: 'border-green-500/50  bg-green-500/10',
                                        yellow: 'border-yellow-400/50 bg-yellow-400/10',
                                        red: 'border-red-500/50    bg-red-500/10',
                                        gray: 'border-gray-500/30   bg-gray-500/10',
                                    };
                                    const dotMap: Record<string, string> = {
                                        green: 'bg-green-500',
                                        yellow: 'bg-yellow-400 animate-pulse',
                                        red: 'bg-red-500',
                                        gray: 'bg-gray-500',
                                    };
                                    const labelColorMap: Record<string, string> = {
                                        green: 'text-green-400', yellow: 'text-yellow-400',
                                        red: 'text-red-400', gray: 'text-gray-400',
                                    };

                                    return (
                                        <div key={station.id} className={`rounded-2xl border transition-all ${colorMap[color]}`}>
                                            {/* Station info row */}
                                            <button
                                                disabled={!bookable}
                                                onClick={() => bookable && handleSelectStation(station)}
                                                className={`w-full p-4 text-left flex items-center gap-4 ${bookable ? 'hover:opacity-90 cursor-pointer' : 'cursor-default'}`}
                                            >
                                                <span className={`w-3 h-3 rounded-full shrink-0 ${dotMap[color]}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold">{station.name}</p>
                                                    <p className="text-xs text-gray-400">{station.type}</p>
                                                    <p className={`text-xs font-semibold mt-0.5 ${labelColorMap[color]}`}>{label}</p>
                                                    {estAvailable && (
                                                        <p className="text-xs text-gray-500 mt-0.5">Est. kosong: {fmt(estAvailable)}</p>
                                                    )}
                                                </div>
                                                {bookable && <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />}
                                            </button>

                                            {/* Lookup form — only shown when station is booked (status pending, confirmed) */}
                                            {hasBooking && (
                                                <div className="px-4 pb-4 border-t border-white/10 pt-3">
                                                    <p className="text-xs text-yellow-400 font-semibold mb-2">Punya tiket untuk stasiun ini?</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Kode BK-XXXX atau No. WA"
                                                            value={lookupQuery}
                                                            onChange={e => { setLookupQuery(e.target.value); setLookupError(''); }}
                                                            onKeyDown={e => e.key === 'Enter' && handleLookup(station.id)}
                                                            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50"
                                                        />
                                                        <button
                                                            onClick={() => handleLookup(station.id)}
                                                            disabled={lookupLoading === station.id}
                                                            className="px-3 py-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded-xl text-sm font-bold hover:bg-yellow-400/30 transition-colors disabled:opacity-50"
                                                        >
                                                            {lookupLoading === station.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    {lookupError && <p className="text-xs text-red-400 mt-1">{lookupError}</p>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <p className="text-center text-xs text-gray-600 mt-8">
                            Booking online hanya untuk unit Timed. Unit Loose tidak dapat dipesan.
                        </p>
                    </>
                )}

                {/* ══ FORM VIEW ══ */}
                {view === 'form' && selectedStation && (
                    <>
                        <button onClick={() => setView('board')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6">
                            <ArrowLeft className="w-4 h-4" /> Pilih stasiun lain
                        </button>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stasiun dipilih</p>
                            <p className="font-bold text-lg">{selectedStation.name}</p>
                            <p className="text-sm text-gray-400">{selectedStation.type}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    <Clock className="inline w-4 h-4 mr-1" /> Jam Datang
                                </label>
                                <input
                                    type="datetime-local"
                                    value={arrivalTime}
                                    min={minArrival}
                                    onChange={e => setArrivalTime(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimal {LEAD_TIME} menit dari sekarang</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Estimasi Durasi Main</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(h => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => setDuration(h)}
                                            className={`py-3 rounded-xl border text-sm font-bold transition-all ${duration === h
                                                ? 'border-none text-white'
                                                : 'border-white/10 text-gray-400 hover:border-white/30'
                                                }`}
                                            style={duration === h ? { background: themeColor } : {}}
                                        >
                                            {h} Jam
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Selesai: {arrivalTime ? fmt(new Date(new Date(arrivalTime).getTime() + duration * 3_600_000)) : '—'}
                                    {' '}· Waktu mutlak (keterlambatan memotong durasi)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Nama Panggilan</label>
                                <input
                                    type="text"
                                    placeholder="cth: Budi, PlayerX"
                                    value={nickname}
                                    onChange={e => setNickname(e.target.value)}
                                    required
                                    maxLength={32}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Nomor WhatsApp</label>
                                <input
                                    type="tel"
                                    placeholder="cth: 08123456789"
                                    value={waNumber}
                                    onChange={e => setWaNumber(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                                />
                                <p className="text-xs text-gray-500 mt-1">Digunakan kasir untuk verifikasi. Tidak ada password.</p>
                            </div>

                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{ background: themeColor }}
                                className="w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Kirim Permintaan Booking <ChevronRight className="w-5 h-5" /></>}
                            </button>
                        </form>
                    </>
                )}

                {/* ══ WAITING VIEW ══ */}
                {view === 'waiting' && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 mb-6">
                            <Hourglass className="w-10 h-10 text-yellow-400 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Menunggu Konfirmasi</h2>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">
                            Permintaan booking kamu sudah masuk. Halaman ini akan otomatis diperbarui saat admin mengkonfirmasi.
                        </p>
                        <div className="flex flex-col items-center gap-2 mb-8">
                            <div className="flex gap-1">
                                {[0, 0.2, 0.4].map(d => (
                                    <span key={d} className="w-2 h-2 rounded-full bg-yellow-400"
                                        style={{ animation: `bounce 1.2s ${d}s infinite` }} />
                                ))}
                            </div>
                        </div>
                        <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }`}</style>
                        <p className="text-xs text-gray-600">
                            Stasiun:{' '}
                            <span className="text-gray-400 font-semibold">{selectedStation?.name}</span>
                        </p>
                        <button
                            onClick={() => setView('board')}
                            className="mt-8 text-sm text-gray-500 hover:text-white underline"
                        >
                            Kembali ke board
                        </button>
                    </div>
                )}

                {/* ══ REJECTED VIEW ══ */}
                {view === 'rejected' && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
                            <XCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Booking Tidak Dikonfirmasi</h2>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">
                            Maaf, permintaan booking kamu tidak dapat dikonfirmasi oleh admin. Silakan coba waktu atau stasiun lain.
                        </p>
                        <button
                            onClick={() => { setView('board'); setPendingBookingId(null); setNickname(''); setWaNumber(''); }}
                            style={{ background: themeColor }}
                            className="px-8 py-3 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* ══ TICKET VIEW ══ */}
                {view === 'ticket' && ticket && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1">Booking Dikonfirmasi!</h2>
                        <p className="text-gray-400 text-sm mb-8">Simpan tiket ini dan tunjukkan ke kasir saat tiba.</p>

                        {/* Ticket card — ref for html2canvas */}
                        <div ref={ticketRef} className="bg-[#141414] border border-white/15 rounded-3xl p-6 text-left mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                                style={{ background: themeColor, transform: 'translate(30%, -30%)' }} />

                            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Kode Booking</p>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-4xl font-black tracking-widest" style={{ color: themeColor }}>{ticket.booking_code}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(ticket.booking_code)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    title="Salin kode"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <Row label="Nama" value={ticket.nickname} />
                                <Row label="Stasiun" value={ticket.station_name} />
                                <Row label="Mulai" value={fmtDatetime(ticket.start_time)} />
                                <Row label="Selesai" value={fmtDatetime(ticket.end_time)} />
                                <Row label="Nomor WA" value={ticket.wa_number} />
                            </div>

                            <div className="mt-6 p-4 bg-white/5 rounded-2xl text-xs text-gray-400 leading-relaxed">
                                📸 <strong className="text-white">Screenshot tiket ini</strong> atau cukup sebutkan{' '}
                                <strong className="text-white">Nomor WA</strong> Anda ke kasir saat tiba.<br /><br />
                                ⏰ Jika tidak check-in dalam <strong className="text-white">5 menit</strong> setelah jam booking,
                                tiket otomatis dibatalkan.
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mb-3">
                            <button
                                onClick={() => { setView('board'); setTicket(null); setPendingBookingId(null); setNickname(''); setWaNumber(''); }}
                                className="flex-1 py-3 rounded-xl border border-white/15 text-sm font-semibold hover:bg-white/5 transition-colors"
                            >
                                Booking Lagi
                            </button>
                            <Link
                                href={`/${slug}`}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                                style={{ background: themeColor }}
                            >
                                <Share2 className="w-4 h-4" /> Halaman Rental
                            </Link>
                        </div>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="w-full py-3 rounded-xl border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Download Tiket (.png)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-right">{value}</span>
        </div>
    );
}
