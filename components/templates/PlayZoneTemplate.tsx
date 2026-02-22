'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Tv, Zap, Box, CircleDollarSign, Menu, X, ChevronRight, Play, Instagram, MapPin, Clock, MessageCircle, AlertCircle, CheckCircle, Timer, Coffee, Repeat, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CSSProperties } from 'react';

interface PlayZoneTemplateProps {
    businessName?: string;
    whatsappNumber?: string;
    address?: string;
    logoText?: string;
    logoUrl?: string;
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

export default function PlayZoneTemplate({
    businessName = "GO-PLAY",
    whatsappNumber = "6281234567890",
    address = "Jalan Gaming No. 1, Jakarta Selatan",
    logoText = "GO-PLAY",
    logoUrl,
    themeColor = "#9333EA",
    instagramLink,
    tiktokLink,
    operationalHours = "Senin - Minggu: 10:00 - 02:00 WIB",
    loyaltyProgramActive = false,
    loyaltyTargetHours = 10,
    isBuilderMode = false,
    customConfig = {},
    onConfigChange,
}: PlayZoneTemplateProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Convert HEX to RGB for shadow/glow effects
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '147, 51, 234';
    };

    const themeRgb = hexToRgb(themeColor);

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

    return (
        <div className="flex flex-col min-h-screen font-sans bg-[#0a0118] text-white selection:bg-purple-500 selection:text-white">
            <style jsx global>{`
                :root {
                    --theme-color: ${themeColor};
                    --theme-rgb: ${themeRgb};
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes glow-pulse {
                    0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(var(--theme-rgb), 0.5); }
                    50% { opacity: 0.8; box-shadow: 0 0 40px rgba(var(--theme-rgb), 0.8); }
                }
                
                .theme-text {
                    color: var(--theme-color);
                }

                .theme-bg {
                    background-color: var(--theme-color);
                }
                
                .theme-border {
                    border-color: var(--theme-color);
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .glow-box {
                    box-shadow: 0 0 30px rgba(var(--theme-rgb), 0.6), 0 0 60px rgba(236, 72, 153, 0.3);
                }
                
                .glow-text {
                    text-shadow: 0 0 20px rgba(var(--theme-rgb), 0.8), 0 0 40px rgba(236, 72, 153, 0.5);
                }
                
                .gradient-border {
                    border: 2px solid transparent;
                    background: linear-gradient(#0a0118, #0a0118) padding-box,
                                linear-gradient(135deg, var(--theme-color), #EC4899, #3B82F6) border-box;
                }

                .theme-gradient-text {
                    background: linear-gradient(to right, var(--theme-color), #F472B6, #60A5FA);
                    -webkit-background-clip: text;
                    color: transparent;
                }

                .theme-gradient-bg {
                    background: linear-gradient(to right, var(--theme-color), #EC4899, #3B82F6);
                }
            `}</style>

            {/* Navigation */}
            <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#0a0118]/80 border-b border-purple-500/20">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {logoUrl ? (
                            <img src={logoUrl} alt={businessName} className="h-12 w-auto object-contain" />
                        ) : (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75"></div>
                                    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                                        <Gamepad2 className="w-7 h-7 text-white" />
                                    </div>
                                </div>
                                <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                                    {logoText || businessName}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex gap-8 text-sm font-bold">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="hover:text-purple-400 transition-colors uppercase tracking-wider text-gray-300 relative group"
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
                            </a>
                        ))}
                    </nav>

                    <div className="hidden md:block">
                        <button
                            onClick={() => openWhatsApp("Saya mau booking meja")}
                            className="relative px-6 py-3 font-bold text-white rounded-xl overflow-hidden group"
                        >
                            <div className="absolute inset-0 theme-gradient-bg opacity-100 group-hover:opacity-90 transition-opacity"></div>
                            <div className="absolute inset-0 theme-gradient-bg blur-lg opacity-50"></div>
                            <span className="relative z-10">Booking Sekarang</span>
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
                        className="fixed inset-0 z-40 bg-[#0a0118]/98 backdrop-blur-xl pt-24 px-6 md:hidden flex flex-col"
                    >
                        <nav className="flex flex-col gap-6 text-xl font-black text-center">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={toggleMenu}
                                    className="hover:text-purple-400 transition-colors text-white py-2"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </nav>
                        <div className="mt-auto mb-10">
                            <button
                                onClick={() => openWhatsApp("Saya mau booking meja")}
                                className="w-full py-4 px-6 font-bold text-white rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
                            >
                                Booking Sekarang
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden min-h-screen flex items-center">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse theme-bg opacity-30"></div>
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="lg:w-1/2 text-center lg:text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6" style={{ background: `linear-gradient(to right, rgba(var(--theme-rgb), 0.2), rgba(236, 72, 153, 0.2))`, borderColor: `rgba(var(--theme-rgb), 0.3)` }}>
                                <Sparkles className="w-4 h-4" style={{ color: themeColor }} />
                                <span className="text-sm font-bold uppercase tracking-widest theme-text">
                                    <EditableText
                                        value={customConfig?.heroBadge || 'Next Gen Gaming'}
                                        onSave={(v) => onConfigChange?.('heroBadge', v)}
                                        isBuilderMode={isBuilderMode}
                                    />
                                </span>
                            </div>

                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.9] uppercase">
                                <EditableText
                                    element="span"
                                    value={customConfig?.heroLine1 || 'Main PS'}
                                    onSave={(v) => onConfigChange?.('heroLine1', v)}
                                    isBuilderMode={isBuilderMode}
                                />
                                <br />
                                <span className="theme-gradient-text glow-text inline-block">
                                    <EditableText
                                        element="span"
                                        value={customConfig?.heroLine2 || 'Tanpa Ribet'}
                                        onSave={(v) => onConfigChange?.('heroLine2', v)}
                                        isBuilderMode={isBuilderMode}
                                    />
                                </span>
                                <br />
                                <EditableText
                                    element="span"
                                    value={customConfig?.heroLine3 || 'Bonus Melimpah'}
                                    onSave={(v) => onConfigChange?.('heroLine3', v)}
                                    isBuilderMode={isBuilderMode}
                                />
                            </h1>

                            <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                <EditableText
                                    element="span"
                                    value={customConfig?.heroDesc || 'Rental PS dengan sistem billing transparan, pemesanan snack dari meja, dan program loyalitas otomatis.'}
                                    onSave={(v) => onConfigChange?.('heroDesc', v)}
                                    isBuilderMode={isBuilderMode}
                                    className="block"
                                />
                                <span className="text-white font-bold block mt-3 text-2xl theme-gradient-text">
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
                                    className="relative px-8 py-4 font-bold text-white rounded-xl overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <span className="relative z-10 flex items-center gap-2">
                                        Booking Meja <ChevronRight className="w-5 h-5" />
                                    </span>
                                </button>

                                <button
                                    onClick={() => openWhatsApp("Info Stok PS Box")}
                                    className="px-8 py-4 font-bold text-white rounded-xl border-2 border-purple-500/50 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Box className="w-5 h-5" /> Cek Stok PS Box
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="lg:w-1/2 relative"
                        >
                            <div className="relative w-full max-w-lg mx-auto">
                                {/* Glow Effect */}
                                <div className="absolute inset-0 theme-gradient-bg rounded-3xl blur-3xl opacity-40 animate-pulse"></div>

                                {/* Card */}
                                <div className="relative gradient-border rounded-3xl p-8 backdrop-blur-xl bg-[#0a0118]/80">
                                    <div className="text-center">
                                        <div className="relative inline-block mb-6">
                                            <div className="absolute inset-0 theme-gradient-bg rounded-full blur-2xl opacity-50 animate-float"></div>
                                            <Gamepad2 className="relative w-32 h-32 theme-text" />
                                        </div>

                                        <h3 className="text-3xl font-black mb-2 theme-gradient-text">
                                            <EditableText
                                                element="span"
                                                value={customConfig?.heroCardTitle || 'ULTIMATE GAMING'}
                                                onSave={(v) => onConfigChange?.('heroCardTitle', v)}
                                                isBuilderMode={isBuilderMode}
                                            />
                                        </h3>
                                        <p className="text-gray-400 mb-8">
                                            <EditableText
                                                element="span"
                                                value={customConfig?.heroCardSubtitle || 'PS5 & 4K 120Hz Ready'}
                                                onSave={(v) => onConfigChange?.('heroCardSubtitle', v)}
                                                isBuilderMode={isBuilderMode}
                                            />
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="gradient-border rounded-xl p-4 backdrop-blur-xl bg-[#0a0118]/50">
                                                <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                                <div className="text-xs text-gray-400">Timer</div>
                                                <div className="font-bold text-white">Real-time</div>
                                            </div>
                                            <div className="gradient-border rounded-xl p-4 backdrop-blur-xl bg-[#0a0118]/50">
                                                <Coffee className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                                <div className="text-xs text-gray-400">Snack</div>
                                                <div className="font-bold text-white">Di Tempat</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section id="problem" className="py-20 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase">
                            PERNAH MENGALAMI INI?
                        </h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: AlertCircle,
                                title: "Bosan di Rumah?",
                                desc: "Harga console mahal, game kaset jutaan, mau main tapi spek PC kentang?",
                                gradient: "from-red-500 to-orange-500"
                            },
                            {
                                icon: Timer,
                                title: "Billing Tidak Jelas?",
                                desc: "Sering merasa dicurangi waktu di rental lain? Atau ribet harus catat jam manual?",
                                gradient: "from-purple-500 to-pink-500"
                            },
                            {
                                icon: Coffee,
                                title: "Repot Pesan Minum?",
                                desc: "Lagi asik war tapi haus? Harus pause game dan jalan ke kasir cuma buat beli air?",
                                gradient: "from-blue-500 to-cyan-500"
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="relative group"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity`}></div>
                                <div className="relative gradient-border rounded-2xl p-8 backdrop-blur-xl bg-[#0a0118]/80 text-center h-full">
                                    <div className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-xl font-black mb-3">{item.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-600/10 to-transparent pointer-events-none"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="mb-16">
                        <span className="text-purple-400 font-bold tracking-widest text-sm uppercase">SOLUSI KAMI</span>
                        <h2 className="text-4xl md:text-6xl font-black mt-2 uppercase">
                            KENAPA HARUS <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DI SINI?</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Timer,
                                title: "Timer Digital Real-Time",
                                desc: "Pantau sisa waktu mainmu langsung lewat HP. Tidak ada lagi drama waktu tiba-tiba habis dipotong operator.",
                                color: "purple"
                            },
                            {
                                icon: Coffee,
                                title: "Kantin Digital",
                                desc: "Lapar pas lagi push rank? Scan QR di meja, pesan snack, dan kami antar tanpa mengganggu permainanmu.",
                                color: "pink"
                            },
                            {
                                icon: Trophy,
                                title: `Loyalty Program ${loyaltyTargetHours}:1`,
                                desc: `Setiap main ${loyaltyTargetHours} jam (akumulatif), otomatis dapat voucher 1 jam gratis. Makin sering main, makin untung!`,
                                color: "blue"
                            },
                            {
                                icon: Box,
                                title: "Sewa PS Box Harian",
                                desc: "Ingin seru-seruan di rumah? Sewa unit PS Box harian dengan syarat mudah dan game terupdate.",
                                color: "cyan"
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                className="relative group"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-600/20 to-${feature.color}-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                <div className="relative gradient-border rounded-2xl p-8 backdrop-blur-xl bg-[#0a0118]/80 flex gap-6 items-start h-full">
                                    <div className={`p-4 bg-gradient-to-br from-${feature.color}-600 to-${feature.color}-700 rounded-xl shrink-0`}>
                                        <feature.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black mb-2">{feature.title}</h3>
                                        <p className="text-gray-400">{feature.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="plan" className="py-20 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-black mb-4 uppercase">CARA MAIN</h2>
                        <p className="text-gray-400 text-lg">3 Langkah mudah untuk mulai gaming experience-mu</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-20 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

                        {[
                            {
                                step: "01",
                                title: "Datang & Scan",
                                desc: "Pilih mejamu, duduk nyaman, dan scan QR Code yang tersedia untuk mulai sesi.",
                                gradient: "from-purple-600 to-purple-700"
                            },
                            {
                                step: "02",
                                title: "Main & Pesan",
                                desc: "Nikmati game PS5/PS4 favoritmu. Haus? Pesan lewat HP langsung diantar.",
                                gradient: "from-pink-600 to-pink-700"
                            },
                            {
                                step: "03",
                                title: "Klaim Bonus",
                                desc: "Selesai main, jam mainmu otomatis tercatat. Kumpulkan untuk dapat gratisan!",
                                gradient: "from-blue-600 to-blue-700"
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center relative z-10">
                                <div className="relative mb-8">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-full blur-2xl opacity-50 animate-pulse`}></div>
                                    <div className={`relative w-32 h-32 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center border-4 border-[#0a0118] shadow-2xl`}>
                                        <span className="text-5xl font-black text-white">{item.step}</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                                <p className="text-gray-400 max-w-xs leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="relative gradient-border rounded-3xl p-12 backdrop-blur-xl bg-[#0a0118]/80 text-center max-w-4xl mx-auto overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>

                        <div className="flex items-center justify-center gap-4 mb-6">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                            <h2 className="text-3xl md:text-4xl font-black">Sistem & Manajemen Transparan</h2>
                        </div>

                        <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
                            Sistem kami mencatat setiap sesi secara akurat. Rekap keuangan transparan memastikan pelayanan tetap prima dan profesional,
                            menghilangkan kecurangan dan memastikan kenyamanan Anda adalah prioritas nomor satu.
                        </p>

                        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold uppercase tracking-wider">
                            {["Anti-Curang", "Real Data", "Auto-Report"].map((badge, i) => (
                                <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="footer" className="bg-[#050010] border-t border-purple-500/20 pt-16 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={businessName} className="h-14 w-auto object-contain" />
                                ) : (
                                    <>
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur"></div>
                                            <Gamepad2 className="relative w-10 h-10 text-white" />
                                        </div>
                                        <span className="font-black text-3xl bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                                            {logoText || businessName}
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-gray-400 max-w-sm leading-relaxed mb-6">
                                <EditableText
                                    element="span"
                                    value={customConfig?.footerDesc || 'Rental PS Modern dengan fasilitas terlengkap dan sistem digital pertama di kota ini. Experience gaming yang sebenarnya ada di sini.'}
                                    onSave={(v) => onConfigChange?.('footerDesc', v)}
                                    isBuilderMode={isBuilderMode}
                                    className="block"
                                />
                            </p>
                            <div className="flex gap-3">
                                {instagramLink && (
                                    <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full theme-gradient-bg flex items-center justify-center hover:scale-110 transition-transform">
                                        <Instagram className="w-6 h-6 text-white" />
                                    </a>
                                )}
                                {tiktokLink && (
                                    <a href={tiktokLink} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full theme-gradient-bg flex items-center justify-center hover:scale-110 transition-transform font-bold text-white">
                                        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-.9 4.45-2.35 6.08-1.48 1.64-3.63 2.68-5.87 2.91-2.22.22-4.52-.31-6.42-1.57C-.04 22.95-.56 20.35.34 18.06c.66-1.68 1.95-3.11 3.53-3.95 1.54-.83 3.33-1.07 5.06-.88v4.06c-1.12-.13-2.3.06-3.23.63-.9.55-1.55 1.48-1.78 2.52-.16.71-.16 1.46.06 2.15.2.62.6 1.18 1.1 1.6.53.44 1.25.66 1.94.67 1.14.02 2.26-.35 3.07-1.1.75-.68 1.22-1.68 1.3-2.73.13-3.86.07-7.72.1-11.58.01-3.15-.02-6.3.02-9.45z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-black mb-6 uppercase tracking-wider text-lg">Lokasi</h3>
                            <div className="flex gap-3 text-gray-400 mb-4">
                                <MapPin className="w-5 h-5 shrink-0 theme-text" />
                                <p>{address}</p>
                            </div>
                            <div className="flex gap-3 text-gray-400">
                                <Clock className="w-5 h-5 shrink-0 theme-text" />
                                <div>
                                    <p className="text-white font-bold">{operationalHours}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-black mb-6 uppercase tracking-wider text-lg">Contact</h3>
                            <button
                                onClick={() => openWhatsApp("Tanya Admin")}
                                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors mb-6 group"
                            >
                                <MessageCircle className="w-5 h-5 text-purple-400 group-hover:text-pink-400 transition-colors" />
                                Hubungi via WhatsApp
                            </button>
                            <div className="gradient-border rounded-xl p-4 backdrop-blur-xl bg-[#0a0118]/50">
                                <p className="text-xs text-gray-500 mb-1">Butuh bantuan?</p>
                                <p className="text-lg font-bold">{whatsappNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-purple-500/20 pt-8 text-center text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
