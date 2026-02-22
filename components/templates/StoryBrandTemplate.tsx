'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Tv, Zap, Box, CircleDollarSign, Menu, X, ChevronRight, Play, Instagram, MapPin, Clock, MessageCircle, AlertCircle, CheckCircle, Timer, Coffee, Repeat, Trophy } from 'lucide-react';
import Link from 'next/link';
import { CSSProperties } from 'react';

interface StoryBrandTemplateProps {
    businessName?: string;
    whatsappNumber?: string;
    address?: string;
    logoText?: string;
    logoUrl?: string; // Uploaded logo image URL
    themeColor?: string;
    instagramLink?: string;
    tiktokLink?: string;
    operationalHours?: string;
    loyaltyProgramActive?: boolean;
    loyaltyTargetHours?: number;
    isBuilderMode?: boolean;
    customConfig?: any;
    onConfigChange?: (key: string, value: string) => void;
}

import EditableText from '../EditableText';

export default function StoryBrandTemplate({
    businessName = "GO-PLAY",
    whatsappNumber = "6281234567890",
    address = "Jalan Gaming No. 1, Jakarta Selatan",
    logoText = "GO-PLAY",
    logoUrl,
    themeColor = "#003791",
    instagramLink,
    tiktokLink,
    operationalHours = "Senin - Minggu: 09:00 - 23:00",
    loyaltyProgramActive = false,
    loyaltyTargetHours = 10,
    isBuilderMode = false,
    customConfig = {},
    onConfigChange,
}: StoryBrandTemplateProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const openWhatsApp = (message = "") => {
        const text = `Halo ${businessName}, ${message}`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const navLinks = [
        { name: "Problem", href: "#problem" },
        { name: "Solusi", href: "#features" },
        { name: "Cara Main", href: "#plan" },
        { name: "Lokasi", href: "#footer" },
    ];

    // Dynamic style for theme color
    const themeStyle = {
        '--color-primary': themeColor,
        '--color-primary-glow': `${themeColor}99`, // 60% opacity approximation
    } as CSSProperties;

    return (
        <div className="flex flex-col min-h-screen font-sans selection:bg-primary selection:text-white" style={themeStyle}>
            {/* Navigation */}
            <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/10 transition-all duration-300">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {logoUrl ? (
                            <img src={logoUrl} alt={businessName} className="h-10 w-auto object-contain" />
                        ) : (
                            <>
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <Gamepad2 className="w-6 h-6 text-primary" />
                                </div>
                                <span className="font-heading font-bold text-xl tracking-wider text-white">
                                    {logoText || businessName}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex gap-8 text-sm font-medium">
                        {navLinks.map((link) => (
                            <a key={link.name} href={link.href} className="hover:text-primary transition-colors uppercase tracking-wider text-xs lg:text-sm text-gray-300">
                                {link.name}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden md:block">
                        <button
                            onClick={() => openWhatsApp("Saya mau booking meja")}
                            className="bg-primary hover:bg-primary/80 text-white font-bold py-2.5 px-6 rounded-xl transition-all hover:glow-box shadow-lg shadow-primary/20"
                        >
                            Booking Meja
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6 md:hidden flex flex-col gap-8"
                    >
                        <nav className="flex flex-col gap-6 text-xl font-heading font-bold text-center">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={toggleMenu}
                                    className="hover:text-primary transition-colors text-white"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </nav>
                        <div className="flex flex-col gap-4 mt-auto mb-10">
                            <button
                                onClick={() => openWhatsApp("Saya mau booking meja")}
                                className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl w-full shadow-lg shadow-primary/20"
                            >
                                Booking Meja
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1. HERO SECTION (The Solution) */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-[90vh]">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] opacity-30" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="lg:w-1/2 text-center lg:text-left"
                        >
                            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6">
                                Next Gen Rental Experience
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight uppercase text-white">
                                <EditableText
                                    element="span"
                                    value={customConfig?.heroLine1 || 'Main PS'}
                                    onSave={(v) => onConfigChange?.('heroLine1', v)}
                                    isBuilderMode={isBuilderMode}
                                />
                                <br />
                                <span className="text-primary glow-text">
                                    <EditableText
                                        element="span"
                                        value={customConfig?.heroLine2 || 'Tanpa Ribet,'}
                                        onSave={(v) => onConfigChange?.('heroLine2', v)}
                                        isBuilderMode={isBuilderMode}
                                    />
                                </span><br />
                                <EditableText
                                    element="span"
                                    value={customConfig?.heroLine3 || 'Bonus Melimpah.'}
                                    onSave={(v) => onConfigChange?.('heroLine3', v)}
                                    isBuilderMode={isBuilderMode}
                                />
                            </h1>
                            <p className="text-gray-400 text-base md:text-lg mb-8 md:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                <EditableText
                                    element="span"
                                    value={customConfig?.heroDesc || 'Rental PS dengan sistem billing transparan, pemesanan snack dari meja, dan program loyalitas otomatis.'}
                                    onSave={(v) => onConfigChange?.('heroDesc', v)}
                                    isBuilderMode={isBuilderMode}
                                    className="block"
                                />
                                <span className="text-white font-bold block mt-2">
                                    <EditableText
                                        element="span"
                                        value={customConfig?.heroPromo || (loyaltyProgramActive ? `Main ${loyaltyTargetHours} Jam, Gratis 1 Jam!` : 'Promo Spesial Hari Ini!')}
                                        onSave={(v) => onConfigChange?.('heroPromo', v)}
                                        isBuilderMode={isBuilderMode}
                                    />
                                </span>
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button
                                    onClick={() => openWhatsApp("Saya mau booking meja sekarang")}
                                    className="bg-primary text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform hover:glow-box shadow-lg shadow-primary/25"
                                >
                                    Booking Meja Sekarang <ChevronRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => openWhatsApp("Info Stok PS Box")}
                                    className="glass-panel hover:bg-white/5 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors border-white/10 hover:border-primary/50"
                                >
                                    <Box className="w-5 h-5" /> Cek Stok PS Box
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="lg:w-1/2 relative"
                        >
                            {/* Mockup Placeholder */}
                            <div className="relative w-full aspect-square max-w-lg mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />
                                <div className="relative z-10 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center">
                                    <Gamepad2 className="w-32 h-32 text-primary drop-shadow-[0_0_20px_rgba(0,55,145,0.8)] mb-4" />
                                    <h3 className="text-2xl font-bold text-white mb-2">ULTIMATE GAMING</h3>
                                    <p className="text-gray-400">PS5 & 4K 120Hz Ready</p>

                                    <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                                        <div className="bg-surface p-4 rounded-xl border border-white/5">
                                            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                                            <div className="text-xs text-gray-500">Timer</div>
                                            <div className="font-bold text-white">Real-time</div>
                                        </div>
                                        <div className="bg-surface p-4 rounded-xl border border-white/5">
                                            <Coffee className="w-6 h-6 text-primary mx-auto mb-2" />
                                            <div className="text-xs text-gray-500">Snack</div>
                                            <div className="font-bold text-white">Ditempat</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 2. THE PROBLEM (The Pain Points) */}
            <section id="problem" className="py-20 bg-surface relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-4">PERNAH MENGALAMI INI?</h2>
                        <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: AlertCircle,
                                title: "Bosan di Rumah?",
                                desc: "Harga console mahal, game kaset jutaan, mau main tapi spek PC kentang?"
                            },
                            {
                                icon: Timer,
                                title: "Billing Tidak Jelas?",
                                desc: "Sering merasa dicurangi waktu di rental lain? Atau ribet harus catat jam manual?"
                            },
                            {
                                icon: Coffee,
                                title: "Repot Pesan Minum?",
                                desc: "Lagi asik war tapi haus? Harus pause game dan jalan ke kasir cuma buat beli air?"
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-background border border-white/5 p-8 rounded-2xl hover:border-primary/30 transition-all text-center group"
                            >
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 group-hover:text-primary transition-colors text-gray-400">
                                    <item.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. FEATURES & BENEFITS (The Guide) */}
            <section id="features" className="py-20 bg-background relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
                        <div>
                            <span className="text-primary font-bold tracking-widest text-sm uppercase">SOLUSI KAMI</span>
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mt-2">KENAPA HARUS DI SINI?</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {/* Feature 1 */}
                        <div className="bg-surface p-8 rounded-3xl border border-white/5 flex gap-6 items-start hover:bg-white/5 transition-colors">
                            <div className="p-4 bg-primary/20 rounded-2xl text-primary shrink-0">
                                <Timer className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Timer Digital Real-Time</h3>
                                <p className="text-gray-400">Pantau sisa waktu mainmu langsung lewat HP. Tidak ada lagi drama waktu tiba-tiba habis dipotong operator.</p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-surface p-8 rounded-3xl border border-white/5 flex gap-6 items-start hover:bg-white/5 transition-colors">
                            <div className="p-4 bg-primary/20 rounded-2xl text-primary shrink-0">
                                <Coffee className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Kantin Digital</h3>
                                <p className="text-gray-400">Lapar pas lagi push rank? Scan QR di meja, pesan snack, dan kami antar tanpa mengganggu permainanmu.</p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-surface p-8 rounded-3xl border border-white/5 flex gap-6 items-start hover:bg-white/5 transition-colors">
                            <div className="p-4 bg-primary/20 rounded-2xl text-primary shrink-0">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Loyalty Program 10:1</h3>
                                <p className="text-gray-400">Setiap main 10 jam (akumulatif), otomatis dapat voucher 1 jam gratis. Makin sering main, makin untung!</p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-surface p-8 rounded-3xl border border-white/5 flex gap-6 items-start hover:bg-white/5 transition-colors">
                            <div className="p-4 bg-primary/20 rounded-2xl text-primary shrink-0">
                                <Box className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Sewa PS Box Harian</h3>
                                <p className="text-gray-400">Ingin seru-seruan di rumah? Sewa unit PS Box harian dengan syarat mudah dan game terupdate.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. THE PLAN (How It Works) */}
            <section id="plan" className="py-20 bg-surface relative border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">CARA MAIN</h2>
                        <p className="text-gray-400">3 Langkah mudah untuk mulai gaming experience-mu.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-1" />

                        {[
                            {
                                step: "01",
                                title: "Datang & Scan",
                                desc: "Pilih mejamu, duduk nyaman, dan scan QR Code yang tersedia untuk mulai sesi."
                            },
                            {
                                step: "02",
                                title: "Main & Pesan",
                                desc: "Nikmati game PS5/PS4 favoritmu. Haus? Pesan lewat HP langsung diantar."
                            },
                            {
                                step: "03",
                                title: "Klaim Bonus",
                                desc: "Selesai main, jam mainmu otomatis tercatat. Kumpulkan untuk dapat gratisan!"
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center relative z-10">
                                <div className="w-24 h-24 rounded-full bg-background border-4 border-surface shadow-xl flex items-center justify-center mb-8 relative">
                                    <span className="text-3xl font-black text-primary">{item.step}</span>
                                    <div className="absolute inset-0 border border-primary/30 rounded-full animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                                <p className="text-gray-400 max-w-xs">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. REKAP & TRANSPARANSI (Building Trust) */}
            <section className="py-16 bg-gradient-to-b from-surface to-background">
                <div className="container mx-auto px-4">
                    <div className="glass-panel p-8 md:p-12 rounded-3xl border border-primary/20 text-center max-w-4xl mx-auto relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-primary" />

                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
                            <CheckCircle className="w-12 h-12 text-primary" />
                            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">Sistem & Manajemen Transparan</h2>
                        </div>
                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                            "Sistem kami mencatat setiap sesi secara akurat. Rekap keuangan transparan memastikan pelayanan tetap prima dan profesional,
                            menghilangkan kecurangan dan memastikan kenyamanan Anda adalah prioritas nomor satu."
                        </p>
                        <div className="flex justify-center gap-8 text-sm font-bold tracking-wider text-gray-500 uppercase">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Anti-Curang</span>
                            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Real Data</span>
                            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Auto-Report</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. FOOTER */}
            <footer id="footer" className="bg-surface border-t border-white/10 pt-16 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={businessName} className="h-12 w-auto object-contain" />
                                ) : (
                                    <>
                                        <Gamepad2 className="w-8 h-8 text-primary" />
                                        <span className="font-heading font-bold text-2xl tracking-wider text-white">
                                            <EditableText
                                                element="span"
                                                value={logoText || businessName}
                                                onSave={(v) => onConfigChange?.('logoText', v)}
                                                isBuilderMode={isBuilderMode}
                                            />
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-gray-400 mb-6 font-medium">
                                <EditableText
                                    element="span"
                                    value={customConfig?.footerDesc || 'Memberikan pengalaman gaming terbaik dengan sistem modern, transparan, dan nyaman. Experience gaming yang sebenarnya ada di sini.'}
                                    onSave={(v) => onConfigChange?.('footerDesc', v)}
                                    isBuilderMode={isBuilderMode}
                                    className="block"
                                />
                            </p>
                            <div className="flex gap-4">
                                {instagramLink && (
                                    <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-[var(--color-primary)] rounded-full transition-colors flex items-center justify-center">
                                        <Instagram className="w-5 h-5 text-gray-400 hover:text-white" />
                                    </a>
                                )}
                                {tiktokLink && (
                                    <a href={tiktokLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-[var(--color-primary)] rounded-full transition-colors flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-400 hover:text-white fill-current" viewBox="0 0 24 24">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-.9 4.45-2.35 6.08-1.48 1.64-3.63 2.68-5.87 2.91-2.22.22-4.52-.31-6.42-1.57C-.04 22.95-.56 20.35.34 18.06c.66-1.68 1.95-3.11 3.53-3.95 1.54-.83 3.33-1.07 5.06-.88v4.06c-1.12-.13-2.3.06-3.23.63-.9.55-1.55 1.48-1.78 2.52-.16.71-.16 1.46.06 2.15.2.62.6 1.18 1.1 1.6.53.44 1.25.66 1.94.67 1.14.02 2.26-.35 3.07-1.1.75-.68 1.22-1.68 1.3-2.73.13-3.86.07-7.72.1-11.58.01-3.15-.02-6.3.02-9.45z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="col-span-1 border-gray-800 pb-6 mb-6">
                            <h3 className="font-bold text-lg mb-6 text-white border-b-2 border-[var(--color-primary)] pb-2 inline-block">Alamat</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-gray-400">
                                    <MapPin className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                                    <span>{address}</span>
                                </li>
                                <li className="flex gap-3 text-gray-400">
                                    <Clock className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                                    <div>
                                        <span className="block font-medium text-white">{operationalHours}</span>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-6 uppercase tracking-wider">Contact</h3>
                            <button
                                onClick={() => openWhatsApp("Tanya Admin")}
                                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors mb-4 group"
                            >
                                <MessageCircle className="w-5 h-5 text-primary group-hover:glow-text" />
                                Hubungi via WhatsApp
                            </button>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-xs text-gray-500 mb-1">Butuh bantuan?</p>
                                <p className="text-lg font-bold text-white">{whatsappNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-8 text-center text-sm text-gray-600">
                        <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
