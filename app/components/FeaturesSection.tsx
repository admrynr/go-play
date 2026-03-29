'use client';

import { useState } from 'react';
import {
    TrendingUp, ChefHat, Trophy, Zap, Users, Monitor,
    QrCode, Clock, Smartphone, X, LayoutDashboard
} from 'lucide-react';

interface Feature {
    icon: React.ElementType;
    title: string;
    desc: string;
    color: string;
    bg: string;
    border: string;
}

const tenantFeatures: Feature[] = [
    {
        icon: Smartphone,
        title: 'Custom Page Builder',
        desc: 'Desain profil publik (Logo, Galeri, Sosmed) agar rental Anda tampil lebih profesional dan kredibel.',
        color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/30',
    },
    {
        icon: ChefHat,
        title: 'Integrated F&B POS',
        desc: 'Kelola katalog menu digital dan terima antrean pesanan makanan/minuman langsung di layar dapur/kasir.',
        color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/30',
    },
    {
        icon: Trophy,
        title: 'Dynamic Loyalty System',
        desc: 'Program poin otomatis per nomor WhatsApp dengan fitur auto-generate voucher bermain gratis.',
        color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500/30',
    },
    {
        icon: TrendingUp,
        title: 'Real-time Dashboard',
        desc: 'Pantau statistik stasiun aktif, sesi berjalan, dan grafik tren pendapatan harian secara akurat.',
        color: 'text-green-400', bg: 'bg-green-500/10', border: 'hover:border-green-500/30',
    },
    {
        icon: Zap,
        title: 'Operational Efficiency',
        desc: 'Terima permintaan bantuan atau tambah waktu dari pemain langsung di dashboard tanpa interaksi fisik.',
        color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/30',
    },
    {
        icon: Users,
        title: 'Username Login',
        desc: 'Login praktis bagi staf menggunakan username unik tanpa perlu mengingat email perusahaan.',
        color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'hover:border-cyan-500/30',
    },
];

const playerFeatures: Feature[] = [
    {
        icon: Monitor,
        title: 'Live Status & Booking Online',
        desc: 'Cek ketersediaan konsol secara real-time dari rumah dan kirim reservasi booking langsung dari halaman tenant.',
        color: 'text-green-400', bg: 'bg-green-500/10', border: 'hover:border-green-500/30',
    },
    {
        icon: QrCode,
        title: 'Player Interface (QR Scan)',
        desc: 'Pantau sisa waktu bermain, tagihan berjalan, dan jumlah poin loyalitas langsung dari smartphone.',
        color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/30',
    },
    {
        icon: ChefHat,
        title: 'Digital Ordering',
        desc: 'Pesan makanan dan minuman tanpa harus beranjak dari kursi melalui menu digital yang terintegrasi.',
        color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/30',
    },
    {
        icon: Clock,
        title: 'One-Tap Extension',
        desc: 'Kirim permintaan tambah durasi bermain langsung melalui antarmuka browser HP masing-masing.',
        color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/30',
    },
];

const placeholderColors = [
    'from-blue-900/60 to-blue-800/30',
    'from-orange-900/60 to-orange-800/30',
    'from-yellow-900/60 to-yellow-800/30',
    'from-green-900/60 to-green-800/30',
    'from-purple-900/60 to-purple-800/30',
    'from-cyan-900/60 to-cyan-800/30',
];

function FeatureCard({ feature, index, accent }: { feature: Feature; index: number; accent: string }) {
    const [hovered, setHovered] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const Icon = feature.icon;

    return (
        <>
            <div
                className={`flex gap-4 items-start p-4 bg-background rounded-xl border border-white/5 ${feature.border} transition-colors group`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div className={`p-2 ${feature.bg} rounded-lg shrink-0`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-white text-sm">{feature.title}</p>
                        <button
                            onClick={() => setModalOpen(true)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-gray-400 hover:text-white hover:border-white/50 transition-all shrink-0 ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            Lihat
                        </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{feature.desc}</p>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 ${feature.bg} rounded-lg`}>
                                    <Icon className={`w-4 h-4 ${feature.color}`} />
                                </div>
                                <span className="text-sm font-semibold text-white">{feature.title}</span>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className={`m-4 rounded-xl bg-gradient-to-br ${placeholderColors[index % placeholderColors.length]} aspect-video flex flex-col items-center justify-center gap-3 border border-white/5`}>
                            <div className={`p-4 ${feature.bg} rounded-2xl`}>
                                <Icon className={`w-10 h-10 ${feature.color}`} />
                            </div>
                            <p className="text-sm text-gray-400">Screenshot fitur segera hadir</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function FeaturesSection() {
    return (
        <section id="fitur" className="py-28 px-6 bg-surface border-y border-white/5">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-16">
                    <span className="section-label text-sm font-bold tracking-widest uppercase">Fitur Lengkap</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Semua yang Anda Butuhkan</h2>
                    <div className="w-20 mt-4 mb-2 h-1 bg-gradient-to-r from-primary to-blue-400 mx-auto rounded-full" />
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Dari billing hingga dapur, dari pemain hingga laporan — semuanya satu platform.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Tenant Features */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-primary/20 rounded-xl">
                                <LayoutDashboard className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Untuk Pemilik Rental</h3>
                                <p className="text-gray-500 text-sm">Kontrol penuh, branding profesional</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {tenantFeatures.map((f, i) => (
                                <FeatureCard key={i} feature={f} index={i} accent="primary" />
                            ))}
                        </div>
                    </div>

                    {/* Player Features */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-green-500/20 rounded-xl">
                                <Users className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Untuk Pemain</h3>
                                <p className="text-gray-500 text-sm">Pengalaman gaming yang mulus & modern</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {playerFeatures.map((f, i) => (
                                <FeatureCard key={i} feature={f} index={i} accent="green" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
