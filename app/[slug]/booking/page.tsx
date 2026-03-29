'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowLeft, CheckCircle2, Clock, Wifi, Monitor, AlertTriangle,
    ChevronRight, Loader2, Copy, Share2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ─── Constants ────────────────────────────────────────────────────────────────
const LEAD_TIME = 10; // minutes
const BUFFER_TIME = 5; // minutes
const REFRESH_MS = 15_000;

// ─── Types ────────────────────────────────────────────────────────────────────
type StationStatus = 'idle' | 'active' | 'maintenance';
interface Station { id: string; name: string; type: string; status: StationStatus }
interface Session { id: string; station_id: string; end_time: string | null; type: string }
interface Booking { id: string; station_id: string; start_time: string; end_time: string; status: string; nickname: string }
interface PageData { id: string; business_name: string; theme_color: string; whatsapp_number: string }
interface Ticket { booking_code: string; nickname: string; wa_number: string; start_time: string; end_time: string; station_name: string }

type ViewState = 'board' | 'form' | 'ticket';

// ─── Helper: station display state ───────────────────────────────────────────
function getStationDisplay(
    station: Station,
    sessions: Session[],
    bookings: Booking[],
    now: Date
) {
    const session = sessions.find(s => s.station_id === station.id);
    const nextBooking = bookings
        .filter(b => b.station_id === station.id && new Date(b.start_time) >= now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

    if (station.status === 'maintenance') {
        return { color: 'gray', label: 'Maintenance', bookable: false, estAvailable: null };
    }
    if (session) {
        if (session.type === 'open' || !session.end_time) {
            return { color: 'red', label: 'Sedang Dipakai', bookable: false, estAvailable: null };
        }
        const estEnd = new Date(new Date(session.end_time).getTime() + BUFFER_TIME * 60_000);
        return { color: 'red', label: 'Sedang Dipakai', bookable: false, estAvailable: estEnd };
    }
    if (nextBooking && new Date(nextBooking.start_time) <= new Date(now.getTime() + LEAD_TIME * 60_000 + 60_000)) {
        const estEnd = new Date(new Date(nextBooking.end_time).getTime() + BUFFER_TIME * 60_000);
        return { color: 'yellow', label: 'Dipesan', bookable: false, estAvailable: estEnd };
    }
    return { color: 'green', label: 'Tersedia', bookable: true, estAvailable: null };
}

function fmt(date: Date) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fmtDatetime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [nickname, setNickname] = useState('');
    const [waNumber, setWaNumber] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [duration, setDuration] = useState(1);

    // Fetch availability data
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

    // Realtime: refresh on bookings or sessions change
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

    // Compute min arrival time
    const minArrival = useMemo(() => {
        const d = new Date(Date.now() + LEAD_TIME * 60_000);
        d.setSeconds(0, 0);
        return d.toISOString().slice(0, 16);
    }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

    const themeColor = pageData?.theme_color ?? '#003791';

    const handleSelectStation = (s: Station) => {
        setSelected(s);
        setArrivalTime(minArrival);
        setError('');
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
            setTicket({
                booking_code: data.booking.booking_code,
                nickname: data.booking.nickname,
                wa_number: data.booking.wa_number,
                start_time: data.booking.start_time,
                end_time: data.booking.end_time,
                station_name: selectedStation.name,
            });
            setView('ticket');
            fetchAvailability();
        } catch {
            setError('Koneksi gagal, periksa internet Anda.');
        } finally {
            setSubmitting(false);
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
            {/* Custom theme color as CSS var */}
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

                {/* ══════════════════════ BOARD VIEW ══════════════════════ */}
                {view === 'board' && (
                    <>
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-bold">Status Stasiun</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Diperbarui setiap {REFRESH_MS / 1000} detik · {fmt(now)}
                            </p>
                        </div>

                        {/* Legend */}
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {stations.map(station => {
                                    const { color, label, bookable, estAvailable } = getStationDisplay(station, sessions, bookings, now);
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

                                    return (
                                        <button
                                            key={station.id}
                                            disabled={!bookable}
                                            onClick={() => bookable && handleSelectStation(station)}
                                            className={`relative p-4 rounded-2xl border transition-all text-left ${colorMap[color]}
                        ${bookable ? 'hover:scale-105 cursor-pointer hover:border-opacity-100' : 'cursor-not-allowed opacity-80'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full mb-3 ${dotMap[color]}`} />
                                            <p className="font-bold text-sm">{station.name}</p>
                                            <p className="text-xs text-gray-400">{station.type}</p>
                                            <p className={`text-xs font-semibold mt-1 ${color === 'green' ? 'text-green-400' :
                                                    color === 'yellow' ? 'text-yellow-400' :
                                                        color === 'red' ? 'text-red-400' : 'text-gray-400'
                                                }`}>{label}</p>
                                            {estAvailable && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Est. kosong: {fmt(estAvailable)}
                                                </p>
                                            )}
                                            {bookable && (
                                                <div className="absolute bottom-3 right-3 text-white/40">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <p className="text-center text-xs text-gray-600 mt-8">
                            Booking online hanya untuk unit Timed. Unit Loose tidak dapat dipesan.
                        </p>
                    </>
                )}

                {/* ══════════════════════ FORM VIEW ══════════════════════ */}
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
                            {/* Arrival time */}
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

                            {/* Duration */}
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

                            {/* Nickname */}
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

                            {/* WA Number */}
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
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Konfirmasi Booking <ChevronRight className="w-5 h-5" /></>}
                            </button>
                        </form>
                    </>
                )}

                {/* ══════════════════════ TICKET VIEW ══════════════════════ */}
                {view === 'ticket' && ticket && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-1">Booking Berhasil!</h2>
                        <p className="text-gray-400 text-sm mb-8">Simpan tiket ini dan tunjukkan ke kasir saat tiba.</p>

                        {/* Ticket card */}
                        <div className="bg-white/5 border border-white/15 rounded-3xl p-6 text-left mb-6 relative overflow-hidden">
                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: themeColor, transform: 'translate(30%, -30%)' }} />

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

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setView('board'); setTicket(null); setNickname(''); setWaNumber(''); }}
                                className="flex-1 py-3 rounded-xl border border-white/15 text-sm font-semibold hover:bg-white/5 transition-colors"
                            >
                                Booking Lagi
                            </button>
                            <Link
                                href={`/${slug}`}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                                style={{ background: themeColor }}
                            >
                                <Share2 className="w-4 h-4" /> Kembali ke Halaman Rental
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Mini helper component ─────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-right">{value}</span>
        </div>
    );
}
